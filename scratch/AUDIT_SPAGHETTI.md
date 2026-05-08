# 🏛️ RAPPORT SPAGHETTI & SOUVERAINETÉ (GRADE X+++)

## 📡 1. RADIOGRAPHIE DU GRAPHE (Atlas V5)
*   **Total Fichiers** : 1 857
*   **Nœuds Actifs** : 2 354
*   **Arêtes (Dépendances)** : 4 158
*   **Communautés (Domaines)** : 190

### 👑 Les "God Nodes" (Risque de Couplage Élevé)
1. `FirestoreAdapter` (13 arêtes) - Le talon d'Achille de l'isolation de base de données.
2. `SimulacraAdapter` (12 arêtes) - Risque de fuite de données mockées en production.
3. `MockAdapter` (11 arêtes)
4. `FleetTelemetryService` (11 arêtes)
5. `SovereignLedger` (10 arêtes) - Normal pour le Core Finance, mais doit rester strictement isolé.
6. `GeminiLiveService` (10 arêtes)

### ⚠️ Fuites Architecturales (Leaking Imports)
*   `src/app/api/admin/nam/analyze/route.ts` pointe vers `scratch/old-repo/src/app/(admin)/api/gemini/route.ts`. Une route API ne doit **jamais** pointer vers un dossier `scratch`.
*   `src/app/api/admin/nam/analyze/route.ts` ne possède pas le **Hidden Door Pattern** (`x-nexus-tenant-id`).

---

## ☣️ 2. INFECTION DE TYPAGE (Opération Zero-Any)
Le scanner révèle une dette de typage sévère, particulièrement dans les couches UI et les contextes :
*   **Instances de `any`** : 389
*   **Castings sauvages (`as any`)** : 268
*   **Types `unknown` (souvent non guardés)** : 195

**Zones Rouges (Exemples) :**
*   `src/context/RegistreContext.tsx` (`useNexusFiscal() as any`)
*   `src/context/PlanningContext.tsx` (`useNexusOps() as any`)
*   `src/app/(client)/(ops)/reservations/page.tsx` (Casting de `customers as any[]`, `table: any`)

---

## 📐 3. CONFORMITÉ AUX PATTERNS SOUVERAINS

### A. The Hidden Door Pattern
*   Total des routes `/api/admin` : 3
*   Routes conformes : 2 (`fec/export/route.ts`, `procurement/delivery/[id]/sign/route.ts`)
*   **Route Compromise** : `nam/analyze/route.ts` (Absence du check `x-nexus-tenant-id`).

### B. SovereignMath & Intégrité Financière
*   Le module Finance respecte scrupuleusement `SovereignMath`. Aucun opérateur natif (`+`, `-`, `*`, `/`) n'a été détecté sur des variables financières dans les modules récemment refactorisés. (Grade X validé sur ce point).

### C. Standard Response Schema
*   `nam/analyze/route.ts` utilise `AnalysisResponseSchema` mais ne s'aligne pas parfaitement sur l'union `StandardResponse<T> | NexusErrorCode` globale.

---

## 💀 4. DÉTECTION DE CODE ZOMBI & TROUS DE TÉLÉMÉTRIE
*   **Telemetry Gaps** : 924 fichiers (incluant des services métier et composants critiques) n'émettent **aucun** `AuditPulse`. La télémétrie est centralisée mais non distribuée dans les modules enfants.
*   **Legacy Singletons** : Les instances de `SovereignLedger` et `NexusTelemetryService` utilisent des patterns de classe statique. Bien que fonctionnel, cela limite l'isolation stricte par `tenantId` requise pour du vrai multi-tenant (Grade X), forçant à passer le `tenantId` en paramètre à chaque appel.

---

## 🛠️ PLAN DE CAUTÉRISATION (ACTION PLAN)

### 🔴 Phase 1 : Cautérisation Critique (Immédiat)
1. **Verrouillage NAM** : Patch immédiat de `src/app/api/admin/nam/analyze/route.ts` pour implémenter le Hidden Door Pattern (`x-nexus-tenant-id`) et purger l'import du dossier `scratch/`.
2. **God Nodes Isolation** : Mettre en place des interfaces stricts (Ports & Adapters) pour `FirestoreAdapter` et `SimulacraAdapter` afin de réduire leur `In-Degree`.

### 🟠 Phase 2 : Éradication du "Any" (Semaine 1)
3. **Typage des Contextes** : Créer des interfaces strictes pour les hooks globaux (`useNexusFiscal`, `useNexusOps`) dans `src/shared/nexus-contract.ts`. Remplacer tous les `(useX() as any)` par des retours typés.
4. **Suture UI/Domaine** : Créer des DTOs stricts pour le passage de données entre les `page.tsx` et les services métier (spécialement dans `/ops/reservations` et `/ops/kitchen`).

### 🟡 Phase 3 : Télémétrie & Injection de Dépendances (Semaine 2)
5. **Telemetry Pulse** : Déployer un décorateur ou un wrapper de fonction de niveau supérieur pour automatiser l'émission d'`AuditPulse` sur les opérations de mutation.
6. **Provider Refactoring** : Passer d'un modèle statique (`SovereignLedger.method()`) à un modèle injecté (`nexus.finance.ledger.method()`) pour garantir l'isolation contextuelle du `tenantId`.
