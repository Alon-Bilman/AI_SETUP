---
name: typescript-strict
description: >-
  Advanced TypeScript patterns — strict configuration, type narrowing, generics, and utility types.
---

# TypeScript Strict Mode

## Description
Advanced TypeScript patterns — strict configuration, type narrowing, generics, and utility types.

## Instructions
- Enable all strict flags: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Never use `any`. Use `unknown` for truly unknown types and narrow with type guards.
- Prefer `interface` for object shapes, `type` for unions, intersections, and mapped types.
- Use discriminated unions for state machines and variant types.
- Write custom type guards (`is` keyword) for runtime type narrowing.
- Use `satisfies` operator to validate types without widening.
- Prefer `readonly` arrays and properties for immutable data.
- Use template literal types for string pattern validation.
- Generic constraints: always add `extends` bounds — never unbounded generics.
- Leverage utility types: `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Extract`, `Exclude`.
