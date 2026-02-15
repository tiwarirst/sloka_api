require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const Quote = require('./models/Quotes');

const app = express();

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Trust proxy for deployment platforms (Heroku, Railway, Render, etc.)
app.set('trust proxy', 1);

// Helmet: Set security HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting - prevent brute force & DDoS attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for all quote endpoints
const quoteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    message: {
        success: false,
        error: 'Rate limit exceeded. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Compression for better performance
app.use(compression());

// ===========================================
// DATABASE CONNECTION
// ===========================================

// Cache the database connection for serverless environments (Vercel)
let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('📦 Using cached MongoDB connection');
        return;
    }
    
    try {
        const mongoOptions = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false, // Disable buffering for serverless
        };
        
        await mongoose.connect(process.env.MONGO_URI, mongoOptions);
        isConnected = true;
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        // Exit process with failure in production (but not in serverless)
        if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
            process.exit(1);
        }
    }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing MongoDB connection...`);
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Response helper
const sendResponse = (res, statusCode, data) => {
    res.status(statusCode).json({
        success: true,
        timestamp: new Date().toISOString(),
        ...data,
    });
};

// ===========================================
// ROUTES
// ===========================================

// Health check endpoint
app.get('/health', (req, res) => {
    const healthcheck = {
        success: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    };
    res.status(200).json(healthcheck);
});

// API info endpoint
app.get('/api', (req, res) => {
    sendResponse(res, 200, {
        message: 'Sloka API - Ancient Wisdom for Modern Times',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            random: 'GET /api/quote/random',
            daily: 'GET /api/quote/daily',
            byId: 'GET /api/quote/:id',
            search: 'GET /api/quotes/search?source=<source>',
            all: 'GET /api/quotes?page=1&limit=10',
        },
    });
});

// Get random quote
app.get('/api/quote/random', quoteLimiter, asyncHandler(async (req, res) => {
    const count = await Quote.countDocuments();
    
    if (count === 0) {
        return res.status(404).json({
            success: false,
            error: 'No quotes found in database',
        });
    }
    
    const random = Math.floor(Math.random() * count);
    const quote = await Quote.findOne().skip(random).select('-__v').lean();
    
    sendResponse(res, 200, { data: quote });
}));

// Get daily quote based on date
app.get('/api/quote/daily', quoteLimiter, asyncHandler(async (req, res) => {
    const count = await Quote.countDocuments();
    
    if (count === 0) {
        return res.status(404).json({
            success: false,
            error: 'No quotes found in database',
        });
    }
    
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % count;
    
    const quote = await Quote.findOne().skip(index).select('-__v').lean();
    
    sendResponse(res, 200, { 
        data: quote,
        dayOfYear,
    });
}));

// Get quote by ID
app.get('/api/quote/:id', quoteLimiter, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid quote ID format',
        });
    }
    
    const quote = await Quote.findById(id).select('-__v').lean();
    
    if (!quote) {
        return res.status(404).json({
            success: false,
            error: 'Quote not found',
        });
    }
    
    sendResponse(res, 200, { data: quote });
}));

// Search quotes by source
app.get('/api/quotes/search', quoteLimiter, asyncHandler(async (req, res) => {
    const { source } = req.query;
    
    if (!source || typeof source !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Source query parameter is required',
        });
    }
    
    // Sanitize and escape regex special characters
    const sanitizedSource = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const quotes = await Quote.find({
        source: { $regex: sanitizedSource, $options: 'i' }
    }).select('-__v').lean().limit(50);
    
    sendResponse(res, 200, { 
        count: quotes.length,
        data: quotes,
    });
}));

// Get all quotes with pagination
app.get('/api/quotes', quoteLimiter, asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    
    const [quotes, total] = await Promise.all([
        Quote.find().select('-__v').skip(skip).limit(limit).lean(),
        Quote.countDocuments(),
    ]);
    
    sendResponse(res, 200, {
        data: quotes,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    });
}));

// Legacy routes (backward compatibility) - redirect to new API
app.get('/quote/random', (req, res) => res.redirect(301, '/api/quote/random'));
app.get('/quote/daily', (req, res) => res.redirect(301, '/api/quote/daily'));

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: Object.values(err.errors).map(e => e.message),
        });
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format',
        });
    }
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            error: 'Duplicate field value',
        });
    }
    
    // Default error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
    });
});

// ===========================================
// SERVER STARTUP
// ===========================================

const PORT = process.env.PORT || 3000;

// For Vercel serverless deployment
if (process.env.VERCEL) {
    // Connect to DB on first request (serverless)
    connectDB();
    module.exports = app;
} else {
    // Traditional server startup
    const startServer = async () => {
        await connectDB();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    };
    
    startServer();
}
