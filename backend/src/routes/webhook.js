const express = require("express");
const twilio = require("twilio");
const { extractContent } = require("../services/extractor");
const { analyzeContent } = require("../services/ai");
const Bookmark = require("../models/Bookmark");
const User = require("../models/User");

const router = express.Router();

// Initialize Twilio client for sending replies via REST API
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

/**
 * Send WhatsApp reply via Twilio REST API (more reliable than TwiML through ngrok)
 */
async function sendWhatsAppReply(to, body) {
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

/**
 * POST /api/webhook/whatsapp
 * Twilio WhatsApp webhook endpoint
 */
router.post("/whatsapp", async (req, res) => {
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
    const urlMatch = messageText.match(
      /https?:\/\/[^\s]+/i
    );

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
          url,
        });

        // Save to MongoDB
        const bookmark = await Bookmark.create({
          user: user._id,
          url,
          platform: content.platform,
          title: content.title || "Untitled",
          caption: content.caption || "",
          summary: analysis.summary || "",
          category: analysis.category || "Uncategorized",
          tags: analysis.tags || [],
          thumbnail: content.thumbnail || "",
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
          `${platformEmoji[content.platform] || "🔖"} Got it! Saved to your *${analysis.category}* bucket.\n\n` +
          `📝 ${analysis.summary}\n\n` +
          `🏷️ Tags: ${(analysis.tags || []).join(", ") || "none"}\n\n` +
          `View your saved links at: ${process.env.FRONTEND_URL || "http://localhost:3000"}`;
      } catch (extractErr) {
        console.error("Error processing URL:", extractErr);
        replyMessage = "⚠️ I couldn't process that link. Please check the URL and try again.";
      }
    }

    // Send reply via Twilio REST API
    await sendWhatsAppReply(phone, replyMessage);
  } catch (err) {
    console.error("Webhook error:", err);
  }
});

/**
 * POST /api/webhook/test
 * Manual test endpoint (simulate sending a link without WhatsApp)
 */
router.post("/test", async (req, res) => {
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
      url,
    });

    // Save
    const bookmark = await Bookmark.create({
      user: user._id,
      url,
      platform: content.platform,
      title: content.title || "Untitled",
      caption: content.caption || "",
      summary: analysis.summary || "",
      category: analysis.category || "Uncategorized",
      tags: analysis.tags || [],
      thumbnail: content.thumbnail || "",
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
});

module.exports = router;
