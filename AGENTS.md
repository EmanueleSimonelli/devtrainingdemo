# AGENTS.md — orientation for coding agents

If you are an AI coding agent that has just been pointed at this repository, read this first.

## What this repo is

This is **DealDesk** — a *starter space*, not a finished product. It exists for a training exercise
where a person learns to build a small app **by directing a team of coding agents** (you).

The repo deliberately ships **only the brief and seed data**. There is **no application code yet** —
no `server/`, `web/`, or `mcp/` folders. Your job (when asked) is to build them.

## What's here

| File / folder | What it is |
|---|---|
| `PRD.md` | The product brief. **§9 is the data model and is the source of truth** — match its field names, types and enumerations exactly. |
| `BUILD-PROMPT.md` | The exact build instruction. Follow it step by step. |
| `AGENT-COMMANDS.md` | Reference for Claude Code's agent/subagent/goal/team commands. |
| `README.md` | Human-facing overview of DealDesk. |
| `data/_source/states.json` | Seed geography: all 50 US states (`code`, `name`, `region`, `population`). |
| `LICENSE` | MIT. |

## What you're expected to build

Three cooperating services plus a synthetic data set (full detail in `BUILD-PROMPT.md`):

- **`/data`** — generate `buyers.json` (~12), `publishers.json` (~20), `deals.json` (60+) to PRD §9.
  Normalise the provided `data/_source/states.json` into `/data/states.json`.
- **`/server`** — an API + embedded DB (e.g. SQLite) that seeds from `/data` and serves list/search/
  filter, read-by-id, and create.
- **`/web`** — a single page: deal list with search + filters, a detail view, and an add-deal form.
- **`/mcp`** — an MCP server over the same data exposing `search_deals`, `get_deal`, `add_deal`.

Acceptance criteria are in `PRD.md` §11.

## How to approach it

1. **Read `PRD.md` first**, then `BUILD-PROMPT.md`.
2. **Write `BUILD-PLAN.md`** (one page) before coding: the data shapes, the four pieces of work, what
   each owns, and the API contract the services share.
3. **Agree the contract up front** so parallel work doesn't collide, e.g.
   `GET /snippets`-style: `GET /deals?...` → `[{ dealId, name, buyerId, publisherId, format, ... }]`.
4. **Split the work across subagents** — one folder, one owner (`/server`, `/web`, `/mcp`, optional
   `/test`). See `AGENT-COMMANDS.md`. Run them in parallel where the work is independent.
5. **Verify**: each service runs with one documented command; add a smoke test; then fill in the
   `> Filled in by the build` placeholders in `README.md` (quick-start + MCP-connect commands).

## Hard rules

- **Match `PRD.md` §9 exactly** — the data, the API, the UI and the MCP tools must all line up.
- **Synthetic only.** No real company, advertiser, publisher or deal. Buyers, publishers, deal names
  and domains are fictional (`*.test` domains); only the US-state geography is real.
- **No secrets, no auth, no real integrations, no live traffic.** Local-first; every service runs
  with a single command on a laptop.
- **Don't edit `data/_source/`** by hand unless you intend to change the geography deals target.

## What "done" looks like

Show: the file tree, row counts per data file, the one-line run command for each service, the
smoke-test output, and the exact line to connect the MCP server to a coding agent.
