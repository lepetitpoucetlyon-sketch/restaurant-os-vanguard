# BARREL-EXCEPTIONS.md — Exceptions Légitimes au Barrel Contract (ADR-015)

> **Référence** : `docs/adrs/ADR-015-loi-des-couches.md` & `.sentrux/README.md`
> **Dernière révision** : 2026-08-25 (Sprint 0 Dette Technique)

Ce document recense les imports profonds délibérés au sein de la base de code et en explicite la justification architecturale. **Aucun agent ne doit tenter de « corriger » les imports listés ci-dessous**, car ils répondent à des contraintes strictes d'anti-cycles et de pureté d'exécution.

---

## 1. Catégorie A — Couche État / Atomes (7 imports obligatoires)

Conformément à la **Règle Sentrux n° 4** (*SSR purity & cycle prevention*), les fichiers de rassemblement d'état `src/store/pillars/*` **ne doivent JAMAIS importer les barrels de modules (`@/modules/*`)**.
L'importation via barrel réintroduirait un cycle `store → module barrel → hooks → store`, déclenchant une erreur TDZ (*Temporal Dead Zone* / `Cannot access X before initialization`) lors du rendu SSR Next.js.

| Fichier consommateur | Import direct autorisé | Justification |
|---|---|---|
| `src/store/pillars/ops.ts` | `@/modules/ops/service/pos/store/orderAtoms` | Règle 4 : Atomes sources purs uniquement |
| `src/store/pillars/human.ts` | `@/modules/human/effectifs/hr/store/staffAtoms` | Règle 4 : Atomes sources purs uniquement |
| `src/store/pillars/logistics.ts` | `@/modules/logistics/stock/inventory/store/inventoryAtoms` | Règle 4 : Atomes sources purs uniquement |
| `src/store/pillars/commerce.ts` | `@/modules/commerce/.../*Atoms` (3 imports) | Règle 4 : Atomes sources purs uniquement |
| `src/store/pillars/compliance.ts` | `@/modules/compliance/qualite/haccp/store/complianceAtoms` | Règle 4 : Atomes sources purs uniquement |

---

## 2. Catégorie B — Contrats & Schémas Zod (~20 imports)

Ces imports profonds proviennent de la couche `shared/` et de contrats globaux ciblant les schémas Zod sous `src/modules/*/domain/schemas/`.

| Fichiers consommateurs | Imports ciblés | Justification |
|---|---|---|
| `src/shared/nexus/contracts/*.types.ts` | `@/modules/*/domain/schemas/*` | Les schémas Zod sont consommés pour typer les contrats |
| `src/shared/nexus/state/SovereignGenome.ts` | `@/modules/{system,human}/domain/schemas/*` | Définition des schémas de génome |
| `src/shared/schemas/index.ts` | `@/modules/*/domain/schemas/*` | Re-exports de transition |

> ⏳ **Statut d'évolution** : Ces exceptions sont gelées jusqu'à l'**Étape 4** (migration globale des schémas vers `src/domain/`). Elles se résorberont mécaniquement à ce moment sans refactoring intermédiaire prématuré.

---

## 3. Catégorie C — Registries & Connecteurs Serveur (8 imports)

### 3.1 Registre de Synchronisation des Piliers (5 imports)
Le registre `src/lib/sync/pillarSyncRegistry.ts` a pour rôle structurel d'agréger les synchroniseurs des 5 piliers métier (`*.sync`). En tant que point de composition central, il doit référencer explicitement ses adapteurs.

### 3.2 Connecteurs Server-Only (3 imports)
Les routes API `src/app/api/connectors/*/route.ts` importent directement les providers `@/modules/ops/connectors/*`.
Comme documenté dans `src/modules/ops/index.ts` :
> `DeliveryProviderFactory` et `ReservationProviderFactory` sont strictement **server-only** et ne doivent pas être exposés dans le barrel client/isomorphe.
