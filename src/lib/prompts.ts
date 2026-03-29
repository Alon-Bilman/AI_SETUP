import { input, select, checkbox, confirm } from "@inquirer/prompts";
import type { DiscoveredAgent, DiscoveredPlugin } from "../core/types.js";

export async function selectAgents(
  agents: DiscoveredAgent[],
  action: "install" | "remove"
): Promise<DiscoveredAgent[]> {
  const choices = agents.map((a) => ({
    name: `${a.config.icon} ${a.config.name} — ${a.config.description}`,
    value: a.config.id,
    checked: true,
  }));

  const selected = await checkbox({
    message: `Which agents do you want to ${action}?`,
    choices,
  });

  return agents.filter((a) => selected.includes(a.config.id));
}

export async function selectOneAgent(
  agents: DiscoveredAgent[]
): Promise<DiscoveredAgent> {
  const choices = agents.map((a) => ({
    name: `${a.config.icon} ${a.config.name} — ${a.config.description}`,
    value: a.config.id,
  }));

  const selected = await select({
    message: "Select an agent for this project:",
    choices,
  });

  return agents.find((a) => a.config.id === selected)!;
}

export async function selectPlugins(
  plugins: DiscoveredPlugin[],
  agentId: string
): Promise<DiscoveredPlugin[]> {
  const compatible = plugins.filter(
    (p) =>
      p.config.compatibleAgents.length === 0 ||
      p.config.compatibleAgents.includes(agentId)
  );

  if (compatible.length === 0) return [];

  const choices = compatible.map((p) => ({
    name: `${p.config.icon} ${p.config.name} — ${p.config.description}`,
    value: p.config.id,
    checked: false,
  }));

  const selected = await checkbox({
    message: "Add optional plugins? (space to select, enter to continue)",
    choices,
  });

  return compatible.filter((p) => selected.includes(p.config.id));
}

export async function promptProjectName(): Promise<string> {
  return input({
    message: "Project name:",
    validate: (v) => {
      if (!v.trim()) return "Project name cannot be empty.";
      if (/[^a-zA-Z0-9._-]/.test(v)) return "Use only letters, numbers, dots, hyphens, underscores.";
      return true;
    },
  });
}

export async function confirmNuke(): Promise<boolean> {
  const answer = await input({
    message:
      "⚠️  This will permanently remove all agents, configs, and foundations.\n  Type NUKE to confirm:",
  });
  return answer === "NUKE";
}

export async function askAbortOrContinue(failedCmd: string): Promise<boolean> {
  return confirm({
    message: `"${failedCmd}" failed. Continue anyway?`,
    default: false,
  });
}
