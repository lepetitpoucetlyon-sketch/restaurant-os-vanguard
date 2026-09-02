MISSION: GRADE X GLOBAL SUTURE
STATUS: PRIORITY ALPHA
TARGETS: 159 TSC ERRORS
TOOLS: RTK, GRAPHIFY, MEMPALACE

# Implementation Plan - Grade X Global Suture (ACTUALISÉ)

Ce plan vise à éradiquer la totalité des 159 erreurs TSC détectées. Nous allons stabiliser le cœur du système avant de remonter vers les couches applicatives.

## User Review Required

> [!IMPORTANT]
> Ce plan implique des modifications structurelles dans `nexus-internal-mapper.ts` et dans les exportations des modules `finance`, `human` et surtout `compliance`. Ces changements sont nécessaires pour restaurer la souveraineté typologique.

> [!CAUTION]
> L'absence d'exports dans `@modules/compliance` bloque actuellement le Store global. Nous allons devoir forcer la création de ces contrats s'ils sont manquants.

## Proposed Changes

### 1. 🏛️ Core Nexus Contracts (Shared)
Le but est d'unifier les types et de résoudre les conflits d'interface dans le mapper interne.

#### [MODIFY] [nexus-internal-mapper.ts](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/nexus/contracts/nexus-internal-mapper.ts)
- Utiliser `export type` pour les re-exports (conformité `isolatedModules`).
- Unifier le type `status` pour les réservations et les commandes.
- Injecter les types manquants (`Customer`, `CRM_Record`, `Floor`, `Zone`).
- Résoudre le conflit `OrderItemModification` vs `SovereignField`.

#### [MODIFY] [index.ts](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/nexus/contracts/index.ts)
- Exporter `Floor`, `Zone` et `LegacyOrder` pour satisfaire les atomes et les tests.

---

### 2. 🧠 Global Store & Atoms (Infrastructure)
Réaligner les atomes exportés par les modules métiers avec le store central. Correction massive des imports brisés.

#### [MODIFY] [operationalAtoms.ts](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/store/operationalAtoms.ts)
- **FIX** : Corriger les imports depuis `@modules/finance` et `@modules/human`.
- **FIX** : Supprimer ou corriger les imports de `hygieneLabelsNodeAtom` et autres membres inexistants de `@modules/compliance`.
- S'assurer que les alias (`activeShiftsNodeAtom` vs `activeShiftsAtom`) sont cohérents.

---

### 3. 🛡️ Compliance & Finance Modules (Contracts)
Restaurer les membres manquants détectés par TSC.

#### [MODIFY] [index.ts](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/compliance/index.ts)
- Exporter les atomes de HACCP et Hygiene demandés par le Store (ce qui résoudra 19 erreurs d'un coup).

---

### 4. 🛠️ Operations & POS (Modules)
Corriger les composants qui traitent mal les structures de données complexes.

#### [MODIFY] [ProductDetailsDialog.tsx](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/ops/pos/components/ProductDetailsDialog.tsx)
- Refactoriser la gestion des `ingredients` et `options` pour utiliser les objets typés et non des `string`.

---

### 5. 🛡️ Admin Guards & MCC (Shared)
Finaliser la correction des exports MCC.

#### [MODIFY] [admin/mcc/index.ts](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/nexus/guards/admin/mcc/index.ts)
#### [MODIFY] [admin/simulator/index.ts](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/nexus/guards/admin/simulator/index.ts)
- Utiliser des exports nommés explicites pour les composants ayant des `export default`.

## Verification Plan

### Automated Tests
- **Cycle TSC** : Exécution de `npx tsc --noEmit` après chaque étape. L'objectif est de passer de 159 à **0 erreurs**.
- **Scan Atlas** : Scan final Atlas pour valider l'absence de fuites structurelles.

### Manual Verification
- Vérification visuelle de l'explorateur VS Code (doit être 100% propre).
- Vérifier que le Dashboard Hermes affiche désormais les métriques sans crash d'import.
