import axios from "axios";
import * as cheerio from "cheerio";
import _YTDlpWrapMod from "yt-dlp-wrap";
// yt-dlp-wrap ships as CJS so the real class sits at .default.default under ESM
const YTDlpWrap = _YTDlpWrapMod?.default?.default ?? _YTDlpWrapMod?.default ?? _YTDlpWrapMod;
import { existsSync } from "fs";
import { mkdir, chmod } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// On Linux hosts (Render, Railway, etc.) the project dir is read-only after
// deploy — /tmp is always writable. On Windows use the local bin/ folder.
const YTDLP_BIN_DIR =
  process.platform === "win32"
    ? path.join(__dirname, "../../bin")
    : "/tmp/yt-dlp-bin";
const YTDLP_BINARY = path.join(
  YTDLP_BIN_DIR,
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

let _ytDlp = null;

/** Lazy-init: download the binary once if missing, then cache the wrapper. */
async function getYtDlp() {
  if (_ytDlp) return _ytDlp;
  if (!existsSync(YTDLP_BINARY)) {
    console.log("⬇️  yt-dlp binary not found — downloading from GitHub...");
    await mkdir(YTDLP_BIN_DIR, { recursive: true });
    await YTDlpWrap.downloadFromGithub(YTDLP_BINARY);
    // Make the binary executable on Linux (required on Render / Railway)
    if (process.platform !== "win32") {
      await chmod(YTDLP_BINARY, 0o755);
    }
    console.log("✅ yt-dlp binary ready at", YTDLP_BINARY);
  }
  _ytDlp = new YTDlpWrap(YTDLP_BINARY);
  return _ytDlp;
}

/**
 * Detect platform from URL
 */
function detectPlatform(url) {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  return "article";
}

/**
 * Extract a readable title from a URL slug as last-resort fallback
 */
function titleFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return last
      .replace(/[-_]/g, " ")
      .replace(/\.[a-z]+$/i, "")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || u.hostname;
  } catch {
    return "Saved Link";
  }
}

/**
 * Use yt-dlp-wrap to extract the direct CDN video URL for an Instagram post/reel.
 * Downloads the standalone yt-dlp binary on first call — no Python required.
 * Returns null gracefully if extraction fails or the post is private.
 */
async function extractInstagramVideoUrl(url) {
  try {
    const ytDlp = await getYtDlp();
    // execPromise returns stdout as a string
    const output = await Promise.race([
      ytDlp.execPromise([
        "--get-url",
        "--format", "mp4",
        "--no-playlist",
        url,
      ]),
      // safety timeout — never block longer than 30 s
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("yt-dlp timeout")), 30000)
      ),
    ]);
    const videoUrl = (output || "").trim().split("\n")[0] || null;
    if (!videoUrl || !videoUrl.startsWith("http")) {
      console.log("yt-dlp did not return a valid video URL");
      return null;
    }
    console.log("✅ yt-dlp extracted video URL:", videoUrl.slice(0, 80) + "...");
    return videoUrl;
  } catch (err) {
    console.log("yt-dlp extraction failed:", err.message);
    return null;
  }
}

/**
 * Scrape the Instagram page HTML to find the direct video CDN URL from meta tags.
 * Tries multiple user-agents. Returns null if not found.
 */
async function scrapeInstagramVideoUrl(url) {
  const userAgents = [
    // WhatsApp link preview bot — Instagram serves OG tags to this
    "WhatsApp/2.23.20.0 A",
    // Googlebot
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    // Twitterbot
    "Twitterbot/1.0",
    // facebookexternalhit
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  ];

  for (const ua of userAgents) {
    try {
      const { data: html } = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const $ = cheerio.load(html);
      const videoUrl =
        $("meta[property='og:video:secure_url']").attr("content") ||
        $("meta[property='og:video']").attr("content") ||
        $("meta[name='twitter:player:stream']").attr("content") ||
        "";
      if (videoUrl && videoUrl.startsWith("http")) {
        console.log("✅ Scraped CDN video URL via meta tag (", ua.slice(0, 20), ")");
        return videoUrl;
      }
    } catch { /* try next UA */ }
  }
  return null;
}

/**
 * Get the Instagram video CDN URL.
 * Step 1: scrape og:video meta tags (no binary needed).
 * Step 2: fall back to yt-dlp (downloads binary once on first use).
 */
async function getInstagramVideoUrl(url) {
  const scraped = await scrapeInstagramVideoUrl(url);
  if (scraped) return scraped;
  console.log("Meta-tag scrape found no video URL, trying yt-dlp...");
  return extractInstagramVideoUrl(url);
}

/**
 * Extract content from an Instagram post/reel URL
 */
async function extractInstagram(url) {
  try {
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    // Detect reel vs post
    const isReel = /instagram\.com\/reel\//i.test(url);
    const isPost = /instagram\.com\/p\//i.test(url);

    // Build a readable title — oEmbed title is the caption, author_name is the username
    let title = "";
    let caption = data.title || "";
    const author = data.author_name || "";

    // If oEmbed caption is empty, try scraping og:description for the real caption
    let thumbnail = data.thumbnail_url || "";
    if (!caption || !thumbnail) {
      try {
        console.log("Instagram oEmbed missing caption/thumbnail, trying scrape...");
        const scraped = await scrapeMetaTags(url);
        if (!caption && scraped.caption) {
          caption = scraped.caption;
        }
        if (!thumbnail && scraped.thumbnail) {
          thumbnail = scraped.thumbnail;
        }
      } catch { }
    }

    // Use caption text as title if it's a real sentence
    if (caption && caption.length > 3 && !/^[A-Za-z0-9_-]{5,20}$/.test(caption)) {
      title = caption.length > 100 ? caption.slice(0, 100) + "…" : caption;
    } else if (author) {
      title = isReel ? `${author}'s Reel` : `${author}'s Post`;
    } else {
      title = isReel ? "Instagram Reel" : "Instagram Post";
    }

    // Embed URL — only for posts, never for reels
    let embedUrl = null;
    if (!isReel) {
      try {
        const u = new URL(url);
        if (!u.pathname.endsWith("/embed")) {
          u.pathname = u.pathname.replace(/\/?$/, "") + "/embed";
        }
        embedUrl = u.toString();
      } catch { }
    }

    // Get video CDN URL: scrape og:video first, yt-dlp as fallback
    const videoUrl = await getInstagramVideoUrl(url);

    return {
      title,
      caption,
      thumbnail,
      author,
      embed_url: embedUrl,
      video_url: videoUrl || "",
      raw_data: data,
    };
  } catch (err) {
    console.log("Instagram oembed failed, trying scrape fallback...");
    const scraped = await scrapeMetaTags(url);
    // adjust embed_url just like the normal path
    try {
      const u = new URL(url);
      if (!u.pathname.endsWith("/embed")) {
        u.pathname = u.pathname.replace(/\/?$/, "") + "/embed";
      }
      scraped.embed_url = u.toString();
    } catch { }
    // Detect reel vs post for fallback
    const isReel = /instagram\.com\/reel\//i.test(url);
    // Fix title — reject shortcode slugs and generic text
    if (
      !scraped.title ||
      scraped.title === "Untitled" ||
      /^[A-Za-z0-9_-]{5,20}$/.test(scraped.title)
    ) {
      if (isReel) {
        scraped.title = scraped.author ? `${scraped.author}'s Reel` : "Instagram Reel";
      } else {
        scraped.title = scraped.author ? `${scraped.author}'s Post` : "Instagram Post";
      }
      scraped.caption = scraped.caption || "Saved from Instagram";
    }
    // Never embed reels
    if (isReel) {
      scraped.embed_url = null;
    }
    // Clean up captions that are just raw HTML/JS
    if (scraped.caption && scraped.caption.length > 500) {
      scraped.caption = scraped.caption.slice(0, 300) + "...";
    }
    // Still attempt video extraction even when oembed failed
    if (!scraped.video_url) {
      scraped.video_url = await getInstagramVideoUrl(url) || "";
    }
    return scraped;
  }
}

/**
 * Extract content from a Twitter/X URL
 */
async function extractTwitter(url) {
  try {
    // Convert x.com to twitter.com for oembed compatibility
    const twitterUrl = url.replace(/https?:\/\/(www\.)?x\.com/i, "https://twitter.com");
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(twitterUrl)}`;
    const { data } = await axios.get(oembedUrl, { timeout: 10000 });

    // Strip HTML from the embed to get plain text
    const $ = cheerio.load(data.html || "");
    const tweetText = $("p").first().text();

    // Try scraping OG/twitter meta tags to find an image thumbnail for tweets
    let thumbnail = "";
    try {
      const scraped = await scrapeMetaTags(url);
      if (scraped && scraped.thumbnail) {
        thumbnail = scraped.thumbnail;
      }
    } catch (e) {
      // ignore scraping errors
    }

    return {
      title: (tweetText || "").slice(0, 100) || "Tweet",
      caption: tweetText || "",
      thumbnail,
      author: data.author_name || "",
      embed_url: url,
      raw_data: data,
    };
  } catch (err) {
    console.log("Twitter oembed failed:", err.message);
    // Use URL-based fallback
    try {
      const scraped = await scrapeMetaTags(url);
      return {
        title: scraped.title || "Tweet by " + extractTwitterHandle(url),
        caption: scraped.caption || "Saved tweet from Twitter/X",
        thumbnail: scraped.thumbnail || "",
        author: scraped.author || extractTwitterHandle(url),
        embed_url: url,
        raw_data: scraped.raw_data || {},
      };
    } catch (e) {
      return {
        title: "Tweet by " + extractTwitterHandle(url),
        caption: "Saved tweet from Twitter/X",
        thumbnail: "",
        author: extractTwitterHandle(url),
        embed_url: url,
        raw_data: {},
      };
    }
  }
}

/**
 * Extract Twitter handle from URL
 */
function extractTwitterHandle(url) {
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/i);
  return match ? `@${match[1]}` : "unknown";
}

/**
 * Extract YouTube video ID from any YouTube URL
 */
function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
    // youtube.com/shorts/VIDEO_ID
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
    // youtube.com/watch?v=VIDEO_ID
    return u.searchParams.get("v") || null;
  } catch {
    return null;
  }
}

/**
 * Extract content from a YouTube URL — scrapes OG tags + builds embed URL
 */
async function extractYouTube(url) {
  const videoId = extractYouTubeId(url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;

  try {
    const scraped = await scrapeMetaTags(url);
    return {
      title: scraped.title || "YouTube Video",
      caption: scraped.caption || "",
      thumbnail: scraped.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ""),
      author: scraped.author || "",
      embed_url: embedUrl,
      raw_data: scraped.raw_data || {},
    };
  } catch {
    return {
      title: "YouTube Video",
      caption: "",
      thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
      author: "",
      embed_url: embedUrl,
      raw_data: {},
    };
  }
}

/**
 * Extract content from a generic article/blog URL
 */
async function extractArticle(url) {
  const scraped = await scrapeMetaTags(url);
  if (!scraped.title || scraped.title === "Untitled") {
    scraped.title = titleFromUrl(url);
  }
  // Clean long captions
  if (scraped.caption && scraped.caption.length > 500) {
    scraped.caption = scraped.caption.slice(0, 300) + "...";
  }
  return scraped;
}

/**
 * Fallback: Scrape Open Graph / meta tags from any URL
 */
async function scrapeMetaTags(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      "";
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      "";
    const video =
      $('meta[property="og:video:secure_url"]').attr("content") ||
      $('meta[property="og:video"]').attr("content") ||
      $('meta[name="twitter:player:stream"]').attr("content") ||
      "";
    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      "";

    return {
      title: title.trim() || "Untitled",
      caption: description.trim(),
      thumbnail: image,
      video_url: video || "",
      author,
      embed_url: url,
      raw_data: { title: title.trim(), description: description.trim(), image },
    };
  } catch (err) {
    console.error("Scrape failed:", err.message);
    return {
      title: titleFromUrl(url),
      caption: "Saved from the web",
      thumbnail: "",
      author: "",
      embed_url: url,
      raw_data: {},
    };
  }
}

/**
 * Main extractor - routes to the right platform handler
 */
async function extractContent(url) {
  const platform = detectPlatform(url);

  let content;
  switch (platform) {
    case "instagram":
      content = await extractInstagram(url);
      break;
    case "twitter":
      content = await extractTwitter(url);
      break;
    case "youtube":
      content = await extractYouTube(url);
      break;
    default:
      content = await extractArticle(url);
  }

  return { ...content, platform };
}

export { extractContent, detectPlatform };
