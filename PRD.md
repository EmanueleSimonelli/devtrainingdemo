# DealDesk — Product Requirements Document

A sell-side (SSP) deal desk for managing private-marketplace deals, with a coding-agent interface over MCP.

| | |
| --- | --- |
| **Document** | Product Requirements Document |
| **Product** | DealDesk (demo) |
| **Version** | 1.0 |
| **Status** | Approved for build |
| **Owner** | Platform Engineering |
| **Audience** | Engineering, ad operations |
| **Classification** | Public demo · synthetic data only |

---

## 1. Overview

DealDesk is an internal tool for a sell-side advertising platform. It gives ad operations a single place to manage private-marketplace (PMP) and guaranteed deals — the agreements that govern which buyers may purchase which inventory, in which formats, at what price floors, and in which geographies — and it exposes that same deal book to a coding agent through an MCP server, so engineers can query and update deals from the tools they already work in.

This document is the build brief. It defines the problem, the users, the scope, the functional requirements, the data model, and the acceptance criteria. It does not prescribe the technical design — the implementing team produces a build plan covering stack, service boundaries, and interfaces.

## 2. Background and problem

On a sell-side platform, deal terms accumulate faster than any one system tracks them. A deal carries a buyer, one or more inventory formats, a price floor, a flight (start and end), a status, and — increasingly — a geographic target. In practice these terms are spread across spreadsheets, account-management notes, and ad-server screens.

Two problems follow:

- **Ad operations cannot answer routine questions quickly.** "Which active video deals target the West region with a floor under $2.50?" requires manual cross-referencing.
- **Engineers cannot reach the deal book from their tools.** There is no programmatic, agent-friendly way to read or amend deals, so automation and diagnostics are slow.

DealDesk consolidates the deal book into one service and makes it queryable both by a person (web UI) and by a coding agent (MCP).

## 3. Objectives and success measures

| # | Objective | Success measure |
| --- | --- | --- |
| O1 | Single source of truth for deals | All seed deals visible and searchable in one list |
| O2 | Fast retrieval | A user can find a deal by name, buyer, format, status, geo or floor in one screen |
| O3 | Agent-accessible deal book | A coding agent can search, read and create deals over MCP |
| O4 | Realistic, explorable data | The seed set spans formats, statuses, buyers, publishers and all US states with believable variety |

## 4. Personas

- **Yield manager / ad operations (primary).** Owns deal hygiene. Needs to browse, search and filter the book, inspect a deal, and add new deals quickly. Comfortable with data, not a developer.
- **Platform engineer (secondary).** Runs DealDesk locally and connects it to a coding agent. Wants to query and amend the deal book programmatically, and to extend the tool.

## 5. Scope

### 5.1 In scope

- A web front end for browsing, searching, filtering, viewing and adding deals.
- An API and database that store and serve deals plus supporting reference data.
- An MCP server exposing the deal book to a coding agent.
- A synthetic seed data set that makes the product useful on first run.

### 5.2 Out of scope

- Authentication, authorisation and user accounts.
- Integration with any real exchange, DSP, ad server or identity system.
- Billing, real spend, or live ad traffic.
- Production hardening (scaling, HA, observability). DealDesk is a local-first demo.

## 6. Use cases

| ID | As a… | I want to… | So that… |
| --- | --- | --- | --- |
| UC1 | Yield manager | see all deals in one list, newest first | I have a single view of the book |
| UC2 | Yield manager | search by deal name or buyer | I can find a specific deal fast |
| UC3 | Yield manager | filter by format, status, geo and floor range | I can answer a targeted question |
| UC4 | Yield manager | open a deal and see its full detail and recent performance | I can review its terms and how it's pacing |
| UC5 | Yield manager | add a new deal | the book stays current |
| UC6 | Engineer | ask my coding agent to find deals matching criteria | I can query the book without leaving my tools |
| UC7 | Engineer | ask my coding agent to read and to create a deal | I can automate and diagnose against real-shaped data |

## 7. Functional requirements

**Front end**

- FR1 — List all deals, most recent first, showing name, buyer, format, floor, status and target geo at a glance.
- FR2 — Search deals by name or buyer (case-insensitive, partial match).
- FR3 — Filter deals by format, status, deal type, target US state, and floor-price range, in combination.
- FR4 — Open a single deal to view its full detail, including its performance metrics.
- FR5 — Add a deal through a form that captures every required field and validates the enumerations.

**Back end**

- FR6 — Persist deals and reference data (buyers, publishers, states) and seed them on first run.
- FR7 — Serve the deal list with the search and filters in FR2–FR3 applied server-side.
- FR8 — Serve a single deal by its identifier.
- FR9 — Accept and store a new deal, returning its assigned identifier.

**MCP server**

- FR10 — Expose a tool to search deals by the same criteria as FR3.
- FR11 — Expose a tool to read a single deal by identifier.
- FR12 — Expose a tool to create a deal.
- FR13 — Operate over the same data as the web front end, so changes are consistent across both.

## 8. System overview

DealDesk is composed of three cooperating services. How they communicate (transport, formats, schemas) is a design decision for the build plan, not part of this brief.

- **Web front end.** The deal desk UI: list, search, filter, detail and add. Serves the personas in §4.
- **API and database.** The system of record. Holds deals and reference data, applies search and filtering, and serves both the front end and the MCP server.
- **MCP server.** A Model Context Protocol server that exposes the deal book to a coding agent as a small set of tools (search, read, create), backed by the same data as the API.

## 9. Data model

DealDesk is data-led: the value is in a believable, fully populated deal book. The model below is the system of record; the seed set in §10 populates it.

### 9.1 Entity — Deal

| Field | Type | Notes |
| --- | --- | --- |
| `dealId` | string | Stable identifier, e.g. `DD-1042` |
| `name` | string | Human-readable deal name |
| `buyerId` | ref → Buyer | The purchasing DSP or agency |
| `publisherId` | ref → Publisher | The supply source |
| `format` | enum | `display` · `video` · `native` · `ctv` · `audio` |
| `dealType` | enum | `pmp` · `preferred` · `programmatic_guaranteed` |
| `device` | enum | `desktop` · `mobile` · `ctv` · `all` |
| `floorCpm` | decimal | Price floor in `currency`, 0.20–8.00 |
| `currency` | enum | `USD` |
| `status` | enum | `active` · `paused` · `draft` · `expired` |
| `targetStates` | array<ref → State> | One or more US state codes; empty means national |
| `startDate` | date | Flight start |
| `endDate` | date | Flight end (nullable for always-on) |
| `createdAt` | date | When the deal was created |
| `impressions30d` | integer | Synthetic: impressions in the last 30 days |
| `fillRate` | decimal | Synthetic: 0.00–1.00 |
| `avgWinCpm` | decimal | Synthetic: realised CPM, ≥ `floorCpm` for active deals |
| `revenue30d` | decimal | Synthetic: revenue in the last 30 days |

### 9.2 Entity — Buyer

| Field | Type | Notes |
| --- | --- | --- |
| `buyerId` | string | e.g. `BUY-07` |
| `name` | string | Fictional DSP or agency name |
| `seatId` | string | Buyer seat reference |
| `type` | enum | `dsp` · `agency` |
| `region` | string | Operating region |

### 9.3 Entity — Publisher

| Field | Type | Notes |
| --- | --- | --- |
| `publisherId` | string | e.g. `PUB-12` |
| `name` | string | Fictional publisher name |
| `vertical` | enum | `news` · `sport` · `entertainment` · `lifestyle` · `finance` · `technology` · `gaming` |
| `domain` | string | Fictional domain, e.g. `example-sport.test` |

### 9.4 Entity — State (geography reference)

| Field | Type | Notes |
| --- | --- | --- |
| `code` | string | Two-letter US state code, e.g. `CA` |
| `name` | string | Full state name |
| `region` | enum | `Northeast` · `Midwest` · `South` · `West` |
| `population` | integer | Used for an optional "reach" view |

Sourced from our existing state data set; any missing field is filled during the build.

### 9.5 Enumerations

`format`, `dealType`, `device`, `status` and `vertical` take only the values listed above. The front end and the MCP tools validate against these.

## 10. Seed data

DealDesk ships populated so it is useful immediately and interesting to explore.

- **Deals:** ~60, spread with realistic skew — more `display` and `active` than `ctv` and `draft`; a mix of single-state, multi-state and national targeting; floors weighted to the $0.50–$3.00 band with a long tail; a handful of `paused` and `expired` for edge cases.
- **Buyers:** ~12 fictional DSPs and agencies, reused consistently across deals.
- **Publishers:** ~20 fictional publishers across the verticals in §9.3.
- **States:** all 50 US states with region and population.

Buyers, publishers, deal names and domains are entirely fictional. Only the geography is real.

## 11. Acceptance criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC1 | The front end loads and lists every seed deal, newest first | FR1, FR6, FR7 |
| AC2 | Search by name or buyer returns the correct subset | FR2, FR7 |
| AC3 | At least three filters (e.g. format, status, target state) work in combination | FR3, FR7 |
| AC4 | Opening a deal shows its full detail and performance metrics | FR4, FR8 |
| AC5 | Adding a deal through the UI persists it and shows it in the list | FR5, FR9 |
| AC6 | A coding agent, MCP connected, answers a real query (e.g. "active video deals targeting California under a $2 floor") | FR10, FR13 |
| AC7 | The same agent can read a deal by id and create a new deal | FR11, FR12 |

## 12. Non-functional and operational notes

- **Local-first.** Every service runs locally with a single documented command; no cloud account required.
- **No secrets.** No API keys, credentials or personal data anywhere in the repo.
- **Scale is trivial.** Tens of deals; no performance target beyond "instant on a laptop".
- **Synthetic only.** No real company, advertiser, publisher or deal is represented.

## 13. Assumptions and dependencies

- The US-state reference data is available to seed the geography entity; missing fields are generated during the build.
- The implementing team writes a technical build plan (stack, service boundaries, interfaces, data flow) before coding.
- A coding agent that supports MCP is available to satisfy the MCP acceptance criteria.

## 14. Stretch goals

- Edit and pause an existing deal (status transitions).
- A "reach by state" view using state population for a selected set of deals.
- A floor-price distribution chart by format.
- A pacing indicator derived from `impressions30d` against the flight window.

## 15. Open questions

- Should national deals be modelled as an empty `targetStates` array or an explicit "all states" value? (Build plan to decide; brief assumes empty = national.)
- Currency is fixed to USD for the demo; multi-currency is out of scope unless the team chooses to add it.

## 16. Glossary

- **SSP (sell-side platform):** technology a publisher uses to sell ad inventory programmatically.
- **DSP (demand-side platform):** technology a buyer uses to purchase ad inventory.
- **PMP (private marketplace):** an invitation-only deal between specific buyers and sellers.
- **Programmatic guaranteed:** a deal with committed volume at a fixed price.
- **Preferred deal:** a fixed-price, non-guaranteed deal offered to a specific buyer.
- **CPM:** cost per mille — price per thousand impressions.
- **Floor (price floor):** the minimum CPM a seller will accept for the inventory in a deal.
- **CTV:** connected TV.
- **Fill rate:** the share of eligible impressions that the deal actually transacted.
