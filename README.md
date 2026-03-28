# 🚀 AI Stack Orchestrator

Two scripts to set up and tear down a complete macOS AI development environment.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `orchestrate_ai.sh` | Install everything, configure Global Brain, inject `ai-init` |
| `nuke_ai.sh` | Remove everything — apps, configs, Homebrew, clean slate |

---

## Global Directory (created by `orchestrate_ai.sh`)

```
~/
├── AI-Global-Settings/
│   ├── master_mcp.json              ← mcpServers format (Claude + Cursor)
│   ├── vscode_mcp.json              ← servers format (VS Code)
│   └── memory/
│       └── memory.json              ← Shared knowledge graph
│
├── .claude.json                     → symlink → master_mcp.json
├── .cursor/
│   └── mcp.json                     → symlink → master_mcp.json
│
├── Library/Application Support/
│   ├── Code/User/
│   │   └── mcp.json                 → symlink → vscode_mcp.json
│   └── ClaudeCode/
│       └── managed-mcp.json         → symlink → master_mcp.json (sudo)
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
│   │   ├── backend-testing.md             ← Backend testing rules
│   │   └── commit-and-migration-workflow.md ← Git workflow rules
│   └── skills/
│       ├── database-design/SKILL.md
│       ├── cli-tooling/SKILL.md
│       ├── api-design/SKILL.md
│       ├── error-handling/SKILL.md
│       └── git-conventions/SKILL.md
└── .mcp.json                          ← Project MCP (mcpServers)
```

### Option 2: Cursor

```
<project>/
├── .cursorrules                       ← Short index (points to rules/ + skills/)
├── .cursor/
│   ├── rules/
│   │   ├── project-core.mdc               ← Core principles (alwaysApply: true)
│   │   ├── ui-component-style.mdc         ← Frontend/UI style (globs: **/*.{ts,tsx})
│   │   ├── frontend-testing.mdc           ← Frontend testing (globs: **/*.{test,spec}.{ts,tsx})
│   │   └── git-workflow.md                ← Git/PR conventions (plain markdown)
│   ├── skills/
│   │   ├── react-components/SKILL.md
│   │   ├── tailwind-patterns/SKILL.md
│   │   ├── accessibility/SKILL.md
│   │   ├── state-management/SKILL.md
│   │   └── git-conventions/SKILL.md
│   └── mcp.json                       ← Project MCP (mcpServers, type: stdio, ${workspaceFolder})
```

### Option 3: VS Code (Copilot)

```
<project>/
├── .github/
│   ├── copilot-instructions.md            ← Main instructions (always-on)
│   ├── instructions/
│   │   ├── fullstack-typescript-style.instructions.md  ← TS style (applyTo: **/*.{ts,tsx})
│   │   ├── fullstack-testing.instructions.md           ← Testing (applyTo: **/*.{test,spec}.{ts,tsx})
│   │   └── monorepo-pr-workflow.instructions.md        ← Git workflow (applyTo: **)
│   └── skills/
│       ├── typescript-strict/SKILL.md
│       ├── esm-modules/SKILL.md
│       ├── full-stack-patterns/SKILL.md
│       ├── error-handling/SKILL.md
│       └── git-conventions/SKILL.md
├── .vscode/
│   └── mcp.json                       ← Project MCP (servers, type: stdio, ${workspaceFolder})
```

---

## What Each Agent Gets

### MCP Servers

| Server | Claude Code | Cursor | VS Code |
|--------|:-----------:|:------:|:-------:|
| **Global** (all 4 servers) | ✅ `~/.claude.json` | ✅ `~/.cursor/mcp.json` | ✅ `~/Library/.../Code/User/mcp.json` |
| JSON root key | `mcpServers` | `mcpServers` | `servers` |
| **Project** (3 servers) | ✅ `.mcp.json` | ✅ `.cursor/mcp.json` | ✅ `.vscode/mcp.json` |

**Global servers:** `filesystem`, `fetch`, `memory`, `sequential-thinking`
**Project servers:** `filesystem` (scoped to project dir), `fetch`, `memory`

---

### Rules (per project)

| Rule File | Claude Code | Cursor | VS Code |
|-----------|------------|--------|---------|
| **Main rules** | `CLAUDE.md` — Autonomous architect, CLI-first, architecture ownership, ADRs | `.cursorrules` (index) + `project-core.mdc` (alwaysApply) — UI-first copilot, Tailwind, React, accessibility | `.github/copilot-instructions.md` — Full-stack assistant, shared types, typed API clients |
| **code style** | `backend-architecture-style.md` — kebab-case files, async/await, pure functions, config module | `ui-component-style.mdc` (globs: TS/TSX) — PascalCase components, Tailwind class grouping | `fullstack-typescript-style.instructions.md` (applyTo: TS/TSX) — split naming, workspace packages |
| **testing** | `backend-testing.md` — unit + integration + load tests, 100% on auth/payments | `frontend-testing.mdc` (globs: test files) — testing-library, MSW mocks, visual regression | `fullstack-testing.instructions.md` (applyTo: test files) — both sides + E2E |
| **git workflow** | `commit-and-migration-workflow.md` — migration steps in PRs | `git-workflow.md` — before/after screenshots for visual changes | `monorepo-pr-workflow.instructions.md` (applyTo: **) — cross-package impact |

---

### Skills (per project)

| # | Claude Code (Architect) | Cursor (Tactician) | VS Code (Full-Stack) |
|---|------------------------|--------------------|--------------------|
| 1 | **database-design** — Schema design, migrations, indexing, UUID v7, ER diagrams | **react-components** — Functional components, hooks, composition, lazy loading | **typescript-strict** — Strict config, type narrowing, generics, utility types |
| 2 | **cli-tooling** — Arg parsing, exit codes, stdin piping, spinners, shell completion | **tailwind-patterns** — Utility-first, responsive breakpoints, dark mode, cn() | **esm-modules** — Import/export, dynamic imports, monorepo package imports, path aliases |
| 3 | **api-design** — REST backend, Zod validation, rate limiting, OpenAPI specs | **accessibility** — WCAG 2.1 AA, semantic HTML, keyboard nav, axe-core CI | **full-stack-patterns** — Shared types, typed API client, Zod validation, e2e type safety |
| 4 | **error-handling** — Server error classes, request-id tracing, circuit breakers, health checks | **state-management** — useState → context → Zustand, TanStack Query, optimistic updates | **error-handling** — React error boundaries + server error classes + request-id tracing |
| 5 | **git-conventions** — Backend/infra workflow, migration steps in PRs, CHANGELOG | **git-conventions** — UI workflow, screenshots in PRs, component-scoped commits | **git-conventions** — Monorepo workflow, package-scoped scopes, per-package changelogs |

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
