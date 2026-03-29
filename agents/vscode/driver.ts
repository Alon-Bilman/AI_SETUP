import type { AgentDriver, Context } from "../../src/core/types.js";
import { existsSync } from "fs";
import { execa } from "execa";

export const driver: AgentDriver = {
  async isInstalled() {
    return existsSync("/Applications/Visual Studio Code.app");
  },

  async install(ctx: Context) {
    ctx.ui.printStep("Installing Visual Studio Code...");
    await ctx.shell.retry(async () => {
      await execa("brew", ["install", "--cask", "visual-studio-code"], {
        stdio: "inherit",
      });
    });
    ctx.ui.printSuccess("VS Code installed.");
  },

  async authenticate(ctx: Context) {
    ctx.ui.printStep("Launching VS Code for authentication...");
    try {
      await execa("open", ["-a", "Visual Studio Code"]);
    } catch {
      // May fail in headless
    }

    await ctx.ui.pauseForAuth([
      "VS Code has been launched.",
      "Install the GitHub Copilot extension and sign in.",
      "Return here and press ENTER when done.",
    ]);
  },

  async uninstall(ctx: Context) {
    ctx.ui.printStep("Uninstalling Visual Studio Code...");

    // Quit if running
    try {
      await execa("osascript", [
        "-e",
        'tell application "Visual Studio Code" to quit',
      ]);
      await new Promise((r) => setTimeout(r, 1000));
    } catch {
      // Not running
    }

    // Uninstall via brew
    try {
      await execa("brew", ["uninstall", "--cask", "visual-studio-code"]);
    } catch {
      // May not be installed via brew
    }

    // Remove app bundle if still present
    if (existsSync("/Applications/Visual Studio Code.app")) {
      await ctx.shell.safeRm("/Applications/Visual Studio Code.app");
    }

    ctx.ui.printSuccess("VS Code uninstalled.");
  },
};

export default driver;
