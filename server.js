import express from 'express';
import cors from 'cors';
import { initDB } from './backend/db.js';
import authRoutes from './backend/routes/auth.js';
import proxyMiddleware from 'express-http-proxy';

const app = express();
const PORT = 5000;
const VITE_DEV_SERVER = 'http://localhost:8080';

// Middleware
app.use(cors({
  origin: '*', // Allow all origins (you can restrict this later)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());

// Initialize database
initDB().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// API Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// In development, proxy all non-API requests to Vite dev server
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Skip API routes - they're handled by Express
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Proxy everything else to Vite
    proxyMiddleware(VITE_DEV_SERVER, {
      proxyReqPathResolver: (req) => req.path,
    })(req, res, next);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
