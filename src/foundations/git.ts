import { execa } from "execa";
import type { Context } from "../core/types.js";

export const git = {
  id: "git",

  async isInstalled(): Promise<boolean> {
    try {
      await execa("brew", ["list", "git"]);
      return true;
    } catch {
      return false;
    }
  },

  async install(ctx: Context): Promise<void> {
    ctx.ui.printStep("Installing Git...");
    await ctx.shell.retry(async () => {
      await execa("brew", ["install", "git"], { stdio: "inherit" });
    });
    ctx.ui.printSuccess("Git installed.");
  },

  async uninstall(ctx: Context): Promise<void> {
    ctx.ui.printStep("Uninstalling Git...");
    try {
      await execa("brew", ["uninstall", "--ignore-dependencies", "git"]);
    } catch {
      // May not be installed
    }
    ctx.ui.printSuccess("Git uninstalled.");
  },
};
