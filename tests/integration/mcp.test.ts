import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { writeMcpConfig } from "../../src/lib/mcp.js";
import { createFs } from "../../src/lib/template.js";
import type { McpTarget } from "../../src/core/types.js";
import { parse as parseToml } from "smol-toml";

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

describe("writeMcpConfig — TOML", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-mcp-toml-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("reads TOML source and writes to a new TOML destination", async () => {
    const destPath = join(tmpDir, "config.toml");
    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(FIXTURE_AGENT_DIR, "global.toml", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = parseToml(content);
    const servers = parsed.mcp_servers as Record<string, Record<string, unknown>>;
    expect(servers).toBeDefined();
    expect(servers["fake-toml-server"]).toBeDefined();
    expect(servers["fake-toml-server"].command).toBe("echo");
    expect(servers["fake-toml-server"].args).toEqual(["hello-toml"]);
  });

  it("merges into existing TOML without clobbering user settings", async () => {
    const destPath = join(tmpDir, "config.toml");

    // Write pre-existing user config
    const existingToml = [
      'model = "gpt-5.4"',
      'approval_policy = "on-request"',
      "",
      "[mcp_servers.user-server]",
      'command = "node"',
      'args = ["my-server.js"]',
      "",
    ].join("\n");
    await writeFile(destPath, existingToml);

    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(FIXTURE_AGENT_DIR, "global.toml", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = parseToml(content) as Record<string, unknown>;

    // User settings preserved
    expect(parsed.model).toBe("gpt-5.4");
    expect(parsed.approval_policy).toBe("on-request");

    // Pre-existing MCP server preserved
    const servers = parsed.mcp_servers as Record<string, Record<string, unknown>>;
    expect(servers["user-server"]).toBeDefined();
    expect(servers["user-server"].command).toBe("node");

    // New MCP server added
    expect(servers["fake-toml-server"]).toBeDefined();
    expect(servers["fake-toml-server"].command).toBe("echo");
  });

  it("reads real codex MCP config successfully", async () => {
    const codexDir = resolve(__dirname, "../../agents/codex");
    const destPath = join(tmpDir, "config.toml");
    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(codexDir, "global.toml", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = parseToml(content);
    const servers = parsed.mcp_servers as Record<string, Record<string, unknown>>;
    expect(servers).toBeDefined();
    expect(servers["context7"]).toBeDefined();
    expect(servers["sequential-thinking"]).toBeDefined();
    expect(servers["memory"]).toBeDefined();
  });

  it("creates intermediate directories for TOML targets", async () => {
    const destPath = join(tmpDir, "deep", "nested", "config.toml");
    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(FIXTURE_AGENT_DIR, "global.toml", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = parseToml(content);
    expect(parsed.mcp_servers).toBeDefined();
  });

  it("handles malformed existing TOML by starting fresh", async () => {
    const destPath = join(tmpDir, "config.toml");
    await writeFile(destPath, "this is [[[not valid toml");

    const target: McpTarget = { path: destPath };
    const fs = createFs(false);

    await writeMcpConfig(FIXTURE_AGENT_DIR, "global.toml", target, fs);

    const content = await readFile(destPath, "utf-8");
    const parsed = parseToml(content);
    const servers = parsed.mcp_servers as Record<string, Record<string, unknown>>;
    expect(servers["fake-toml-server"]).toBeDefined();
  });
});
