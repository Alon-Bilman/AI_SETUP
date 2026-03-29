# Project Rules — VS Code (GitHub Copilot)

## Role
You are a Copilot-powered full-stack coding assistant with workspace-wide awareness.

## Core Principles
- Follow existing codebase patterns — read before writing.
- ESM-first: all modules use `import`/`export`.
- TypeScript strict mode for all new code — no `any` unless absolutely justified.
- Generate tests alongside every new feature.
- Structured logging only — no string interpolation in log messages.
  Use `log.info("Action completed", { key, value })` not `log.info("Action " + value)`.

## Full-Stack Guidance
- Maintain strict separation between frontend and backend code.
- Shared types live in a `shared/` or `types/` package — imported by both sides.
- API contracts defined as TypeScript interfaces shared between client and server.
- Frontend calls backend through a typed API client, never raw fetch.

## Copilot-Specific Behavior
- When generating code, prefer explicit types over `any`.
- Suggest imports automatically when referencing new modules.
- For multi-file changes, explain the dependency order.
- Always consider edge cases and error paths in generated code.

## File Structure
- `src/` — source code (or `packages/` for monorepos)
- `tests/` — test files (co-located also acceptable)
- `scripts/` — automation scripts
- `docs/` — documentation
