// ─── Agent Configuration (agent.json schema) ────────────────────────────

export interface McpTarget {
  /** Absolute path (supports ~ for home dir) where MCP config should be written */
  path: string;
  /** Whether this MCP config requires sudo to write */
  sudo?: boolean;
}

export interface AgentConfig {
  /** Human-readable agent name, e.g. "Claude Code" */
  name: string;
  /** Machine-readable ID matching the folder name, e.g. "claude" */
  id: string;
  /** One-line description shown in menus */
  description: string;
  /** Emoji icon for UI display */
  icon: string;
  /** Foundation dependencies required before this agent can be installed */
  requires: string[];
  /** Install method: "brew-cask" for macOS apps, "custom" for agents with bespoke install */
  installMethod: "brew-cask" | "brew" | "npm-global" | "custom";
  /** Brew cask or formula name (when installMethod is "brew-cask" or "brew") */
  brewPackage?: string;
  /** npm package name (when installMethod is "npm-global") */
  npmPackage?: string;
  /** App bundle path for macOS app detection, e.g. "/Applications/Cursor.app" */
  appPath?: string;
  /** CLI command name to check if installed, e.g. "claude" */
  command?: string;
  /** MCP config targets — each entry under mcp/ folder maps to a destination */
  mcp: Record<string, McpTarget>;
  /** Paths to remove during nuke (supports ~) */
  cleanup: {
    paths: string[];
    sudoPaths: string[];
  };
}

// ─── Agent Driver (implemented per agent in driver.ts) ───────────────────

export interface AgentDriver {
  isInstalled(): Promise<boolean>;
  install(ctx: Context): Promise<void>;
  authenticate(ctx: Context): Promise<void>;
  uninstall(ctx: Context): Promise<void>;
}

// ─── Plugin Configuration (plugin.json schema) ──────────────────────────

export interface PluginConfig {
  name: string;
  id: string;
  description: string;
  icon: string;
  /** Which agent IDs this plugin is compatible with. Empty = all agents. */
  compatibleAgents: string[];
}

// ─── Context (injected into drivers and plugins) ─────────────────────────

export interface ShellHelpers {
  exec(cmd: string, args?: string[]): Promise<{ stdout: string; stderr: string }>;
  execLive(cmd: string, args?: string[]): Promise<void>;
  retry<T>(fn: () => Promise<T>, attempts?: number): Promise<T>;
  safeRm(target: string): Promise<void>;
  sudoRm(target: string): Promise<void>;
}

export interface UiHelpers {
  printHeader(emoji: string, title: string): void;
  printStep(msg: string): void;
  printSuccess(msg: string): void;
  printError(msg: string): void;
  printWarning(msg: string): void;
  pauseForAuth(instructions: string[]): Promise<void>;
}

export interface FsHelpers {
  copyScaffold(srcDir: string, destDir: string, vars?: Record<string, string>): Promise<void>;
  readJson<T = unknown>(filePath: string): Promise<T>;
  writeJson(filePath: string, data: unknown, options?: { sudo?: boolean }): Promise<void>;
  readToml<T = Record<string, unknown>>(filePath: string): Promise<T>;
  writeToml(filePath: string, data: Record<string, unknown>, options?: { sudo?: boolean }): Promise<void>;
  exists(filePath: string): Promise<boolean>;
}

export interface Context {
  shell: ShellHelpers;
  ui: UiHelpers;
  fs: FsHelpers;
  /** Absolute path to the agent's directory under agents/ */
  agentDir: string;
  /** Whether to print actions without executing them */
  dryRun: boolean;
}

// ─── Discovered Agent (config + loaded driver) ──────────────────────────

export interface DiscoveredAgent {
  config: AgentConfig;
  driver: AgentDriver;
  /** Absolute path to agents/<id>/ */
  dir: string;
}

export interface DiscoveredPlugin {
  config: PluginConfig;
  /** Absolute path to plugins/<id>/ */
  dir: string;
}
