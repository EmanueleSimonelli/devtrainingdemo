# DealDesk — Build Plan

## Stack

| Service    | Technology                                  | Port / Transport       |
|------------|---------------------------------------------|------------------------|
| Data       | JSON files in `/data/` → SQLite (seeded)    | —                      |
| Back end   | Node.js + Express + better-sqlite3          | http://localhost:3001  |
| Front end  | React + Vite                                | http://localhost:3000  |
| MCP server | Node.js + @modelcontextprotocol/sdk         | stdio                  |

---

## Data shapes (source of truth: PRD §9)

### Deal
```json
{
  "dealId": "DD-1042",
  "name": "string",
  "buyerId": "BUY-07",
  "publisherId": "PUB-12",
  "format": "display|video|native|ctv|audio",
  "dealType": "pmp|preferred|programmatic_guaranteed",
  "device": "desktop|mobile|ctv|all",
  "floorCpm": 1.50,
  "currency": "USD",
  "status": "active|paused|draft|expired",
  "targetStates": ["CA", "NY"],
  "startDate": "2024-01-15",
  "endDate": "2024-06-30",
  "createdAt": "2024-01-10",
  "impressions30d": 250000,
  "fillRate": 0.72,
  "avgWinCpm": 1.85,
  "revenue30d": 462.50
}
```

### Buyer
```json
{ "buyerId": "BUY-07", "name": "string", "seatId": "string", "type": "dsp|agency", "region": "string" }
```

### Publisher
```json
{ "publisherId": "PUB-12", "name": "string", "vertical": "news|sport|entertainment|lifestyle|finance|technology|gaming", "domain": "example.test" }
```

### State
```json
{ "code": "CA", "name": "California", "region": "West", "population": 39538223 }
```

---

## REST API contract (back end → front end & MCP)

| Method | Path               | Query params / Body                                          | Returns             |
|--------|--------------------|--------------------------------------------------------------|---------------------|
| GET    | /api/deals         | `q`, `format`, `status`, `dealType`, `state`, `floorMin`, `floorMax` | `Deal[]` newest first |
| GET    | /api/deals/:dealId | —                                                            | `Deal`              |
| POST   | /api/deals         | Deal body (without dealId, createdAt, metrics)               | `{ dealId }`        |
| GET    | /api/buyers        | —                                                            | `Buyer[]`           |
| GET    | /api/publishers    | —                                                            | `Publisher[]`       |
| GET    | /api/states        | —                                                            | `State[]`           |

All endpoints return JSON. CORS open (`*`) so the front end can call from localhost:3000.

---

## MCP tools

| Tool           | Backs onto              |
|----------------|-------------------------|
| `search_deals` | GET /api/deals          |
| `get_deal`     | GET /api/deals/:dealId  |
| `add_deal`     | POST /api/deals         |

MCP server calls the REST API (not the DB directly) so both clients always see the same data.

---

## Agents

| Agent        | Owns            | One-line brief                                                                                   | Skill    |
|--------------|-----------------|--------------------------------------------------------------------------------------------------|----------|
| **Back-end** | `/server`, `/data` | Generate 60+ seed deals + reference data; build Express + SQLite API that seeds on first run | `/server` |
| **Front-end** | `/web`         | Build React + Vite SPA: deal list with search/filter, deal detail, add-deal form                | `/web`   |
| **MCP**      | `/mcp`          | Build stdio MCP server with `search_deals`, `get_deal`, `add_deal` backed by the REST API       | `/mcp`   |
| **Test**     | `/test`         | Smoke-test that API returns seed deals and MCP `search_deals` answers a real query              | `/test`  |