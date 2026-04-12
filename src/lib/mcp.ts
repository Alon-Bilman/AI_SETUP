import { existsSync } from "fs";
import { join, extname } from "path";
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
 * Deep-merge source into target (mutates target). Nested objects are merged
 * recursively; all other values are overwritten by source.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      target[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>
      );
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

/**
 * Read an MCP config file from the agent's mcp/ folder and write it to the
 * destination. Format is determined by file extension:
 *   .json source → readJson    |  .json dest → writeJson (overwrite)
 *   .toml source → readToml    |  .toml dest → writeToml (merge into existing)
 */
export async function writeMcpConfig(
  agentDir: string,
  mcpFileName: string,
  target: McpTarget,
  fs: FsHelpers
): Promise<void> {
  const srcPath = join(agentDir, "mcp", mcpFileName);
  const destPath = expandHome(target.path);
  const srcExt = extname(mcpFileName).toLowerCase();
  const destExt = extname(target.path).toLowerCase();

  ui.printStep(`Writing MCP config → ${destPath}`);

  // ── Read source ──────────────────────────────────────────────────────
  let srcData: Record<string, unknown>;
  if (srcExt === ".toml") {
    srcData = await fs.readToml<Record<string, unknown>>(srcPath);
  } else {
    srcData = await fs.readJson<Record<string, unknown>>(srcPath);
  }

  // ── Write destination ────────────────────────────────────────────────
  if (destExt === ".toml") {
    // TOML destinations: merge into existing file to preserve user settings
    let existing: Record<string, unknown> = {};
    if (existsSync(destPath)) {
      try {
        existing = await fs.readToml<Record<string, unknown>>(destPath);
      } catch {
        // If existing file is malformed, start fresh
        existing = {};
      }
    }
    const merged = deepMerge(existing, srcData);
    await fs.writeToml(destPath, merged, { sudo: target.sudo });
  } else {
    // JSON destinations: overwrite (existing behavior)
    await fs.writeJson(destPath, srcData, { sudo: target.sudo });
  }

  ui.printSuccess(`MCP config written: ${destPath}`);
}
