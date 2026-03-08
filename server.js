require('dotenv').config();

const express = require('express');
const path    = require('path');
const cors    = require('cors');
const pool    = require('./db');

const authRoutes  = require('./routes/auth');
const leadsRoutes = require('./routes/leads');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/leads', leadsRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── SPA fallback: serve index.html for any unmatched route ──────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Database init + server start ─────────────────────────────────────────────
async function initDB() {
  const fs = require('fs');
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  try {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('Database schema initialized.');
  } catch (err) {
    console.error('DB init error (non-fatal):', err.message);
  }
}

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`HomeValue Nova server running on port ${PORT}`);
  });
}

start();
