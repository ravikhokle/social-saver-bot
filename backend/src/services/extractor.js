import axios from "axios";
import * as cheerio from "cheerio";

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
      } catch {}
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
      } catch {}
    }

    return {
      title,
      caption,
      thumbnail,
      author,
      embed_url: embedUrl,
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
    } catch {}
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

    return {
      title: (tweetText || "").slice(0, 100) || "Tweet",
      caption: tweetText || "",
      thumbnail: "",
      author: data.author_name || "",
      embed_url: url,
      raw_data: data,
    };
  } catch (err) {
    console.log("Twitter oembed failed:", err.message);
    // Use URL-based fallback
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

/**
 * Extract Twitter handle from URL
 */
function extractTwitterHandle(url) {
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/i);
  return match ? `@${match[1]}` : "unknown";
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
    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      "";

    return {
      title: title.trim() || "Untitled",
      caption: description.trim(),
      thumbnail: image,
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
    default:
      content = await extractArticle(url);
  }

  return { ...content, platform };
}

export { extractContent, detectPlatform };
