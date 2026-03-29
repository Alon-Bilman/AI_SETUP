#!/usr/bin/env tsx
/**
 * nuke.ts — Complete AI Stack Teardown
 *
 * Discovers all agents, uninstalls them, removes configs, and tears down foundations.
 */
import { platform } from "os";
import { execa } from "execa";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { ui } from "./lib/ui.js";
import { createShell } from "./lib/shell.js";
import { createFs } from "./lib/template.js";
import { expandHome } from "./lib/mcp.js";
import { confirmNuke } from "./lib/prompts.js";
import { discoverAgents } from "./core/registry.js";
import { createContext } from "./core/runner.js";
import { uninstallFoundations } from "./foundations/index.js";
import type { Context } from "./core/types.js";

const dryRun = process.argv.includes("--dry-run");

// ─── OS Check ────────────────────────────────────────────────────────────
if (platform() !== "darwin") {
  ui.printError(`This script only runs on macOS. Detected: ${platform()}`);
  process.exit(1);
}

ui.printHeader("🧹", "AI Stack Teardown v2");
console.log(`  Date: ${new Date().toISOString().replace("T", " ").slice(0, 19)}`);
console.log(`  User: ${process.env.USER ?? "unknown"}`);
if (dryRun) ui.printWarning("DRY RUN MODE — no changes will be made.");

// ─── Safety Gate ─────────────────────────────────────────────────────────
const confirmed = await confirmNuke();
if (!confirmed) {
  ui.printSuccess("Aborted. Nothing was changed.");
  process.exit(0);
}

// ─── Sudo ────────────────────────────────────────────────────────────────
ui.printHeader("🔑", "Requesting Administrator Privileges");
try {
  await execa("sudo", ["-v"], { stdio: "inherit" });
  ui.printSuccess("Sudo session active.");
} catch {
  ui.printError("Failed to acquire sudo. Some steps may fail.");
}

const baseCtx: Context = {
  shell: createShell(dryRun),
  ui,
  fs: createFs(dryRun),
  agentDir: "",
  dryRun,
};

// ─── Discover & Uninstall Agents ─────────────────────────────────────────
ui.printHeader("🗑️", "Removing Agents");

const agents = await discoverAgents();
for (const agent of agents) {
  const { config, driver, dir } = agent;
  const ctx = createContext(dir, dryRun);

  ui.printHeader(config.icon, `Removing ${config.name}`);

  // Run agent-specific uninstall
  await driver.uninstall(ctx);

  // Remove cleanup paths
  for (const p of config.cleanup.paths) {
    await ctx.shell.safeRm(expandHome(p));
  }
  for (const p of config.cleanup.sudoPaths) {
    await ctx.shell.sudoRm(expandHome(p));
  }

  // Remove global MCP configs
  for (const target of Object.values(config.mcp)) {
    const dest = expandHome(target.path);
    if (target.sudo) {
      await ctx.shell.sudoRm(dest);
    } else {
      await ctx.shell.safeRm(dest);
    }
  }

  ui.printSuccess(`${config.name} removed.`);
}

// ─── Remove ai-init from shell configs ───────────────────────────────────
ui.printHeader("📝", "Removing ai-init from Shell Configs");

for (const rcFile of [
  `${process.env.HOME}/.zshrc`,
  `${process.env.HOME}/.bashrc`,
]) {
  if (!existsSync(rcFile)) {
    ui.printStep(`${rcFile} does not exist — skipping.`);
    continue;
  }

  if (dryRun) {
    ui.printStep(`[dry-run] Would clean ai-init from ${rcFile}`);
    continue;
  }

  let content = readFileSync(rcFile, "utf-8");
  if (content.includes("# >>> AI-INIT >>>")) {
    content = content.replace(
      /# >>> AI-INIT >>>[\s\S]*?# <<< AI-INIT <<</g,
      ""
    );
    // Also remove any leftover ~/.local/bin PATH export from v1
    content = content.replace(
      /export PATH="\$HOME\/\.local\/bin:\$PATH"\n?/g,
      ""
    );
    // Clean trailing blank lines
    content = content.replace(/\n{3,}/g, "\n\n").trim() + "\n";
    writeFileSync(rcFile, content, "utf-8");
    ui.printSuccess(`Cleaned ai-init from ${rcFile}`);
  } else {
    ui.printStep(`No ai-init block found in ${rcFile}`);
  }
}

// ─── Uninstall Foundations ────────────────────────────────────────────────
await uninstallFoundations(baseCtx);

// ─── Summary ─────────────────────────────────────────────────────────────
ui.printHeader("🎉", "TEARDOWN COMPLETE");

console.log("  Removed:");
for (const agent of agents) {
  console.log(`    ✔ ${agent.config.icon} ${agent.config.name}`);
}
console.log("    ✔ ai-init from shell configs");
console.log("    ✔ Foundations (Node.js, Python, Git, Homebrew)");
console.log();
console.log("  Manual steps (if needed):");
console.log("    • Remove project-level scaffold files (.mcp.json, CLAUDE.md, etc.)");
console.log("    • Revoke API tokens in browser (claude.ai, cursor.com, github.com)");
console.log("    • Open a new terminal to ensure PATH changes take effect");
console.log();
