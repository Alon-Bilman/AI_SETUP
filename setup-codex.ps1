<# 
  setup-codex.ps1 — Set up OpenAI Codex agent in the current project (Windows)
  Run from the root of your project:  .\setup-codex.ps1
#>
$ErrorActionPreference = 'Stop'

# ── 1. Preflight checks ────────────────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  X Node.js is required. Install it from https://nodejs.org" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "  X npm is required (comes with Node.js)." -ForegroundColor Red
    exit 1
}

# ── 2. Install Codex CLI globally ──────────────────────────────────────
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    Write-Host "  > Installing Codex CLI..." -ForegroundColor Cyan
    npm install -g @openai/codex
    if ($LASTEXITCODE -ne 0) { Write-Host "  X npm install failed." -ForegroundColor Red; exit 1 }
    Write-Host "  + Codex CLI installed." -ForegroundColor Green
} else {
    Write-Host "  + Codex CLI already installed." -ForegroundColor Green
}

# ── 3. Write global MCP config (~/.codex/config.toml) ─────────────────
$codexHome = Join-Path $env:USERPROFILE ".codex"
$configPath = Join-Path $codexHome "config.toml"

if (-not (Test-Path $codexHome)) {
    New-Item -ItemType Directory -Path $codexHome -Force | Out-Null
}

$mcpConfig = @'
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.sequential-thinking]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]

[mcp_servers.memory]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-memory"]
'@

if (Test-Path $configPath) {
    Write-Host "  ~ $configPath already exists — appending MCP servers." -ForegroundColor Yellow
    $existing = Get-Content $configPath -Raw
    # Only append sections that aren't already present
    foreach ($section in @('mcp_servers.context7', 'mcp_servers.sequential-thinking', 'mcp_servers.memory')) {
        if ($existing -notmatch [regex]::Escape("[$section]")) {
            $block = ($mcpConfig -split "`n" | 
                Select-String -Pattern "\[$([regex]::Escape($section))\]" -Context 0,2).Line
            # Append the full block
            $startIdx = $mcpConfig.IndexOf("[$section]")
            if ($startIdx -ge 0) {
                $nextSection = $mcpConfig.IndexOf("`n[mcp_servers.", $startIdx + 1)
                if ($nextSection -lt 0) { $nextSection = $mcpConfig.Length }
                $chunk = $mcpConfig.Substring($startIdx, $nextSection - $startIdx).Trim()
                Add-Content -Path $configPath -Value "`n$chunk"
            }
        }
    }
} else {
    Set-Content -Path $configPath -Value $mcpConfig -Encoding UTF8
}
Write-Host "  + Global MCP config written to $configPath" -ForegroundColor Green

# ── 4. Create AGENTS.md in the current project ────────────────────────
$agentsFile = Join-Path (Get-Location) "AGENTS.md"

$agentsContent = @'
# Project Rules — Codex

## Role
You are an autonomous coding agent running in the CLI. You have access to
subagents, skills, MCP servers, and full shell execution within the sandbox.

## Core Principles
- Prioritize correctness, then simplicity, then performance.
- ESM-first: all modules use `import`/`export`, never CommonJS.
- Every new feature must include tests — no exceptions.
- Prefer CLI tools over GUI for all automations.
- Atomic git commits following Conventional Commits format.
- Structured logging only — no string interpolation in log messages.

## Architecture Ownership
- You own the system design: data models, service boundaries, API contracts.
- Design for horizontal scaling from the start.
- Document architectural decisions in `docs/adr/` using the ADR format.
- Prefer composition over inheritance in all designs.

## Codex-Specific Conventions
- Project configuration lives in `.codex/config.toml`.
- Custom subagents are defined in `.codex/agents/*.toml`.
- Command rules are defined in `.codex/rules/*.rules` (Starlark).
- Skills are defined in `.codex/skills/*/SKILL.md`.
- Use `$skill-name` to invoke skills explicitly when the task matches their scope.
- Spawn subagents for parallelizable work (exploration, review, implementation).

## File Structure
- `src/` — source code
- `tests/` — test files (co-located also acceptable)
- `scripts/` — automation and build scripts
- `docs/` — documentation and ADRs

## Before Making Changes
1. Read existing code in the area you are modifying.
2. Check for existing patterns and follow them.
3. Run tests to ensure nothing is broken before and after changes.
'@

if (Test-Path $agentsFile) {
    Write-Host "  ~ AGENTS.md already exists — skipping." -ForegroundColor Yellow
} else {
    Set-Content -Path $agentsFile -Value $agentsContent -Encoding UTF8
    Write-Host "  + Created AGENTS.md" -ForegroundColor Green
}

# ── 5. Launch Codex for authentication ─────────────────────────────────
Write-Host ""
Write-Host "  Setup complete! Run 'codex' to sign in with ChatGPT and start using it." -ForegroundColor Cyan
Write-Host ""
