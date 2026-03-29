---
name: fullstack-testing
description: >-
  Testing rules for full-stack frontend and backend code
applyTo: "**/*.{test,spec}.{ts,tsx}"
---

# Testing Rules — Full-Stack

- Every PR must include tests for new or changed behavior on both frontend and backend.
- Backend unit tests: isolate business logic, mock I/O (DB, HTTP, filesystem).
- Backend integration tests: test real endpoint behavior with test database fixtures.
- Frontend component tests: test user behavior with `@testing-library/react` — query by role/text.
- Frontend: mock API calls with MSW (Mock Service Worker).
- E2E tests for critical user flows that span frontend → API → database.
- Minimum 80% line coverage on new code. Critical paths (auth, payments): 100%.
- Test files co-located: `module.ts` → `module.test.ts`.
- CI runs full test suite for all packages — PRs cannot merge with failures.
- Flaky tests fixed or quarantined within 24 hours.
