import twilio from "twilio";
import { extractContent } from "../services/extractor.js";
import { analyzeContent } from "../services/ai.js";
import Bookmark from "../models/Bookmark.js";
import User from "../models/User.js";

// initialize Twilio client once
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const TWILIO_WHATSAPP_NUMBER =
  process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

export async function sendWhatsAppReply(to, body) {
  try {
    const message = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to,
      body,
    });
    console.log(`📤 Reply sent (SID: ${message.sid})`);
    return message;
  } catch (err) {
    console.error("❌ Failed to send WhatsApp reply:", err.message);
    throw err;
  }
}

export async function handleWhatsAppWebhook(req, res) {
  // Immediately respond with empty 200 so Twilio doesn't retry
  res.status(200).type("text/xml").send("<Response></Response>");

  try {
    const { Body, From, ProfileName } = req.body;
    const phone = From; // e.g. whatsapp:+1234567890
    const messageText = (Body || "").trim();

    console.log(`📩 WhatsApp message from ${phone}: ${messageText}`);

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: ProfileName || "User" });
    }

    // Extract URL from message
    const urlMatch = messageText.match(/https?:\/\/[^\s]+/i);

    let replyMessage;

    if (!urlMatch) {
      // Not a URL — send help message
      replyMessage =
        "👋 Hey! Send me a link (Instagram, Twitter, or any article) and I'll save it to your dashboard!\n\n" +
        "Try sending an Instagram Reel or Post link.";
    } else {
      const url = urlMatch[0];

      try {
        // Extract content from URL
        console.log(`🔍 Extracting content from: ${url}`);
        const content = await extractContent(url);

        // AI analysis
        console.log("🤖 Running AI analysis...");
        const analysis = await analyzeContent({
          title: content.title,
          caption: content.caption,
          platform: content.platform,
          author: content.author,
          url,
        });

        // Determine final title
        let finalTitle = content.title || "";
        const isReel = /instagram\.com\/reel\//i.test(url);
        const isJunkTitle = !finalTitle || /^[A-Za-z0-9_-]{5,20}$/.test(finalTitle) || /%%|Untitled|Instagram Reel|Instagram Post/i.test(finalTitle);

        // For Instagram reels, always prefer AI title since reels have no native title
        if (content.platform === "instagram" && isReel) {
          finalTitle = analysis.title || finalTitle;
        } else if (isJunkTitle) {
          finalTitle = analysis.title || finalTitle || "Untitled";
        }
        // Last resort fallback
        if (!finalTitle || /^Instagram (Reel|Post)$/i.test(finalTitle)) {
          finalTitle = content.author
            ? `${content.author}'s ${isReel ? "Reel" : "Post"}`
            : analysis.title || "Untitled";
        }

        // finalize category if AI left it uncategorized
        let finalCategory = analysis.category || "Uncategorized";
        const validCategories = [
          "Fitness", "Coding", "Food", "Cooking", "Travel", "Design", "Photography",
          "Music", "Fashion", "Education", "Business", "Finance", "Gaming",
          "Entertainment", "Science", "Health", "Motivation", "Productivity",
          "Lifestyle", "News",
        ];
        if (!validCategories.includes(finalCategory)) finalCategory = "Uncategorized";

        // Save to MongoDB
        const bookmark = await Bookmark.create({
          user: user._id,
          url,
          platform: content.platform,
          title: finalTitle,
          caption: content.caption || "",
          summary: analysis.summary || "",
          category: finalCategory,
          tags: analysis.tags || [],
          thumbnail: content.thumbnail || "",
          videoUrl: content.video_url || "",
          embedUrl: content.embed_url || url,
          author: content.author || "",
          rawData: content.raw_data || {},
        });

        console.log(`✅ Saved bookmark: ${bookmark._id}`);

        const platformEmoji = {
          instagram: "📸",
          twitter: "🐦",
          youtube: "🎬",
          article: "📄",
        };

        replyMessage =
          `${platformEmoji[content.platform] || "🔖"} Got it! Saved to your *${finalCategory}* bucket.\n\n` +
          `📌 Title: ${finalTitle}\n` +
          `📂 Category: ${finalCategory}\n\n` +
          `📝 ${analysis.summary}\n\n` +
          `🏷️ Tags: ${(analysis.tags || []).join(", ") || "none"}\n\n` +
          `View your saved links at: ${process.env.FRONTEND_URL ||
          "http://localhost:3000"}`;
      } catch (extractErr) {
        console.error("Error processing URL:", extractErr);
        replyMessage =
          "⚠️ I couldn't process that link. Please check the URL and try again.";
      }
    }

    // Send reply via Twilio REST API
    await sendWhatsAppReply(phone, replyMessage);
  } catch (err) {
    console.error("Webhook error:", err);
  }
}

export async function handleTestWebhook(req, res) {
  try {
    const { url, phone = "test:+0000000000" } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Find or create test user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: "Test User" });
    }

    // Extract content
    const content = await extractContent(url);

    // AI analysis
    const analysis = await analyzeContent({
      title: content.title,
      caption: content.caption,
      platform: content.platform,
      author: content.author,
      url,
    });

    // Determine final title
    let finalTitle = content.title || "";
    const isReel = /instagram\.com\/reel\//i.test(url);
    const isJunkTitle = !finalTitle || /^[A-Za-z0-9_-]{5,20}$/.test(finalTitle) || /%%|Untitled|Instagram Reel|Instagram Post/i.test(finalTitle);

    // For Instagram reels, always prefer AI title since reels have no native title
    if (content.platform === "instagram" && isReel) {
      finalTitle = analysis.title || finalTitle;
    } else if (isJunkTitle) {
      finalTitle = analysis.title || finalTitle || "Untitled";
    }
    // Last resort fallback
    if (!finalTitle || /^Instagram (Reel|Post)$/i.test(finalTitle)) {
      finalTitle = content.author
        ? `${content.author}'s ${isReel ? "Reel" : "Post"}`
        : analysis.title || "Untitled";
    }

    // finalize category
    let finalCategory = analysis.category || "Uncategorized";
    const validCategories = [
      "Fitness", "Coding", "Food", "Cooking", "Travel", "Design", "Photography",
      "Music", "Fashion", "Education", "Business", "Finance", "Gaming",
      "Entertainment", "Science", "Health", "Motivation", "Productivity",
      "Lifestyle", "News",
    ];
    if (!validCategories.includes(finalCategory)) finalCategory = "Uncategorized";

    // Save
    const bookmark = await Bookmark.create({
      user: user._id,
      url,
      platform: content.platform,
      title: finalTitle,
      caption: content.caption || "",
      summary: analysis.summary || "",
      category: finalCategory,
      tags: analysis.tags || [],
      thumbnail: content.thumbnail || "",
      videoUrl: content.video_url || "",
      embedUrl: content.embed_url || url,
      author: content.author || "",
      rawData: content.raw_data || {},
    });

    res.json({
      message: `Saved to "${analysis.category}" bucket!`,
      bookmark,
    });
  } catch (err) {
    console.error("Test endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
}
