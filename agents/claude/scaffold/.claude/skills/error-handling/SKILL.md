---
name: error-handling
description: >-
  Server-side error classes, structured logging, recovery strategies, and observability.
---

# Error Handling (Backend)

## Description
Server-side error classes, structured logging, recovery strategies, and observability.

## Instructions
- Create custom error classes: `AppError`, `ValidationError`, `NotFoundError`, `AuthError`.
- Each error class must have a `code` (machine-readable), `message` (human-readable), and `statusCode`.
- Only try/catch at system boundaries: HTTP handlers, queue consumers, CLI entry points.
- Never swallow errors silently. Always log or re-throw.
- Use structured logging: `log.error("Payment failed", { orderId, amount, reason })` — no string interpolation.
- Distinguish operational errors (handle gracefully) from programmer errors (crash fast).
- Implement a global error handler middleware that maps error codes to HTTP responses.
- Add request-id tracing: generate a unique ID per request, propagate through all log entries.
- Use circuit breakers for external service calls (e.g., `opossum`).
- Set up health check endpoints (`/health`, `/ready`) for monitoring.
