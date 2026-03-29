import { describe, it, expect, afterEach } from "vitest";
import { writeFile, mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { loadAgentConfig } from "../../src/core/config.js";

describe("loadAgentConfig", () => {
  const tmpDirs: string[] = [];

  async function writeTempConfig(data: Record<string, unknown>): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "ai-setup-cfg-"));
    tmpDirs.push(dir);
    const path = join(dir, "agent.json");
    await writeFile(path, JSON.stringify(data));
    return path;
  }

  afterEach(async () => {
    for (const dir of tmpDirs) {
      await rm(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("loads a valid config with all required fields", async () => {
    const path = await writeTempConfig({
      name: "Test Agent",
      id: "test",
      description: "A test agent",
      icon: "🧪",
      requires: ["homebrew"],
      installMethod: "custom",
      mcp: { "global.json": { path: "~/.test/mcp.json" } },
      cleanup: { paths: ["~/.test"], sudoPaths: ["/tmp/test"] },
    });

    const config = await loadAgentConfig(path);
    expect(config.name).toBe("Test Agent");
    expect(config.id).toBe("test");
    expect(config.installMethod).toBe("custom");
    expect(config.cleanup.paths).toEqual(["~/.test"]);
    expect(config.cleanup.sudoPaths).toEqual(["/tmp/test"]);
  });

  it("rejects config missing 'name'", async () => {
    const path = await writeTempConfig({
      id: "test",
      description: "x",
      icon: "🧪",
      requires: [],
      installMethod: "custom",
      mcp: {},
      cleanup: { paths: [], sudoPaths: [] },
    });

    await expect(loadAgentConfig(path)).rejects.toThrow('missing required field "name"');
  });

  it("rejects config missing 'mcp'", async () => {
    const path = await writeTempConfig({
      name: "Test",
      id: "test",
      description: "x",
      icon: "🧪",
      requires: [],
      installMethod: "custom",
      cleanup: { paths: [], sudoPaths: [] },
    });

    await expect(loadAgentConfig(path)).rejects.toThrow('missing required field "mcp"');
  });

  it("rejects config missing 'cleanup'", async () => {
    const path = await writeTempConfig({
      name: "Test",
      id: "test",
      description: "x",
      icon: "🧪",
      requires: [],
      installMethod: "custom",
      mcp: {},
    });

    await expect(loadAgentConfig(path)).rejects.toThrow('missing required field "cleanup"');
  });

  it("defaults cleanup.paths and cleanup.sudoPaths to empty arrays", async () => {
    const path = await writeTempConfig({
      name: "Test",
      id: "test",
      description: "x",
      icon: "🧪",
      requires: [],
      installMethod: "custom",
      mcp: {},
      cleanup: {},
    });

    const config = await loadAgentConfig(path);
    expect(config.cleanup.paths).toEqual([]);
    expect(config.cleanup.sudoPaths).toEqual([]);
  });

  it("throws on malformed JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ai-setup-cfg-"));
    tmpDirs.push(dir);
    const path = join(dir, "agent.json");
    await writeFile(path, "{ not valid json");

    await expect(loadAgentConfig(path)).rejects.toThrow();
  });

  it("loads the real claude agent.json successfully", async () => {
    const { resolve } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    const claudeConfig = resolve(__dirname, "../../agents/claude/agent.json");

    const config = await loadAgentConfig(claudeConfig);
    expect(config.name).toBe("Claude Code");
    expect(config.id).toBe("claude");
    expect(config.installMethod).toBe("custom");
  });
});
