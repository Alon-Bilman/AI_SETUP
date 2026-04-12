import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "fs/promises";
import { readdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createFs } from "../../src/lib/template.js";

describe("copyScaffold", () => {
  let srcDir: string;
  let destDir: string;

  beforeEach(async () => {
    srcDir = await mkdtemp(join(tmpdir(), "ai-setup-scaffold-src-"));
    destDir = await mkdtemp(join(tmpdir(), "ai-setup-scaffold-dest-"));
  });

  afterEach(async () => {
    await rm(srcDir, { recursive: true, force: true });
    await rm(destDir, { recursive: true, force: true });
  });

  it("copies files and replaces {{VAR}} tokens", async () => {
    await writeFile(join(srcDir, "README.md"), "# {{PROJECT_NAME}}\nBuilt in {{PROJECT_DIR}}");
    await mkdir(join(srcDir, "sub"), { recursive: true });
    await writeFile(join(srcDir, "sub", "data.json"), '{"name":"{{PROJECT_NAME}}"}');

    const fs = createFs(false);
    await fs.copyScaffold(srcDir, destDir, {
      PROJECT_NAME: "my-app",
      PROJECT_DIR: "/home/user/my-app",
    });

    const readme = await readFile(join(destDir, "README.md"), "utf-8");
    expect(readme).toBe("# my-app\nBuilt in /home/user/my-app");

    const data = await readFile(join(destDir, "sub", "data.json"), "utf-8");
    expect(data).toBe('{"name":"my-app"}');
  });

  it("copies files without modification when no vars are provided", async () => {
    const content = "No templates here, just text.";
    await writeFile(join(srcDir, "plain.txt"), content);

    const fs = createFs(false);
    await fs.copyScaffold(srcDir, destDir);

    const result = await readFile(join(destDir, "plain.txt"), "utf-8");
    expect(result).toBe(content);
  });

  it("handles deeply nested directory structures", async () => {
    await mkdir(join(srcDir, "a", "b", "c"), { recursive: true });
    await writeFile(join(srcDir, "a", "b", "c", "deep.txt"), "{{NAME}}");

    const fs = createFs(false);
    await fs.copyScaffold(srcDir, destDir, { NAME: "deep-value" });

    const result = await readFile(join(destDir, "a", "b", "c", "deep.txt"), "utf-8");
    expect(result).toBe("deep-value");
  });

  it("does nothing in dry-run mode", async () => {
    await writeFile(join(srcDir, "file.txt"), "content");

    const fs = createFs(true);
    await fs.copyScaffold(srcDir, destDir, { PROJECT_NAME: "test" });

    expect(readdirSync(destDir)).toHaveLength(0);
  });
});

describe("copyScaffold with fixture agent", () => {
  let destDir: string;

  beforeEach(async () => {
    destDir = await mkdtemp(join(tmpdir(), "ai-setup-scaffold-fixture-"));
  });

  afterEach(async () => {
    await rm(destDir, { recursive: true, force: true });
  });

  it("scaffolds from the fake-agent fixture with variable replacement", async () => {
    const { resolve } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    const fixtureScaffold = resolve(__dirname, "../fixtures/fake-agent/scaffold");

    const fs = createFs(false);
    await fs.copyScaffold(fixtureScaffold, destDir, {
      PROJECT_NAME: "test-project",
      PROJECT_DIR: "/tmp/test-project",
    });

    const readme = await readFile(join(destDir, "README.md"), "utf-8");
    expect(readme).toContain("# test-project");
    expect(readme).toContain("/tmp/test-project");

    const config = await readFile(join(destDir, "sub", "config.json"), "utf-8");
    const parsed = JSON.parse(config);
    expect(parsed.name).toBe("test-project");
  });
});

describe("readJson / writeJson", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-json-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("writeJson creates a JSON file and readJson reads it back", async () => {
    const fs = createFs(false);
    const filePath = join(tmpDir, "test.json");
    const data = { key: "value", nested: { arr: [1, 2, 3] } };

    await fs.writeJson(filePath, data);
    const result = await fs.readJson(filePath);

    expect(result).toEqual(data);
  });

  it("writeJson creates intermediate directories", async () => {
    const fs = createFs(false);
    const filePath = join(tmpDir, "a", "b", "deep.json");
    await fs.writeJson(filePath, { deep: true });

    const result = await fs.readJson<{ deep: boolean }>(filePath);
    expect(result.deep).toBe(true);
  });

  it("writeJson is a no-op in dry-run mode", async () => {
    const fs = createFs(true);
    const filePath = join(tmpDir, "nope.json");
    await fs.writeJson(filePath, { data: true });

    const { existsSync } = await import("fs");
    expect(existsSync(filePath)).toBe(false);
  });
});

describe("exists", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-exists-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns true for existing files", async () => {
    const fs = createFs(false);
    const filePath = join(tmpDir, "exists.txt");
    await writeFile(filePath, "hi");

    expect(await fs.exists(filePath)).toBe(true);
  });

  it("returns false for non-existing files", async () => {
    const fs = createFs(false);
    expect(await fs.exists(join(tmpDir, "nope.txt"))).toBe(false);
  });
});

describe("readToml / writeToml", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "ai-setup-toml-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("writeToml creates a TOML file and readToml reads it back", async () => {
    const fs = createFs(false);
    const filePath = join(tmpDir, "test.toml");
    const data = { key: "value", nested: { arr: [1, 2, 3] } };

    await fs.writeToml(filePath, data);
    const result = await fs.readToml(filePath);

    expect(result).toEqual(data);
  });

  it("writeToml creates intermediate directories", async () => {
    const fs = createFs(false);
    const filePath = join(tmpDir, "a", "b", "deep.toml");
    await fs.writeToml(filePath, { deep: true });

    const result = await fs.readToml<{ deep: boolean }>(filePath);
    expect(result.deep).toBe(true);
  });

  it("writeToml is a no-op in dry-run mode", async () => {
    const fs = createFs(true);
    const filePath = join(tmpDir, "nope.toml");
    await fs.writeToml(filePath, { data: true });

    const { existsSync } = await import("fs");
    expect(existsSync(filePath)).toBe(false);
  });

  it("round-trips MCP server config as valid TOML", async () => {
    const fs = createFs(false);
    const filePath = join(tmpDir, "config.toml");
    const data = {
      mcp_servers: {
        context7: {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp"],
        },
      },
    };

    await fs.writeToml(filePath, data);
    const result = await fs.readToml<typeof data>(filePath);

    expect(result.mcp_servers.context7.command).toBe("npx");
    expect(result.mcp_servers.context7.args).toEqual(["-y", "@upstash/context7-mcp"]);
  });

  it("preserves string content when reading raw TOML", async () => {
    const tomlContent = [
      'model = "gpt-5.4"',
      "",
      "[mcp_servers.test]",
      'command = "echo"',
      'args = ["hello"]',
      "",
    ].join("\n");
    await writeFile(join(tmpDir, "raw.toml"), tomlContent);

    const fs = createFs(false);
    const result = await fs.readToml<Record<string, unknown>>(join(tmpDir, "raw.toml"));

    expect(result.model).toBe("gpt-5.4");
    expect(result.mcp_servers).toBeDefined();
  });
});
