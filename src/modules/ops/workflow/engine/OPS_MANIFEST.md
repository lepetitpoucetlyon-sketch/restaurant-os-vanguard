# 🍱 Ops Mapper Module - Sovereign Manifest

## Overview
This module is the **Real-Time Engine** of the restaurant. It handles the lifecycle of an order (from seat to payment) and manages table availability and reservations.

## Boundaries
- **Owned Objects**: `Order`, `Reservation`, `Table`, `Guest` (renamed to Client).
- **Core Engine**: KDS (Kitchen Display System) logic and Floor Map orchestration.
- **Rules**: An order cannot be closed without a transaction ID from the `Finance` module.

## API (Public)
- `useOrders()`: Logic for POS and KDS.
- `useReservations()`: Logic for booking and occupancy.

## Transactional Integrity
Operational state changes (status updates, new orders) MUST use `useNexusMutation` to ensure that even local network failures don't lose active orders.

## Governance Links
- **Finance**: Sends `REVENUE_PULSE` when a payment is executed.
- **HACCP**: Triggers temperature checks for high-risk stock items added to an order.
