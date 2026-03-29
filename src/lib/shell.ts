import { execa } from "execa";
import { existsSync, lstatSync } from "fs";
import { rm } from "fs/promises";
import type { ShellHelpers } from "../core/types.js";
import { ui } from "./ui.js";

export function createShell(dryRun: boolean): ShellHelpers {
  return {
    async exec(cmd: string, args: string[] = []) {
      if (dryRun) {
        ui.printStep(`[dry-run] ${cmd} ${args.join(" ")}`);
        return { stdout: "", stderr: "" };
      }
      const result = await execa(cmd, args);
      return { stdout: result.stdout, stderr: result.stderr };
    },

    async execLive(cmd: string, args: string[] = []) {
      if (dryRun) {
        ui.printStep(`[dry-run] ${cmd} ${args.join(" ")}`);
        return;
      }
      await execa(cmd, args, { stdio: "inherit" });
    },

    async retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
      let lastError: unknown;
      let delay = 2000;
      for (let i = 1; i <= attempts; i++) {
        try {
          return await fn();
        } catch (err) {
          lastError = err;
          if (i < attempts) {
            ui.printWarning(
              `Attempt ${i}/${attempts} failed. Retrying in ${delay / 1000}s...`
            );
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
          }
        }
      }
      throw lastError;
    },

    async safeRm(target: string) {
      if (dryRun) {
        ui.printStep(`[dry-run] rm ${target}`);
        return;
      }
      try {
        if (lstatSync(target)) {
          await rm(target, { recursive: true, force: true });
          ui.printSuccess(`Removed: ${target}`);
        }
      } catch {
        ui.printStep(`Already absent: ${target}`);
      }
    },

    async sudoRm(target: string) {
      if (dryRun) {
        ui.printStep(`[dry-run] sudo rm ${target}`);
        return;
      }
      try {
        if (existsSync(target)) {
          await execa("sudo", ["rm", "-rf", target]);
          ui.printSuccess(`Removed (sudo): ${target}`);
        } else {
          ui.printStep(`Already absent: ${target}`);
        }
      } catch {
        ui.printStep(`Already absent: ${target}`);
      }
    },
  };
}
