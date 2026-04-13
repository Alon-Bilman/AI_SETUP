---
name: code-review
description: >-
  Structured code review workflow — finding real bugs, security issues,
  and missing edge cases. Triggers when reviewing PRs, diffs, or code changes.
---

# Code Review

## Review Priorities (in order)
1. **Security**: injection, auth bypass, secret leaks, unsafe deserialization.
2. **Correctness**: logic errors, off-by-one, null/undefined paths, race conditions.
3. **Data integrity**: missing validation, unhandled error states, partial writes.
4. **Test coverage**: untested branches, missing edge cases, brittle assertions.
5. **Maintainability**: only when it hides a real bug or creates a trap for the next change.

## Review Process
- Read the full diff before commenting.
- Trace data flow end-to-end through affected code paths.
- Check boundary conditions: empty inputs, max values, concurrent access.
- Verify error handling: what happens when the happy path fails?
- Confirm tests actually assert the behavior they claim to test.

## Output Format
- Lead each finding with a severity: `critical`, `warning`, or `nit`.
- Include the file path and line number.
- Show what's wrong and suggest a concrete fix.
- Group related findings together.
- End with a summary: total findings by severity, overall assessment.

## Anti-patterns to Flag
- Catch-and-swallow: `catch {}` or `catch (e) { /* ignore */ }`.
- String-based type checks instead of discriminated unions.
- Mutable shared state without synchronization.
- Raw SQL or shell commands with string interpolation.
- Missing input validation at system boundaries.
