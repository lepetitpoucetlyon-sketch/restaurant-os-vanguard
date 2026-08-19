# src/kernel/ — Vocabulaire pur du projet

> Couche fondationnelle : **types, schemas, événements, primitives**.
>
> Règle d'or : **zéro import sortant vers `modules/`, `shared/`, `lib/`, `app/`**.
> Le kernel peut être lu par tout le monde ; personne dans le kernel ne connaît le reste.

## Arborescence

```
src/kernel/
├── contracts/     Types Nexus, RBAC, permissions — vocabulaire cross-pilier
├── schemas/       Zod schemas métier (pos, orders, commerce, rbac, supplier-invoice)
├── events/        Schemas Zod des events (BaseEventPayload, order.*, kds.*, haccp.*)
├── primitives/    Types brandés (TenantId, Microunits, UUID, etc.)
└── errors/        Classes d'erreur du domaine (NF525_VIOLATION, RBAC_DENIED, ...)
```

## Contrat

- `kernel/**` **peut importer** : autres `kernel/**`, standard TypeScript, `zod`, `@nexus/contracts` (legacy alias transitoire)
- `kernel/**` **ne peut PAS importer** : `@/modules/**`, `@/shared/**`, `@/lib/**`, `@/app/**`, `@/verticals/**`

## Origine

Créé le 2026-08-19 par session `attack-consolidation-master` (Chantier α-5 du PLAN_CONSOLIDATION).

Débloque :
- **Chantier F** — restructuration finale `shared/` (les schemas d'events y migrent)
- **Chantier L** — RBAC table unique (`kernel/contracts/rbac.ts`)
- **α-1** — 24 violations `domain/schemas/*` résolues par migration vers `kernel/schemas/`
