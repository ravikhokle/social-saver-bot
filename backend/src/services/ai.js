// switch to official Gemini SDK; still use axios for OpenAI
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

/**
 * Delay helper for retry/backoff
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// initialize Gemini client once (picks up GEMINI_API_KEY automatically if set)
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Use AI to auto-tag and summarize content
 */
async function analyzeContent({ title, caption, platform, url }) {
  // Include caption, title, and URL so AI has maximum context
  const textToAnalyze = [caption, title, url].filter(Boolean).join(" ").trim();

  if (!textToAnalyze) {
    return {
      category: "Uncategorized",
      tags: [],
      summary: "No content available to summarize.",
    };
  }

  const provider = process.env.AI_PROVIDER || "gemini";

  // Try primary provider
  try {
    if (provider === "openai") {
      return await analyzeWithOpenAI(textToAnalyze, platform);
    } else {
      return await analyzeWithGemini(textToAnalyze, platform);
    }
  } catch (err) {
    console.error(`Primary AI (${provider}) failed:`, err.message);
    if (err.response && err.response.data) {
      console.error("Primary error details:", err.response.data);
    }
  }

  // Try fallback provider
  try {
    if (provider === "openai" && process.env.GEMINI_API_KEY) {
      console.log("Falling back to Gemini...");
      return await analyzeWithGemini(textToAnalyze, platform);
    } else if (provider === "gemini" && process.env.OPENAI_API_KEY) {
      console.log("Falling back to OpenAI...");
      return await analyzeWithOpenAI(textToAnalyze, platform);
    }
  } catch (err2) {
    console.error("Fallback AI also failed:", err2.message);
  }

  // If both providers fail, retry primary once after a short delay
  try {
    console.log("⏳ Waiting 3s and retrying primary AI...");
    await delay(3000);
    if (provider === "openai") {
      return await analyzeWithOpenAI(textToAnalyze, platform);
    } else {
      return await analyzeWithGemini(textToAnalyze, platform);
    }
  } catch (retryErr) {
    console.error("Retry also failed:", retryErr.message);
  }

  console.log("🔧 Using keyword-based fallback analysis");
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

async function analyzeWithOpenAI(text, platform) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Platform: ${platform}\nContent: ${text.slice(0, 1000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  const raw = res.data.choices[0].message.content.trim();
  return parseAIResponse(raw);
}

/**
 * Try multiple Gemini models — different models may have separate rate limits
 */
async function analyzeWithGemini(text, platform) {
  // prefer the newest model; can be overridden via env
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const prompt = `${SYSTEM_PROMPT}\n\nPlatform: ${platform}\nContent: ${text.slice(0, 1000)}`;

  try {
    const response = await geminiClient.models.generateContent({
      model,
      contents: prompt,
      temperature: 0.3,
      maxOutputTokens: 200,
    });

    // the SDK returns the generated text in `response.text`
    let raw = (response && response.text) ? response.text.trim() : "";
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
 * Smart keyword-based fallback when AI is unavailable
 */
function fallbackAnalysis(text, platform, url) {
  const lower = (text + " " + (url || "")).toLowerCase();

  // attempt simple title generation: use first 6 words of text or hostname
  let title = "";
  if (text) {
    title = text.split(" ").slice(0, 6).join(" ");
  }
  if (!title && url) {
    try {
      title = new URL(url).hostname;
    } catch {}
  }
  if (!title) title = "Untitled";

  const categories = {
    Fitness: [
      "workout", "gym", "exercise", "fitness", "muscle", "cardio", "yoga",
      "running", "abs", "bodybuilding", "stretch", "health", "weight",
      "training", "sport", "protein", "diet", "hiit", "crossfit",
    ],
    Coding: [
      "code", "programming", "developer", "javascript", "python", "react",
      "api", "github", "software", "algorithm", "frontend", "backend",
      "devops", "debug", "tech", "html", "css", "node", "database",
      "typescript", "rust", "golang", "nextjs", "deploy",
    ],
    Food: [
      "recipe", "cook", "food", "meal", "pasta", "restaurant", "eat",
      "kitchen", "bake", "delicious", "dinner", "lunch", "breakfast",
      "snack", "chef", "vegan", "pizza", "salad", "healthy eating",
    ],
    Travel: [
      "travel", "trip", "destination", "flight", "hotel", "explore",
      "adventure", "tourism", "beach", "mountain", "vacation", "hiking",
      "backpack", "road trip", "scenic", "wanderlust",
    ],
    Design: [
      "design", "ui", "ux", "figma", "typography", "layout", "creative",
      "graphic", "branding", "logo", "illustration", "photoshop", "canva",
      "wireframe", "prototype", "color palette",
    ],
    Music: [
      "music", "song", "album", "playlist", "concert", "artist", "beat",
      "rapper", "singer", "guitar", "lyrics", "melody", "spotify",
      "hip hop", "rock", "pop", "jazz",
    ],
    Fashion: [
      "fashion", "outfit", "style", "clothing", "wear", "trend", "dress",
      "shoes", "streetwear", "luxury", "accessories", "wardrobe", "model",
    ],
    Education: [
      "learn", "study", "course", "tutorial", "guide", "tips", "howto",
      "lesson", "teach", "knowledge", "university", "student", "lecture",
      "skill", "certification", "bootcamp",
    ],
    Business: [
      "startup", "business", "entrepreneur", "marketing", "money", "invest",
      "finance", "stock", "crypto", "revenue", "growth", "sales", "brand",
      "linkedin", "saas", "product", "founder",
    ],
    Entertainment: [
      "movie", "film", "show", "netflix", "anime", "meme", "funny",
      "comedy", "game", "gaming", "celebrity", "viral", "drama",
      "series", "trailer", "review",
    ],
    Science: [
      "science", "research", "physics", "biology", "chemistry", "space",
      "nasa", "experiment", "discovery", "data", "ai", "machine learning",
      "neuroscience", "climate", "quantum",
    ],
    Lifestyle: [
      "lifestyle", "motivation", "mindset", "self-improvement", "morning routine",
      "productivity", "wellness", "meditation", "gratitude", "habit",
      "minimalism", "home decor", "relationship",
    ],
  };

  // Score each category
  let bestCategory = "Uncategorized";
  let bestScore = 0;
  let matchedTags = [];

  for (const [cat, keywords] of Object.entries(categories)) {
    const matches = keywords.filter((k) => lower.includes(k));
    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestCategory = cat;
      matchedTags = matches;
    }
  }

  // Platform-specific tags
  const platformTags = {
    instagram: ["instagram", "reel"],
    twitter: ["twitter", "tweet"],
    youtube: ["youtube", "video"],
    article: ["article", "blog"],
  };
  const pTags = platformTags[platform] || [];

  // Combine matched keyword tags + platform tags, deduplicated
  const allTags = [...new Set([...matchedTags.slice(0, 3), ...pTags])].slice(0, 5);

  // Generate a reasonable summary from the text
  let summary = text.slice(0, 150).trim();
  if (text.length > 150) summary += "...";
  if (!summary) summary = `Saved ${platform || "link"} content`;

  return {
    title,
    category: bestCategory,
    tags: allTags,
    summary,
  };
}

export { analyzeContent };
