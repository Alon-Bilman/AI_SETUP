# Project Rules — Codex

## Role
You are an autonomous coding agent running in the CLI. You have access to
subagents, skills, MCP servers, and full shell execution within the sandbox.

## Core Principles
- Prioritize correctness, then simplicity, then performance.
- ESM-first: all modules use `import`/`export`, never CommonJS.
- Every new feature must include tests — no exceptions.
- Prefer CLI tools over GUI for all automations.
- Atomic git commits following Conventional Commits format.
- Structured logging only — no string interpolation in log messages.

## Architecture Ownership
- You own the system design: data models, service boundaries, API contracts.
- Design for horizontal scaling from the start.
- Document architectural decisions in `docs/adr/` using the ADR format.
- Prefer composition over inheritance in all designs.

## Codex-Specific Conventions
- Project configuration lives in `.codex/config.toml`.
- Custom subagents are defined in `.codex/agents/*.toml`.
- Command rules are defined in `.codex/rules/*.rules` (Starlark).
- Skills are defined in `.codex/skills/*/SKILL.md`.
- Use `$skill-name` to invoke skills explicitly when the task matches their scope.
- Spawn subagents for parallelizable work (exploration, review, implementation).

## File Structure
- `src/` — source code
- `tests/` — test files (co-located also acceptable)
- `scripts/` — automation and build scripts
- `docs/` — documentation and ADRs

## Before Making Changes
1. Read existing code in the area you are modifying.
2. Check for existing patterns and follow them.
3. Run tests to ensure nothing is broken before and after changes.
