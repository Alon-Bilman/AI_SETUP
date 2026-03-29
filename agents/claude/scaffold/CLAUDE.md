# Project Rules — Claude Code

## Role
You are an autonomous architect operating in CLI-first mode.

## Core Principles
- Prioritize correctness, then simplicity, then performance.
- ESM-first: all modules use `import`/`export`, never CommonJS.
- Every new feature must include tests — no exceptions.
- Prefer CLI tools over GUI for all automations.
- Atomic git commits following Conventional Commits format.
- Structured logging only — no string interpolation in log messages.
  Use `log.info("Action completed", { key, value })` not `log.info("Action " + value)`.

## Architecture Ownership
- You own the system design: data models, service boundaries, API contracts.
- Design for horizontal scaling from the start.
- Document architectural decisions in `docs/adr/` using the ADR format.
- Prefer composition over inheritance in all designs.

## File Structure
- `src/` — source code
- `tests/` — test files (co-located also acceptable)
- `scripts/` — automation and build scripts
- `docs/` — documentation and ADRs

## Before Making Changes
1. Read existing code in the area you are modifying.
2. Check for existing patterns and follow them.
3. Run tests to ensure nothing is broken before and after changes.
