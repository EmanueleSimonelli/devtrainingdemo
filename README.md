# DealDesk

A small, open demo of a sell-side (SSP) **deal desk** — see, search and manage private-marketplace ad deals, and query the same deal book from a coding agent over **MCP**.

It's a teaching and demo project: synthetic data, three small services, built to be cloned, run, and pulled apart. No real company, no real deals — fictional buyers and publishers, real US-state geography.

---

## Why it exists

Most "hello world" demos are too thin to feel real, and most real codebases are too big to learn from. DealDesk sits in between: a believable slice of ad-tech (PMP deals on a sell-side platform) small enough to read in one sitting, and structured so you can practise the things that actually matter now — decomposing a brief across several coding agents, wiring up an MCP server, and letting an agent work against real-shaped data.

## What's inside — three services

- **Web front end** — browse, search and filter deals; add a deal; open one to see its detail.
- **API + database** — stores and serves the deals and the US-state geography reference data.
- **MCP server** — lets a coding agent search, read and add deals directly, from inside the agent.

## The data

Synthetic seed data ships in the repo:

- 60+ fictional deals — buyer (a DSP or agency), publisher, format (display / video / native / CTV / audio), deal type, device, floor CPM, status (active / paused / draft / expired), target US states, flight dates, and synthetic performance metrics (impressions, fill rate, realised CPM, revenue).
- 12 buyers and 20 publishers across seven verticals, reused consistently across the deals.
- All 50 US states — code, name, region, population — used for targeting, filtering and an optional "reach" view.

Buyers, publishers, deal names and domains are invented. Only the geography is real. Nothing here maps to any real platform or advertiser. The full data dictionary is in `PRD.md` §9.

## Quick start

> Filled in by the build — these are the one-line commands to run each service.

```
# 1. API + database (seeds on first run)
# 2. Web front end  → open in your browser
# 3. MCP server     → connect it to your coding agent
```

## Play with it

- Search for active video deals targeting a given state.
- Add a deal in the UI and watch it appear in the list.
- From a coding agent with the MCP connected, try:
  - "List active deals with a floor under $2 targeting California."
  - "Add a display deal for *[buyer]* targeting Texas at a $1.20 floor."
  - "Which buyers have the most paused deals?"

## Connect the MCP to a coding agent

> Filled in by the build — the exact command to register the MCP server with your agent.

## Built it from a brief

DealDesk is built from a short product brief (`PRD.md`) rather than a spec — the technical design, the service boundaries and the data shapes are decisions you make. If you're using it to learn multi-agent coding: read the brief, write a build plan, then split the work across agents (front end, back end, MCP, tests) and let them run.

## Licence and data

Demo project. Synthetic data only — no real company, advertiser or deal. Choose a permissive licence (MIT is a sensible default) before you make the repo public.
