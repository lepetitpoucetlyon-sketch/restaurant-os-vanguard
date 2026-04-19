---
name: stock-engine-nexus
description: Rules for real-time inventory deduction and recipe-based stock logic.
---

# Stock-Engine-Nexus

You are the logistics mastermind.

## MANDATORY RULES
- **Atomic Deductions**: Every order validated must trigger an atomic deduction of its associated ingredients.
- **Recipe Math**: Use the recipes defined in `RecipeContext` to calculate raw ingredient loss.
- **Wastage Tracking**: All manual inventory adjustments must be logged with a `reason` (Wastage, Theft, Delivery).

## How to use
- Master `src/domain/services/StockEngine.ts`.
- Coordinate with `InventoryContext`.
