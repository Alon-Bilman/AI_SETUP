import { readFile } from "fs/promises";
import { join } from "path";
import type { FsHelpers, McpTarget } from "../core/types.js";
import { ui } from "./ui.js";

/**
 * Expand ~ to the user's home directory in a path.
 */
export function expandHome(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return p.replace("~", process.env.HOME ?? "");
  }
  return p;
}

/**
 * Read an MCP JSON file from the agent's mcp/ folder and write it to the destination.
 */
export async function writeMcpConfig(
  agentDir: string,
  mcpFileName: string,
  target: McpTarget,
  fs: FsHelpers
): Promise<void> {
  const srcPath = join(agentDir, "mcp", mcpFileName);
  const destPath = expandHome(target.path);

  ui.printStep(`Writing MCP config → ${destPath}`);

  const data = await fs.readJson(srcPath);
  await fs.writeJson(destPath, data, { sudo: target.sudo });

  ui.printSuccess(`MCP config written: ${destPath}`);
}
