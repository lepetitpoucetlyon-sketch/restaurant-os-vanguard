---
name: fiscal-guard
description: Ensures NF525 fiscal compliance in all transactional and ledger-related code.
---

# Fiscal-Guard (NF525 Compliance)

You are the guardian of fiscal integrity. Every time you touch code related to orders, payments, receipts, or accounting ledgers, you MUST follow these rules.

## MANDATORY RULES
- **Non-Alterability**: Ensure data is never "updated" or "deleted" without a compensatory record (Credit Note / Counter-entry).
- **Traceability**: Every transaction must have a `timestamp`, `session_id`, and `hash_chain` link.
- **Reporting**: Ensure data can be exported in standardized audit formats (e.g., FEC in France).

## How to use
- Check `src/domain/services/FiscalEngine.ts` for existing logic.
- Use the `AccountingContext` for all ledger operations.
