#!/usr/bin/env node
/**
 * DealDesk smoke tests
 *
 * Requires:
 *   - Back-end server running on http://localhost:3001
 *   - MCP server reachable at mcp/index.js (spawned here as a child process)
 *
 * Usage:
 *   node test/smoke.js
 *
 * Exits 0 if all checks pass, 1 if any fail.
 */

'use strict';

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:3001';
const MCP_SERVER_PATH = path.resolve(__dirname, '..', 'mcp', 'index.js');

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  PASS  ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
}

function assert(ok, label, detail) {
  if (ok) pass(label);
  else fail(label, detail);
}

/**
 * Minimal HTTP GET that returns { status, body } where body is already
 * JSON-parsed (or the raw string on parse error).
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { body = raw; }
        resolve({ status: res.statusCode, body });
      });
    }).on('error', reject);
  });
}

/**
 * Minimal HTTP POST with a JSON body.
 */
function httpPost(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(url, opts, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { body = raw; }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Section 1 — API smoke tests
// ---------------------------------------------------------------------------

async function runApiTests() {
  console.log('\n── API smoke tests (http://localhost:3001) ──');

  // ── 1.1  GET /api/deals — returns ≥50 items ──────────────────────────────
  let dealsRes;
  try {
    dealsRes = await httpGet(`${BASE_URL}/api/deals`);
  } catch (err) {
    fail('GET /api/deals is reachable', err.message);
    // Cannot continue without deals
    return null;
  }

  assert(
    dealsRes.status === 200,
    'GET /api/deals → 200',
    `got ${dealsRes.status}`,
  );

  const deals = dealsRes.body;
  assert(
    Array.isArray(deals),
    'GET /api/deals → array',
    typeof deals,
  );

  assert(
    Array.isArray(deals) && deals.length >= 50,
    `GET /api/deals → at least 50 items (got ${Array.isArray(deals) ? deals.length : '?'})`,
    Array.isArray(deals) ? `length=${deals.length}` : 'not an array',
  );

  // ── 1.2  Required fields on every deal ───────────────────────────────────
  const REQUIRED = ['dealId', 'name', 'buyerId', 'format', 'status', 'floorCpm'];

  if (Array.isArray(deals) && deals.length > 0) {
    const missingByField = {};
    for (const deal of deals) {
      for (const field of REQUIRED) {
        if (deal[field] === undefined || deal[field] === null) {
          missingByField[field] = (missingByField[field] || 0) + 1;
        }
      }
    }

    const problems = Object.entries(missingByField)
      .map(([f, n]) => `${f} missing in ${n} deal(s)`)
      .join('; ');

    assert(
      Object.keys(missingByField).length === 0,
      `All deals have required fields: ${REQUIRED.join(', ')}`,
      problems || undefined,
    );
  }

  // ── 1.3  GET /api/deals/:dealId — returns a single deal ──────────────────
  let sampleId = null;
  if (Array.isArray(deals) && deals.length > 0 && deals[0].dealId) {
    sampleId = deals[0].dealId;
    let singleRes;
    try {
      singleRes = await httpGet(`${BASE_URL}/api/deals/${encodeURIComponent(sampleId)}`);
    } catch (err) {
      fail(`GET /api/deals/${sampleId} is reachable`, err.message);
      singleRes = null;
    }

    if (singleRes) {
      assert(
        singleRes.status === 200,
        `GET /api/deals/${sampleId} → 200`,
        `got ${singleRes.status}`,
      );

      const single = singleRes.body;
      assert(
        single && single.dealId === sampleId,
        `GET /api/deals/${sampleId} → correct dealId`,
        single ? `returned dealId=${single.dealId}` : 'null body',
      );
    }
  } else {
    fail('GET /api/deals/:dealId — skipped (no deals returned)');
  }

  // ── 1.4  POST /api/deals — creates a deal and returns a dealId ───────────
  const newDeal = {
    name: 'Smoke Test Deal',
    buyerId: 'BUY-01',
    publisherId: 'PUB-01',
    format: 'display',
    dealType: 'pmp',
    device: 'desktop',
    floorCpm: 1.00,
    currency: 'USD',
    status: 'draft',
    targetStates: ['CA'],
    startDate: '2025-01-01',
  };

  let createRes;
  try {
    createRes = await httpPost(`${BASE_URL}/api/deals`, newDeal);
  } catch (err) {
    fail('POST /api/deals is reachable', err.message);
    createRes = null;
  }

  if (createRes) {
    assert(
      createRes.status === 200 || createRes.status === 201,
      `POST /api/deals → 200/201 (got ${createRes.status})`,
    );

    const created = createRes.body;
    assert(
      created && typeof created.dealId === 'string' && created.dealId.length > 0,
      'POST /api/deals → response contains dealId',
      created ? `body=${JSON.stringify(created)}` : 'null body',
    );
  }

  return Array.isArray(deals) ? deals : [];
}

// ---------------------------------------------------------------------------
// Section 2 — MCP smoke test
// ---------------------------------------------------------------------------

/**
 * Spawn the MCP server, exchange JSON-RPC messages over stdio, and resolve
 * with the result of tools/call search_deals.
 *
 * Protocol: newline-delimited JSON-RPC 2.0
 */
function runMcpQuery(args) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn('node', [MCP_SERVER_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      return reject(new Error(`Failed to spawn MCP server: ${err.message}`));
    }

    const TIMEOUT_MS = 15_000;
    let settled = false;
    let buffer = '';

    // Pending requests: id → { resolve, reject }
    const pending = {};

    function sendMessage(msg) {
      child.stdin.write(JSON.stringify(msg) + '\n');
    }

    function settle(result, err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      if (err) reject(err);
      else resolve(result);
    }

    const timer = setTimeout(() => {
      settle(null, new Error('MCP server timed out after 15 s'));
    }, TIMEOUT_MS);

    child.stderr.on('data', (chunk) => {
      // Ignore stderr (may contain info logs); surface on timeout for debug.
    });

    child.on('error', (err) => {
      settle(null, new Error(`MCP child process error: ${err.message}`));
    });

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      // Keep the last (potentially incomplete) fragment
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let msg;
        try {
          msg = JSON.parse(trimmed);
        } catch {
          // Not JSON — skip (server may emit non-JSON startup text)
          continue;
        }

        if (msg.id !== undefined && pending[msg.id]) {
          const { resolve: res, reject: rej } = pending[msg.id];
          delete pending[msg.id];
          if (msg.error) rej(new Error(`RPC error: ${JSON.stringify(msg.error)}`));
          else res(msg.result);
        }
      }
    });

    // Step 1: initialize
    pending[1] = {
      resolve: () => {
        // Step 2: tools/call search_deals
        pending[2] = {
          resolve: (result) => settle(result, null),
          reject: (err) => settle(null, err),
        };
        sendMessage({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'search_deals',
            arguments: args,
          },
        });
      },
      reject: (err) => settle(null, err),
    };

    sendMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'smoke', version: '1' },
      },
    });
  });
}

async function runMcpTests() {
  console.log('\n── MCP smoke tests (stdio) ──');

  const searchArgs = { format: 'video', status: 'active' };

  let result;
  try {
    result = await runMcpQuery(searchArgs);
  } catch (err) {
    fail('MCP server spawned and responded', err.message);
    return;
  }

  // The MCP SDK wraps tool results in { content: [{ type, text }] }
  // The tool itself returns a JSON string or object inside content[0].text
  pass('MCP server spawned and responded to tools/call');

  assert(
    result && result.content && Array.isArray(result.content) && result.content.length > 0,
    'MCP search_deals → result has content array',
    result ? JSON.stringify(result).slice(0, 200) : 'null result',
  );

  if (result && result.content && result.content.length > 0) {
    // Parse the text payload — the server may return JSON in content[0].text
    const raw = result.content[0].text || result.content[0].json || '';
    let deals;
    if (typeof raw === 'string') {
      try { deals = JSON.parse(raw); } catch { deals = raw; }
    } else {
      deals = raw;
    }

    const hasDeals = Array.isArray(deals) ? deals.length >= 1
      : (deals && typeof deals === 'object' && Array.isArray(deals.deals)) ? deals.deals.length >= 1
      : false;

    assert(
      hasDeals,
      'MCP search_deals({ format:"video", status:"active" }) → at least one deal',
      typeof deals === 'string' ? deals.slice(0, 200) : JSON.stringify(deals).slice(0, 200),
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('DealDesk smoke tests');
  console.log('====================');

  await runApiTests();
  await runMcpTests();

  console.log('\n──────────────────────────────');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error('\nSome tests FAILED.');
    process.exit(1);
  } else {
    console.log('\nAll tests PASSED.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
