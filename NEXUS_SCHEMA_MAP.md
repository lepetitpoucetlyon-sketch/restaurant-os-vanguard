# NEXUS_SCHEMA_MAP.md

## Carte Structurelle : NexusInternalMapper Fragmenté

```mermaid
graph TD
    Facade(NexusInternalMapper) --> Types(nexus-business.types.ts)
    Facade --> Errors(nexus-error-mapper.ts)
    Facade --> Auth(nexus-auth-mapper.ts)
    Facade --> Guards(nexus-type-guards.ts)
    Facade --> Converters(nexus-type-converters.ts)
```

## Types Métier Supportés
- Table, TableStatus
- Order, OrderItem, OrderItemModification, OrderStatus
- Product, OptionGroup, Option
- Recipe, RecipeIngredient
- Quote, Campaign, Reservation, LegalInvoice
- Floor, Zone
- Customer, CRM_Record

## Hubs de Télémétrie Découplés
```mermaid
graph TD
    Service(FleetTelemetryService) --> Executor(FleetTelemetryExecutor)
    Service --> Stream(TelemetryStream)
```
