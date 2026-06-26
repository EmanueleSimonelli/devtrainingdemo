# Build prompt — DealDesk seed repo + synthetic data

*Clone this repo, then paste the prompt below into your coding agent (Claude Code or Codex) from the repo root. The repo already contains `PRD.md` (the brief), `README.md`, and seed US-state data in `/data/_source/states.json` — the agent uses that for the geography entity and generates everything else. It builds a complete, runnable demo with a rich synthetic data set.*

---

You are building **DealDesk**, a small public demo of a sell-side (SSP) deal desk. `PRD.md` in this folder is the brief, and §9 is the data model — read it first and treat the data dictionary as the source of truth. Build a complete, runnable demo with three services and a generous synthetic data set.

Work in this order, and write a short build plan before you start.

**1. Build plan.** Read `PRD.md`. Write `BUILD-PLAN.md`: the data shapes (from §9), the four pieces of work (data + back end, front end, MCP server, smoke test), what each owns, and how the services talk. Keep it to a page. If you want, spin up a subagent per piece and run them in parallel — each scoped to its own folder.

**2. Synthetic data → `/data`.** Generate generously and with real variety — this data set is the point. Match the field names, types and enumerations in `PRD.md` §9 exactly.

- `states.json` — all 50 US states: `code`, `name`, `region`, `population`. Use the data in `/data/_source/` if present; fill any missing field. If it isn't present, generate all 50 yourself.
- `buyers.json` — 12 fictional buyers: `buyerId`, `name` (invented DSP or agency), `seatId`, `type` (`dsp`/`agency`), `region`. Reuse these across deals.
- `publishers.json` — 20 fictional publishers: `publisherId`, `name`, `vertical` (from the §9.3 list), `domain` (e.g. `example-sport.test`). Spread across all verticals.
- `deals.json` — **60+ deals**, each with every field in §9.1: `dealId` (e.g. `DD-1042`), `name`, `buyerId`, `publisherId`, `format`, `dealType`, `device`, `floorCpm`, `currency` (`USD`), `status`, `targetStates` (array of state codes — mix of single-state, multi-state, and empty = national), `startDate`, `endDate` (nullable), `createdAt`, and the synthetic metrics `impressions30d`, `fillRate`, `avgWinCpm`, `revenue30d`.

Make the variety believable, not uniform:

- Skew the mix — more `display` and `active`, fewer `ctv`/`audio` and `draft`; a handful of `paused` and `expired` for edge cases.
- Weight floors to the $0.50–$3.00 band with a long tail up to $8.00.
- Vary geo — some national (empty `targetStates`), some single-state, some regional clusters (e.g. several West-region states together).
- Keep metrics internally consistent — `avgWinCpm` ≥ `floorCpm` for active deals; `revenue30d` roughly tracks `impressions30d` × `avgWinCpm`; `fillRate` between 0 and 1; drafts and expired deals can have zero or low metrics.
- Spread `createdAt` and flight windows across the last 6 months so dates look real.

If a generator script makes this cleaner and reproducible, write one (`/data/generate.*`) and commit both the script and its output.

**3. Back end → `/server`.** A small API that seeds from `/data` on first run (SQLite or an embedded store) and supports: list deals with search (name/buyer) and filters (format, status, dealType, target state, floor range); read a deal by id; create a deal. Pick a small common stack; one runnable command.

**4. Front end → `/web`.** A single page: the deal list with search and the filters above, a deal detail view showing the performance metrics, and an "add deal" form that validates the enums. Plain and clean — it should make the data easy to explore. If a front-end design skill is available, use it.

**5. MCP server → `/mcp`.** An MCP server over the same data exposing `search_deals` (the filters above), `get_deal` (by id) and `add_deal`. It must connect to a coding agent and answer a real query.

**6. Run + verify.** Each service runs with one documented command. Add a smoke test that the API returns seeded deals and `search_deals` responds over MCP. Update `README.md`'s quick-start and MCP-connect sections with the exact commands.

**Constraints**

- Generic public demo — no real company, advertiser or publisher names, no secrets. Buyers, publishers, deal names and domains are fictional; geography is real US states.
- No auth, no real integrations, no live traffic.
- Match the data dictionary in `PRD.md` §9 exactly, so the data, the API, the UI and the MCP tools all line up.

**When you're done, show me:** the file tree, the row counts for each data file, the one-line run command for each service, the smoke-test output, and the exact line to connect the MCP server to a coding agent.
