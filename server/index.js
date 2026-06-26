'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(__dirname, 'dealdesk.db');

// ---------------------------------------------------------------------------
// Database bootstrap
// ---------------------------------------------------------------------------
function openDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS states (
      code       TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      region     TEXT NOT NULL,
      population INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buyers (
      buyerId TEXT PRIMARY KEY,
      name    TEXT NOT NULL,
      seatId  TEXT NOT NULL,
      type    TEXT NOT NULL CHECK (type IN ('dsp','agency')),
      region  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS publishers (
      publisherId TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      vertical    TEXT NOT NULL CHECK (vertical IN ('news','sport','entertainment','lifestyle','finance','technology','gaming')),
      domain      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deals (
      dealId        TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      buyerId       TEXT NOT NULL REFERENCES buyers(buyerId),
      publisherId   TEXT NOT NULL REFERENCES publishers(publisherId),
      format        TEXT NOT NULL CHECK (format IN ('display','video','native','ctv','audio')),
      dealType      TEXT NOT NULL CHECK (dealType IN ('pmp','preferred','programmatic_guaranteed')),
      device        TEXT NOT NULL CHECK (device IN ('desktop','mobile','ctv','all')),
      floorCpm      REAL NOT NULL,
      currency      TEXT NOT NULL DEFAULT 'USD',
      status        TEXT NOT NULL CHECK (status IN ('active','paused','draft','expired')),
      targetStates  TEXT NOT NULL DEFAULT '[]',  -- JSON array of state codes
      startDate     TEXT NOT NULL,
      endDate       TEXT,
      createdAt     TEXT NOT NULL,
      impressions30d INTEGER NOT NULL DEFAULT 0,
      fillRate      REAL NOT NULL DEFAULT 0,
      avgWinCpm     REAL NOT NULL DEFAULT 0,
      revenue30d    REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS _seed_done (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      seeded_at TEXT NOT NULL
    );
  `);
}

function seedIfNeeded(db) {
  const already = db.prepare('SELECT id FROM _seed_done WHERE id = 1').get();
  if (already) {
    console.log('Database already seeded — skipping.');
    return;
  }

  console.log('Seeding database from JSON files…');

  const states = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'states.json'), 'utf8'));
  const buyers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'buyers.json'), 'utf8'));
  const publishers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'publishers.json'), 'utf8'));
  const deals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'deals.json'), 'utf8'));

  const insertState = db.prepare(
    'INSERT OR IGNORE INTO states (code, name, region, population) VALUES (@code, @name, @region, @population)'
  );
  const insertBuyer = db.prepare(
    'INSERT OR IGNORE INTO buyers (buyerId, name, seatId, type, region) VALUES (@buyerId, @name, @seatId, @type, @region)'
  );
  const insertPublisher = db.prepare(
    'INSERT OR IGNORE INTO publishers (publisherId, name, vertical, domain) VALUES (@publisherId, @name, @vertical, @domain)'
  );
  const insertDeal = db.prepare(`
    INSERT OR IGNORE INTO deals
      (dealId, name, buyerId, publisherId, format, dealType, device,
       floorCpm, currency, status, targetStates, startDate, endDate,
       createdAt, impressions30d, fillRate, avgWinCpm, revenue30d)
    VALUES
      (@dealId, @name, @buyerId, @publisherId, @format, @dealType, @device,
       @floorCpm, @currency, @status, @targetStates, @startDate, @endDate,
       @createdAt, @impressions30d, @fillRate, @avgWinCpm, @revenue30d)
  `);

  const seedAll = db.transaction(() => {
    for (const s of states) insertState.run(s);
    for (const b of buyers) insertBuyer.run(b);
    for (const p of publishers) insertPublisher.run(p);
    for (const d of deals) {
      insertDeal.run({
        ...d,
        targetStates: JSON.stringify(d.targetStates || []),
        endDate: d.endDate || null,
      });
    }
    db.prepare("INSERT INTO _seed_done (id, seeded_at) VALUES (1, datetime('now'))").run();
  });

  seedAll();

  console.log(`Seeded: ${states.length} states, ${buyers.length} buyers, ${publishers.length} publishers, ${deals.length} deals.`);
}

// ---------------------------------------------------------------------------
// Deal serialiser — converts DB row → API shape
// ---------------------------------------------------------------------------
function rowToDeal(row) {
  return {
    dealId: row.dealId,
    name: row.name,
    buyerId: row.buyerId,
    publisherId: row.publisherId,
    format: row.format,
    dealType: row.dealType,
    device: row.device,
    floorCpm: row.floorCpm,
    currency: row.currency,
    status: row.status,
    targetStates: JSON.parse(row.targetStates || '[]'),
    startDate: row.startDate,
    endDate: row.endDate || null,
    createdAt: row.createdAt,
    impressions30d: row.impressions30d,
    fillRate: row.fillRate,
    avgWinCpm: row.avgWinCpm,
    revenue30d: row.revenue30d,
  };
}

// ---------------------------------------------------------------------------
// ID generator for new deals
// ---------------------------------------------------------------------------
function nextDealId(db) {
  const row = db.prepare("SELECT dealId FROM deals ORDER BY dealId DESC LIMIT 1").get();
  if (!row) return 'DD-1001';
  const num = parseInt(row.dealId.replace('DD-', ''), 10);
  return `DD-${num + 1}`;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Attach DB to every request
const db = openDb();
createSchema(db);
seedIfNeeded(db);

// ---- GET /api/states -------------------------------------------------------
app.get('/api/states', (_req, res) => {
  const rows = db.prepare('SELECT * FROM states ORDER BY name').all();
  res.json(rows);
});

// ---- GET /api/buyers -------------------------------------------------------
app.get('/api/buyers', (_req, res) => {
  const rows = db.prepare('SELECT * FROM buyers ORDER BY buyerId').all();
  res.json(rows);
});

// ---- GET /api/publishers ---------------------------------------------------
app.get('/api/publishers', (_req, res) => {
  const rows = db.prepare('SELECT * FROM publishers ORDER BY publisherId').all();
  res.json(rows);
});

// ---- GET /api/deals --------------------------------------------------------
// Query params: q, format, status, dealType, state, floorMin, floorMax
app.get('/api/deals', (req, res) => {
  const { q, format, status, dealType, state, floorMin, floorMax } = req.query;

  const conditions = [];
  const params = {};

  if (q) {
    // Search by name or buyer name (join buyers)
    conditions.push(`(d.name LIKE @q OR b.name LIKE @q)`);
    params.q = `%${q}%`;
  }
  if (format) {
    conditions.push(`d.format = @format`);
    params.format = format;
  }
  if (status) {
    conditions.push(`d.status = @status`);
    params.status = status;
  }
  if (dealType) {
    conditions.push(`d.dealType = @dealType`);
    params.dealType = dealType;
  }
  if (state) {
    // targetStates is a JSON array; use json_each for state filtering
    // Deals with empty targetStates (national) are NOT included when filtering by state
    conditions.push(`EXISTS (
      SELECT 1 FROM json_each(d.targetStates) je WHERE je.value = @state
    )`);
    params.state = state;
  }
  if (floorMin !== undefined && floorMin !== '') {
    conditions.push(`d.floorCpm >= @floorMin`);
    params.floorMin = parseFloat(floorMin);
  }
  if (floorMax !== undefined && floorMax !== '') {
    conditions.push(`d.floorCpm <= @floorMax`);
    params.floorMax = parseFloat(floorMax);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT d.*
    FROM deals d
    JOIN buyers b ON b.buyerId = d.buyerId
    ${where}
    ORDER BY d.createdAt DESC, d.dealId DESC
  `;

  try {
    const rows = db.prepare(sql).all(params);
    res.json(rows.map(rowToDeal));
  } catch (err) {
    console.error('GET /api/deals error:', err.message);
    res.status(500).json({ error: 'Query failed', detail: err.message });
  }
});

// ---- GET /api/deals/:dealId -----------------------------------------------
app.get('/api/deals/:dealId', (req, res) => {
  const row = db.prepare('SELECT * FROM deals WHERE dealId = ?').get(req.params.dealId);
  if (!row) return res.status(404).json({ error: 'Deal not found' });
  res.json(rowToDeal(row));
});

// ---- POST /api/deals -------------------------------------------------------
app.post('/api/deals', (req, res) => {
  const body = req.body || {};

  // Required fields
  const required = ['name', 'buyerId', 'publisherId', 'format', 'dealType', 'device', 'floorCpm', 'status', 'startDate'];
  const missing = required.filter(f => body[f] === undefined || body[f] === '');
  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing });
  }

  // Enum validation
  const enums = {
    format: ['display', 'video', 'native', 'ctv', 'audio'],
    dealType: ['pmp', 'preferred', 'programmatic_guaranteed'],
    device: ['desktop', 'mobile', 'ctv', 'all'],
    status: ['active', 'paused', 'draft', 'expired'],
  };
  for (const [field, allowed] of Object.entries(enums)) {
    if (body[field] && !allowed.includes(body[field])) {
      return res.status(400).json({ error: `Invalid value for ${field}`, allowed });
    }
  }

  // Verify buyer and publisher exist
  const buyer = db.prepare('SELECT buyerId FROM buyers WHERE buyerId = ?').get(body.buyerId);
  if (!buyer) return res.status(400).json({ error: 'Unknown buyerId', buyerId: body.buyerId });
  const pub = db.prepare('SELECT publisherId FROM publishers WHERE publisherId = ?').get(body.publisherId);
  if (!pub) return res.status(400).json({ error: 'Unknown publisherId', publisherId: body.publisherId });

  const dealId = nextDealId(db);
  const now = new Date().toISOString().slice(0, 10);

  const insert = db.prepare(`
    INSERT INTO deals
      (dealId, name, buyerId, publisherId, format, dealType, device,
       floorCpm, currency, status, targetStates, startDate, endDate,
       createdAt, impressions30d, fillRate, avgWinCpm, revenue30d)
    VALUES
      (@dealId, @name, @buyerId, @publisherId, @format, @dealType, @device,
       @floorCpm, @currency, @status, @targetStates, @startDate, @endDate,
       @createdAt, 0, 0, 0, 0)
  `);

  insert.run({
    dealId,
    name: body.name,
    buyerId: body.buyerId,
    publisherId: body.publisherId,
    format: body.format,
    dealType: body.dealType,
    device: body.device,
    floorCpm: parseFloat(body.floorCpm),
    currency: body.currency || 'USD',
    status: body.status,
    targetStates: JSON.stringify(Array.isArray(body.targetStates) ? body.targetStates : []),
    startDate: body.startDate,
    endDate: body.endDate || null,
    createdAt: now,
  });

  res.status(201).json({ dealId });
});

// ---- Health check ----------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', db: DB_PATH });
});

// ---- Start -----------------------------------------------------------------
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`DealDesk API listening on http://localhost:${PORT}`);
});
