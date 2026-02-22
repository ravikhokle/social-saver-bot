// Gemini via official SDK; Cohere via axios
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

// initialize Gemini client once (picks up GEMINI_API_KEY automatically if set)
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Use AI to auto-tag and summarize content
 */
async function analyzeContent({ title, caption, platform, url, author }) {
  const textToAnalyze = [caption, title, url].filter(Boolean).join(" ").trim();

  if (!textToAnalyze) {
    return { category: "Uncategorized", tags: [], summary: "No content available to summarize." };
  }

  // 1️⃣ Always try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("🤖 Trying Gemini...");
      return await analyzeWithGemini(textToAnalyze, platform, { author, url });
    } catch (err) {
      console.warn("⚠️ Gemini failed:", err.message?.slice(0, 120));
    }
  }

  // 2️⃣ Try Cohere (free tier)
  if (process.env.COHERE_API_KEY) {
    try {
      console.log("🤖 Trying Cohere...");
      return await analyzeWithCohere(textToAnalyze, platform, { author, url });
    } catch (err) {
      console.warn("⚠️ Cohere failed:", err.response?.data?.message || err.message?.slice(0, 120));
    }
  }

  // 3️⃣ All AI providers failed — use keyword-based fallback
  console.log("🔧 All AI providers failed, using keyword-based fallback analysis");
  return fallbackAnalysis(textToAnalyze, platform, url);
}

const SYSTEM_PROMPT = `You are an expert content classifier for a social media bookmark app. Given post content, return ONLY valid JSON (no markdown, no code fences).

Required JSON shape:
{
  "title": "...",
  "category": "...",
  "tags": ["...", "...", "..."],
  "summary": "..."
}

--- TITLE RULES ---
- 4 to 10 words, natural and descriptive.
- Must reflect the ACTUAL topic/subject of the post, not the platform or format.
- Use important keywords from the caption so the user recognises the content.
- Do NOT start with: "Instagram", "Twitter", "YouTube", "Reel", "Post", "Video", "A post about".
- Do NOT use clickbait or vague phrases like "You won't believe" or "Amazing content".
- If the caption is empty, infer from the author name and URL slug.
- Examples of GOOD titles: "How to Build a REST API in Node.js", "5 Minute Leg Workout for Beginners", "Homemade Sourdough Bread Recipe"

--- CATEGORY RULES ---
Pick exactly ONE from this list:
Fitness, Coding, Food, Travel, Design, Music, Fashion, Education, Business, Finance, Entertainment, Science, Lifestyle, Health, Gaming, Photography, Motivation, Productivity, News, Cooking
- Choose the most specific matching category.
- "Education" = tutorials, explanations, how-to guides.
- "Coding" = programming, software, tech tools.
- "Finance" = money, investing, crypto, trading.
- If nothing fits well, use "Lifestyle".

--- TAG RULES ---
- 3 to 6 tags, all lowercase.
- Include the real hashtags from the caption (without the # symbol).
- Add topic/concept tags inferred from the content (e.g. "system design", "node.js", "interview prep").
- Tags can be multi-word (e.g. "event loop", "weight loss").
- Do NOT include generic noise tags: viral, trending, fyp, foryou, explorepage, follow, like, share, reels, instagood.

--- SUMMARY RULES ---
- 1 to 2 sentences max.
- Must include key topic words from the caption so it is searchable later.
- Write in third-person or neutral tone (no "I" or "you").
- Do NOT just repeat the title. Add context about what the viewer learns or sees.
`;

/**
 * Build the user message for AI — structured for clarity
 */
function buildUserMessage(text, platform, { author, url } = {}) {
  const hashtags = (text.match(/#[a-zA-Z][a-zA-Z0-9_]*/g) || []).join(" ");
  // Strip hashtag block from caption so the main text is cleaner
  const cleanText = text.replace(/(#[a-zA-Z][a-zA-Z0-9_]*\s*)+/g, " ").replace(/\s+/g, " ").trim();
  const lines = [
    `Platform: ${platform}`,
    author ? `Creator: ${author}` : null,
    `URL: ${url || ""}`,
    `Caption/Text: ${cleanText.slice(0, 800)}`,
    hashtags ? `Hashtags in post: ${hashtags}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}


async function analyzeWithCohere(text, platform, meta = {}) {
  const model = process.env.COHERE_MODEL || "command-r";
  const res = await axios.post(
    "https://api.cohere.com/v2/chat",
    {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(text, platform, meta) },
      ],
      temperature: 0.2,
      max_tokens: 350,
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
async function analyzeWithGemini(text, platform, meta = {}) {
  // prefer the newest model; can be overridden via env
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const prompt = `${SYSTEM_PROMPT}\n\n${buildUserMessage(text, platform, meta)}`;

  try {
    const response = await geminiClient.models.generateContent({
      model,
      contents: prompt,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 350,
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
    title: (parsed.title || "").trim(),
    category: parsed.category || "Uncategorized",
    tags: Array.isArray(parsed.tags)
      ? parsed.tags
          .map((t) => t.toLowerCase().trim())
          .filter((t) => t.length > 1 && ![
            "viral","trending","fyp","foryou","explorepage","follow","like","share","reels","instagood","love"
          ].includes(t))
          .slice(0, 6)
      : [],
    summary: (parsed.summary || "").trim(),
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
      "running", "abs", "bodybuilding", "stretch", "weight loss",
      "training", "protein", "hiit", "crossfit", "squat",
      "push up", "pull up", "calories", "reps", "plank", "deadlift",
    ],
    Coding: [
      "code", "coding", "programming", "developer", "javascript", "python", "react",
      "api", "github", "software", "algorithm", "frontend", "backend",
      "devops", "debug", "html", "css", "node", "database", "typescript",
      "rust", "golang", "nextjs", "java", "kotlin", "swift",
      "flutter", "docker", "kubernetes", "git", "open source",
      "function", "class", "object", "array", "loop",
      "system design", "data structure", "leetcode", "dsa",
    ],
    Food: [
      "recipe", "cook", "food", "meal", "pasta", "restaurant", "eat",
      "bake", "delicious", "dinner", "lunch", "breakfast",
      "snack", "chef", "vegan", "pizza", "salad", "cuisine",
      "ingredient", "dessert", "smoothie", "coffee",
    ],
    Cooking: [
      "how to cook", "cooking tutorial", "cooking tips", "homemade", "kitchen hack",
      "stir fry", "grilling", "baking tips", "sourdough", "meal prep",
      "knife skills", "seasoning", "sauce", "marinade",
    ],
    Travel: [
      "travel", "trip", "destination", "flight", "hotel", "explore",
      "adventure", "tourism", "beach", "mountain", "vacation", "hiking",
      "road trip", "wanderlust", "itinerary", "passport",
      "backpacking", "hostel", "resort", "sightseeing", "landmark",
    ],
    Design: [
      "design", "ui", "ux", "figma", "typography", "layout", "creative",
      "graphic", "branding", "logo", "illustration", "photoshop", "canva",
      "wireframe", "prototype", "color palette", "design system",
      "mockup", "animation", "motion",
    ],
    Photography: [
      "photography", "photo", "camera", "lens", "lightroom", "editing photo",
      "portrait", "landscape photo", "street photography", "composition",
      "exposure", "shutter speed", "iso", "aperture",
    ],
    Music: [
      "music", "song", "album", "playlist", "concert", "artist", "beat",
      "rapper", "singer", "guitar", "lyrics", "melody", "spotify",
      "hip hop", "rock", "pop", "jazz", "producer", "studio",
      "bass", "drum", "piano", "vocals",
    ],
    Fashion: [
      "fashion", "outfit", "ootd", "style", "clothing", "wear", "trend",
      "dress", "shoes", "streetwear", "luxury", "accessories", "wardrobe",
      "model", "lookbook", "collection", "brand",
    ],
    Education: [
      "learn", "study", "course", "tutorial", "guide", "tips", "how to",
      "lesson", "teach", "university", "student", "lecture",
      "skill", "certification", "bootcamp", "explained", "basics",
      "beginner", "advanced", "concept", "theory", "exam",
    ],
    Business: [
      "startup", "business", "entrepreneur", "marketing",
      "revenue", "growth", "sales", "brand",
      "saas", "product", "founder", "client", "freelance",
      "e-commerce", "shopify", "monetize",
    ],
    Finance: [
      "money", "invest", "finance", "stock", "crypto", "trading",
      "wealth", "profit", "passive income", "budget", "savings",
      "portfolio", "dividend", "forex", "nft", "defi", "blockchain",
    ],
    Gaming: [
      "game", "gaming", "gamer", "esports", "playstation", "xbox", "pc gaming",
      "minecraft", "fortnite", "valorant", "roblox", "twitch", "streamer",
      "fps", "rpg", "console", "controller",
    ],
    Entertainment: [
      "movie", "film", "show", "netflix", "anime", "meme", "funny",
      "comedy", "celebrity", "drama",
      "series", "trailer", "review", "reaction", "prank", "challenge",
    ],
    Science: [
      "science", "research", "physics", "biology", "chemistry", "space",
      "nasa", "experiment", "discovery", "data", "artificial intelligence",
      "machine learning", "neuroscience", "climate", "quantum", "rocket",
      "atom", "dna", "evolution", "mathematics",
    ],
    Health: [
      "health", "mental health", "anxiety", "depression", "therapy",
      "sleep", "nutrition", "immune", "gut health", "supplements",
      "vitamins", "hydration", "stress", "wellness check",
    ],
    Motivation: [
      "motivation", "inspire", "mindset", "discipline", "grind",
      "success", "goals", "consistency", "hard work", "focus",
      "positive", "growth mindset", "never give up",
    ],
    Productivity: [
      "productivity", "time management", "focus", "deep work", "pomodoro",
      "habit", "morning routine", "to do list", "planning", "system",
      "workflow", "tools", "automation", "notion", "obsidian",
    ],
    Lifestyle: [
      "lifestyle", "self improvement", "self care", "meditation", "gratitude",
      "minimalism", "home decor", "relationship", "journaling", "routine", "balance",
    ],
    News: [
      "news", "breaking", "update", "report", "latest", "today",
      "politics", "economy", "government", "election", "headline",
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
