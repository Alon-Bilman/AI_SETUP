---
name: project-conventions
description: >-
  Project structure, coding standards, and testing expectations.
  Triggers when Codex needs guidance on how code should be organized,
  what patterns to follow, or how tests should be written.
---

# Project Conventions

## Code Organization
- Source code in `src/`, tests in `tests/` (co-located also acceptable).
- One module per file. Filename matches the primary export.
- Import order: Node builtins → external packages → internal modules → types.
- ESM only: `import`/`export`, never `require`/`module.exports`.

## TypeScript Standards
- Strict mode enabled in all `tsconfig.json` files.
- Never use `any` — use `unknown` and narrow with type guards.
- `interface` for object shapes, `type` for unions/intersections/mapped types.
- `const` over `let`. Never `var`.
- Max line length: 100 characters.

## Testing Requirements
- Every new feature or bug fix must include tests.
- Unit tests isolate business logic, mock I/O boundaries.
- Integration tests verify real behavior across module boundaries.
- Test files co-located: `module.ts` → `module.test.ts`.
- Minimum 80% line coverage on new code. Critical paths: 100%.
- Run `npm test` before committing.

## Git Workflow
- Atomic commits following Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`.
- Branch naming: `feat/description`, `fix/description`, `chore/description`.
- Squash-merge feature branches into main.
- Never force-push to shared branches.

## Documentation
- Public APIs documented with JSDoc.
- Architectural decisions recorded in `docs/adr/` using ADR format.
- README updated when setup steps or project structure change.
