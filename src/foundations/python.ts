import { execa } from "execa";
import type { Context } from "../core/types.js";

export const python = {
  id: "python",

  async isInstalled(): Promise<boolean> {
    try {
      await execa("brew", ["list", "python@3.12"]);
      return true;
    } catch {
      return false;
    }
  },

  async install(ctx: Context): Promise<void> {
    ctx.ui.printStep("Installing Python 3.12+...");
    await ctx.shell.retry(async () => {
      await execa("brew", ["install", "python@3.12"], { stdio: "inherit" });
    });
    ctx.ui.printSuccess("Python 3.12 installed.");
  },

  async uninstall(ctx: Context): Promise<void> {
    ctx.ui.printStep("Uninstalling Python 3.12...");
    try {
      await execa("brew", ["uninstall", "--ignore-dependencies", "python@3.12"]);
    } catch {
      // May not be installed
    }
    ctx.ui.printSuccess("Python 3.12 uninstalled.");
  },
};
