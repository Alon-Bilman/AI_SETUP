import { readFile } from "fs/promises";
import type { AgentConfig } from "./types.js";

/**
 * Read and validate an agent.json file. Throws on missing required fields.
 */
export async function loadAgentConfig(
  agentJsonPath: string
): Promise<AgentConfig> {
  const raw = await readFile(agentJsonPath, "utf-8");
  const config = JSON.parse(raw) as AgentConfig;

  // Basic validation — catch misconfigured agents early
  const required: (keyof AgentConfig)[] = [
    "name",
    "id",
    "description",
    "icon",
    "requires",
    "installMethod",
    "mcp",
    "cleanup",
  ];
  for (const key of required) {
    if (config[key] === undefined) {
      throw new Error(
        `Invalid agent config at ${agentJsonPath}: missing required field "${key}"`
      );
    }
  }

  if (!config.cleanup.paths) config.cleanup.paths = [];
  if (!config.cleanup.sudoPaths) config.cleanup.sudoPaths = [];

  return config;
}
