import { readdir, readFile, cp, mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { execa } from "execa";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import type { FsHelpers } from "../core/types.js";
import { ui } from "./ui.js";

export function createFs(dryRun: boolean): FsHelpers {
  return {
    async copyScaffold(
      srcDir: string,
      destDir: string,
      vars: Record<string, string> = {}
    ) {
      if (dryRun) {
        ui.printStep(`[dry-run] copy scaffold ${srcDir} → ${destDir}`);
        return;
      }

      // Recursively walk srcDir and copy files, replacing {{VAR}} tokens
      const entries = await walkDir(srcDir);
      for (const relPath of entries) {
        const srcPath = join(srcDir, relPath);
        const destPath = join(destDir, relPath);

        await mkdir(dirname(destPath), { recursive: true });

        let content = await readFile(srcPath, "utf-8");
        for (const [key, value] of Object.entries(vars)) {
          content = content.replaceAll(`{{${key}}}`, value);
        }
        await writeFile(destPath, content, "utf-8");
      }
    },

    async readJson<T = unknown>(filePath: string): Promise<T> {
      const raw = await readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    },

    async writeJson(
      filePath: string,
      data: unknown,
      options?: { sudo?: boolean }
    ) {
      const content = JSON.stringify(data, null, 2) + "\n";

      if (dryRun) {
        ui.printStep(`[dry-run] write ${filePath}`);
        return;
      }

      if (options?.sudo) {
        // Write to temp file, then sudo mv
        const tmpPath = `/tmp/ai-setup-${Date.now()}.json`;
        await writeFile(tmpPath, content, "utf-8");
        await execa("sudo", ["mkdir", "-p", dirname(filePath)]);
        await execa("sudo", ["mv", tmpPath, filePath]);
      } else {
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, content, "utf-8");
      }
    },

    async exists(filePath: string): Promise<boolean> {
      return existsSync(filePath);
    },

    async readToml<T = Record<string, unknown>>(filePath: string): Promise<T> {
      const raw = await readFile(filePath, "utf-8");
      return parseToml(raw) as T;
    },

    async writeToml(
      filePath: string,
      data: Record<string, unknown>,
      options?: { sudo?: boolean }
    ) {
      const content = stringifyToml(data) + "\n";

      if (dryRun) {
        ui.printStep(`[dry-run] write ${filePath}`);
        return;
      }

      if (options?.sudo) {
        const tmpPath = `/tmp/ai-setup-${Date.now()}.toml`;
        await writeFile(tmpPath, content, "utf-8");
        await execa("sudo", ["mkdir", "-p", dirname(filePath)]);
        await execa("sudo", ["mv", tmpPath, filePath]);
      } else {
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, content, "utf-8");
      }
    },
  };
}

/** Recursively list all file paths relative to `dir` */
async function walkDir(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...(await walkDir(join(dir, entry.name), relPath)));
    } else {
      results.push(relPath);
    }
  }

  return results;
}
