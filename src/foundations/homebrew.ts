import { execa } from "execa";
import type { Context } from "../core/types.js";

export const homebrew = {
  id: "homebrew",

  async isInstalled(): Promise<boolean> {
    try {
      await execa("which", ["brew"]);
      return true;
    } catch {
      return false;
    }
  },

  async install(ctx: Context): Promise<void> {
    ctx.ui.printStep("Installing Homebrew...");
    await ctx.shell.retry(async () => {
      await execa(
        "bash",
        ["-c", 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'],
        { stdio: "inherit" }
      );
    });

    // Add brew to PATH for this session
    const brewPaths = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
    for (const bp of brewPaths) {
      try {
        const { stdout } = await execa(bp, ["shellenv"]);
        // Apply brew shellenv to current process
        for (const line of stdout.split("\n")) {
          const match = line.match(/export\s+(\w+)="([^"]*)"/);
          if (match) {
            process.env[match[1]] = match[2];
          }
        }
        break;
      } catch {
        continue;
      }
    }

    ctx.ui.printSuccess("Homebrew installed.");
  },

  async uninstall(ctx: Context): Promise<void> {
    ctx.ui.printStep("Uninstalling Homebrew...");
    try {
      await execa(
        "bash",
        ["-c", 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"'],
        { stdio: "inherit" }
      );
    } catch {
      // May already be removed
    }

    // Clean up leftover directories
    for (const dir of [
      "/opt/homebrew",
      "/usr/local/Homebrew",
      "/usr/local/Cellar",
      "/usr/local/Caskroom",
    ]) {
      await ctx.shell.sudoRm(dir);
    }

    ctx.ui.printSuccess("Homebrew uninstalled.");
  },
};
