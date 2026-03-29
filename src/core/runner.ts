import type { Context } from "./types.js";
import { createShell } from "../lib/shell.js";
import { createFs } from "../lib/template.js";
import { ui } from "../lib/ui.js";

/**
 * Build a Context object that gets injected into agent drivers.
 */
export function createContext(agentDir: string, dryRun: boolean): Context {
  return {
    shell: createShell(dryRun),
    ui,
    fs: createFs(dryRun),
    agentDir,
    dryRun,
  };
}
