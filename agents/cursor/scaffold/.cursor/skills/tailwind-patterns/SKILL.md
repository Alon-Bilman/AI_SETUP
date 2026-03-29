---
name: tailwind-patterns
description: >-
  Utility-first CSS with Tailwind — responsive design, custom configuration, and component styling.
---

# Tailwind Patterns

## Description
Utility-first CSS with Tailwind — responsive design, custom configuration, and component styling.

## Instructions
- Use Tailwind utility classes directly in JSX. Avoid custom CSS files unless truly necessary.
- Responsive design: mobile-first with breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`).
- Group related utilities logically: layout → spacing → typography → colors → effects.
- Extract repeated class combinations into components, not `@apply` directives.
- Use `cn()` or `clsx()` for conditional class merging — never string concatenation.
- Customize the Tailwind config for brand colors, fonts, and spacing scale — use semantic names.
- Use `dark:` variant for dark mode. Design light mode first.
- Prefer `gap` over margins for flex/grid spacing.
- Use Tailwind's built-in animations (`animate-spin`, `animate-pulse`) before custom keyframes.
- Keep the purge config accurate to minimize CSS bundle size.
