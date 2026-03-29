# 🚀 AI Stack Orchestrator

Two scripts to set up and tear down a complete macOS AI development environment.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `orchestrate_ai.sh` | Install everything, configure global MCPs per agent, inject `ai-init` |
| `nuke_ai.sh` | Remove everything — apps, configs, Homebrew, clean slate |

---

## Global MCP Configuration (written by `orchestrate_ai.sh`)

Each agent gets its own unique global MCP, written directly to its native config path:

```
~/
├── .claude.json                     ← Claude user-level global (sequential-thinking)
├── .cursor/
│   └── mcp.json                     ← Cursor global (fetch)
│
├── Library/Application Support/
│   ├── Code/User/
│   │   └── mcp.json                 ← VS Code global (puppeteer)
│   └── ClaudeCode/
│       └── managed-mcp.json         ← Claude managed global (memory) — sudo
│
└── .zshrc                           ← ai-init function injected here
```

---

## Project Scaffolds (`ai-init`)

### Option 1: Claude Code

```
<project>/
├── CLAUDE.md                          ← Main rules
├── .claude/
│   ├── rules/
│   │   ├── backend-architecture-style.md  ← Backend/architecture style
│   │   └── backend-testing.md             ← Backend testing rules
│   └── skills/
│       ├── api-design/SKILL.md
│       └── error-handling/SKILL.md
└── .mcp.json                          ← Project MCP: filesystem + github
```

### Option 2: Cursor

```
<project>/
├── .cursorrules                       ← Short index (points to rules/ + skills/)
├── .cursor/
│   ├── rules/
│   │   ├── project-core.mdc               ← Core principles (alwaysApply: true)
│   │   └── ui-component-style.mdc         ← Frontend/UI style (globs: **/*.{ts,tsx})
│   ├── skills/
│   │   ├── react-components/SKILL.md
│   │   └── tailwind-patterns/SKILL.md
│   └── mcp.json                       ← Project MCP: brave-search + git
```

### Option 3: VS Code (Copilot)

```
<project>/
├── .github/
│   ├── copilot-instructions.md            ← Main instructions (always-on)
│   ├── instructions/
│   │   ├── fullstack-typescript-style.instructions.md  ← TS style (applyTo: **/*.{ts,tsx})
│   │   └── fullstack-testing.instructions.md           ← Testing (applyTo: **/*.{test,spec}.{ts,tsx})
│   └── skills/
│       ├── typescript-strict/SKILL.md
│       └── full-stack-patterns/SKILL.md
├── .vscode/
│   └── mcp.json                       ← Project MCP: sqlite + postgres
```

---

## What Each Agent Gets

### MCP Servers (all 10 unique)

| Agent | Global MCP(s) | Global Path(s) | Local Project MCPs |
|-------|---------------|-----------------|-------------------|
| **Claude Code** | `sequential-thinking` + `memory` | `~/.claude.json` + `/Library/.../ClaudeCode/managed-mcp.json` | `filesystem` + `github` |
| **Cursor** | `fetch` | `~/.cursor/mcp.json` | `brave-search` + `git` |
| **VS Code** | `puppeteer` | `~/Library/.../Code/User/mcp.json` | `sqlite` + `postgres` |

---

### Rules (per project)

| Rule File | Claude Code | Cursor | VS Code |
|-----------|------------|--------|---------|
| **Main rules** | `CLAUDE.md` — Autonomous architect, CLI-first, architecture ownership, ADRs | `.cursorrules` (index) + `project-core.mdc` (alwaysApply) — UI-first copilot, Tailwind, React, accessibility | `.github/copilot-instructions.md` — Full-stack assistant, shared types, typed API clients |
| **Code style** | `backend-architecture-style.md` — kebab-case files, async/await, pure functions, config module | `ui-component-style.mdc` (globs: TS/TSX) — PascalCase components, Tailwind class grouping | `fullstack-typescript-style.instructions.md` (applyTo: TS/TSX) — split naming, workspace packages |
| **Testing** | `backend-testing.md` — unit + integration + load tests, 100% on auth/payments | *(via project-core)* | `fullstack-testing.instructions.md` (applyTo: test files) — both sides + E2E |

---

### Skills (per project)

| # | Claude Code (Architect) | Cursor (Tactician) | VS Code (Full-Stack) |
|---|------------------------|--------------------|--------------------|
| 1 | **api-design** — REST backend, Zod validation, rate limiting, OpenAPI specs | **react-components** — Functional components, hooks, composition, lazy loading | **typescript-strict** — Strict config, type narrowing, generics, utility types |
| 2 | **error-handling** — Server error classes, request-id tracing, circuit breakers, health checks | **tailwind-patterns** — Utility-first, responsive breakpoints, dark mode, cn() | **full-stack-patterns** — Shared types, typed API client, Zod validation, e2e type safety |

---

## Quick Start

```bash
# 1. Run the installer
chmod +x orchestrate_ai.sh && bash orchestrate_ai.sh

# 2. Reload shell
source ~/.zshrc

# 3. Scaffold a project
ai-init

# To remove everything:
chmod +x nuke_ai.sh && bash nuke_ai.sh
```
