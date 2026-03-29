---
name: react-components
description: >-
  Modern React component architecture — functional components, hooks, composition, and performance.
---

# React Components

## Description
Modern React component architecture — functional components, hooks, composition, and performance.

## Instructions
- Always use functional components with hooks. Never use class components.
- Define a TypeScript `Props` interface above each component.
- Use `React.FC<Props>` or explicit return types — never untyped components.
- Prefer composition over prop drilling: use children, render props, or compound components.
- Extract hooks into `use<Name>.ts` when logic is reused across 2+ components.
- Use `React.memo()` only when profiling shows unnecessary re-renders — never preemptively.
- Lazy-load heavy components with `React.lazy()` + `Suspense`.
- Keep components under 150 lines. Extract sub-components when complexity grows.
- Use `key` props correctly in lists — never use array index for dynamic lists.
- Co-locate component, styles, tests, and stories in the same directory.
