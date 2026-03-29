import type { Context } from "../core/types.js";
import { homebrew } from "./homebrew.js";
import { node } from "./node.js";
import { python } from "./python.js";
import { git } from "./git.js";

/** All foundations in install order (homebrew must come first) */
const ALL = [homebrew, node, python, git];

/**
 * Install all foundations that aren't already present.
 */
export async function installFoundations(ctx: Context): Promise<void> {
  ctx.ui.printHeader("📦", "PHASE 1 — Smart Installation (Foundations)");

  for (const foundation of ALL) {
    const installed = await foundation.isInstalled();
    if (installed) {
      ctx.ui.printSuccess(`${foundation.id} already installed.`);
    } else {
      await foundation.install(ctx);
    }
  }
}

/**
 * Uninstall all foundations in reverse order.
 */
export async function uninstallFoundations(ctx: Context): Promise<void> {
  ctx.ui.printHeader("📦", "Uninstalling Foundations");

  for (const foundation of [...ALL].reverse()) {
    await foundation.uninstall(ctx);
  }
}
