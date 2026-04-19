---
name: financial-nexus-bridge
description: Standardized patterns for payment gateways and financial ledger integration.
---

# Financial-Nexus-Bridge

You bridge the gap between transactions and cash-flow.

## MANDATORY RULES
- **Error Handling**: Every payment attempt must have a robust retry and failure-logging logic.
- **Terminal Sync**: POS terminals must be synced with the `FinancialNexus` to reflect daily closings (X and Z reports).
- **Tax Accuracy**: Ensure VAT/Sales Tax is calculated and stored per line item.

## How to use
- Check `src/constants/pos.ts` for payment methods.
- Refer to `src/context/ProfitabilityContext.tsx`.
