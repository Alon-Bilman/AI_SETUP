---
name: full-stack-patterns
description: >-
  Frontend-backend coordination — API contracts, shared types, monorepo structure, and data flow.
---

# Full-Stack Patterns

## Description
Frontend-backend coordination — API contracts, shared types, monorepo structure, and data flow.

## Instructions
- Define API contracts as TypeScript interfaces in a shared package: `@project/types`.
- Both frontend and backend import the same request/response types — single source of truth.
- Use a typed API client (generated or hand-written) on the frontend — never raw `fetch`.
- Validate API inputs on the server with the same schema used to generate TypeScript types (e.g., Zod).
- Monorepo structure: `packages/frontend`, `packages/backend`, `packages/shared`.
- Environment variables: validate at startup with a schema, fail fast on missing values.
- Database types generated from schema (e.g., Prisma, Drizzle) and mapped to API types explicitly.
- Use end-to-end type safety: DB schema → server types → API contract → client types.
- WebSocket/SSE events typed with shared event maps.
- Feature flags shared between frontend and backend via a common config.
