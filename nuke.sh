#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  nuke.sh — Bootstrap for AI Stack Teardown v2                      ║
# ║  Ensures Node exists, then hands off to TypeScript.                 ║
# ╚══════════════════════════════════════════════════════════════════════╝
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Node must be present for the teardown script itself
if ! command -v node &>/dev/null; then
    echo "  ✘ Node.js is required to run nuke. Install it first."
    exit 1
fi

cd "$SCRIPT_DIR"
npm install --silent 2>/dev/null
npx tsx src/nuke.ts "$@"
