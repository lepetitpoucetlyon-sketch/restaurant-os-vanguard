# 🛡️ HACCP Sentinel Module - Sovereign Manifest

## Overview
This module manages food safety, hygiene logs, temperature monitoring, and regulatory compliance. It uses the `NexusForge` for transactional data integrity.

## Boundaries
- **Owned Objects**: `HygieneLog`, `ReceptionLog`, `OilLog`, `RegulatoryWasteLog`.
- **Sensors**: Virtualized/Simulated temperature and humidity sensors.
- **Rules**: Compliance score calculated based on alerts in logs.

## API (Public)
- `useHACCP()`: The primary hook for UI interactions.
- `HACCP_ZONES`: Configuration of cleaning zones.

## Simulation Mode (Simulacra)
Active by default when hardware sensors are absent. Generates noise-aware temperature curves.

## Mutation Policy
All mutations MUST use `useNexusMutation` with the `HACCP` moduleId to ensure traceability in the Sovereign Ledger.
