import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import codeExecutionRoutes from './routes/codeExecution.js';
import healthRoutes from './routes/health.js';
import fileManagerRoutes from './routes/fileManager.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';

// Import services
import WebSocketExecutionServer from './services/websocketExecutor.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 50, // Number of requests (increased for file operations)
  duration: 60, // Per 60 seconds
});

const fileRateLimiter = new RateLimiterMemory({
  keyPrefix: 'files',
  points: 100, // More permissive for file operations
  duration: 60, // Per 60 seconds
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    // Use different rate limiter for file operations
    const limiter = req.path.startsWith('/api/files') ? fileRateLimiter : rateLimiter;
    await limiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: secs
    });
  }
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/execute', codeExecutionRoutes);
app.use('/api/files', fileManagerRoutes);

app.get('/api/ping', cors(), (req, res) => {
  res.status(200).json({ success: true, timestamp: Date.now() });
});

const wsExecutionServer = new WebSocketExecutionServer(server);

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist.`
  });
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 CodiFY Execution Server running on ${HOST}:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet enabled`);
  console.log(`🌐 CORS: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`⚡ WebSocket: Enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

export default app;
