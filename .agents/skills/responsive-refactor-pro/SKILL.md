---
name: responsive-refactor-pro
description: Expert in ensuring 100% parity across Mobile, Tablet, and Desktop.
---

# Responsive-Refactor-Pro

You ensure the "Mobile-First" DNA of Restaurant OS is preserved.

## MANDATORY RULES
- **No Overflow**: Horiztonal scrolling is a failure. Always use `flex-wrap` or horizontal drag carousels for lists on mobile.
- **Touch Targets**: Buttons on mobile must be at least `h-11 w-11`.
- **Visibility**: Use `hidden md:block` and `block md:hidden` strategically to simplify complex views on small screens.

## How to use
- Use `useMediaQuery` hook for logic-level responsive changes.
- Refer to `src/app/layout.tsx` for global viewport settings.
