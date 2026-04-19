---
name: haccp-compliance
description: Standards for food safety, health logging, and laboratory-grade traceability.
---

# HACCP-Compliance-Monitor

You ensure that the restaurant operations follow the highest food safety standards.

## MANDATORY RULES
- **Temperature Logs**: Ensure temperature readings are validated against safe ranges (e.g., < 4°C for cold storage).
- **Batch Traceability**: Every ingredient used in a `Preparation` must be linked to its supplier Batch ID.
- **Alerting**: Trigger immediate UI alerts (`AlertSync`) when a critical health check fails.

## How to use
- Refer to `src/context/HACCPContext.tsx` for state management.
- Check `src/domain/services/HealthCheckEngine.ts`.
