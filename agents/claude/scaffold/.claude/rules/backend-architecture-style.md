# Code Style — Backend / Architecture

- Use `camelCase` for variables/functions, `PascalCase` for classes, `UPPER_SNAKE` for constants.
- One module per file. Name files after their primary export in kebab-case.
- Order imports: Node builtins → external packages → internal modules → relative imports.
- Separate import groups with blank lines.
- Maximum line length: 100 characters.
- Use TypeScript strict mode (`"strict": true`) for all projects.
- Prefer `const` over `let`. Never use `var`.
- Use async/await over raw Promises. Never mix callbacks and promises.
- Prefer pure functions and immutable data. Avoid side effects in business logic.
- All environment variables accessed through a single validated config module.
