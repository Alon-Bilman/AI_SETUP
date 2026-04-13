---
name: testing-strategy
description: >-
  Testing strategy and patterns — unit, integration, and E2E test design.
  Triggers when writing tests, debugging flaky tests, or designing test architecture.
---

# Testing Strategy

## Test Pyramid
- **Unit tests** (most): isolate pure logic, mock I/O boundaries, fast execution.
- **Integration tests** (some): verify module interactions with real dependencies.
- **E2E tests** (few): critical user flows only, kept stable and deterministic.

## Unit Test Rules
- One assertion concept per test. Multiple `expect` calls are fine if testing one behavior.
- Test behavior, not implementation. Don't assert on internal method calls.
- Use descriptive test names: `it("returns 404 when user does not exist")`.
- Arrange–Act–Assert structure. Keep arrange minimal.
- Mock at I/O boundaries: database, HTTP, filesystem, clock.
- Never mock the thing you're testing.

## Integration Test Rules
- Use real databases with test fixtures, not mocks.
- Clean up state between tests — each test runs in isolation.
- Test the contract, not the internals: HTTP status codes, response shapes, side effects.
- Keep integration tests deterministic — no random data, no external services.

## Test Quality Checks
- Does the test fail when the behavior breaks? (mutation testing mindset)
- Does the test name describe the scenario, not the implementation?
- Are assertions specific? Prefer `.toBe(404)` over `.toBeTruthy()`.
- Are test fixtures minimal? Only include data relevant to the assertion.

## Flaky Test Protocol
- Quarantine immediately — move to a `.skip` or separate suite.
- Root cause within 24 hours: timing? shared state? external dependency?
- Fix the root cause, not the symptom. Adding retries hides bugs.
- Add a regression test for the flakiness itself when possible.

## Coverage Guidelines
- 80% line coverage minimum on new code.
- 100% on critical paths: auth, payments, data mutations.
- Coverage is a floor, not a goal — high coverage with weak assertions is worse than moderate coverage with strong assertions.
