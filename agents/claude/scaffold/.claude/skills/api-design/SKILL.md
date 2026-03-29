---
name: api-design
description: >-
  RESTful and GraphQL API design with focus on backend architecture, validation, and security.
---

# API Design (Backend)

## Description
RESTful and GraphQL API design with focus on backend architecture, validation, and security.

## Instructions
- Use plural nouns for REST endpoints: `/users`, `/orders`.
- HTTP verbs map to CRUD: GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove.
- Validate all input at the API boundary using schema validation (e.g., Zod, Joi).
- Return consistent response shapes: `{ "data": ..., "error": null }`.
- Use proper HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 422, 500.
- Version APIs in the URL path: `/api/v1/users`.
- Implement rate limiting, request size limits, and timeout policies.
- Use middleware for cross-cutting concerns (auth, logging, CORS).
- Paginate list endpoints with cursor-based pagination for large datasets.
- Generate OpenAPI/Swagger specs from code annotations.
