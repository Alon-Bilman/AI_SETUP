import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { writeMcpConfig } from "../../src/lib/mcp.js";
import { createFs } from "../../src/lib/template.js";
import type { McpTarget } from "../../src/core/types.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const FIXTURE_AGENT_DIR = resolve(__dirname, "../fixtures/fake-agent");

describe("writeMcpConfig", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-mcp-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("reads MCP source JSON and writes it to the target path", async () => {
    const destPath = join(tmpDir, "mcp-output.json");
    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(FIXTURE_AGENT_DIR, "global.json", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers).toBeDefined();
    expect(parsed.mcpServers["fake-server"]).toBeDefined();
    expect(parsed.mcpServers["fake-server"].command).toBe("echo");
  });

  it("creates intermediate directories for the target", async () => {
    const destPath = join(tmpDir, "deep", "nested", "mcp.json");
    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(FIXTURE_AGENT_DIR, "global.json", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers).toBeDefined();
  });

  it("reads real claude MCP config successfully", async () => {
    const claudeDir = resolve(__dirname, "../../agents/claude");
    const destPath = join(tmpDir, "claude-mcp.json");
    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(claudeDir, "global.json", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers).toBeDefined();
    expect(parsed.mcpServers["sequential-thinking"]).toBeDefined();
  });
});

describe("expandHome", () => {
  it("expands ~ to HOME directory", async () => {
    const { expandHome } = await import("../../src/lib/mcp.js");
    const result = expandHome("~/some/path");
    expect(result).toBe(`${process.env.HOME}/some/path`);
  });

  it("leaves absolute paths unchanged", async () => {
    const { expandHome } = await import("../../src/lib/mcp.js");
    expect(expandHome("/absolute/path")).toBe("/absolute/path");
  });

  it("leaves relative paths unchanged", async () => {
    const { expandHome } = await import("../../src/lib/mcp.js");
    expect(expandHome("relative/path")).toBe("relative/path");
  });
});
