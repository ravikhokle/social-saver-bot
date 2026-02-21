# Social Saver Bot

Turn your saved Instagram Reels, Tweets, and articles into a searchable personal knowledge base.

## Architecture

```
WhatsApp (Twilio) ──► Express.js API ──► MongoDB
                          │
                     AI (Gemini/OpenAI)
                          │
                     Next.js Dashboard
```

## Tech Stack

| Layer       | Technology                      |
|-------------|---------------------------------|
| Bot         | Twilio WhatsApp Sandbox         |
| Backend     | Express.js (Node.js)            |
| Frontend    | Next.js 15 + Tailwind CSS       |
| Database    | MongoDB (Mongoose)              |
| AI          | Google Gemini / OpenAI (via @google/genai SDK) |
| Icons       | Lucide React                    |

## Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)
- Twilio account (for WhatsApp)
- Gemini API key or OpenAI API key

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs on `http://localhost:3000`.

### 3. WhatsApp Bot (Twilio)

1. Create a Twilio account and set up the WhatsApp Sandbox
2. Set your webhook URL to `https://<your-domain>/api/webhook/whatsapp`
3. Use ngrok for local development: `ngrok http 5000`
4. Update the Twilio sandbox webhook to your ngrok URL

### 4. Testing Without WhatsApp

Use the test endpoint to save links directly:

```bash
curl -X POST http://localhost:5000/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/example"}'
```

Or use the **Add Link** page in the dashboard.

## Environment Variables

### Backend (.env)

| Variable               | Description                          |
|------------------------|--------------------------------------|
| PORT                   | Server port (default: 5000)          |
| MONGODB_URI            | MongoDB connection string            |
| TWILIO_ACCOUNT_SID     | Twilio Account SID                   |
| TWILIO_AUTH_TOKEN       | Twilio Auth Token                    |
| TWILIO_WHATSAPP_NUMBER | Twilio WhatsApp sandbox number       |
| AI_PROVIDER            | `gemini` or `openai`                 |
| GEMINI_API_KEY         | Google Gemini API key                |
| GEMINI_MODEL           | Optional Gemini model (default gemini-3-flash-preview) |
| OPENAI_API_KEY         | OpenAI API key                       |
| FRONTEND_URL           | Frontend URL for CORS                |

### Frontend (.env.local)

| Variable             | Description                  |
|----------------------|------------------------------|
| NEXT_PUBLIC_API_URL  | Backend API URL              |

## API Endpoints

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | /api/bookmarks              | List bookmarks (with search)   |
| GET    | /api/bookmarks/random       | Get random bookmark            |
| GET    | /api/bookmarks/categories   | List categories with counts    |
| GET    | /api/bookmarks/stats        | Dashboard statistics           |
| GET    | /api/bookmarks/:id          | Get single bookmark            |
| DELETE | /api/bookmarks/:id          | Delete bookmark                |
| POST   | /api/webhook/whatsapp       | Twilio WhatsApp webhook        |
| POST   | /api/webhook/test           | Test save (no WhatsApp needed) |
| GET    | /api/health                 | Health check                   |

## Features

- **WhatsApp Bot**: Send links via WhatsApp, get auto-categorized saves
- **AI Auto-Tagging**: Categorizes content (Fitness, Coding, Food, Travel, etc.)
- **AI Summaries**: One-sentence summary of each saved link
- **Search**: Full-text search across titles, captions, summaries, and tags
- **Category Filtering**: Filter by AI-assigned categories
- **Platform Filtering**: Filter by Instagram, Twitter, YouTube, or articles
- **Random Inspiration**: Get a random saved bookmark for inspiration
- **Modern Dark UI**: Glass morphism design with smooth animations
- **Add Link Page**: Save links directly from the web dashboard
