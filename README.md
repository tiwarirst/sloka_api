# 🙏 Sloka API

A secure, production-ready REST API serving ancient Sanskrit slokas (verses) with translations and transliterations from sacred Hindu scriptures including Bhagavad Gita, Upanishads, Vedas, and more.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-5.x-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- 🔐 **Bulletproof Security** - Helmet, rate limiting, input sanitization
- 🚀 **Production Ready** - Docker support, health checks, graceful shutdown
- 📊 **Pagination** - Efficient data retrieval with pagination support
- 🔍 **Search** - Filter quotes by source (Bhagavad Gita, Upanishads, etc.)
- 📅 **Daily Quote** - Deterministic daily quote based on day of year
- 🎲 **Random Quote** - Get random wisdom for your app
- ⚡ **High Performance** - Response compression, connection pooling

## 🛡️ Security Features

| Feature | Description |
|---------|-------------|
| **Helmet** | Sets secure HTTP headers |
| **Rate Limiting** | 100 req/15min general, 30 req/min for quotes |
| **NoSQL Injection Prevention** | Sanitizes all MongoDB queries |
| **CORS** | Configurable allowed origins |
| **Input Validation** | Validates all user inputs |
| **Error Handling** | Safe error responses in production |

## 📋 API Endpoints

### Base URL
```
https://your-domain.com/api
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check & status |
| `GET` | `/api` | API information |
| `GET` | `/api/quote/random` | Get a random quote |
| `GET` | `/api/quote/daily` | Get today's quote |
| `GET` | `/api/quote/:id` | Get quote by ID |
| `GET` | `/api/quotes` | Get all quotes (paginated) |
| `GET` | `/api/quotes/search?source=Gita` | Search by source |

### Response Format

```json
{
  "success": true,
  "timestamp": "2026-02-15T10:30:00.000Z",
  "data": {
    "id": "65a1b2c3d4e5f6789012345",
    "sloka": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
    "transliteration": "Karmanye vadhikaraste ma phaleshu kadachana.",
    "translation": "आपका अधिकार केवल कर्म करने पर है, उसके फल पर नहीं।",
    "source": "Bhagavad Gita"
  }
}
```

### Pagination

```
GET /api/quotes?page=1&limit=10
```

Response includes:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 27,
    "totalItems": 262,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sloka-api.git
   cd sloka-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/sloka_db
   ALLOWED_ORIGINS=*
   ```

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development (with hot reload)
   npm run dev
   
   # Production
   npm start
   ```

6. **Test the API**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/quote/random
   ```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build image
docker build -t sloka-api .

# Run container
docker run -d \
  --name sloka-api \
  -p 3000:3000 \
  -e MONGO_URI="your-mongodb-uri" \
  -e NODE_ENV=production \
  sloka-api
```

### Docker Compose (with MongoDB)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/sloka_db
      - ALLOWED_ORIGINS=https://yourdomain.com
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

```bash
docker-compose up -d
```

## ☁️ Cloud Deployment

### Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create sloka-api

# Set environment variables
heroku config:set MONGO_URI="your-mongodb-uri"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Vercel (Serverless)

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

## 🗄️ MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist IP addresses (or allow all with `0.0.0.0/0`)
4. Get your connection string
5. Replace `<password>` with your database user password

## 📁 Project Structure

```
sloka-api/
├── index.js            # Main application entry
├── models/
│   └── Quotes.js       # Mongoose schema
├── scripts/
│   └── seed.js         # Database seeder
├── quotes.json         # Source data
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .gitignore          # Git ignore rules
├── Dockerfile          # Docker configuration
├── .dockerignore       # Docker ignore rules
└── README.md           # Documentation
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | Required |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` |

## 📊 Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 requests per 15 minutes |
| Quote endpoints | 30 requests per minute |

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Get random quote
curl http://localhost:3000/api/quote/random

# Get daily quote
curl http://localhost:3000/api/quote/daily

# Get all quotes (page 1, 10 per page)
curl "http://localhost:3000/api/quotes?page=1&limit=10"

# Search quotes by source
curl "http://localhost:3000/api/quotes/search?source=Bhagavad%20Gita"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Ancient Sanskrit scriptures and their timeless wisdom
- The open-source community

---

<p align="center">
  Made with ❤️ for sharing ancient wisdom
</p>
