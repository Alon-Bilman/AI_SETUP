import type { AgentDriver, Context } from "../../src/core/types.js";
import { existsSync } from "fs";
import { execa } from "execa";

export const driver: AgentDriver = {
  async isInstalled() {
    return existsSync("/Applications/Cursor.app");
  },

  async install(ctx: Context) {
    ctx.ui.printStep("Installing Cursor...");
    await ctx.shell.retry(async () => {
      await execa("brew", ["install", "--cask", "cursor"], { stdio: "inherit" });
    });
    ctx.ui.printSuccess("Cursor installed.");
  },

  async authenticate(ctx: Context) {
    ctx.ui.printStep("Launching Cursor for authentication...");
    try {
      await execa("open", ["-a", "Cursor"]);
    } catch {
      // May fail in headless
    }

    await ctx.ui.pauseForAuth([
      "Cursor has been launched.",
      "Sign in to your Cursor account.",
      "Return here and press ENTER when done.",
    ]);
  },

  async uninstall(ctx: Context) {
    ctx.ui.printStep("Uninstalling Cursor...");

    // Quit if running
    try {
      await execa("osascript", ["-e", 'tell application "Cursor" to quit']);
      await new Promise((r) => setTimeout(r, 1000));
    } catch {
      // Not running
    }

    // Uninstall via brew
    try {
      await execa("brew", ["uninstall", "--cask", "cursor"]);
    } catch {
      // May not be installed via brew
    }

    // Remove app bundle if still present
    if (existsSync("/Applications/Cursor.app")) {
      await ctx.shell.safeRm("/Applications/Cursor.app");
    }

    ctx.ui.printSuccess("Cursor uninstalled.");
  },
};

export default driver;
