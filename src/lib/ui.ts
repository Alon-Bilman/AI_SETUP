import chalk from "chalk";
import type { UiHelpers } from "../core/types.js";
import { createInterface } from "readline";

export const ui: UiHelpers = {
  printHeader(emoji: string, title: string) {
    console.log();
    console.log(
      chalk.cyan(
        "╔══════════════════════════════════════════════════════════════╗"
      )
    );
    console.log(chalk.cyan("║") + `  ${emoji}  ${chalk.bold(title)}`);
    console.log(
      chalk.cyan(
        "╚══════════════════════════════════════════════════════════════╝"
      )
    );
    console.log();
  },

  printStep(msg: string) {
    console.log(chalk.dim("  ▸") + ` ${msg}`);
  },

  printSuccess(msg: string) {
    console.log(chalk.green("  ✔") + ` ${msg}`);
  },

  printError(msg: string) {
    console.log(chalk.red("  ✘") + ` ${msg}`);
  },

  printWarning(msg: string) {
    console.log(chalk.yellow("  ⚠") + ` ${msg}`);
  },

  async pauseForAuth(instructions: string[]) {
    console.log();
    console.log(
      chalk.magenta(
        "  ╔══════════════════════════════════════════════════════════╗"
      )
    );
    console.log(
      chalk.magenta("  ║") + `  🔐  ${chalk.bold("AUTHENTICATION REQUIRED")}`
    );
    console.log(chalk.magenta("  ║"));
    for (const line of instructions) {
      console.log(chalk.magenta("  ║") + `  ${line}`);
    }
    console.log(chalk.magenta("  ║"));
    console.log(
      chalk.magenta("  ║") +
        `  Press ${chalk.green("ENTER")} when done...`
    );
    console.log(
      chalk.magenta(
        "  ╚══════════════════════════════════════════════════════════╝"
      )
    );

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    await new Promise<void>((resolve) => {
      rl.question("", () => {
        rl.close();
        resolve();
      });
    });
  },
};
