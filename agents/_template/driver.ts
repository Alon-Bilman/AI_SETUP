import type { AgentDriver, Context } from "../../src/core/types.js";

/**
 * Agent driver template.
 *
 * Implement the 4 required methods:
 *   isInstalled() — return true if the agent CLI/app is already installed
 *   install(ctx)  — install the agent (use ctx.shell.retry for network ops)
 *   authenticate(ctx) — prompt the user to log in (use ctx.ui.pauseForAuth)
 *   uninstall(ctx) — remove the agent binary/app
 */
export const driver: AgentDriver = {
  async isInstalled() {
    // TODO: check if installed (e.g., `which my-agent` or existsSync("/Applications/..."))
    return false;
  },

  async install(ctx: Context) {
    // TODO: install the agent
    // ctx.shell.retry(() => execa("brew", ["install", "..."]))
    ctx.ui.printStep("Installing My Agent...");
    ctx.ui.printSuccess("My Agent installed.");
  },

  async authenticate(ctx: Context) {
    // TODO: launch auth flow
    // await ctx.ui.pauseForAuth(["Open browser and sign in.", "Press ENTER when done."]);
  },

  async uninstall(ctx: Context) {
    // TODO: uninstall the agent
    ctx.ui.printStep("Uninstalling My Agent...");
    ctx.ui.printSuccess("My Agent uninstalled.");
  },
};

export default driver;
