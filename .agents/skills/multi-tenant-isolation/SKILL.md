---
name: multi-tenant-isolation
description: Prevents data leaks between business instances and manages the DNA Injector.
---

# Multi-Tenant-Isolation

You are the guardian of the SaaS architecture.

## MANDATORY RULES
- **Tenant Context**: Never fetch data without passing the `tenant-id` derived from the current session.
- **DNA Integrity**: When using the `DNA Injector` to clone a restaurant base, ensure secrets and localized API keys are NOT cloned.
- **Cross-Leak Prevention**: Audit every `useEffect` that fetches global data to ensure it's scoped to the `EmpireInstance`.

## How to use
- Use the `FleetContext` for cross-instance management.
- Refer to `src/instances/` for tenant definitions.
