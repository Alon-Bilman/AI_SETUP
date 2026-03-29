#!/usr/bin/env tsx
/**
 * orchestrate.ts — Config-driven macOS AI Stack Builder
 *
 * Reads agents/ folder, presents interactive menu, installs selected agents,
 * writes their MCP configs, and runs authentication flows.
 */
import { platform } from "os";
import { execa } from "execa";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { ui } from "./lib/ui.js";
import { createShell } from "./lib/shell.js";
import { createFs } from "./lib/template.js";
import { writeMcpConfig, expandHome } from "./lib/mcp.js";
import { selectAgents } from "./lib/prompts.js";
import { discoverAgents } from "./core/registry.js";
import { createContext } from "./core/runner.js";
import { installFoundations } from "./foundations/index.js";
import type { Context } from "./core/types.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const dryRun = process.argv.includes("--dry-run");

// ─── OS Check ────────────────────────────────────────────────────────────
if (platform() !== "darwin") {
  ui.printError(`This script only runs on macOS. Detected: ${platform()}`);
  process.exit(1);
}

ui.printHeader("🚀", "AI Stack Builder v2 — Config-Driven Orchestrator");
console.log(`  Date: ${new Date().toISOString().replace("T", " ").slice(0, 19)}`);
console.log(`  User: ${process.env.USER ?? "unknown"}`);
if (dryRun) ui.printWarning("DRY RUN MODE — no changes will be made.");

// ─── Sudo ────────────────────────────────────────────────────────────────
ui.printHeader("🔑", "Requesting Administrator Privileges");
ui.printStep("Some steps require sudo (managed MCP config, auth).");
try {
  await execa("sudo", ["-v"], { stdio: "inherit" });
  ui.printSuccess("Sudo session active.");
} catch {
  ui.printError("Failed to acquire sudo. Some steps may fail.");
}

// ─── Build base context (used for foundations, no specific agent dir) ────
const baseCtx: Context = {
  shell: createShell(dryRun),
  ui,
  fs: createFs(dryRun),
  agentDir: "",
  dryRun,
};

// ─── Phase 1: Foundations ────────────────────────────────────────────────
await installFoundations(baseCtx);

// ─── Phase 2: Discover & Select Agents ──────────────────────────────────
ui.printHeader("🧠", "PHASE 2 — Agent Configuration");

const allAgents = await discoverAgents();
if (allAgents.length === 0) {
  ui.printError("No agents found in agents/ directory.");
  process.exit(1);
}

ui.printStep(`Found ${allAgents.length} agent(s): ${allAgents.map((a) => a.config.name).join(", ")}`);
const selectedAgents = await selectAgents(allAgents, "install");

if (selectedAgents.length === 0) {
  ui.printWarning("No agents selected. Skipping agent setup.");
} else {
  // ─── Phase 3: Install, Configure, Authenticate Each Agent ─────────────
  for (const agent of selectedAgents) {
    const { config, driver, dir } = agent;
    const ctx = createContext(dir, dryRun);

    ui.printHeader(config.icon, `Setting up ${config.name}`);

    // Install
    const alreadyInstalled = await driver.isInstalled();
    if (alreadyInstalled) {
      ui.printSuccess(`${config.name} already installed.`);
    } else {
      await driver.install(ctx);
    }

    // Write MCP configs
    for (const [fileName, target] of Object.entries(config.mcp)) {
      await writeMcpConfig(dir, fileName, target, ctx.fs);
    }

    // Authenticate
    await driver.authenticate(ctx);

    ui.printSuccess(`${config.name} configured.`);
  }
}

// ─── Phase 4: Inject ai-init ────────────────────────────────────────────
ui.printHeader("🛠️", "PHASE 3 — Installing ai-init");

const aiInitPath = resolve(__dirname, "ai-init.ts");
const shellBlock = `# >>> AI-INIT >>>
# AI project scaffolding — installed by ai-setup v2
ai-init() {
    npx tsx "${aiInitPath}" "$@"
}
# <<< AI-INIT <<<`;

const zshrc = `${process.env.HOME}/.zshrc`;
if (!dryRun) {
  let content = "";
  if (existsSync(zshrc)) {
    content = readFileSync(zshrc, "utf-8");
    // Remove old block if present
    content = content.replace(/# >>> AI-INIT >>>[\s\S]*?# <<< AI-INIT <<</g, "").trim();
  }
  content = content + "\n\n" + shellBlock + "\n";
  writeFileSync(zshrc, content, "utf-8");
  ui.printSuccess("ai-init function injected into ~/.zshrc");
} else {
  ui.printStep("[dry-run] Would inject ai-init into ~/.zshrc");
}

// ─── Summary ─────────────────────────────────────────────────────────────
ui.printHeader("🎉", "SETUP COMPLETE");

console.log("  Installed foundations: Homebrew, Node.js, Python 3.12, Git");
console.log();
if (selectedAgents.length > 0) {
  console.log("  Configured agents:");
  for (const agent of selectedAgents) {
    console.log(`    ✔ ${agent.config.icon} ${agent.config.name}`);
    for (const [fileName, target] of Object.entries(agent.config.mcp)) {
      console.log(`      MCP: ${expandHome(target.path)}`);
    }
  }
  console.log();
}
console.log("  Next Steps:");
console.log("    1. Open a new terminal (or run: source ~/.zshrc)");
console.log("    2. Navigate to where you want your project");
console.log("    3. Run: ai-init");
console.log();
