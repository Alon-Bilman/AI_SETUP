#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  🧹 nuke_ai.sh — Complete AI Stack Teardown                       ║
# ║  Removes: Claude Code, Cursor, VS Code,                          ║
# ║           Node, Python, Git, Homebrew, ai-init, all configs        ║
# ╚══════════════════════════════════════════════════════════════════════╝
set -euo pipefail

# ─────────────────────────── ANSI Colors ────────────────────────────
readonly RED='\033[1;31m'
readonly GREEN='\033[1;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[1;36m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly RESET='\033[0m'

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

print_warning() {
    echo -e "  ${YELLOW}⚠${RESET} $1"
}

print_error() {
    echo -e "  ${RED}✘${RESET} $1"
}

# Safely remove a file or directory. Logs but does not fail.
safe_rm() {
    local target="$1"
    if [ -L "$target" ]; then
        rm -f "$target"
        print_success "Removed symlink: $target"
    elif [ -f "$target" ]; then
        rm -f "$target"
        print_success "Removed file: $target"
    elif [ -d "$target" ]; then
        rm -rf "$target"
        print_success "Removed directory: $target"
    else
        print_step "Already absent: $target"
    fi
}

sudo_safe_rm() {
    local target="$1"
    if [ -L "$target" ] || [ -f "$target" ]; then
        sudo rm -f "$target"
        print_success "Removed (sudo): $target"
    elif [ -d "$target" ]; then
        sudo rm -rf "$target"
        print_success "Removed directory (sudo): $target"
    else
        print_step "Already absent: $target"
    fi
}

# ─────────────────────────── OS Check ───────────────────────────────

if [ "$(uname -s)" != "Darwin" ]; then
    print_error "This script only runs on macOS. Detected: $(uname -s)"
    exit 1
fi

print_header "🧹" "nuke_ai.sh — Complete AI Stack Teardown"
echo -e "  ${DIM}Date: $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo -e "  ${DIM}User: $(whoami)${RESET}"
echo ""

# ─────────────────────────── Safety Gate ────────────────────────────

echo -e "  ${RED}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "  ${RED}║${RESET}  ⚠️   ${BOLD}WARNING: DESTRUCTIVE OPERATION${RESET}"
echo -e "  ${RED}║${RESET}"
echo -e "  ${RED}║${RESET}  This will permanently remove:"
echo -e "  ${RED}║${RESET}    • Claude Code, Cursor, VS Code"
echo -e "  ${RED}║${RESET}    • All global MCP configs"
echo -e "  ${RED}║${RESET}    • ai-init function from ~/.zshrc"
echo -e "  ${RED}║${RESET}    • Node.js, Python 3.12, Git"
echo -e "  ${RED}║${RESET}    • Homebrew"
echo -e "  ${RED}║${RESET}"
echo -e "  ${RED}║${RESET}  Type ${BOLD}NUKE${RESET} to confirm, anything else to abort."
echo -e "  ${RED}╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
read -r -p "  > " confirm

if [ "$confirm" != "NUKE" ]; then
    echo -e "\n  ${GREEN}Aborted. Nothing was changed.${RESET}\n"
    exit 0
fi

# ─────────────────────────── Sudo Upfront ───────────────────────────

print_header "🔑" "Requesting Administrator Privileges"
sudo -v
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &
SUDO_PID=$!
trap 'kill "$SUDO_PID" 2>/dev/null || true' EXIT
print_success "Sudo session active."

# ═══════════════════════════════════════════════════════════════════
#  STEP 1: QUIT RUNNING APPS
# ═══════════════════════════════════════════════════════════════════

print_header "🛑" "STEP 1 — Quitting Running Applications"

for app in "Cursor" "Visual Studio Code"; do
    if pgrep -xq "$app" 2>/dev/null || pgrep -f "$app" &>/dev/null; then
        print_step "Quitting $app..."
        osascript -e "tell application \"$app\" to quit" 2>/dev/null || true
        sleep 1
        print_success "$app quit."
    else
        print_step "$app is not running."
    fi
done

# ═══════════════════════════════════════════════════════════════════
#  STEP 2: UNINSTALL CLAUDE CODE
# ═══════════════════════════════════════════════════════════════════

print_header "🗑️" "STEP 2 — Uninstalling Claude Code"

if command -v claude &>/dev/null; then
    print_step "Removing Claude Code binary..."
    # Try the official uninstall first
    claude uninstall 2>/dev/null || true
    # Remove binary if still present
    local_claude="$(command -v claude 2>/dev/null || true)"
    if [ -n "$local_claude" ]; then
        safe_rm "$local_claude"
    fi
    print_success "Claude Code uninstalled."
else
    print_step "Claude Code not found — skipping."
fi

# Remove Claude binary from ~/.local/bin if still present
safe_rm "$HOME/.local/bin/claude"

# Remove Claude config files
print_step "Removing Claude Code configs..."
safe_rm "$HOME/.claude.json"
safe_rm "$HOME/.claude"
sudo_safe_rm "/Library/Application Support/ClaudeCode"
print_success "Claude Code configs removed."

# ═══════════════════════════════════════════════════════════════════
#  STEP 3: UNINSTALL CURSOR
# ═══════════════════════════════════════════════════════════════════

print_header "🗑️" "STEP 3 — Uninstalling Cursor"

if command -v brew &>/dev/null && brew list --cask cursor &>/dev/null 2>&1; then
    print_step "Uninstalling Cursor via Homebrew..."
    brew uninstall --cask cursor 2>/dev/null || true
    print_success "Cursor cask uninstalled."
else
    print_step "Cursor cask not found in Homebrew — skipping."
fi

# Remove app bundle if still present
if [ -d "/Applications/Cursor.app" ]; then
    print_step "Removing /Applications/Cursor.app..."
    safe_rm "/Applications/Cursor.app"
fi

# Remove Cursor configs
print_step "Removing Cursor configs..."
safe_rm "$HOME/.cursor"
safe_rm "$HOME/Library/Application Support/Cursor"
safe_rm "$HOME/Library/Caches/Cursor"
safe_rm "$HOME/Library/Preferences/com.cursor.Cursor.plist"
safe_rm "$HOME/Library/Saved Application State/com.cursor.Cursor.savedState"
print_success "Cursor configs removed."

# ═══════════════════════════════════════════════════════════════════
#  STEP 4: UNINSTALL VS CODE
# ═══════════════════════════════════════════════════════════════════

print_header "🗑️" "STEP 4 — Uninstalling Visual Studio Code"

if command -v brew &>/dev/null && brew list --cask visual-studio-code &>/dev/null 2>&1; then
    print_step "Uninstalling VS Code via Homebrew..."
    brew uninstall --cask visual-studio-code 2>/dev/null || true
    print_success "VS Code cask uninstalled."
else
    print_step "VS Code cask not found in Homebrew — skipping."
fi

# Remove app bundle if still present
if [ -d "/Applications/Visual Studio Code.app" ]; then
    print_step "Removing /Applications/Visual Studio Code.app..."
    safe_rm "/Applications/Visual Studio Code.app"
fi

# Remove VS Code configs
print_step "Removing VS Code configs..."
safe_rm "$HOME/Library/Application Support/Code"
safe_rm "$HOME/Library/Caches/com.microsoft.VSCode"
safe_rm "$HOME/Library/Preferences/com.microsoft.VSCode.plist"
safe_rm "$HOME/Library/Saved Application State/com.microsoft.VSCode.savedState"
safe_rm "$HOME/.vscode"
print_success "VS Code configs removed."

# ═══════════════════════════════════════════════════════════════════
#  STEP 5: REMOVE GLOBAL MCP CONFIGS
# ═══════════════════════════════════════════════════════════════════

print_header "🔗" "STEP 5 — Removing Global MCP Configs"

safe_rm "$HOME/.claude.json"
safe_rm "$HOME/.claude"
safe_rm "$HOME/.cursor/mcp.json"
safe_rm "$HOME/Library/Application Support/Code/User/mcp.json"
sudo_safe_rm "/Library/Application Support/ClaudeCode/managed-mcp.json"
sudo_safe_rm "/Library/Application Support/ClaudeCode"
print_success "All global MCP configs removed."

# ═══════════════════════════════════════════════════════════════════
#  STEP 6: SCRUB ai-init FROM SHELL CONFIGS
# ═══════════════════════════════════════════════════════════════════

print_header "📝" "STEP 6 — Scrubbing ai-init from Shell Configs"

for rcfile in "$HOME/.zshrc" "$HOME/.bashrc"; do
    if [ -f "$rcfile" ]; then
        if grep -q '# >>> AI-INIT >>>' "$rcfile"; then
            print_step "Removing ai-init block from $rcfile..."
            sed -i '' '/# >>> AI-INIT >>>/,/# <<< AI-INIT <<</d' "$rcfile"
            # Remove any trailing blank lines left behind
            sed -i '' -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$rcfile" 2>/dev/null || true
            print_success "ai-init removed from $rcfile"
        else
            print_step "No ai-init block found in $rcfile"
        fi
        # Remove the ~/.local/bin PATH export added by orchestrate_ai.sh
        if grep -qF 'export PATH="$HOME/.local/bin:$PATH"' "$rcfile"; then
            print_step "Removing ~/.local/bin PATH export from $rcfile..."
            sed -i '' '/export PATH="\$HOME\/.local\/bin:\$PATH"/d' "$rcfile"
            print_success "PATH export removed from $rcfile"
        fi
    else
        print_step "$rcfile does not exist — skipping."
    fi
done

# ═══════════════════════════════════════════════════════════════════
#  STEP 7: UNINSTALL FOUNDATIONS
# ═══════════════════════════════════════════════════════════════════

print_header "📦" "STEP 7 — Uninstalling Foundations"

if command -v brew &>/dev/null; then
    for pkg in node "python@3.12" git; do
        if brew list "$pkg" &>/dev/null 2>&1; then
            print_step "Uninstalling $pkg..."
            brew uninstall --ignore-dependencies "$pkg" 2>/dev/null || true
            print_success "$pkg uninstalled."
        else
            print_step "$pkg not installed via Homebrew — skipping."
        fi
    done
else
    print_warning "Homebrew not found — skipping foundation uninstalls."
fi

# ═══════════════════════════════════════════════════════════════════
#  STEP 8: UNINSTALL HOMEBREW
# ═══════════════════════════════════════════════════════════════════

print_header "🍺" "STEP 8 — Uninstalling Homebrew"

if command -v brew &>/dev/null; then
    print_step "Running official Homebrew uninstaller..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)" 2>/dev/null || true

    # Clean up Homebrew directories if still present
    for dir in /opt/homebrew /usr/local/Homebrew /usr/local/Cellar /usr/local/Caskroom; do
        if [ -d "$dir" ]; then
            print_step "Removing leftover $dir..."
            sudo rm -rf "$dir" 2>/dev/null || true
        fi
    done

    # Remove brew shellenv from shell configs
    for rcfile in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.zprofile" "$HOME/.bash_profile"; do
        if [ -f "$rcfile" ]; then
            if grep -q 'brew shellenv' "$rcfile"; then
                print_step "Removing brew shellenv from $rcfile..."
                sed -i '' '/brew shellenv/d' "$rcfile"
            fi
        fi
    done

    print_success "Homebrew uninstalled."
else
    print_step "Homebrew not found — skipping."
fi

# ═══════════════════════════════════════════════════════════════════
#  SUMMARY
# ═══════════════════════════════════════════════════════════════════

print_header "🎉" "TEARDOWN COMPLETE"

echo -e "  ${BOLD}Removed:${RESET}"
echo -e "    ✔ Claude Code (binary + configs)"
echo -e "    ✔ Cursor (app + configs)"
echo -e "    ✔ Visual Studio Code (app + configs)"
echo -e "    ✔ All global MCP configs"
echo -e "    ✔ ai-init function from shell configs"
echo -e "    ✔ Node.js, Python 3.12, Git"
echo -e "    ✔ Homebrew"
echo ""
echo -e "  ${YELLOW}Manual steps (if needed):${RESET}"
echo -e "    • Remove any project-level scaffold files (.mcp.json, CLAUDE.md,"
echo -e "      .cursorrules, .cursor/, .copilot/, .vscode/mcp.json)"
echo -e "    • Revoke API tokens/sessions in browser (claude.ai, cursor.com, github.com)"
echo -e "    • Open a new terminal to ensure PATH changes take effect"
echo ""
echo -e "  ${DIM}nuke_ai.sh finished at $(date '+%H:%M:%S')${RESET}"
echo ""
