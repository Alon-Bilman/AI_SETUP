#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  🚀 orchestrate_ai.sh — Zero-to-Hero macOS AI Stack Builder       ║
# ║  Installs: Homebrew, Node LTS, Python 3.12+, Git,                 ║
# ║            Claude Code, Cursor, VS Code                            ║
# ║  Configures: Global Brain MCP, ai-init project scaffolder          ║
# ╚══════════════════════════════════════════════════════════════════════╝
set -euo pipefail

# ─────────────────────────── ANSI Colors ────────────────────────────
readonly RED='\033[1;31m'
readonly GREEN='\033[1;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[1;36m'
readonly MAGENTA='\033[1;35m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly RESET='\033[0m'

# ─────────────────────────── Globals ────────────────────────────────
readonly GLOBAL_DIR="$HOME/AI-Global-Settings"
readonly MEMORY_DIR="$GLOBAL_DIR/memory"
readonly MASTER_MCP="$GLOBAL_DIR/master_mcp.json"
readonly VSCODE_MCP="$GLOBAL_DIR/vscode_mcp.json"
ERRORS_LOG=""

# ─────────────────────────── Utilities ──────────────────────────────

print_header() {
    local emoji="$1" title="$2"
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${CYAN}║${RESET}  ${emoji}  ${BOLD}${title}${RESET}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
}

print_step() {
    echo -e "  ${DIM}▸${RESET} $1"
}

print_success() {
    echo -e "  ${GREEN}✔${RESET} $1"
}

print_error() {
    echo -e "  ${RED}✘${RESET} $1"
}

print_warning() {
    echo -e "  ${YELLOW}⚠${RESET} $1"
}

# Retry a command up to 3 times with exponential backoff.
# On permanent failure, prompt the user to abort or continue.
retry() {
    local max_attempts=3
    local attempt=1
    local delay=2

    while [ "$attempt" -le "$max_attempts" ]; do
        if "$@"; then
            return 0
        fi
        if [ "$attempt" -lt "$max_attempts" ]; then
            print_warning "Attempt $attempt/$max_attempts failed. Retrying in ${delay}s..."
            sleep "$delay"
            delay=$((delay * 2))
        fi
        attempt=$((attempt + 1))
    done

    print_error "Command failed after $max_attempts attempts: $*"
    ask_abort_or_continue "$*"
}

ask_abort_or_continue() {
    local failed_cmd="$1"
    ERRORS_LOG="${ERRORS_LOG}\n  - ${failed_cmd}"
    echo ""
    echo -e "  ${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "  ${RED}│${RESET}  Failed: ${failed_cmd}"
    echo -e "  ${RED}│${RESET}  ${YELLOW}[A]${RESET}bort  or  ${GREEN}[C]${RESET}ontinue?"
    echo -e "  ${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    while true; do
        read -r -p "  > " choice
        case "$choice" in
            [Aa]) echo -e "\n${RED}Aborting.${RESET}"; exit 1 ;;
            [Cc]) print_warning "Continuing despite failure..."; return 0 ;;
            *) echo -e "  Type ${YELLOW}A${RESET} or ${GREEN}C${RESET}" ;;
        esac
    done
}

pause_for_auth() {
    local instruction="$1"
    echo ""
    echo -e "  ${MAGENTA}╔══════════════════════════════════════════════════════════╗${RESET}"
    echo -e "  ${MAGENTA}║${RESET}  🔐  ${BOLD}AUTHENTICATION REQUIRED${RESET}"
    echo -e "  ${MAGENTA}║${RESET}"
    while IFS= read -r line; do
        echo -e "  ${MAGENTA}║${RESET}  $line"
    done <<< "$instruction"
    echo -e "  ${MAGENTA}║${RESET}"
    echo -e "  ${MAGENTA}║${RESET}  Press ${GREEN}ENTER${RESET} when done..."
    echo -e "  ${MAGENTA}╚══════════════════════════════════════════════════════════╝${RESET}"
    read -r
}

# ─────────────────────────── OS Check ───────────────────────────────

if [ "$(uname -s)" != "Darwin" ]; then
    print_error "This script only runs on macOS. Detected: $(uname -s)"
    exit 1
fi

print_header "🚀" "orchestrate_ai.sh — macOS AI Stack Builder"
echo -e "  ${DIM}Date: $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo -e "  ${DIM}User: $(whoami)${RESET}"
echo -e "  ${DIM}macOS: $(sw_vers -productVersion)${RESET}"

# ─────────────────────────── Sudo Upfront ───────────────────────────

print_header "🔑" "Requesting Administrator Privileges"
print_step "Some steps require sudo (managed MCP config)."
sudo -v
# Keep sudo alive in the background
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &
SUDO_PID=$!
trap 'kill "$SUDO_PID" 2>/dev/null || true' EXIT
print_success "Sudo session active."

# ═══════════════════════════════════════════════════════════════════
#  PHASE 1: SMART INSTALLATION
# ═══════════════════════════════════════════════════════════════════

print_header "📦" "PHASE 1 — Smart Installation"

# ── 1.1 Homebrew ──
print_step "Checking Homebrew..."
if ! command -v brew &>/dev/null; then
    print_step "Installing Homebrew..."
    retry bash -c 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    # Add brew to PATH for this session
    if [ -f /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    print_success "Homebrew installed."
else
    print_success "Homebrew already installed."
fi

# ── 1.2 Foundations ──
print_step "Installing foundations (Node.js LTS, Python 3.12+, Git)..."

for pkg in node "python@3.12" git; do
    if brew list "$pkg" &>/dev/null; then
        print_success "$pkg already installed."
    else
        print_step "Installing $pkg..."
        retry brew install "$pkg"
        print_success "$pkg installed."
    fi
done

# ── 1.3 Claude Code ──
print_step "Checking Claude Code..."
if ! command -v claude &>/dev/null; then
    print_step "Installing Claude Code..."
    retry bash -c "curl -fsSL https://claude.ai/install.sh | bash"
    print_success "Claude Code installed."
else
    print_success "Claude Code already installed."
fi

# ── 1.4 Claude Auth Pause ──
print_step "Opening Claude Code login in a new Terminal window..."
osascript -e 'tell application "Terminal" to do script "claude login"' &>/dev/null || true

pause_for_auth "A new Terminal window has been opened with 'claude login'.
Complete the browser-based authentication there.
Return here and press ENTER when login is successful."

# ── 1.5 Cursor & VS Code ──
print_step "Checking Cursor..."
if [ ! -d "/Applications/Cursor.app" ]; then
    print_step "Installing Cursor..."
    retry brew install --cask cursor
    print_success "Cursor installed."
else
    print_success "Cursor already installed."
fi

print_step "Checking Visual Studio Code..."
if [ ! -d "/Applications/Visual Studio Code.app" ]; then
    print_step "Installing Visual Studio Code..."
    retry brew install --cask visual-studio-code
    print_success "VS Code installed."
else
    print_success "VS Code already installed."
fi

# ── 1.6 IDE Auth Pause ──
print_step "Launching Cursor and VS Code for authentication..."
open -a "Cursor" 2>/dev/null || true
open -a "Visual Studio Code" 2>/dev/null || true

pause_for_auth "Both IDEs have been launched.
  1️⃣  In Cursor → Sign in to your Cursor account
  2️⃣  In VS Code → Install the GitHub Copilot extension & sign in
Return here and press ENTER when both are authenticated."

# ═══════════════════════════════════════════════════════════════════
#  PHASE 2: THE GLOBAL BRAIN (MCP HIERARCHY)
# ═══════════════════════════════════════════════════════════════════

print_header "🧠" "PHASE 2 — The Global Brain (MCP Configuration)"

# ── 2.1 Create directories ──
print_step "Creating Global Settings directory..."
if [ ! -d "$GLOBAL_DIR" ]; then
    mkdir -p "$GLOBAL_DIR"
    print_success "Created $GLOBAL_DIR"
else
    print_success "$GLOBAL_DIR already exists."
fi

if [ ! -d "$MEMORY_DIR" ]; then
    mkdir -p "$MEMORY_DIR"
    print_success "Created $MEMORY_DIR"
else
    print_success "$MEMORY_DIR already exists."
fi

# ── 2.2 Generate master_mcp.json (Claude + Cursor format) ──
print_step "Generating master_mcp.json (mcpServers format)..."
cat > "$MASTER_MCP" << 'MCPJSON'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "$HOME/Desktop",
        "$HOME/Documents",
        "$HOME/Projects"
      ]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "$HOME/AI-Global-Settings/memory/memory.json"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
MCPJSON

# Replace $HOME with actual path
sed -i '' "s|\$HOME|$HOME|g" "$MASTER_MCP"
print_success "master_mcp.json generated."

# ── 2.3 Generate vscode_mcp.json (VS Code format) ──
print_step "Generating vscode_mcp.json (servers format)..."
cat > "$VSCODE_MCP" << 'VSCODEJSON'
{
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "$HOME/Desktop",
        "$HOME/Documents",
        "$HOME/Projects"
      ]
    },
    "fetch": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "$HOME/AI-Global-Settings/memory/memory.json"
      }
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
VSCODEJSON

sed -i '' "s|\$HOME|$HOME|g" "$VSCODE_MCP"
print_success "vscode_mcp.json generated."

# ── 2.4 Symlink: Claude global ──
print_step "Linking Claude Code global config..."
ln -sf "$MASTER_MCP" "$HOME/.claude.json"
print_success "~/.claude.json → master_mcp.json"

# ── 2.5 Symlink: Claude managed (sudo) ──
print_step "Linking Claude Code managed config (sudo)..."
sudo mkdir -p "/Library/Application Support/ClaudeCode"
sudo ln -sf "$MASTER_MCP" "/Library/Application Support/ClaudeCode/managed-mcp.json"
print_success "/Library/Application Support/ClaudeCode/managed-mcp.json → master_mcp.json"

# ── 2.6 Symlink: Cursor global ──
print_step "Linking Cursor global config..."
mkdir -p "$HOME/.cursor"
ln -sf "$MASTER_MCP" "$HOME/.cursor/mcp.json"
print_success "~/.cursor/mcp.json → master_mcp.json"

# ── 2.7 Symlink: VS Code user ──
print_step "Linking VS Code user config..."
mkdir -p "$HOME/Library/Application Support/Code/User"
ln -sf "$VSCODE_MCP" "$HOME/Library/Application Support/Code/User/mcp.json"
print_success "~/Library/Application Support/Code/User/mcp.json → vscode_mcp.json"

# ═══════════════════════════════════════════════════════════════════
#  PHASE 3: ai-init SHELL FUNCTION
# ═══════════════════════════════════════════════════════════════════

print_header "🛠️" "PHASE 3 — Injecting ai-init into ~/.zshrc"

AI_INIT_BLOCK='# >>> AI-INIT >>>
# AI project scaffolding function — installed by orchestrate_ai.sh
ai-init() {
    local RED="\033[1;31m" GREEN="\033[1;32m" CYAN="\033[1;36m"
    local MAGENTA="\033[1;35m" BOLD="\033[1m" DIM="\033[2m" RESET="\033[0m"

    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${CYAN}║${RESET}  🛠️  ${BOLD}AI Project Scaffolder${RESET}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}"
    echo ""

    # ── Project name ──
    local project_name
    read -r -p "  Project name: " project_name
    if [ -z "$project_name" ]; then
        echo -e "  ${RED}✘ Project name cannot be empty.${RESET}"
        return 1
    fi

    if [ -d "$project_name" ]; then
        echo -e "  ${RED}✘ Directory '\''$project_name'\'' already exists.${RESET}"
        return 1
    fi

    # ── Mode selection ──
    echo ""
    echo -e "  ${BOLD}Select project mode:${RESET}"
    echo -e "    ${GREEN}1)${RESET} Claude Code  — Autonomous architect (CLI-first)"
    echo -e "    ${GREEN}2)${RESET} Cursor       — UI-first tactician (IDE copilot)"
    echo -e "    ${GREEN}3)${RESET} VS Code      — Copilot-powered (GitHub Copilot)"
    echo ""

    local mode
    while true; do
        read -r -p "  Choice [1/2/3]: " mode
        case "$mode" in
            1|2|3) break ;;
            *) echo -e "  ${RED}Invalid choice. Enter 1, 2, or 3.${RESET}" ;;
        esac
    done

    mkdir -p "$project_name"
    cd "$project_name" || return 1
    echo -e "\n  ${DIM}Created and entered ./$project_name${RESET}\n"

    # ════════════════════════════════════════════════════
    #  HELPER FUNCTIONS
    # ════════════════════════════════════════════════════

    _write_skill() {
        local base_dir="$1" name="$2" content="$3"
        mkdir -p "$base_dir/$name"
        echo "$content" > "$base_dir/$name/SKILL.md"
    }

    _write_rule() {
        local rules_dir="$1" name="$2" content="$3"
        mkdir -p "$rules_dir"
        echo "$content" > "$rules_dir/$name.md"
    }

    # ════════════════════════════════════════════════════════════
    #  OPTION 1: CLAUDE CODE — Autonomous Architect (CLI-first)
    # ════════════════════════════════════════════════════════════
    if [ "$mode" = "1" ]; then
        echo -e "  ${MAGENTA}Scaffolding Claude Code project...${RESET}"

        # ── Main rules file ──
        cat > CLAUDE.md << '\''CLAUDEEOF'\''
# Project Rules — Claude Code

## Role
You are an autonomous architect operating in CLI-first mode.

## Core Principles
- Prioritize correctness, then simplicity, then performance.
- ESM-first: all modules use `import`/`export`, never CommonJS.
- Every new feature must include tests — no exceptions.
- Prefer CLI tools over GUI for all automations.
- Atomic git commits following Conventional Commits format.
- Structured logging only — no string interpolation in log messages.
  Use `log.info("Action completed", { key, value })` not `log.info("Action " + value)`.

## Architecture Ownership
- You own the system design: data models, service boundaries, API contracts.
- Design for horizontal scaling from the start.
- Document architectural decisions in `docs/adr/` using the ADR format.
- Prefer composition over inheritance in all designs.

## File Structure
- `src/` — source code
- `tests/` — test files (co-located also acceptable)
- `scripts/` — automation and build scripts
- `docs/` — documentation and ADRs

## Before Making Changes
1. Read existing code in the area you are modifying.
2. Check for existing patterns and follow them.
3. Run tests to ensure nothing is broken before and after changes.
CLAUDEEOF

        # ── Claude-specific skills ──
        local skills_dir=".claude/skills"
        local rules_dir=".claude/rules"

        _write_skill "$skills_dir" "database-design" "# Database Design

## Description
Schema design, migrations, indexing, and query optimization for relational and document databases.

## Instructions
- Design schemas normalized to 3NF by default; denormalize only with measured performance justification.
- Every table must have a primary key, \`created_at\`, and \`updated_at\` timestamps.
- Use UUID v7 for primary keys (time-sortable) over auto-increment integers.
- Write reversible migrations: every \`up\` must have a corresponding \`down\`.
- Name migrations with timestamps: \`20260101120000_create_users_table.sql\`.
- Add indexes on columns used in WHERE, JOIN, and ORDER BY clauses.
- Use foreign keys with appropriate ON DELETE behavior (CASCADE, SET NULL, RESTRICT).
- Prefer \`BIGINT\` for IDs, \`TEXT\` over \`VARCHAR\` unless length constraints are required.
- Write raw SQL for complex queries; use ORM for simple CRUD.
- Document entity relationships in \`docs/schema.md\` with ER diagrams."

        _write_skill "$skills_dir" "cli-tooling" "# CLI Tooling

## Description
Building robust command-line interfaces — argument parsing, I/O streams, exit codes, and scripting patterns.

## Instructions
- Use a proper argument parser (e.g., \`commander\`, \`yargs\`, \`argparse\`) — never hand-parse \`process.argv\`.
- Support \`--help\` and \`--version\` flags on every CLI tool.
- Use exit codes correctly: 0=success, 1=general error, 2=usage error.
- Write to stdout for data output, stderr for status/progress/errors.
- Support piping: accept stdin when no file argument is given.
- Use spinners/progress bars for long operations (e.g., \`ora\`, \`cli-progress\`).
- Provide \`--json\` flag for machine-readable output alongside human-readable default.
- Gracefully handle SIGINT (Ctrl+C) — clean up temp files and connections.
- Validate all input arguments before starting work; fail fast with clear messages.
- Add shell completion scripts for common shells (bash, zsh, fish)."

        _write_skill "$skills_dir" "api-design" "# API Design (Backend)

## Description
RESTful and GraphQL API design with focus on backend architecture, validation, and security.

## Instructions
- Use plural nouns for REST endpoints: \`/users\`, \`/orders\`.
- HTTP verbs map to CRUD: GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove.
- Validate all input at the API boundary using schema validation (e.g., Zod, Joi).
- Return consistent response shapes: \`{ \"data\": ..., \"error\": null }\`.
- Use proper HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 422, 500.
- Version APIs in the URL path: \`/api/v1/users\`.
- Implement rate limiting, request size limits, and timeout policies.
- Use middleware for cross-cutting concerns (auth, logging, CORS).
- Paginate list endpoints with cursor-based pagination for large datasets.
- Generate OpenAPI/Swagger specs from code annotations."

        _write_skill "$skills_dir" "error-handling" "# Error Handling (Backend)

## Description
Server-side error classes, structured logging, recovery strategies, and observability.

## Instructions
- Create custom error classes: \`AppError\`, \`ValidationError\`, \`NotFoundError\`, \`AuthError\`.
- Each error class must have a \`code\` (machine-readable), \`message\` (human-readable), and \`statusCode\`.
- Only try/catch at system boundaries: HTTP handlers, queue consumers, CLI entry points.
- Never swallow errors silently. Always log or re-throw.
- Use structured logging: \`log.error(\"Payment failed\", { orderId, amount, reason })\` — no string interpolation.
- Distinguish operational errors (handle gracefully) from programmer errors (crash fast).
- Implement a global error handler middleware that maps error codes to HTTP responses.
- Add request-id tracing: generate a unique ID per request, propagate through all log entries.
- Use circuit breakers for external service calls (e.g., \`opossum\`).
- Set up health check endpoints (\`/health\`, \`/ready\`) for monitoring."

        _write_skill "$skills_dir" "git-conventions" "# Git Conventions

## Description
Conventional commits, branching strategy, and PR workflow for backend/infrastructure projects.

## Instructions
- Use Conventional Commits: \`type(scope): description\` — e.g., \`feat(api): add user endpoint\`.
- Types: \`feat\`, \`fix\`, \`docs\`, \`refactor\`, \`test\`, \`chore\`, \`perf\`, \`ci\`.
- Keep commits atomic — one logical change per commit.
- Write imperative mood: \"add feature\" not \"added feature\".
- Branch naming: \`type/short-description\` — e.g., \`feat/user-auth\`, \`fix/db-connection\`.
- Main branch is always deployable. Never push directly to main.
- Squash-merge feature branches to keep main history clean.
- PR descriptions must include: what changed, why, migration steps, how to test.
- Tag releases with semver: \`v1.2.3\`. Use \`CHANGELOG.md\` generated from commits.
- Delete branches after merge."

        # ── Claude-specific rules ──
        _write_rule "$rules_dir" "code-style" "# Code Style — Backend / Architecture

- Use \`camelCase\` for variables/functions, \`PascalCase\` for classes, \`UPPER_SNAKE\` for constants.
- One module per file. Name files after their primary export in kebab-case.
- Order imports: Node builtins → external packages → internal modules → relative imports.
- Separate import groups with blank lines.
- Maximum line length: 100 characters.
- Use TypeScript strict mode (\`\"strict\": true\`) for all projects.
- Prefer \`const\` over \`let\`. Never use \`var\`.
- Use async/await over raw Promises. Never mix callbacks and promises.
- Prefer pure functions and immutable data. Avoid side effects in business logic.
- All environment variables accessed through a single validated config module."

        _write_rule "$rules_dir" "testing" "# Testing Rules — Backend

- Every PR must include tests for new or changed behavior.
- Minimum 80% line coverage on new code; 100% on critical paths (auth, payments, data mutations).
- Test files live next to their source: \`service.ts\` → \`service.test.ts\`.
- Unit tests: isolate functions, mock external dependencies, test edge cases and error paths.
- Integration tests: test real database operations, HTTP endpoints, and message queues with fixtures.
- Use \`beforeEach\`/\`afterEach\` for setup/teardown — never leak state between tests.
- CI must run the full suite — PRs cannot merge with failing tests.
- Load tests for critical endpoints before major releases.
- Flaky tests must be fixed or quarantined within 24 hours."

        _write_rule "$rules_dir" "git-conventions" "# Git Conventions Rules

- All commits follow Conventional Commits format.
- No direct pushes to the main branch — all changes via PR.
- PRs require at least one approval before merge.
- Squash-merge feature branches into main.
- Branch names follow \`type/short-description\` pattern.
- Include migration instructions in PR description when applicable.
- Delete merged branches promptly."

        # ── Project MCP ──
        local project_dir
        project_dir="$(pwd)"
        cat > .mcp.json << MCPEOF
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "$project_dir"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
MCPEOF
        print_success "Claude Code project scaffolded."

    # ════════════════════════════════════════════════════════════
    #  OPTION 2: CURSOR — UI-First Tactician (IDE Copilot)
    # ════════════════════════════════════════════════════════════
    elif [ "$mode" = "2" ]; then
        echo -e "  ${MAGENTA}Scaffolding Cursor project...${RESET}"

        # ── Main rules file ──
        cat > .cursorrules << '\''CURSOREOF'\''
# Project Rules — Cursor

## Role
You are a UI-first implementation copilot with real-time pair programming focus.

## Core Principles
- Tailwind CSS utility-first: avoid custom CSS unless absolutely necessary.
- React: functional components and hooks only — no class components.
- Accessibility: WCAG 2.1 AA compliance, semantic HTML, ARIA labels where needed.
- Provide real-time explanations: when suggesting code, explain trade-offs inline.
- Structured logging only — no string interpolation in log messages.
  Use `log.info("Action completed", { key, value })` not `log.info("Action " + value)`.

## Component Conventions
- One component per file, named with PascalCase matching the filename.
- Props interfaces defined above the component.
- Hooks extracted to `use<Name>.ts` files when reused across components.
- State management: prefer local state → context → external store (escalate only when needed).

## Before Making Changes
1. Check existing components for patterns — reuse, don'\''t reinvent.
2. Verify accessibility with semantic HTML before adding ARIA attributes.
3. Test UI changes across viewport sizes (mobile, tablet, desktop).
CURSOREOF

        # ── Cursor-specific skills ──
        local skills_dir=".cursor/skills"
        local rules_dir=".cursor/rules"

        _write_skill "$skills_dir" "react-components" "# React Components

## Description
Modern React component architecture — functional components, hooks, composition, and performance.

## Instructions
- Always use functional components with hooks. Never use class components.
- Define a TypeScript \`Props\` interface above each component.
- Use \`React.FC<Props>\` or explicit return types — never untyped components.
- Prefer composition over prop drilling: use children, render props, or compound components.
- Extract hooks into \`use<Name>.ts\` when logic is reused across 2+ components.
- Use \`React.memo()\` only when profiling shows unnecessary re-renders — never preemptively.
- Lazy-load heavy components with \`React.lazy()\` + \`Suspense\`.
- Keep components under 150 lines. Extract sub-components when complexity grows.
- Use \`key\` props correctly in lists — never use array index for dynamic lists.
- Co-locate component, styles, tests, and stories in the same directory."

        _write_skill "$skills_dir" "tailwind-patterns" "# Tailwind Patterns

## Description
Utility-first CSS with Tailwind — responsive design, custom configuration, and component styling.

## Instructions
- Use Tailwind utility classes directly in JSX. Avoid custom CSS files unless truly necessary.
- Responsive design: mobile-first with breakpoint prefixes (\`sm:\`, \`md:\`, \`lg:\`, \`xl:\`).
- Group related utilities logically: layout → spacing → typography → colors → effects.
- Extract repeated class combinations into components, not \`@apply\` directives.
- Use \`cn()\` or \`clsx()\` for conditional class merging — never string concatenation.
- Customize the Tailwind config for brand colors, fonts, and spacing scale — use semantic names.
- Use \`dark:\` variant for dark mode. Design light mode first.
- Prefer \`gap\` over margins for flex/grid spacing.
- Use Tailwind\`s built-in animations (\`animate-spin\`, \`animate-pulse\`) before custom keyframes.
- Keep the purge config accurate to minimize CSS bundle size."

        _write_skill "$skills_dir" "accessibility" "# Accessibility

## Description
WCAG 2.1 AA compliance — semantic HTML, ARIA attributes, keyboard navigation, and screen reader support.

## Instructions
- Use semantic HTML elements: \`<nav>\`, \`<main>\`, \`<article>\`, \`<button>\`, \`<a>\` — not \`<div>\` for everything.
- Every interactive element must be keyboard-accessible (Tab, Enter, Space, Escape).
- Every \`<img>\` must have an \`alt\` attribute. Decorative images use \`alt=\"\"\`.
- Form inputs must have associated \`<label>\` elements (not just placeholder text).
- Use ARIA attributes only when semantic HTML is insufficient. Prefer native elements.
- Color contrast must meet WCAG AA: 4.5:1 for text, 3:1 for large text and UI components.
- Manage focus: move focus to modals on open, return to trigger on close.
- Use \`aria-live\` regions for dynamic content updates (toasts, loading states).
- Test with screen readers (VoiceOver on macOS) and keyboard-only navigation.
- Run automated checks with \`axe-core\` or \`eslint-plugin-jsx-a11y\` in CI."

        _write_skill "$skills_dir" "state-management" "# State Management

## Description
Frontend state architecture — local state, context, external stores, and data flow patterns.

## Instructions
- Start with local state (\`useState\`). Escalate only when state is shared across distant components.
- Use \`useReducer\` for complex local state with multiple related values.
- React Context for low-frequency global state (theme, auth, locale) — never for high-frequency updates.
- For server state (API data): use TanStack Query (React Query) — never manual \`useEffect\` + \`fetch\`.
- For complex client state: use Zustand (simple) or Jotai (atomic) — avoid Redux unless already in use.
- Never duplicate server state in client stores. Let the cache be the source of truth.
- Derive computed values with \`useMemo\` — don'\''t store calculated state.
- Use optimistic updates for better UX on mutations.
- Keep state as close to where it'\''s used as possible — avoid global state hoisting.
- Type all state shapes with TypeScript interfaces."

        _write_skill "$skills_dir" "git-conventions" "# Git Conventions

## Description
Conventional commits and workflow for frontend/UI projects.

## Instructions
- Use Conventional Commits: \`type(scope): description\` — e.g., \`feat(ui): add modal component\`.
- Types: \`feat\`, \`fix\`, \`style\`, \`refactor\`, \`test\`, \`chore\`, \`perf\`, \`docs\`.
- Keep commits atomic — one component or feature per commit.
- Write imperative mood: \"add button\" not \"added button\".
- Branch naming: \`type/short-description\` — e.g., \`feat/login-modal\`, \`fix/nav-overflow\`.
- Include before/after screenshots in PR descriptions for visual changes.
- Main branch is always deployable. All changes via PR.
- Squash-merge feature branches to keep main history clean.
- Tag releases with semver. Update \`CHANGELOG.md\` from commits.
- Delete branches after merge."

        # ── Cursor-specific rules ──
        _write_rule "$rules_dir" "code-style" "# Code Style — Frontend / UI

- Use \`PascalCase\` for components and types, \`camelCase\` for variables/hooks, \`UPPER_SNAKE\` for constants.
- One component per file. Filename matches component name: \`UserCard.tsx\`.
- Order imports: React → external packages → internal components → hooks → utils → types → styles.
- Separate import groups with blank lines.
- Maximum line length: 100 characters. Break JSX props onto separate lines when >3 props.
- Use TypeScript strict mode. Define prop interfaces above each component.
- Prefer \`const\` + arrow functions for components: \`const Button: React.FC<Props> = () => {}\`.
- Use Tailwind utility classes. Avoid inline \`style={{}}]\` unless dynamic values are required.
- Group Tailwind classes: layout → spacing → typography → colors → effects.
- No unused imports, variables, or props — enforce with ESLint."

        _write_rule "$rules_dir" "testing" "# Testing Rules — Frontend

- Every PR with UI changes must include component tests.
- Test user behavior, not implementation: use \`@testing-library/react\` and query by role/text.
- Avoid testing internal state or implementation details.
- Snapshot tests only for stable, rarely-changed components (icons, layout shells).
- Test keyboard navigation and screen reader interactions for interactive components.
- Test responsive behavior at key breakpoints (mobile: 375px, tablet: 768px, desktop: 1280px).
- Mock API calls with MSW (Mock Service Worker) — never mock fetch/axios directly.
- Integration tests for critical user flows (signup, checkout, search).
- Visual regression tests for design-system components.
- CI must pass before merge. Flaky tests quarantined within 24 hours."

        _write_rule "$rules_dir" "git-conventions" "# Git Conventions Rules

- All commits follow Conventional Commits format.
- No direct pushes to the main branch — all changes via PR.
- PRs require at least one approval before merge.
- PRs for visual changes must include before/after screenshots.
- Squash-merge feature branches into main.
- Branch names follow \`type/short-description\` pattern.
- Delete merged branches promptly."

        # ── Project MCP ──
        local project_dir
        project_dir="$(pwd)"
        cat > .cursor/mcp.json << MCPEOF
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "$project_dir"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
MCPEOF
        print_success "Cursor project scaffolded."

    # ════════════════════════════════════════════════════════════
    #  OPTION 3: VS CODE — Copilot Full-Stack Assistant
    # ════════════════════════════════════════════════════════════
    elif [ "$mode" = "3" ]; then
        echo -e "  ${MAGENTA}Scaffolding VS Code (Copilot) project...${RESET}"

        # ── Main rules file ──
        mkdir -p .github
        cat > .github/copilot-instructions.md << '\''VSCEOF'\''
# Project Rules — VS Code (GitHub Copilot)

## Role
You are a Copilot-powered full-stack coding assistant with workspace-wide awareness.

## Core Principles
- Follow existing codebase patterns — read before writing.
- ESM-first: all modules use `import`/`export`.
- TypeScript strict mode for all new code — no `any` unless absolutely justified.
- Generate tests alongside every new feature.
- Structured logging only — no string interpolation in log messages.
  Use `log.info("Action completed", { key, value })` not `log.info("Action " + value)`.

## Full-Stack Guidance
- Maintain strict separation between frontend and backend code.
- Shared types live in a `shared/` or `types/` package — imported by both sides.
- API contracts defined as TypeScript interfaces shared between client and server.
- Frontend calls backend through a typed API client, never raw fetch.

## Copilot-Specific Behavior
- When generating code, prefer explicit types over `any`.
- Suggest imports automatically when referencing new modules.
- For multi-file changes, explain the dependency order.
- Always consider edge cases and error paths in generated code.

## File Structure
- `src/` — source code (or `packages/` for monorepos)
- `tests/` — test files (co-located also acceptable)
- `scripts/` — automation scripts
- `docs/` — documentation
VSCEOF

        # ── VS Code / Copilot-specific skills ──
        local skills_dir=".copilot/skills"
        local rules_dir=".copilot/rules"

        _write_skill "$skills_dir" "typescript-strict" "# TypeScript Strict Mode

## Description
Advanced TypeScript patterns — strict configuration, type narrowing, generics, and utility types.

## Instructions
- Enable all strict flags: \`strict\`, \`noUncheckedIndexedAccess\`, \`exactOptionalPropertyTypes\`.
- Never use \`any\`. Use \`unknown\` for truly unknown types and narrow with type guards.
- Prefer \`interface\` for object shapes, \`type\` for unions, intersections, and mapped types.
- Use discriminated unions for state machines and variant types.
- Write custom type guards (\`is\` keyword) for runtime type narrowing.
- Use \`satisfies\` operator to validate types without widening.
- Prefer \`readonly\` arrays and properties for immutable data.
- Use template literal types for string pattern validation.
- Generic constraints: always add \`extends\` bounds — never unbounded generics.
- Leverage utility types: \`Partial\`, \`Required\`, \`Pick\`, \`Omit\`, \`Record\`, \`Extract\`, \`Exclude\`."

        _write_skill "$skills_dir" "esm-modules" "# ESM Modules

## Description
ECMAScript Modules — the standard JavaScript module system for full-stack TypeScript projects.

## Instructions
- Always use \`import\`/\`export\` syntax. Never use \`require()\` or \`module.exports\`.
- Set \`\"type\": \"module\"\` in package.json for all new projects.
- Include \`.js\` extensions in relative import paths (required by ESM even for .ts source).
- Use dynamic \`import()\` for code splitting — frontend lazy routes and backend optional deps.
- Prefer named exports for better refactoring and tree-shaking support.
- In monorepos, use workspace package imports (\`@project/shared\`) over relative paths across packages.
- Use top-level \`await\` in scripts and server entry points.
- For dual CJS/ESM packages, use the \`\"exports\"\` field with conditional exports.
- Configure path aliases in \`tsconfig.json\` for clean imports: \`@/components\`, \`@/utils\`.
- Ensure bundler (Vite, esbuild) and Node.js agree on module resolution settings."

        _write_skill "$skills_dir" "full-stack-patterns" "# Full-Stack Patterns

## Description
Frontend-backend coordination — API contracts, shared types, monorepo structure, and data flow.

## Instructions
- Define API contracts as TypeScript interfaces in a shared package: \`@project/types\`.
- Both frontend and backend import the same request/response types — single source of truth.
- Use a typed API client (generated or hand-written) on the frontend — never raw \`fetch\`.
- Validate API inputs on the server with the same schema used to generate TypeScript types (e.g., Zod).
- Monorepo structure: \`packages/frontend\`, \`packages/backend\`, \`packages/shared\`.
- Environment variables: validate at startup with a schema, fail fast on missing values.
- Database types generated from schema (e.g., Prisma, Drizzle) and mapped to API types explicitly.
- Use end-to-end type safety: DB schema → server types → API contract → client types.
- WebSocket/SSE events typed with shared event maps.
- Feature flags shared between frontend and backend via a common config."

        _write_skill "$skills_dir" "error-handling" "# Error Handling (Full-Stack)

## Description
Error handling across the full stack — React error boundaries, server error classes, and structured logging.

## Instructions
- Frontend: wrap route-level components in React Error Boundaries with fallback UI.
- Frontend: use \`try/catch\` in async event handlers; show user-friendly toast/alert on failure.
- Frontend: never show raw error messages or stack traces to users.
- Backend: create custom error classes: \`AppError\`, \`ValidationError\`, \`NotFoundError\`.
- Backend: global error handler middleware maps error classes to HTTP status codes.
- Both: structured logging — \`log.error(\"Action failed\", { context })\` — no string interpolation.
- Both: add request-id tracing that flows from frontend → API → backend → logs.
- Backend: distinguish operational errors (handle) from programmer errors (crash + alert).
- Frontend: retry failed API calls with exponential backoff for transient errors.
- Both: centralize error types in the shared package so frontend can switch on error codes."

        _write_skill "$skills_dir" "git-conventions" "# Git Conventions

## Description
Conventional commits and workflow for full-stack TypeScript monorepo projects.

## Instructions
- Use Conventional Commits: \`type(scope): description\` — e.g., \`feat(api): add auth endpoint\`.
- Scopes match package names: \`frontend\`, \`backend\`, \`shared\`, \`infra\`.
- Types: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`test\`, \`chore\`, \`perf\`, \`ci\`.
- Keep commits atomic — one logical change per commit.
- Write imperative mood: \"add feature\" not \"added feature\".
- Branch naming: \`type/scope-description\` — e.g., \`feat/backend-auth\`, \`fix/frontend-nav\`.
- Main branch is always deployable. All changes via PR.
- Squash-merge feature branches into main.
- PRs that touch both frontend and backend must describe the coordination.
- Tag releases with semver per package in monorepo. Maintain per-package changelogs."

        # ── VS Code / Copilot-specific rules ──
        _write_rule "$rules_dir" "code-style" "# Code Style — Full-Stack TypeScript

- Use \`camelCase\` for variables/functions, \`PascalCase\` for components/classes/types, \`UPPER_SNAKE\` for constants.
- Backend files: kebab-case (\`user-service.ts\`). Frontend files: PascalCase for components (\`UserCard.tsx\`), camelCase for hooks/utils.
- Order imports: Node builtins → external packages → workspace packages (@project/) → relative imports.
- Separate import groups with blank lines.
- Maximum line length: 100 characters.
- TypeScript strict mode (\`\"strict\": true\`) in all \`tsconfig.json\` files.
- Prefer \`const\` over \`let\`. Never use \`var\`. Never use \`any\`.
- Shared types in \`packages/shared/\` — both frontend and backend import from there.
- All environment variables accessed through a single validated config module per package.
- Prefer functional patterns: pure functions, immutable data, explicit data flow."

        _write_rule "$rules_dir" "testing" "# Testing Rules — Full-Stack

- Every PR must include tests for new or changed behavior on both frontend and backend.
- Backend unit tests: isolate business logic, mock I/O (DB, HTTP, filesystem).
- Backend integration tests: test real endpoint behavior with test database fixtures.
- Frontend component tests: test user behavior with \`@testing-library/react\` — query by role/text.
- Frontend: mock API calls with MSW (Mock Service Worker).
- E2E tests for critical user flows that span frontend → API → database.
- Minimum 80% line coverage on new code. Critical paths (auth, payments): 100%.
- Test files co-located: \`module.ts\` → \`module.test.ts\`.
- CI runs full test suite for all packages — PRs cannot merge with failures.
- Flaky tests fixed or quarantined within 24 hours."

        _write_rule "$rules_dir" "git-conventions" "# Git Conventions Rules

- All commits follow Conventional Commits format with package-scoped scopes.
- No direct pushes to the main branch — all changes via PR.
- PRs require at least one approval before merge.
- PRs touching multiple packages must describe cross-package impact.
- Squash-merge feature branches into main.
- Branch names follow \`type/scope-description\` pattern.
- Delete merged branches promptly."

        # ── Project MCP (VS Code format) ──
        mkdir -p .vscode
        local project_dir
        project_dir="$(pwd)"
        cat > .vscode/mcp.json << MCPEOF
{
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "$project_dir"]
    },
    "fetch": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
MCPEOF
        print_success "VS Code (Copilot) project scaffolded."
    fi

    echo ""
    echo -e "  ${GREEN}╔══════════════════════════════════════════════════════════╗${RESET}"
    echo -e "  ${GREEN}║${RESET}  ✅  ${BOLD}Project '\''$project_name'\'' is ready!${RESET}"
    echo -e "  ${GREEN}╚══════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "  ${DIM}Run '\''tree -a -I node_modules'\'' to see the scaffold.${RESET}"
}
# <<< AI-INIT <<<'

# ── Inject into ~/.zshrc ──
ZSHRC="$HOME/.zshrc"
if [ ! -f "$ZSHRC" ]; then
    touch "$ZSHRC"
fi

if grep -q '# >>> AI-INIT >>>' "$ZSHRC"; then
    print_step "Replacing existing ai-init in ~/.zshrc..."
    # Remove old block and re-inject
    sed -i '' '/# >>> AI-INIT >>>/,/# <<< AI-INIT <<</d' "$ZSHRC"
fi

print_step "Injecting ai-init function into ~/.zshrc..."
echo "" >> "$ZSHRC"
echo "$AI_INIT_BLOCK" >> "$ZSHRC"
print_success "ai-init function injected into ~/.zshrc"

# Also inject into ~/.bashrc if it exists
BASHRC="$HOME/.bashrc"
if [ -f "$BASHRC" ]; then
    if grep -q '# >>> AI-INIT >>>' "$BASHRC"; then
        sed -i '' '/# >>> AI-INIT >>>/,/# <<< AI-INIT <<</d' "$BASHRC"
    fi
    echo "" >> "$BASHRC"
    echo "$AI_INIT_BLOCK" >> "$BASHRC"
    print_success "ai-init function also injected into ~/.bashrc"
fi

# ═══════════════════════════════════════════════════════════════════
#  SUMMARY
# ═══════════════════════════════════════════════════════════════════

print_header "🎉" "SETUP COMPLETE"

echo -e "  ${BOLD}Installed:${RESET}"
echo -e "    ✔ Homebrew"
echo -e "    ✔ Node.js (LTS)"
echo -e "    ✔ Python 3.12+"
echo -e "    ✔ Git"
echo -e "    ✔ Claude Code"
echo -e "    ✔ Cursor"
echo -e "    ✔ Visual Studio Code"
echo ""
echo -e "  ${BOLD}Configured:${RESET}"
echo -e "    ✔ Global Brain MCP → ~/AI-Global-Settings/"
echo -e "    ✔ Claude Code global config → ~/.claude.json"
echo -e "    ✔ Claude Code managed config → /Library/Application Support/ClaudeCode/"
echo -e "    ✔ Cursor global config → ~/.cursor/mcp.json"
echo -e "    ✔ VS Code user config → ~/Library/Application Support/Code/User/mcp.json"
echo -e "    ✔ ai-init function → ~/.zshrc"
echo ""
echo -e "  ${BOLD}Next Steps:${RESET}"
echo -e "    1. Open a new terminal (or run: ${CYAN}source ~/.zshrc${RESET})"
echo -e "    2. Navigate to where you want your project"
echo -e "    3. Run: ${CYAN}ai-init${RESET}"
echo ""

if [ -n "$ERRORS_LOG" ]; then
    echo -e "  ${YELLOW}⚠ Some steps had issues:${RESET}"
    echo -e "$ERRORS_LOG"
    echo ""
fi

echo -e "  ${DIM}orchestrate_ai.sh finished at $(date '+%H:%M:%S')${RESET}"
echo ""
