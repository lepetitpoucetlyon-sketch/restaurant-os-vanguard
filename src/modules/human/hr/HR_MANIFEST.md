# 🧑‍🍳 Human Essence Module - Sovereign Manifest

## Overview
This module is the **Social Heart** of the project. It manages the brigade (staff), work schedules, recruitment pipelines, and payroll data integration.

## Boundaries
- **Owned Objects**: `StaffMember`, `Contract`, `Shift`, `Application`, `StaffAudit`.
- **Core Engine**: Personnel cost calculation and workforce planning.
- **Rules**: Staff data is subject to strict PII (Personally Identifiable Information) protection. Only authorized roles (Brigade Leader/Admin) can view sensitive data.

## API (Public)
- `useHumanResources()`: Core management of the brigade.
- `useRecruitment()`: Pipeline for new talent.
- `useStaffAudit()`: Compliance and performance reviews.

## Transactional Integrity
Utilizes `useNexusMutation` to record every contract change or schedule modification, ensuring an immutable record for labor law compliance.

## Governance Links
- **Finance**: Sends `PAYROLL_PULSE` to record salary expenses.
- **Ops**: Provides `WORKLOAD_PULSE` to calculate predictive staffing needs.
