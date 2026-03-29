import { execa } from "execa";
import type { Context } from "../core/types.js";

export const node = {
  id: "node",

  async isInstalled(): Promise<boolean> {
    try {
      await execa("brew", ["list", "node"]);
      return true;
    } catch {
      return false;
    }
  },

  async install(ctx: Context): Promise<void> {
    ctx.ui.printStep("Installing Node.js (LTS)...");
    await ctx.shell.retry(async () => {
      await execa("brew", ["install", "node"], { stdio: "inherit" });
    });
    ctx.ui.printSuccess("Node.js installed.");
  },

  async uninstall(ctx: Context): Promise<void> {
    ctx.ui.printStep("Uninstalling Node.js...");
    try {
      await execa("brew", ["uninstall", "--ignore-dependencies", "node"]);
    } catch {
      // May not be installed
    }
    ctx.ui.printSuccess("Node.js uninstalled.");
  },
};
