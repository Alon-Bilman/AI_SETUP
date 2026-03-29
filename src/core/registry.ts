import { readdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadAgentConfig } from "./config.js";
import type {
  AgentDriver,
  DiscoveredAgent,
  DiscoveredPlugin,
  PluginConfig,
} from "./types.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "../..");

export const AGENTS_DIR = join(ROOT, "agents");
export const PLUGINS_DIR = join(ROOT, "plugins");

/**
 * Auto-discover all agents under agents/ that have an agent.json.
 * Folders starting with _ (like _template) are skipped.
 */
export async function discoverAgents(): Promise<DiscoveredAgent[]> {
  const entries = await readdir(AGENTS_DIR, { withFileTypes: true });
  const agents: DiscoveredAgent[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;

    const agentDir = join(AGENTS_DIR, entry.name);
    const configPath = join(agentDir, "agent.json");
    const driverPath = join(agentDir, "driver.ts");

    if (!existsSync(configPath)) continue;

    const config = await loadAgentConfig(configPath);

    // Dynamically import the driver module
    let driver: AgentDriver;
    if (existsSync(driverPath)) {
      const mod = await import(driverPath);
      driver = mod.default ?? mod.driver;
    } else {
      // Fallback no-op driver for agents without custom logic
      driver = {
        async isInstalled() { return false; },
        async install() {},
        async authenticate() {},
        async uninstall() {},
      };
    }

    agents.push({ config, driver, dir: agentDir });
  }

  // Sort alphabetically by name for stable menu order
  agents.sort((a, b) => a.config.name.localeCompare(b.config.name));
  return agents;
}

/**
 * Auto-discover all plugins under plugins/ that have a plugin.json.
 * Folders starting with _ (like _template) are skipped.
 */
export async function discoverPlugins(): Promise<DiscoveredPlugin[]> {
  if (!existsSync(PLUGINS_DIR)) return [];

  const entries = await readdir(PLUGINS_DIR, { withFileTypes: true });
  const plugins: DiscoveredPlugin[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;

    const pluginDir = join(PLUGINS_DIR, entry.name);
    const configPath = join(pluginDir, "plugin.json");

    if (!existsSync(configPath)) continue;

    const { readFile } = await import("fs/promises");
    const raw = await readFile(configPath, "utf-8");
    const config = JSON.parse(raw) as PluginConfig;

    plugins.push({ config, dir: pluginDir });
  }

  plugins.sort((a, b) => a.config.name.localeCompare(b.config.name));
  return plugins;
}
