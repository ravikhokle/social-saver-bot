// Gemini via official SDK; Cohere via axios
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

// initialize Gemini client once (picks up GEMINI_API_KEY automatically if set)
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Use AI to auto-tag and summarize content
 */
async function analyzeContent({ title, caption, platform, url }) {
  const textToAnalyze = [caption, title, url].filter(Boolean).join(" ").trim();

  if (!textToAnalyze) {
    return { category: "Uncategorized", tags: [], summary: "No content available to summarize." };
  }

  // 1️⃣ Always try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("🤖 Trying Gemini...");
      return await analyzeWithGemini(textToAnalyze, platform);
    } catch (err) {
      console.warn("⚠️ Gemini failed:", err.message?.slice(0, 120));
    }
  }

  // 2️⃣ Try Cohere (free tier)
  if (process.env.COHERE_API_KEY) {
    try {
      console.log("🤖 Trying Cohere...");
      return await analyzeWithCohere(textToAnalyze, platform);
    } catch (err) {
      console.warn("⚠️ Cohere failed:", err.response?.data?.message || err.message?.slice(0, 120));
    }
  }

  // 3️⃣ All AI providers failed — use keyword-based fallback
  console.log("🔧 All AI providers failed, using keyword-based fallback analysis");
  return fallbackAnalysis(textToAnalyze, platform, url);
}

const SYSTEM_PROMPT = `You are a content classifier. Given social media content (caption, title, URL), respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "A short, descriptive title based on the actual content/caption (NOT generic like 'Instagram Reel')",
  "category": "one of: Fitness, Coding, Food, Travel, Design, Music, Fashion, Education, Business, Entertainment, Science, Lifestyle, Uncategorized",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "A single concise sentence summarizing the content. Use key words from the caption so the user can search for it later."
}

IMPORTANT:
- The title MUST describe what the content is about, using keywords from the caption.
- The summary MUST include important words from the caption so it is searchable.
- Tags MUST include relevant keywords from the caption text.
- If caption is empty, infer meaning from the URL or author name.
- NEVER use generic titles like "Instagram Reel" or "Social Media Post".`;


async function analyzeWithCohere(text, platform) {
  const model = process.env.COHERE_MODEL || "command-r";
  const res = await axios.post(
    "https://api.cohere.com/v2/chat",
    {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Platform: ${platform}\nContent: ${text.slice(0, 1000)}` },
      ],
      temperature: 0.3,
      max_tokens: 200,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );
  const raw = res.data.message.content[0].text.trim();
  console.log(`✅ Cohere model "${model}" returned`);
  return parseAIResponse(raw);
}

/**
 * Try multiple Gemini models — different models may have separate rate limits
 */
async function analyzeWithGemini(text, platform) {
  // prefer the newest model; can be overridden via env
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const prompt = `${SYSTEM_PROMPT}\n\nPlatform: ${platform}\nContent: ${text.slice(0, 1000)}`;

  try {
    const response = await geminiClient.models.generateContent({
      model,
      contents: prompt,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 200,
      },
    });

    // SDK exposes the text via the .text property (getter)
    const raw = response.text ? response.text.trim() : "";
    console.log(`✅ Gemini SDK model "${model}" returned`);
    return parseAIResponse(raw);
  } catch (err) {
    console.log(`⚠️ Gemini SDK call failed: ${err.message}`);
    if (err?.response?.data) {
      console.log("   details:", err.response.data);
    }
    throw err;
  }
}

/**
 * Parse AI response, stripping markdown fences if present
 */
function parseAIResponse(raw) {
  raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(raw);
  return {
    title: parsed.title || "",
    category: parsed.category || "Uncategorized",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    summary: parsed.summary || "",
  };
}

/**
 * Clean raw caption/title — strip Instagram engagement noise like "12K likes, 41 comments"
 */
function cleanCaption(text) {
  if (!text) return "";
  return text
    // Remove engagement counts: "12K likes, 41 comments - " prefix
    .replace(/^\d[\d.,KkMm]*\s*(likes?|views?|comments?|shares?)[^-\n]*[-–]\s*/gi, "")
    // Remove trailing "on <date>:" patterns from oEmbed
    .replace(/\s+on\s+\w+ \d{1,2},\s*\d{4}:\s*/gi, ": ")
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract a readable title from cleaned caption text
 */
function titleFromCaption(caption) {
  if (!caption) return "";
  // If caption contains a colon (e.g. "Java Basics: ..."), use the part before it
  const colonIdx = caption.indexOf(":");
  if (colonIdx > 10 && colonIdx < 80) {
    return caption.slice(0, colonIdx).trim();
  }
  // Use first sentence if short enough
  const sentenceEnd = caption.search(/[.!?]/);
  if (sentenceEnd > 10 && sentenceEnd < 80) {
    return caption.slice(0, sentenceEnd).trim();
  }
  // Fall back to first 8 words
  const words = caption.split(" ").slice(0, 8).join(" ");
  return words.length > 3 ? words : "";
}

/**
 * Extract hashtags from raw caption text — these make great tags
 */
function extractHashtags(text) {
  if (!text) return [];
  const tags = (text.match(/#[a-zA-Z][a-zA-Z0-9_]*/g) || [])
    .map((t) => t.slice(1).toLowerCase())
    // Filter out generic noise tags
    .filter((t) => !["instagram", "reel", "reels", "instagood", "viral", "fyp", "foryou", "trending", "explorepage", "follow", "like", "love", "share"].includes(t));
  return [...new Set(tags)];
}

/**
 * Smart keyword-based fallback when AI is unavailable
 */
function fallbackAnalysis(rawText, platform, url) {
  const cleaned = cleanCaption(rawText);
  const lower = (cleaned + " " + (url || "")).toLowerCase();

  // --- Title ---
  let title = titleFromCaption(cleaned);
  if (!title && url) {
    try {
      const u = new URL(url);
      const slug = u.pathname.split("/").filter(Boolean).pop() || "";
      title = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || u.hostname;
    } catch { }
  }
  if (!title) title = "Saved Content";

  const categories = {
    Fitness: [
      "workout", "gym", "exercise", "fitness", "muscle", "cardio", "yoga",
      "running", "abs", "bodybuilding", "stretch", "health", "weight loss",
      "training", "sport", "protein", "diet", "hiit", "crossfit", "squat",
      "push up", "pull up", "calories", "reps", "sets", "plank", "deadlift",
    ],
    Coding: [
      "code", "coding", "programming", "developer", "javascript", "python", "react",
      "api", "github", "software", "algorithm", "frontend", "backend",
      "devops", "debug", "html", "css", "node", "database", "typescript",
      "rust", "golang", "nextjs", "deploy", "java", "kotlin", "swift",
      "flutter", "docker", "kubernetes", "git", "open source", "terminal",
      "function", "class", "object", "array", "loop", "variable", "boolean",
      "string[]", "main method", "static void", "public class",
    ],
    Food: [
      "recipe", "cook", "food", "meal", "pasta", "restaurant", "eat",
      "kitchen", "bake", "delicious", "dinner", "lunch", "breakfast",
      "snack", "chef", "vegan", "pizza", "salad", "healthy eating", "cuisine",
      "ingredient", "flavour", "flavor", "dessert", "smoothie", "coffee",
    ],
    Travel: [
      "travel", "trip", "destination", "flight", "hotel", "explore",
      "adventure", "tourism", "beach", "mountain", "vacation", "hiking",
      "road trip", "wanderlust", "itinerary", "passport", "visa",
      "backpacking", "hostel", "resort", "sightseeing", "landmark",
    ],
    Design: [
      "design", "ui", "ux", "figma", "typography", "layout", "creative",
      "graphic", "branding", "logo", "illustration", "photoshop", "canva",
      "wireframe", "prototype", "color palette", "design system", "font",
      "visual", "mockup", "component", "animation", "motion",
    ],
    Music: [
      "music", "song", "album", "playlist", "concert", "artist", "beat",
      "rapper", "singer", "guitar", "lyrics", "melody", "spotify",
      "hip hop", "rock", "pop", "jazz", "producer", "studio", "track",
      "bass", "drum", "piano", "vocals", "mixtape",
    ],
    Fashion: [
      "fashion", "outfit", "ootd", "style", "clothing", "wear", "trend",
      "dress", "shoes", "streetwear", "luxury", "accessories", "wardrobe",
      "model", "lookbook", "collection", "brand", "couture",
    ],
    Education: [
      "learn", "study", "course", "tutorial", "guide", "tips", "how to",
      "lesson", "teach", "knowledge", "university", "student", "lecture",
      "skill", "certification", "bootcamp", "explained", "basics",
      "beginner", "advanced", "concept", "theory", "exam", "quiz",
    ],
    Business: [
      "startup", "business", "entrepreneur", "marketing", "money", "invest",
      "finance", "stock", "crypto", "revenue", "growth", "sales", "brand",
      "linkedin", "saas", "product", "founder", "profit", "passive income",
      "e-commerce", "shopify", "monetize", "client", "freelance",
    ],
    Entertainment: [
      "movie", "film", "show", "netflix", "anime", "meme", "funny",
      "comedy", "game", "gaming", "celebrity", "viral", "drama",
      "series", "trailer", "review", "reaction", "prank", "challenge",
    ],
    Science: [
      "science", "research", "physics", "biology", "chemistry", "space",
      "nasa", "experiment", "discovery", "data", "artificial intelligence",
      "machine learning", "neuroscience", "climate", "quantum", "rocket",
      "atom", "dna", "evolution", "mathematics",
    ],
    Lifestyle: [
      "lifestyle", "motivation", "mindset", "self improvement", "morning routine",
      "productivity", "wellness", "meditation", "gratitude", "habit",
      "minimalism", "home decor", "relationship", "mental health", "anxiety",
      "confidence", "journaling", "routine", "balance", "self care",
    ],
  };

  // Score each category
  let bestCategory = "Uncategorized";
  let bestScore = 0;
  let matchedKeywords = [];

  for (const [cat, keywords] of Object.entries(categories)) {
    const matches = keywords.filter((k) => lower.includes(k));
    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestCategory = cat;
      matchedKeywords = matches;
    }
  }

  // --- Tags: prefer real hashtags from caption, backfill with matched keywords ---
  const hashTags = extractHashtags(rawText);
  const keywordTags = matchedKeywords
    .filter((k) => k.length > 3 && !k.includes(" "))
    .slice(0, 3);
  const allTags = [...new Set([...hashTags.slice(0, 4), ...keywordTags])].slice(0, 5);

  // --- Summary: build a clean, readable sentence ---
  let summary = "";
  if (cleaned) {
    // Strip hashtag block from the end (lines full of hashtags)
    const noHashtags = cleaned.replace(/(#\w+\s*){3,}/g, "").trim();
    // Take up to 180 chars, ending at a word boundary
    if (noHashtags.length <= 180) {
      summary = noHashtags;
    } else {
      const cut = noHashtags.slice(0, 180);
      const lastSpace = cut.lastIndexOf(" ");
      summary = (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + "…";
    }
  }
  if (!summary) summary = `A ${bestCategory !== "Uncategorized" ? bestCategory.toLowerCase() : platform || "web"} post saved from ${platform || "the web"}.`;

  return {
    title,
    category: bestCategory,
    tags: allTags,
    summary,
  };
}

export { analyzeContent };
