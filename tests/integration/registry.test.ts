import { describe, it, expect } from "vitest";
import { discoverAgents, discoverPlugins } from "../../src/core/registry.js";

describe("discoverAgents", () => {
  it("finds all non-template agents in agents/", async () => {
    const agents = await discoverAgents();
    const ids = agents.map((a) => a.config.id);

    expect(ids).toContain("claude");
    expect(ids).toContain("cursor");
    expect(ids).toContain("vscode");
  });

  it("skips _template directory", async () => {
    const agents = await discoverAgents();
    const ids = agents.map((a) => a.config.id);

    expect(ids).not.toContain("_template");
  });

  it("returns agents sorted alphabetically", async () => {
    const agents = await discoverAgents();
    const names = agents.map((a) => a.config.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sorted);
  });

  it("loads valid configs with all required fields", async () => {
    const agents = await discoverAgents();
    expect(agents.length).toBeGreaterThan(0);

    for (const agent of agents) {
      expect(agent.config.name).toBeTruthy();
      expect(agent.config.id).toBeTruthy();
      expect(agent.config.description).toBeTruthy();
      expect(agent.config.icon).toBeTruthy();
      expect(agent.config.requires).toBeDefined();
      expect(agent.config.installMethod).toBeTruthy();
      expect(agent.config.mcp).toBeDefined();
      expect(agent.config.cleanup).toBeDefined();
      expect(agent.config.cleanup.paths).toBeInstanceOf(Array);
      expect(agent.config.cleanup.sudoPaths).toBeInstanceOf(Array);
    }
  });

  it("loads drivers with all 4 required methods", async () => {
    const agents = await discoverAgents();

    for (const agent of agents) {
      expect(typeof agent.driver.isInstalled).toBe("function");
      expect(typeof agent.driver.install).toBe("function");
      expect(typeof agent.driver.authenticate).toBe("function");
      expect(typeof agent.driver.uninstall).toBe("function");
    }
  });

  it("sets dir to the absolute agent directory path", async () => {
    const agents = await discoverAgents();

    for (const agent of agents) {
      expect(agent.dir).toContain(`agents/${agent.config.id}`);
      expect(agent.dir).toMatch(/^\//); // absolute path
    }
  });
});

describe("discoverPlugins", () => {
  it("skips _template directory", async () => {
    const plugins = await discoverPlugins();
    const ids = plugins.map((p) => p.config.id);

    expect(ids).not.toContain("_template");
  });

  it("returns sorted plugins", async () => {
    const plugins = await discoverPlugins();
    const names = plugins.map((p) => p.config.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sorted);
  });
});
