import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import entriesRoutes from './routes/entries.js';
import insightsRoutes from './routes/insights.js';
import { sessionCookieOptions } from './lib/sessionCookie.js';
import { prisma } from './lib/prisma.js';
import { requireAuth } from './middleware/requireAuth.js';
import { isOidcConfigured, initializeOIDC } from './lib/oidc.js';
import { isAiConfigured } from './services/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const trustProxyVal = process.env.TRUST_PROXY
  ? process.env.TRUST_PROXY === 'true'
    ? 1
    : Number(process.env.TRUST_PROXY) || 1
  : 1;
app.set('trust proxy', trustProxyVal);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.trim().replace(/\/+$/, '');
      if (
        allowedOrigins.includes(normalized) ||
        (!isProduction &&
          (normalized.startsWith('http://localhost:') ||
            normalized.startsWith('http://127.0.0.1:')))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const PgSession = connectPgSimple(session);
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || 'dev-only-change-me',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: sessionCookieOptions(),
    proxy: Boolean(trustProxyVal),
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/user', requireAuth, userRoutes);
app.use('/api/entries', requireAuth, entriesRoutes);
app.use('/api/insights', requireAuth, insightsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    ai: isAiConfigured(),
    oidc: isOidcConfigured(),
    date: new Date().toISOString(),
  });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: 'Something went wrong' });
});

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Journal API on port ${PORT}`);
  console.log(`  AI:   ${isAiConfigured() ? 'configured' : 'fallback prompts (no OPENAI_API_KEY)'}`);
  console.log(`  OIDC: ${isOidcConfigured() ? 'configured' : 'disabled'}`);
  if (isOidcConfigured()) {
    try {
      await initializeOIDC();
      console.log('  OIDC discovery OK');
    } catch (e) {
      console.error('  OIDC discovery failed:', e.message);
    }
  }
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close();
  await prisma.$disconnect();
  await pgPool.end();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
