# Agent commands — Claude Code reference

A quick reference to the ways you direct **one or many agents** in Claude Code, for the
multi-agent build in this repo. Verified against Claude Code **v2.1.x (June 2026)**.

> **The live source of truth is `/help`.** Type `/help` (or just `/`) in your session to see the
> exact commands your version supports — the set ships fast and varies by version. Treat this file
> as orientation, not gospel.

---

## First, the honest bit

You don't *need* a command to send out agents. The primary way is **plain English**:

```
Build the server, web and mcp folders in parallel using separate subagents,
one per folder. Agree the API contract first and don't let them change it.
```

The commands below are for **control and scale** — naming agents, scoping them, backgrounding
them, watching them, and setting an outcome to run toward.

---

## 1. Goal-directed — run until a condition is met

| Command | What it does |
|---|---|
| `/goal [condition]` | Sets a completion condition; Claude keeps working across turns until it's met. With no argument, shows the current/last goal. |
| `/goal clear` | Removes an active goal early. Also accepts `stop` · `off` · `reset` · `none` · `cancel`. |

Pair `/goal` with **Auto mode** (`Shift+Tab` to cycle) and it runs unattended for hours.
A goal is only as good as its finish line — make it **provable** (the agent shows evidence in chat),
**fenced** (name the files, say what must not change), and **guarded** (branch + limits + review).

```
Goal: every test in /server passes — npm test exits 0. Don't edit any test file.
```

## 2. Subagents — spawn focused helpers inside your session

| Command / key | What it does |
|---|---|
| `/agents` | Manager UI: create, edit, scope and run named subagents. The **Running** tab lists live ones. |
| `@agent-<name>` | Force a *specific* named subagent onto the next task (guaranteed — not Claude's choice). |
| `/fork <directive>` | Spawns a forked subagent that inherits your **full conversation**, works in the background, and returns its result when done. |
| `Ctrl+B` | Send a currently-running subagent to the background and keep working. |

A subagent is just a markdown file with YAML frontmatter (`.claude/agents/<name>.md`):

```markdown
---
name: backend
description: Owns /server — the SQLite schema, the DB, and the REST API
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---
You own the /server folder only. Build to the agreed API contract.
Never touch /web or /mcp. Return the final endpoint list when done.
```

Agents made via `/agents` work immediately; hand-edited files on disk need a session restart.

## 3. Background sessions & parallel-at-scale

| Command / key | What it does |
|---|---|
| `/background [prompt]` (alias `/bg`) | Detaches the **whole session** to run as a background agent and frees your terminal. |
| `/tasks` (alias `/bashes`) | View and manage everything running in the background of the session. |
| `/batch <instruction>` | Decomposes a big codebase-wide change into **5–30 independent units**, each in its own git worktree, run in parallel. |
| `\` (backslash) | Opens **Agent View** — one dashboard listing every running/background session. |
| `claude agents` *(shell)* | Monitor/manage background agents from the terminal. |
| `claude --bg` / `--background` *(shell)* | Start a background agent straight from the shell. |

## 4. Agent Teams — peers that talk to each other (experimental)

No slash command. Enable it, then ask in natural language. Use only when workers need to **discuss
or challenge each other** (research, review, debugging competing hypotheses) — they cost far more
tokens than subagents.

- **Enable:** set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `settings.json` or your environment.
- **Start:** *"Spawn 3 teammates to review PR #142 — one on security, one on performance, one on tests."*
- **Flag:** `claude --teammate-mode auto|tmux|iterm2|in-process` (split panes need tmux or iTerm2).
- **Agent panel keys:** `↑/↓` select · `Enter` open & message · `x` stop · `Esc` interrupt · `Ctrl+T` toggle shared task list.

## 5. Cloud agents

| Command | What it does |
|---|---|
| `/autofix-pr [prompt]` | Spawns a **Claude Code on the web** session that watches your branch's PR and pushes fixes when CI fails or reviewers comment. |

## Supporting — the gates around agents

`/plan [description]` (plan mode before agents act) · `Shift+Tab` (cycle plan/auto modes) ·
`/model`, `/effort` (tune reasoning) · `/rewind` (roll code + conversation back if an agent goes wrong) ·
`/context` + `/compact` (manage the window when it fills).

---

## Which to reach for

| Situation | Reach for |
|---|---|
| Everyday parallel work (this repo's build) | `/agents` + plain English |
| Peel off a side-task without losing context | `/fork` |
| Codebase-wide sweep (rename, migration) | `/batch` |
| "Run until it's green / done" | `/goal` + Auto mode |
| Workers need to argue with each other | Agent Teams |
| Fire-and-forget, come back to a PR | `/background`, cloud agents |

## How this maps to the DealDesk build

Split the PRD across **subagents** — `/web`, `/server`, `/mcp` (and an optional `/test`) — one folder
per owner, with the API contract agreed up front so they don't collide. That's section 1 of
`BUILD-PROMPT.md`. Use `/plan` to review before they write code; `\` (Agent View) to watch them.

---

*Sources: Claude Code docs — [Commands](https://code.claude.com/docs/en/commands),
[Subagents](https://code.claude.com/docs/en/sub-agents),
[Agent teams](https://code.claude.com/docs/en/agent-teams),
[Agent view](https://code.claude.com/docs/en/agent-view),
[Goal](https://code.claude.com/docs/en/goal). Current as of June 2026; run `/help` for your version.*
