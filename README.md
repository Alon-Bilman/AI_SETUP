# 🚀 AI Stack Orchestrator v2

Config-driven macOS AI development environment — extensible, reliable, and maintainable.

**Add a new agent = add a folder. No code changes.**

---

## Architecture

```
AI_SETUP/
├── setup.sh                  # Bash bootstrap → installs brew+node, runs orchestrator
├── nuke.sh                   # Bash bootstrap → runs teardown
├── package.json / tsconfig.json
│
├── src/
│   ├── orchestrate.ts        # Main entry: foundations → select agents → install → MCP → auth
│   ├── nuke.ts               # Teardown: select agents → uninstall → cleanup → remove foundations
│   ├── ai-init.ts            # Project scaffolder: select agent → copy scaffold + plugins
│   ├── core/
│   │   ├── types.ts          # AgentConfig, AgentDriver, PluginConfig, Context interfaces
│   │   ├── registry.ts       # Auto-discovers agents/ and plugins/ folders
│   │   ├── config.ts         # Reads + validates agent.json
│   │   └── runner.ts         # Builds Context objects for drivers
│   ├── lib/
│   │   ├── ui.ts             # Terminal output (chalk colors, headers, steps)
│   │   ├── shell.ts          # exec, retry, safeRm, sudoRm
│   │   ├── prompts.ts        # Interactive menus (inquirer)
│   │   ├── mcp.ts            # Write MCP configs to disk
│   │   └── template.ts       # Deep-copy scaffold dirs with {{VAR}} replacement
│   └── foundations/
│       ├── index.ts           # Install/uninstall in order: brew → node → python → git
│       ├── homebrew.ts
│       ├── node.ts
│       ├── python.ts
│       └── git.ts
│
├── agents/                    # One folder per agent (data, not code)
│   ├── claude/
│   │   ├── agent.json         # Config: name, MCP paths, cleanup paths
│   │   ├── driver.ts          # 4 functions: isInstalled, install, authenticate, uninstall
│   │   ├── mcp/               # Global MCP JSON files
│   │   └── scaffold/          # Files copied into new projects by ai-init
│   ├── cursor/
│   ├── vscode/
│   └── _template/             # Copy this to add a new agent
│
└── plugins/                   # Optional cross-agent project add-ons
    └── _template/
```

---

## Quick Start

```bash
# Setup everything
chmod +x setup.sh && ./setup.sh

# Scaffold a new project
ai-init

# Teardown everything
chmod +x nuke.sh && ./nuke.sh

# Dry run (see what would happen without doing it)
./setup.sh --dry-run
./nuke.sh --dry-run
```

---

## Built-in Agents

| Agent | Icon | Global MCPs | Project Scaffold |
|-------|------|-------------|-----------------|
| Claude Code | 🤖 | sequential-thinking, memory | CLAUDE.md, rules, skills, .mcp.json |
| Cursor | ⚡ | fetch | .cursorrules, .mdc rules, skills, .cursor/mcp.json |
| VS Code | 💎 | puppeteer | copilot-instructions.md, .instructions.md, skills, .vscode/mcp.json |

---

## Adding a New Agent

```bash
# 1. Copy the template
cp -r agents/_template agents/opencode

# 2. Edit the config
#    agents/opencode/agent.json — name, MCP paths, cleanup paths
#    agents/opencode/driver.ts  — isInstalled, install, authenticate, uninstall

# 3. Add MCP configs
#    agents/opencode/mcp/global.json

# 4. Add scaffold files
#    agents/opencode/scaffold/  — rules, skills, project MCP, etc.

# 5. Done. Run ./setup.sh — OpenCode appears in the menu automatically.
```

### agent.json Reference

```jsonc
{
  "name": "OpenCode",              // Display name
  "id": "opencode",               // Must match folder name
  "description": "Terminal AI",    // Shown in menus
  "icon": "🖥️",                   // Menu icon
  "requires": ["homebrew", "node"],
  "installMethod": "custom",      // "custom" | "brew-cask" | "brew" | "npm-global"
  "command": "opencode",           // CLI command to check installation
  "mcp": {
    "global.json": {               // File under mcp/ → destination path
      "path": "~/.opencode/mcp.json"
    }
  },
  "cleanup": {
    "paths": ["~/.opencode"],      // Removed by nuke (user-level)
    "sudoPaths": []                // Removed by nuke (with sudo)
  }
}
```

### driver.ts Reference

```typescript
import type { AgentDriver, Context } from "../../src/core/types.js";

export const driver: AgentDriver = {
  async isInstalled() { /* return true if installed */ },
  async install(ctx)  { /* install the agent */ },
  async authenticate(ctx) { /* prompt user to log in */ },
  async uninstall(ctx) { /* remove the agent */ },
};
export default driver;
```

---

## Adding a Plugin

Plugins are optional add-ons that inject files into projects during `ai-init`.

```bash
# 1. Copy the template
cp -r plugins/_template plugins/git-hooks

# 2. Edit plugins/git-hooks/plugin.json
{
  "name": "Git Hooks",
  "id": "git-hooks",
  "description": "Husky + commitlint pre-commit hooks",
  "icon": "🪝",
  "compatibleAgents": []    // empty = compatible with all agents
}

# 3. Add files under plugins/git-hooks/files/
#    These are copied to the project root preserving directory structure.
#    Supports {{PROJECT_DIR}} and {{PROJECT_NAME}} tokens.

# 4. Done. Plugin appears in ai-init menu automatically.
```

---

## How It Works

### Setup Flow (`./setup.sh`)
1. Bash bootstrap ensures Homebrew + Node exist
2. `orchestrate.ts` installs foundations (brew, node, python, git)
3. Auto-discovers `agents/*/agent.json`
4. Interactive checkbox: pick which agents to set up
5. For each agent: install → write global MCP → authenticate
6. Injects `ai-init` shell function into `~/.zshrc`

### Teardown Flow (`./nuke.sh`)
1. Safety gate (type NUKE to confirm)
2. Auto-discovers all agents
3. For each: run `driver.uninstall()` → remove cleanup paths → remove MCP configs
4. Removes `ai-init` from shell configs
5. Uninstalls foundations in reverse order

### Scaffold Flow (`ai-init`)
1. Prompt for project name
2. Select one agent from discovered list
3. Optionally select plugins
4. Deep-copy `agents/<id>/scaffold/` into new project
5. Replace `{{PROJECT_DIR}}` and `{{PROJECT_NAME}}` tokens in copied files
6. Copy plugin files into project

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Convention over configuration** | Agents discovered by folder existence — no central registry |
| **Data, not code** | MCP configs, rules, skills are plain files — edit with any editor |
| **Typed driver contract** | `AgentDriver` interface enforces consistent 4-function API |
| **Idempotent** | Every step checks before acting (already installed → skip) |
| **Dry run** | `--dry-run` flag prints actions without executing |
| **Isolated agents** | One agent's broken config can't affect another |
| **Template tokens** | `{{PROJECT_DIR}}` replaced at scaffold time for dynamic values |

---

## What Each Agent Gets

### MCP Servers

| Agent | Global MCP(s) | Project MCPs |
|-------|---------------|-------------|
| **Claude Code** | sequential-thinking + memory | filesystem + github |
| **Cursor** | fetch | brave-search + git |
| **VS Code** | puppeteer | sqlite + postgres |

### Skills (per project)

| # | Claude Code | Cursor | VS Code |
|---|------------|--------|---------|
| 1 | **api-design** — REST, Zod, rate limiting, OpenAPI | **react-components** — Functional, hooks, lazy loading | **typescript-strict** — Strict config, generics, utility types |
| 2 | **error-handling** — Error classes, tracing, circuit breakers | **tailwind-patterns** — Utility-first, responsive, dark mode | **full-stack-patterns** — Shared types, typed API, e2e safety |
