import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { createContext } from "../../src/core/runner.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const FIXTURE_AGENT_DIR = resolve(__dirname, "../fixtures/fake-agent");

describe("createContext", () => {
  it("returns a context with all required helpers", () => {
    const ctx = createContext(FIXTURE_AGENT_DIR, false);

    expect(ctx.shell).toBeDefined();
    expect(ctx.ui).toBeDefined();
    expect(ctx.fs).toBeDefined();
    expect(ctx.agentDir).toBe(FIXTURE_AGENT_DIR);
    expect(ctx.dryRun).toBe(false);
  });

  it("respects dryRun flag", () => {
    const ctx = createContext(FIXTURE_AGENT_DIR, true);
    expect(ctx.dryRun).toBe(true);
  });

  it("shell.exec is a no-op in dry-run mode", async () => {
    const ctx = createContext(FIXTURE_AGENT_DIR, true);
    const result = await ctx.shell.exec("echo", ["should not run"]);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });

  it("shell.exec works in live mode", async () => {
    const ctx = createContext(FIXTURE_AGENT_DIR, false);
    const result = await ctx.shell.exec("echo", ["hello"]);
    expect(result.stdout.trim()).toBe("hello");
  });

  it("fs.writeJson + readJson round-trips correctly", async () => {
    const { mkdtemp, rm } = await import("fs/promises");
    const { join } = await import("path");
    const { tmpdir } = await import("os");

    const tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-ctx-"));
    const ctx = createContext(FIXTURE_AGENT_DIR, false);

    const filePath = join(tmpDir, "round-trip.json");
    const data = { test: true, items: [1, 2, 3] };

    await ctx.fs.writeJson(filePath, data);
    const result = await ctx.fs.readJson(filePath);
    expect(result).toEqual(data);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it("fs operations are no-ops in dry-run mode", async () => {
    const { mkdtemp, rm } = await import("fs/promises");
    const { join } = await import("path");
    const { tmpdir } = await import("os");
    const { existsSync } = await import("fs");

    const tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-ctx-dry-"));
    const ctx = createContext(FIXTURE_AGENT_DIR, true);

    const filePath = join(tmpDir, "should-not-exist.json");
    await ctx.fs.writeJson(filePath, { nope: true });
    expect(existsSync(filePath)).toBe(false);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it("ui helpers are callable functions", () => {
    const ctx = createContext(FIXTURE_AGENT_DIR, false);

    expect(typeof ctx.ui.printHeader).toBe("function");
    expect(typeof ctx.ui.printStep).toBe("function");
    expect(typeof ctx.ui.printSuccess).toBe("function");
    expect(typeof ctx.ui.printError).toBe("function");
    expect(typeof ctx.ui.printWarning).toBe("function");
    expect(typeof ctx.ui.pauseForAuth).toBe("function");
  });
});

describe("createContext — driver integration", () => {
  it("context works when passed to a fixture driver", async () => {
    const ctx = createContext(FIXTURE_AGENT_DIR, false);
    const { driver, resetTracking, getTracking } = await import(
      "../fixtures/fake-agent/driver.js"
    );

    resetTracking();
    expect(getTracking().installCalled).toBe(false);

    await driver.install(ctx);
    expect(getTracking().installCalled).toBe(true);

    await driver.authenticate(ctx);
    expect(getTracking().authenticateCalled).toBe(true);

    await driver.uninstall(ctx);
    expect(getTracking().uninstallCalled).toBe(true);
  });
});
