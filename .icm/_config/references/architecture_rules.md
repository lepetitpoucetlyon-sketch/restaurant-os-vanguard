# ARCHITECTURE RULES (Layer 3)

1. **Nexus Adapter**: All writes must go through `NexusManager` wrapped by `SovereignGuard`.
2. **Microunits**: Currency is strictly handled in Microunits (`z.number().int().min(0).brand<'Microunits'>()`). 1 unit = 1,000,000 µ.
3. **Immutability**: `fiscalLedger`, `fiscalSeals`, `journalEntries` are IMMUTABLE. Never update or delete.
4. **Pillars**: `ops`, `commerce`, `compliance`, `finance`, `human`, `logistics`, `intelligence`. Pillars do not import each other directly. Use `NexusEventBus` or infrastructure bridges.
