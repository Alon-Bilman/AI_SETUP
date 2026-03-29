import type { AgentDriver, Context } from "../../src/core/types.js";
import { execa } from "execa";

export const driver: AgentDriver = {
  async isInstalled() {
    try {
      await execa("which", ["claude"]);
      return true;
    } catch {
      return false;
    }
  },

  async install(ctx: Context) {
    ctx.ui.printStep("Installing Claude Code...");
    await ctx.shell.retry(async () => {
      await execa("bash", ["-c", 'curl -fsSL https://claude.ai/install.sh | bash'], {
        stdio: "inherit",
      });
    });

    // Ensure ~/.local/bin is in PATH
    const home = process.env.HOME ?? "";
    const localBin = `${home}/.local/bin`;
    if (!process.env.PATH?.includes(localBin)) {
      process.env.PATH = `${localBin}:${process.env.PATH}`;
    }

    ctx.ui.printSuccess("Claude Code installed.");
  },

  async authenticate(ctx: Context) {
    ctx.ui.printStep("Opening Claude Code login in a new Terminal window...");
    try {
      await execa("osascript", [
        "-e",
        'tell application "Terminal" to do script "claude login"',
      ]);
    } catch {
      // osascript may fail in headless environments
    }

    await ctx.ui.pauseForAuth([
      "A new Terminal window has been opened with 'claude login'.",
      "Complete the browser-based authentication there.",
      "Return here and press ENTER when login is successful.",
    ]);
  },

  async uninstall(ctx: Context) {
    ctx.ui.printStep("Uninstalling Claude Code...");
    try {
      await execa("claude", ["uninstall"]);
    } catch {
      // May not exist
    }
    // Remove binary if still present
    const home = process.env.HOME ?? "";
    await ctx.shell.safeRm(`${home}/.local/bin/claude`);
    ctx.ui.printSuccess("Claude Code uninstalled.");
  },
};

export default driver;
