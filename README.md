# Social Saver Bot

> Send an Instagram Reel to WhatsApp → it auto-categorizes and appears on your personal dashboard.

## Demo

📹 **Video Walkthrough:** https://drive.google.com/file/d/14TcWye00d8qmsdTwQI2JbSdJwTxM8JIH/view?usp=sharing

---

## Overview

Social Saver Bot turns social media links into a structured, searchable knowledge base.

Send a link via WhatsApp. The system extracts content, uses AI to categorize and summarize it, and stores it in a clean dashboard for later discovery.

---

## How It Works

```
📱 WhatsApp ──► ☁️ Twilio ──► 🖥️ Express API ──► 🤖 AI ──► 🗄️ MongoDB
                                                                                          │
                                                                              🌐 Next.js Dashboard
```

1. User sends a link (Instagram, Twitter, YouTube, article) to the WhatsApp bot
2. Twilio forwards the message to the Express backend
3. The backend extracts metadata (title, caption, thumbnail)
4. AI generates:
    - Category
    - One-line summary
    - Tags
5. Data is stored in MongoDB
6. Bot replies with confirmation
7. Dashboard displays searchable, filterable saved content

---

## Architecture

## Features

- WhatsApp link ingestion
- AI auto-categorization
- AI one-line summaries
- Full-text search
- Category filtering
- Platform filtering
- Random inspiration
- Embedded Instagram video support
- Dark modern dashboard UI
- Manual “Add Link” page

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Bot | Twilio WhatsApp Sandbox |
| Backend | Express.js (Node.js) |
| Frontend | Next.js 15 + Tailwind CSS |
| Database | MongoDB (Mongoose) |
| AI | Google Gemini / OpenAI |

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Runs on: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on: `http://localhost:3000`

### WhatsApp Setup

Configure Twilio WhatsApp Sandbox

Set webhook to:

`https://<your-domain>/api/webhook/whatsapp`

For local development:

`ngrok http 5000`

---

## Environment Variables

Backend (.env)

- MONGODB_URI
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_NUMBER
- GEMINI_API_KEY or OPENAI_API_KEY
- FRONTEND_URL

Frontend (.env.local)

- NEXT_PUBLIC_API_URL

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/webhook/whatsapp | WhatsApp webhook |
| POST | /api/webhook/test | Manual test save |
| GET | /api/bookmarks | List/search bookmarks |
| GET | /api/bookmarks/random | Random bookmark |
| GET | /api/bookmarks/categories | Category list |
| GET | /api/bookmarks/stats | Dashboard stats |
| DELETE | /api/bookmarks/:id | Delete bookmark |
