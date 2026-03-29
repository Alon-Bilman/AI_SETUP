#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  setup.sh — Bootstrap for AI Stack Builder v2                      ║
# ║  Ensures Homebrew + Node exist, then hands off to TypeScript.       ║
# ╚══════════════════════════════════════════════════════════════════════╝
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Ensure Homebrew
if ! command -v brew &>/dev/null; then
    echo "  ▸ Installing Homebrew..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    [ -f /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
    [ -f /usr/local/bin/brew ]   && eval "$(/usr/local/bin/brew shellenv)"
fi

# Ensure Node.js
if ! command -v node &>/dev/null; then
    echo "  ▸ Installing Node.js..."
    brew install node
fi

# Install npm deps & run orchestrator
cd "$SCRIPT_DIR"
npm install --silent 2>/dev/null
npx tsx src/orchestrate.ts "$@"
