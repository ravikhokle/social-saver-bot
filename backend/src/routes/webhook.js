import express from "express";
import {
  handleWhatsAppWebhook,
  handleTestWebhook,
} from "../controllers/webhookController.js";

const router = express.Router();

// Twilio WhatsApp webhook endpoint
router.post("/whatsapp", handleWhatsAppWebhook);
router.post("/test", handleTestWebhook);

export default router;
