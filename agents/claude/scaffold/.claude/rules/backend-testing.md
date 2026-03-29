# Testing Rules — Backend

- Every PR must include tests for new or changed behavior.
- Minimum 80% line coverage on new code; 100% on critical paths (auth, payments, data mutations).
- Test files live next to their source: `service.ts` → `service.test.ts`.
- Unit tests: isolate functions, mock external dependencies, test edge cases and error paths.
- Integration tests: test real database operations, HTTP endpoints, and message queues with fixtures.
- Use `beforeEach`/`afterEach` for setup/teardown — never leak state between tests.
- CI must run the full suite — PRs cannot merge with failing tests.
- Load tests for critical endpoints before major releases.
- Flaky tests must be fixed or quarantined within 24 hours.
