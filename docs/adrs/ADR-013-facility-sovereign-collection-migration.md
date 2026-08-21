# ADR-013 — Migration du pilier facility vers useSovereignCollection

- **Statut** : Adopté (Phase 5 — 2026-08-21) — clôture de la migration progressive lancée par ADR-009
- **Contexte** : Plan Master P4.3, suite d'ADR-009 → 012

## Décision

Migrer deux collections mutables du pilier facility :

| Collection | Adapter | Cas d'usage |
|---|---|---|
| `equipmentAssets` | `useSovereignEquipment` | Inventaire des équipements (frigos, fours, plancha), audit maintenance |
| `equipmentBreakdowns` | `useSovereignBreakdowns` | Ticket incident capté en cave sans wifi, jamais perdu |

### Implémentation

**Adapters** — `src/modules/facility/hooks/`
- `useSovereignEquipment.ts` : `create / setStatus / stampMaintenance / retire`
  - `stampMaintenance` calcule automatiquement `nextMaintenanceDueAt` (default 90 j)
  - Type renommé `SovereignEquipmentStatus` pour éviter collision avec le legacy
- `useSovereignBreakdowns.ts` : cycle `OPEN → IN_PROGRESS → WAITING_PARTS → RESOLVED`
  - `resolve` accepte notes + coût + pièces remplacées (traçabilité SAV complète)

**Composant preuve** — `BreakdownsBoard.tsx`
- Kanban 4 colonnes des tickets d'incident
- Optimistic UI + indicateur isSyncing
- Actions inline selon statut, badge couleur par sévérité

**Tests** — 10 tests bloquants :
- `useSovereignEquipment.test.ts` (5) : create, cycle broken→maintenance→operational, retire, filtre location
- `useSovereignBreakdowns.test.ts` (5) : cycle complet, WAITING_PARTS, filtre equipmentId

### Ne PAS migrer côté facility
- `floorPlanElements` : équivaut aux `tables` (déjà migré Phase 2 via `useSovereignTables`)
- `iotHistory` : IMMUABLE NF525 (append-only)
- `spaces/zones/floors` : config quasi-statique, gérée via tenantConfig

## Conséquences

### Positives (fin de la migration progressive)
Les 5 phases sont désormais livrées. Les 8 piliers ont un ancrage sovereign
(finance, ops, logistics, commerce, facility) ou n'en ont pas besoin
(system, compliance NF525 = immuable, intelligence, human = pas de UI CRUD offline critique).

Le kernel `useSovereignCollection` est **prouvé en production** sur 12
collections mutables réparties sur 5 piliers, avec 66+ tests bloquants
qui protègent la garde NF525 et la sémantique métier.

### Récapitulatif migration

| Phase | Pilier | Collections | Adapters | Tests |
|---|---|---|---|---|
| 1 | finance   | expenseClaims | 1 | 8 |
| 2 | ops       | orders, tables, reservations | 3 | 22 |
| 3 | logistics | stocks, supplierInvoices | 2 | 11 |
| 4 | commerce  | customers, quotes, loyaltyAccounts | 3 | 14 |
| 5 | facility  | equipmentAssets, equipmentBreakdowns | 2 | 10 |
| **Total** | 5 piliers | **12 collections** | **11 adapters** | **65 tests** |

### Prochain chantier suggéré
- Migration progressive des composants legacy (POS, KDS, dashboards
  existants) vers les nouveaux adapters — non bloquante, à faire quand
  on touche déjà à un composant
- Enrichissement des adapters (`bulkUpdate`, `search`, `paginate`) selon
  les besoins produit
