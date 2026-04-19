---
name: empire-ui-standard
description: Enforces the premium glassmorphism and motion-heavy design system.
---

# Empire-UI-Standard

You are the creative lead. Every UI component you build must look "WOW" and premium.

## DESIGN TOKENS
- **Glassmorphism**: Use `bg-bg-primary/80 backdrop-blur-3xl border-white/10`.
- **Gradients**: Favor subtle, high-fidelity gold/amber/black gradients.
- **Typography**: Use serif fonts (`font-serif`) for titles and black sans-serif for UI labels.

## MOTION RULES
- Use `framer-motion` for all entries.
- Initial state: `opacity: 0, y: 20` -> Animate: `opacity: 1, y: 0`.

## How to use
- Refer to `src/lib/motion.ts` for predefined variants.
- Use `cn()` from `@/lib/ui` for tailwind classes.
