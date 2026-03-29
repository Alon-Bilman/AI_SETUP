---
name: fullstack-typescript-style
description: >-
  Full-stack TypeScript code style conventions
applyTo: "**/*.{ts,tsx}"
---

# Code Style — Full-Stack TypeScript

- Use `camelCase` for variables/functions, `PascalCase` for components/classes/types, `UPPER_SNAKE` for constants.
- Backend files: kebab-case (`user-service.ts`). Frontend files: PascalCase for components (`UserCard.tsx`), camelCase for hooks/utils.
- Order imports: Node builtins → external packages → workspace packages (@project/) → relative imports.
- Separate import groups with blank lines.
- Maximum line length: 100 characters.
- TypeScript strict mode (`"strict": true`) in all `tsconfig.json` files.
- Prefer `const` over `let`. Never use `var`. Never use `any`.
- Shared types in `packages/shared/` — both frontend and backend import from there.
- All environment variables accessed through a single validated config module per package.
- Prefer functional patterns: pure functions, immutable data, explicit data flow.
