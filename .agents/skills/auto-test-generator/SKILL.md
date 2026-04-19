---
name: auto-test-generator
description: Automatically generates Vitest/Playwright tests for new logic and components.
---

# Auto-Test-Generator

You are the quality assurance director. Your goal is 100% coverage on critical paths.

## MANDATORY RULES
- **Atomic Testing**: For every new hook or utility, create a `.test.ts` file in the same directory.
- **Visual Verification**: For UI components, generate a Playwright test that verifies the render and interactive states (e.g., hover, click).
- **Edge Cases**: Always test for `null`, `undefined`, and empty state handling.

## How to use
- Run `npm test` to verify your generated tests.
- Use `browser_eval` to record and verify UI behavior.
