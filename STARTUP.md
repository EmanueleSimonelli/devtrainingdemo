# DealDesk — Quick Start

## Prerequisites

- Node.js 18+
- npm

---

## 1. Back end (porta 3001)

```bash
cd server && npm install && node index.js
```

Il database SQLite viene creato e popolato automaticamente al primo avvio dai file in `/data`.

---

## 2. Front end (porta 3000)

```bash
cd web && npm install && npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

---

## 3. MCP server (stdio)

```bash
cd mcp && npm install
```

Connetti a Claude Code:

```bash
claude mcp add dealdesk -- node /home/emanuele/dev/git/devtrainingdemo/mcp/index.js
```

Strumenti esposti: `search_deals`, `get_deal`, `add_deal`.

---

## 4. Smoke test

Con il back end già avviato:

```bash
node test/smoke.js
```

Verifica: 50+ deal nel DB, lookup per ID, creazione deal, risposta MCP a `search_deals`.

---

## Ordine consigliato

1. `server` → 2. `web` → 3. MCP add → 4. smoke test
