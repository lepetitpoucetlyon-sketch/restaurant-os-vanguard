# 🏛️ Finance Ledger Module - Sovereign Manifest

## Overview
This module is the **Fiscal Bastion** of Restaurant OS. It manages the PCG (Plan Comptable Général), financial journals, fiscal sealing (NF525), and bank reconciliations.

## Boundaries
- **Owned Objects**: `JournalEntry`, `FiscalSeal`, `Account`, `ExpenseClaim`, `BankTransaction`.
- **Core Engine**: `NF525Service` (Atomic payments and digital signatures).
- **Rules**: Every sale MUST be sealed with a fiscal hash. No modification allowed after validation.

## API (Public)
- `useAccounting()`: High-level bridge for UI interaction.
- `NF525Service`: Static methods for transactional fiscal operations.

## Transactional Integrity
All accounting movements MUST be recorded via the `NexusForge` to maintain binary audit consistency.

## Compliance
- **NF525**: Implemented through `FiscalEngine` and local scellement.
- **Audit**: FEC (Fichier des Écritures Comptables) ready.
