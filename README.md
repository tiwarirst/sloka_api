# 🙏 Sloka API

A REST API serving ancient Sanskrit slokas (verses) with translations and transliterations from Bhagavad Gita, Upanishads, Vedas, and other sacred scriptures.

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quote/random` | Get a random quote |
| `GET` | `/api/quote/daily` | Get today's quote |
| `GET` | `/api/quote/:id` | Get quote by ID |
| `GET` | `/api/quotes?page=1&limit=10` | Get paginated quotes |
| `GET` | `/api/quotes/search?source=Gita` | Search by source |
| `GET` | `/health` | Health check |

## 📦 Response Example

```json
{
  "success": true,
  "data": {
    "sloka": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
    "transliteration": "Karmanye vadhikaraste ma phaleshu kadachana.",
    "translation": "You have the right to work, but never to its fruits.",
    "source": "Bhagavad Gita"
  }
}
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start server
npm start
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment mode |

## 📜 License

MIT License
