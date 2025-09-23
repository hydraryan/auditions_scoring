import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routes/auth';
import studentsRouter from './routes/students';
import scoresRouter from './routes/scores';
import debugRouter from './routes/debug';
import publicRouter from './routes/public';
import { ensureRoundsInitialized } from './utils/seed';

dotenv.config();
if (!process.env.JWT_SECRET || !process.env.ARYAN_PASSWORD || !process.env.KUNAL_PASSWORD) {
  const rootEnv = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: rootEnv });
}

const app = express();

// CORS: allow only configured origins (supports wildcards like https://*.vercel.app)
// Defaults cover local dev, typical Vercel deployments, and the promooora.in domain used for this app.
const defaultOrigins = [
  'http://localhost:5173',
  'https://*.vercel.app',
  'https://promooora.in',
  'https://www.promooora.in',
];
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const origins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

function normalize(url: string) {
  return url.replace(/\/$/, '');
}

function wildcardToRegex(pattern: string) {
  // Escape regex special chars, then replace '*' with '.*'
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function isOriginAllowed(origin: string | undefined) {
  // Escape hatch for incidents: allow all when explicitly enabled
  if ((process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true') return true;
  if (!origin) return true; // allow same-origin/no-origin (like curl, mobile apps)
  const o = normalize(origin);
  for (const entry of origins) {
    const p = normalize(entry);
    if (!p.includes('*')) {
      if (o === p) return true;
      continue;
    }
    try {
      const rx = wildcardToRegex(p);
      if (rx.test(o)) return true;
    } catch {
      // ignore bad patterns
    }
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      // Helpful log for debugging CORS issues in production
      try {
        console.warn('[CORS] Blocked request from origin:', origin, 'Allowed patterns:', origins);
      } catch {}
      return callback(new Error('CORS: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Helmet with CSP in production
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              fontSrc: ["'self'", 'https:', 'data:'],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json());
app.use(morgan('dev'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auditions_scoring';
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await ensureRoundsInitialized();
  })
  .catch((err) => console.error('MongoDB connection error', err));

// Rate limiting: stricter for auth, general limits for write-heavy routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: 'draft-7', legacyHeaders: false });

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/students', writeLimiter, studentsRouter);
app.use('/api/scores', writeLimiter, scoresRouter);
app.use('/api/debug', debugRouter);
app.use('/api/public', publicRouter);

// Public health endpoint for platform health checks (no auth)
app.get('/api/health', (_req, res) => {
  const db = mongoose.connection;
  const dbConnected = db.readyState === 1; // 1 = connected
  res.json({
    ok: true,
    dbConnected,
    database: (db as any).db?.databaseName || null,
    ts: new Date().toISOString(),
  });
});

// Simple root route for sanity check
app.get('/', (_req, res) => {
  res.type('text').send('Auditions Scoring API is running. See /api/health');
});

const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
