import type { AgentDriver, Context } from "../../src/core/types.js";
import { execa } from "execa";

export const driver: AgentDriver = {
  async isInstalled() {
    try {
      await execa("which", ["codex"]);
      return true;
    } catch {
      return false;
    }
  },

  async install(ctx: Context) {
    ctx.ui.printStep("Installing Codex CLI...");
    await ctx.shell.retry(async () => {
      await execa("npm", ["install", "-g", "@openai/codex"], {
        stdio: "inherit",
      });
    });
    ctx.ui.printSuccess("Codex CLI installed.");
  },

  async authenticate(ctx: Context) {
    ctx.ui.printStep("Opening Codex in a new Terminal window for ChatGPT sign-in...");
    try {
      await execa("osascript", [
        "-e",
        'tell application "Terminal" to do script "codex"',
      ]);
    } catch {
      // osascript may fail in headless environments
    }

    await ctx.ui.pauseForAuth([
      "A new Terminal window has been opened with 'codex'.",
      "Select 'Sign in with ChatGPT' and complete browser authentication.",
      "Return here and press ENTER when login is successful.",
    ]);
  },

  async uninstall(ctx: Context) {
    ctx.ui.printStep("Uninstalling Codex CLI...");
    try {
      await execa("npm", ["uninstall", "-g", "@openai/codex"]);
    } catch {
      // May not be installed via npm
    }
    const home = process.env.HOME ?? "";
    await ctx.shell.safeRm(`${home}/.codex`);
    ctx.ui.printSuccess("Codex CLI uninstalled.");
  },
};

export default driver;
