#!/usr/bin/env tsx
/**
 * ai-init.ts — AI Project Scaffolder
 *
 * Discovers available agents and plugins, presents interactive menus,
 * then copies scaffold files into a new project directory.
 */
import { existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";
import { ui } from "./lib/ui.js";
import { createFs } from "./lib/template.js";
import {
  promptProjectName,
  selectOneAgent,
  selectPlugins,
} from "./lib/prompts.js";
import { discoverAgents, discoverPlugins } from "./core/registry.js";

ui.printHeader("🛠️", "AI Project Scaffolder");

// ─── Project Name ────────────────────────────────────────────────────────
const projectName = await promptProjectName();

const projectDir = resolve(process.cwd(), projectName);
if (existsSync(projectDir)) {
  ui.printError(`Directory '${projectName}' already exists.`);
  process.exit(1);
}

// ─── Select Agent ────────────────────────────────────────────────────────
const agents = await discoverAgents();
if (agents.length === 0) {
  ui.printError("No agents found in agents/ directory.");
  process.exit(1);
}

const selectedAgent = await selectOneAgent(agents);

// ─── Select Plugins ──────────────────────────────────────────────────────
const allPlugins = await discoverPlugins();
const selectedPlugins = await selectPlugins(allPlugins, selectedAgent.config.id);

// ─── Create Project ──────────────────────────────────────────────────────
mkdirSync(projectDir, { recursive: true });
console.log();
ui.printStep(`Created ./${projectName}`);
ui.printStep(`Scaffolding ${selectedAgent.config.icon} ${selectedAgent.config.name} project...`);

const fs = createFs(false);

// Copy agent scaffold with template variable replacement
const scaffoldDir = join(selectedAgent.dir, "scaffold");
if (existsSync(scaffoldDir)) {
  await fs.copyScaffold(scaffoldDir, projectDir, {
    PROJECT_DIR: projectDir,
    PROJECT_NAME: projectName,
  });
  ui.printSuccess(`${selectedAgent.config.name} scaffold copied.`);
} else {
  ui.printWarning(`No scaffold/ directory found for ${selectedAgent.config.name}.`);
}

// Copy plugin files
for (const plugin of selectedPlugins) {
  const pluginFilesDir = join(plugin.dir, "files");
  if (existsSync(pluginFilesDir)) {
    await fs.copyScaffold(pluginFilesDir, projectDir, {
      PROJECT_DIR: projectDir,
      PROJECT_NAME: projectName,
    });
    ui.printSuccess(`Plugin "${plugin.config.name}" applied.`);
  }
}

// ─── Done ────────────────────────────────────────────────────────────────
console.log();
ui.printHeader("✅", `Project '${projectName}' is ready!`);
console.log(`  Run 'tree -a -I node_modules ${projectName}' to see the scaffold.`);
console.log();
