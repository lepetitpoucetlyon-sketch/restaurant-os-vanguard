# Plan V2 — Audit Global & Reste à faire

> **Repo** : RESTAURANT-OS-CORE · branche `fix/coherence-ui-backend-securite`
> **Rédigé le** : 2026-08-09 · **mis à jour** le 2026-08-09 · session `audit-global-v2`
>
> Ce document est **autonome** : chaque chantier contient le diagnostic, la preuve empirique,
> le fichier/module exact, la correction proposée et le critère de validation.

---

## Sommaire des Nouveaux Chantiers (V2)

| # | Chantier | Sévérité | Effort | Bloquant |
|---|----------|----------|--------|----------|
| [17](#chantier-17--57-handlers-abonnés-à-des-événements-fantômes) | 57 handlers abonnés à des événements fantômes (jamais émis) | 🔴 HIGH | ~3 h | Non |
| [18](#chantier-18--85-événements-émis-sans-aucun-écouteur) | 85 événements émis sans aucun écouteur (silent emission) | 🟠 MEDIUM | ~4 h | Non |
| [19](#chantier-19--129-handlers-non-tier-aware-failles-sovereignguard-sur-_ref_) | 129 handlers non tier-aware (risques de crash sur `_ref_*`) | 🔴 CRITIQUE | ~5 h | Oui — casse la promotion MCC |
| [20](#chantier-20--160-routes-api-sans-contrôle-dauthentification) | 160 routes API sans vérification d'authentification (`verifySession`) | 🔴 CRITIQUE | ~6 h | Oui — faille de sécurité |
| [21](#chantier-21--77-routes-api-orphelines-sans-consommateur-ui) | 77 routes API orphelines sans consommateur UI | 🟠 MEDIUM | ~2 h | Non |
| [22](#chantier-22--migration-globale-des-tests-saga-vers-vispyon) | Migration globale des 13 suites saga vers `vi.spyOn` (Vitest 4) | 🔴 CRITIQUE | ~3 h | Oui — 267 échecs résiduels |

---

## Rappel des 3 Tiers par Verticale

Chaque chantier de ce document doit respecter scrupuleusement la séparation des tiers système (`docs/versionbase.md`) :
- **DEMO** (`_demo_*`) : Mode Simulacra (écritures interceptées).
- **TEST** (`_test_*`) : Seul tier acceptant les écritures directes.
- **REFERENCE** (`_ref_*`) : Écritures strictes **interdites** (`SovereignGuard`).

---

## Contexte : Chantiers V1 Finalisés et Validés

Ces chantiers de la session précédente sont désormais **100 % livrés et vérifiés** :
- ✅ **Chantier 1 (partiel)** : Normalisation des 162 handlers vers l'alias `@/shared/eventBus/NexusEventBus`.
- ✅ **Chantier 6** : Correction des `catch` silencieux UI dans `EventQuoteModal.tsx` et `useReservationsPage.ts`.
- ✅ **Chantier 7** : Câblage des données réelles `wasteLogsAtom` dans `WasteManagementHACCP.tsx`.
- ✅ **Chantier 10** : Enregistrement de 6 nouvelles routes de navigation dans `navConfig.ts`.
- ✅ **Chantier 11** : Complétion des maps d'importance ICM pour `/nf525` (`HIGH`) et 5 autres routes dans `TaskContext.ts`.
- ✅ **Chantier 12** : Nettoyage et archivage des sessions fantômes dans `.claude/sessions.md`.
- ✅ **Chantier 14** : Isolation multi-tenant et interdiction de `tenantOverride` serveur.
- ✅ **Chantier 15** : Durabilité `emitDurable` côté serveur via `ServerEventBus` outbox pattern.
- ✅ **Grade X Sovereignty** : `npx tsc --noEmit` → **0 Erreur TypeScript**.

---

## Chantier 17 — 57 handlers abonnés à des événements fantômes

> 🔴 **HIGH — Incohérence architecturelle du Bus d'Événements.**

### Symptôme
57 handlers enregistrés dans `src/shared/eventBus/handlers/` écoutent des noms d'événements qui ne sont **jamais émis** nulle part dans tout le code source (`src/`).

### Preuve Empirique
Sonde d'analyse statique exécutée sur la totalité du dépôt (`src/`) :
- `integration.menu_sync_requested` (`AggregatorMenuSyncHandler.ts`)
- `integration.reservation_received` (`AntiCorruptionLayerHandler.ts`)
- `ai.document_uploaded` (`AutoIndexationHandler.ts`)
- `finance.bank_transaction_synced` (`BankSyncAuditHandler.ts`, `ReconciliationEngineHandler.ts`)
- `biggroup.confirmed` (`BigGroupAlertHandler.ts`)
- `compliance.deadline_approaching` (`ComplianceDeadlineHandler.ts`)
- `haccp.cooling_cycle_logged` (`CoolingCycleHandler.ts`)
- `delivery.delivered` (`DeliveryDriverUnlockHandler.ts`)
- `kds.dish_rebound` (`DishReboundHandler.ts`)
- `store.shift_ended` (`EndOfServiceActionHandler.ts`)

### Cause Racine
Les modules métier ou connecteurs tiers qui devraient émettre ces événements utilisent des noms d'événements obsolètes ou n'ont pas encore été raccordés au bus `NexusEventBus.emitDurable`.

### Correction Proposée
1. Raccorder les services et API routes émettrices aux événements correspondants.
2. Pour les événements obsolètes, supprimer ou réaligner le nom de l'événement dans la déclaration `NexusEventBus.on`.

---

## Chantier 18 — 85 événements émis sans aucun écouteur

> 🟠 **MEDIUM — Émissions dans le vide (Silent Emission).**

### Symptôme
85 types d'événements sont émis via `NexusEventBus.emit` ou `emitDurable` dans les routes API, les services métier ou les adapters de verticales, mais **aucun handler** n'est abonné pour traiter ces événements.

### Preuve Empirique
- `system.reference_promoted` (`/api/admin/mcc/system-tenants/promote/route.ts`)
- `connectors.activated`, `connectors.deactivated`, `connectors.config_saved`, `connectors.sync_completed`, `connectors.sync_failed` (`/api/connectors/...`)
- `fleet.vehicle_assigned` (`/api/fleet/assign-vehicle/route.ts`)
- `haccp.temperature_logged` (`/api/haccp/log-temp/route.ts`)
- `inventory.stock_adjusted` (`/api/inventory/adjust/route.ts`)
- `finance.z_report_requested` (`ZReportAutoJob.ts`, adapters de verticales `Bakery`, `Restaurant`, `Retail`, `Salon`)

### Correction Proposée
Créer les handlers récepteurs manquants dans `src/shared/eventBus/handlers/` pour assurer la clôture des boucles événementielles (Audit, Ledger, Notifications).

---

## Chantier 19 — 129 handlers non tier-aware (`_ref_*` breach risk)

> 🔴 **CRITIQUE — Violations potentielles de SovereignGuard.**

### Symptôme
Sur 139 handlers enregistrés dans `src/shared/eventBus/handlers/`, **129 effectuent des écritures directes** (`Nexus.adapter.update`, `set`, `create`, `delete`) sans vérifier si le tenant cible est inscriptible via `SystemTenantRegistry.isWritable(tenantId)`.

### Cause Racine
Si un événement survient sur un tenant système `_ref_*` (ex: lors de promotions MCC ou d'audits globaux), l'exécution du handler tente d'écrire sur `_ref_*` et déclenche immédiatement un `SovereignBreachError`.

### Correction Proposée
Introduire le garde de tiering en haut de chaque handler modificateur :
```ts
if (!isWritable(tenantId)) {
  logger.info(`[${handlerId}] Ignoré sur le tier non inscriptible: ${tenantId}`);
  return;
}
```

---

## Chantier 20 — 160 routes API sans contrôle d'authentification

> 🔴 **CRITIQUE — Faille de sécurité et contrôle d'accès.**

### Symptôme
160 routes API sur 164 dans `src/app/api/` ne contiennent aucune vérification explicite d'authentification (`verifySession()`, `getServerSession()`, `verifyAdmin()`).

### Preuve Empirique
Scan de l'arbre `src/app/api/` : seules 4 routes API effectuent une validation explicite de la session ou du token d'accès.

### Correction Proposée
Intégrer le middleware centralisé de sécurité API ou le guard `verifySession(req)` au début de chaque route API sous `src/app/api/`.

---

## Chantier 21 — 77 routes API orphelines sans consommateur UI

> 🟠 **MEDIUM — Surface d'attaque et code mort.**

### Symptôme
77 routes Next.js API (`src/app/api/.../route.ts`) ne sont appelées par aucun composant, hook ou service côté frontend (`src/app`, `src/modules`).

### Exemples
- `/api/admin/compliance/chain-audit`
- `/api/admin/compliance/nf525-certificate`
- `/api/admin/fleet/billing/feature-flags`
- `/api/admin/fleet/drain-outbox`
- `/api/admin/fleet/rgpd-purge`

### Correction Proposée
Documenter les routes réservées aux webhooks/cron externes et connecter ou purger les routes obsolètes.

---

## Chantier 22 — Migration globale des tests saga vers `vi.spyOn`

> 🔴 **CRITIQUE — 267 échecs de test résiduels sous Vitest 4.**

### Symptôme
13 fichiers de test (`src/__tests__/helpers/saga.*.test.ts`) échouent sous Vitest 4 car ils utilisent `vi.mock` sur des singletons importés dynamiquement.

### Correction Proposée
Convertir l'ensemble des 13 fichiers de test de saga pour utiliser `vi.spyOn(NexusEventBus, 'emitDurable')` et `vi.spyOn(Nexus.adapter, 'get')` au lieu de `vi.mock()`, sur le modèle validé à 100 % dans `src/__tests__/handlers/saga-handlers.test.ts` (28/28 succès).

---

## Plan de Vérification

### 1. Tests Automatisés
- **TypeScript** : `npx tsc --noEmit` (0 erreur).
- **Vitest Suite Global** : `npx vitest run` (0 échecs sur les 761 tests).
- **Vanguard Fiscal** : `npx vitest run src/e2e/vanguard/` (64/64 succès).

### 2. Validation Manuelle & Multi-Tenant
- Test d'émission d'événement sur tenant `_ref_restaurant` → Vérification de l'absence de crash `SovereignBreachError`.
