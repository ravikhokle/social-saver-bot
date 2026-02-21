const axios = require("axios");
const cheerio = require("cheerio");

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

    return {
      title: data.title || titleFromUrl(url),
      caption: data.title || "",
      thumbnail: data.thumbnail_url || "",
      author: data.author_name || "",
      embed_url: url,
      raw_data: data,
    };
  } catch (err) {
    console.log("Instagram oembed failed, trying scrape fallback...");
    const scraped = await scrapeMetaTags(url);
    // If scrape also returns garbage, use a clean default
    if (!scraped.title || scraped.title === "Untitled") {
      scraped.title = "Instagram Post";
      scraped.caption = scraped.caption || "Saved from Instagram";
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

module.exports = { extractContent, detectPlatform };
