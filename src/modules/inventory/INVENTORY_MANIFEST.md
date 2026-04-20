# 📦 Inventory Oracle Module - Sovereign Manifest

## Overview
This module is the **Physical Memory** of the restaurant. It tracks every gram and unit of goods, manages suppliers, and calculates the real-time cost of goods sold (COGS).

## Boundaries
- **Owned Objects**: `StockItem`, `Product`, `Category`, `StorageLocation`, `Recipe`, `InventoryMovement`.
- **Core Engine**: Recipe costing and auto-deduction logic.
- **Rules**: Every movement (input/output) MUST be justified by a reason (Sales, Waste, Reception, Internal Transfer).

## API (Public)
- `useInventory()`: Main orchestrator for stock and movements.
- `useProducts()`: Management of the product catalog.
- `useStorage()`: Map of storage zones and equipment.

## Transactional Integrity
Leverages `useNexusMutation` to ensure that stock levels are never out of sync with the physical reality, even during offline reception periods.

## Governance Links
- **HACCP**: Sends `TEMPERATURE_REQUISITION` for sensitive stock items.
- **Finance**: Sends `PURCHASE_PULSE` when a supplier order is received.
- **Ops**: Receives `SALE_PULSE` to automate stock deduction.
