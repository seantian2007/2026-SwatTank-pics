/* eslint-disable no-console */
'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (!DATABASE_URL) {
  // Fail fast in production: Render will show this in logs.
  console.error('Missing DATABASE_URL env var.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const s = email.trim();
  if (s.length < 3 || s.length > 254) return false;
  // pragmatic email check (not RFC-perfect, but robust for waitlists)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const app = express();

app.set('trust proxy', 1); // Render sits behind a proxy

app.use(express.json({ limit: '16kb' }));

app.use(cors({
  origin: function(origin, cb) {
    // Allow non-browser clients without Origin (curl, server-to-server)
    if (!origin) return cb(null, true);

    // If not configured, default-deny cross-origin browser requests.
    if (ALLOWED_ORIGINS.length === 0) return cb(new Error('CORS: origin not allowed'), false);

    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'), false);
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/api/subscribe', async (req, res) => {
  const emailRaw = req && req.body ? req.body.email : undefined;
  const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  try {
    const q = `
      INSERT INTO waitlist_emails (email)
      VALUES ($1)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, created_at
    `;

    const result = await pool.query(q, [email]);
    if (result.rowCount === 0) {
      return res.status(409).json({ ok: true, duplicate: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('subscribe error:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// CORS errors / other thrown errors
app.use((err, _req, res, _next) => {
  if (String(err && err.message).startsWith('CORS:')) {
    return res.status(403).json({ ok: false, error: 'forbidden_origin' });
  }
  console.error('unhandled error:', err);
  return res.status(500).json({ ok: false, error: 'server_error' });
});

app.listen(PORT, () => {
  console.log(`waitlist api listening on :${PORT}`);
  if (ALLOWED_ORIGINS.length) console.log('allowed origins:', ALLOWED_ORIGINS.join(', '));
});

