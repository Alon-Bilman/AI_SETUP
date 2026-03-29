import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { existsSync, lstatSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createShell } from "../../src/lib/shell.js";

describe("createShell (live mode)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-shell-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("exec", () => {
    it("runs a command and captures stdout", async () => {
      const shell = createShell(false);
      const result = await shell.exec("echo", ["hello world"]);
      expect(result.stdout.trim()).toBe("hello world");
    });

    it("captures stderr from commands", async () => {
      const shell = createShell(false);
      // ls on a non-existent path writes to stderr
      await expect(shell.exec("ls", ["/nonexistent-path-12345"])).rejects.toThrow();
    });
  });

  describe("safeRm", () => {
    it("removes an existing file", async () => {
      const shell = createShell(false);
      const filePath = join(tmpDir, "to-remove.txt");
      await writeFile(filePath, "delete me");

      expect(existsSync(filePath)).toBe(true);
      await shell.safeRm(filePath);
      expect(existsSync(filePath)).toBe(false);
    });

    it("removes an existing directory recursively", async () => {
      const shell = createShell(false);
      const { mkdir } = await import("fs/promises");
      const dirPath = join(tmpDir, "dir-to-remove");
      await mkdir(dirPath, { recursive: true });
      await writeFile(join(dirPath, "inner.txt"), "content");

      await shell.safeRm(dirPath);
      expect(existsSync(dirPath)).toBe(false);
    });

    it("does not throw when target does not exist", async () => {
      const shell = createShell(false);
      await expect(shell.safeRm(join(tmpDir, "nonexistent"))).resolves.not.toThrow();
    });
  });

  describe("retry", () => {
    it("returns result on first success", async () => {
      const shell = createShell(false);
      const result = await shell.retry(async () => 42);
      expect(result).toBe(42);
    });

    it("retries on failure and eventually succeeds", async () => {
      const shell = createShell(false);
      let attempt = 0;
      const result = await shell.retry(async () => {
        attempt++;
        if (attempt < 2) throw new Error("not yet");
        return "done";
      }, 2);
      expect(result).toBe("done");
      expect(attempt).toBe(2);
    });

    it("throws after exhausting all attempts", async () => {
      const shell = createShell(false);
      await expect(
        shell.retry(async () => {
          throw new Error("always fails");
        }, 2)
      ).rejects.toThrow("always fails");
    });
  });
});

describe("createShell (dry-run mode)", () => {
  describe("exec", () => {
    it("returns empty stdout/stderr without running the command", async () => {
      const shell = createShell(true);
      const result = await shell.exec("rm", ["-rf", "/"]);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe("");
    });
  });

  describe("safeRm", () => {
    it("does not actually remove files", async () => {
      const shell = createShell(true);
      const dir = await mkdtemp(join(tmpdir(), "ai-setup-dryshell-"));
      const filePath = join(dir, "keep-me.txt");
      await writeFile(filePath, "important");

      await shell.safeRm(filePath);
      expect(existsSync(filePath)).toBe(true);

      await rm(dir, { recursive: true, force: true });
    });
  });

  describe("sudoRm", () => {
    it("does not actually remove files", async () => {
      const shell = createShell(true);
      const dir = await mkdtemp(join(tmpdir(), "ai-setup-dryshell-"));
      const filePath = join(dir, "keep-me.txt");
      await writeFile(filePath, "important");

      await shell.sudoRm(filePath);
      expect(existsSync(filePath)).toBe(true);

      await rm(dir, { recursive: true, force: true });
    });
  });
});
