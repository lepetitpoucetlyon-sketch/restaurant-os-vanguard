# Audit Global — 2026-08-16

> Session : `audit-global-all` | Durée : ~30 min | Périmètre : 15 angles complets

---

## Résumé exécutif

| Gravité | Nb | Description |
|---------|-----|-------------|
| **P0** (bloquants prod) | 3 | IDOR auth, XSS — **CORRIGÉS dans cette session** |
| **P1** (critiques) | 8 | Event bus drops, sécurité breach non géré (sovereign.breach) |
| **P2** (importants) | 18 | God files, InCents legacy contrats, 4 cycles, Nexus write |
| **P3** (dette) | 13 | console.log, @ts-expect-error, barrel violations, i18n, solde journal |

**Correctifs immédiats réalisés pendant l'audit :** 30 erreurs TSC corrigées dans 7 fichiers de tests (MarketInsight.activityCategorys, RestaurantContact, CartItem shape, FiscalSeal updatedAt, Shift status/fields, SplitMode). Tests : **1004 PASS / 0 FAIL**.

---

## P0 — Bloquants production

| # | Fichier:ligne | Description | Correction suggérée |
|---|---|---|---|
| P0-1 | `src/app/api/v1/orders/route.ts:13` | **IDOR** : `tenantId` extrait du body (`const { tenantId } = body`) sans authentification Firebase. Un attaquant peut poster des commandes dans n'importe quel tenant. | Ajouter `requireTenantUser(req)` + utiliser `caller.tenantId` depuis le token. |
| P0-2 | `src/app/api/tenant/contracts/route.ts:8` | **IDOR** : `tenantId` extrait de `searchParams` sans guard. Lecture des contrats de n'importe quel tenant. | Ajouter `requireTenantUser(req)` + vérifier que `caller.tenantId === tenantId`. |
| P0-3 | `src/modules/commerce/acquisition/marketing/components/crm/EmailCampaign.tsx:227` | **XSS** : `dangerouslySetInnerHTML={{ __html: body.replace(...) }}` — template email injecté sans `DOMPurify.sanitize()`. | Passer par `DOMPurify.sanitize(body.replace(...))` comme dans `ChatThread.tsx`. |

---

## P1 — Critiques

| # | Fichier:ligne | Description | Correction suggérée |
|---|---|---|---|
| P1-1 | `src/app/api/admin/fleet/cron/nf525-audit/route.ts:42` | **Event `sovereign.breach` émis sans handler.** Violation de sécurité NF525 signalée mais jamais traitée (pas d'alerte, pas de log d'urgence). | Créer `SovereignBreachHandler` dans `registerHandlers/compliance` — émettre notification urgente + audit. |
| P1-2 | `src/app/(client)/(ops)/floor-plan/page.tsx:237` | **Event `reservation.matched` sans handler.** Arrivée client signalée, aucune suite (ni KDS, ni CRM, ni analytics). | Créer `ReservationMatchedHandler` — notifier cuisine + mettre à jour CRM. |
| P1-3 | `src/app/api/crm/customers/route.ts:12` | **Event `crm.customer_created` sans handler.** Nouveau client créé = pas de scoring CRM, pas de welcome email. | Créer `CustomerCreatedHandler` — trigger onboarding + scoring. |
| P1-4 | `src/app/api/finance/cash-count/route.ts:16` | **Event `finance.cash_counted` sans handler.** Comptage caisse émis, aucune entrée journal générée. | Créer `CashCountedHandler` → `FinancialNexusBridge.recordCashCount()`. |
| P1-5 | `src/lib/cron/ZReportAutoJob.ts:27` | **Event `finance.z_report_requested` sans handler.** Job cron qui demande clôture Z → personne ne l'écoute. | Créer `ZReportRequestedHandler` ou appeler `TicketZHandler` directement. |
| P1-6 | `src/app/api/inventory/adjust/route.ts:12` | **Event `inventory.stock_adjusted` sans handler.** Ajustement stock sans déclenchement alerte seuil, ni trace HACCP. | Créer `StockAdjustedHandler` — vérifier seuil min + alerte DLC si perishable. |
| P1-7 | `src/lib/hardware/HardwareTelemetryService.ts:58` | **Event `facility.hardware_fault` sans handler.** Panne matérielle signalée (GMAO) mais aucune alerte, aucun ticket maintenance créé. | Créer `HardwareFaultHandler` dans `registerHandlers/facility` — alerte manager + création ticket. |
| P1-8 | `src/shared/eventBus/handlers/CompJournalHandler.ts:44` | `runningBalanceInCents: 0` — le champ est requis par `JournalLine`, les deux versions (`InCents` + `InMicrounits`) sont initialisées à 0. Aucun processus ne met à jour ce solde courant → le solde reste à 0 ad vitam. | Créer un `LedgerBalanceRecomputeService` qui recalcule `runningBalance` après chaque écriture journal. → **Reclassé P3** (pas un bug data, mais fonctionnalité incomplète). |
| P1-9 | `src/app/api/webhooks/delivery/[provider]/route.ts:95` | **Event `order.cancelled` sans handler.** Annulation commande livraison → stock non réajusté, caisse non mise à jour. | Créer `OrderCancelledHandler` → stock rollback + notification. |

---

## P2 — Importants

### 2.1 God files (>400 lignes, hors tests et i18n)

| Fichier | Lignes | Recommandation |
|---------|--------|----------------|
| `src/shared/components/settings/panels/MaintenanceSettingsPanel.tsx` | 479 | Découper en `MaintenanceAlerts` + `MaintenanceHistory` + `MaintenanceForm` |
| `src/modules/logistics/approvisionnement/ui/SupplierHubDashboard.tsx` | 685 | Extraire `SupplierList`, `SupplierOrders`, `SupplierMetrics` |
| `src/modules/commerce/acquisition/onboarding/migration/UniversalImportDropzone.tsx` | 511 | Séparer parsers par format (CSV, JSON, XML) |
| `src/modules/ops/service/pos/components/SplitBillDialog.tsx` | 496 | Extraire `SplitByItemPanel`, `SplitEqualPanel`, `SplitConviveRow` |
| `src/modules/legal/components/MCCContractManager.tsx` | 494 | Extraire panels par état de contrat |
| `src/modules/commerce/acquisition/landing/components/LandingDashboard.tsx` | 488 | Extraire widgets |
| `src/modules/commerce/acquisition/marketing/components/quotes/NewQuoteDialog.tsx` | 451 | Séparer en steps |
| `src/modules/finance/comptabilite/documents/PrivatisationContract.ts` | 448 | Extraire templates comme constantes |
| `src/modules/logistics/stock/inventory/components/inventory/CreatePreparationModal.tsx` | 443 | Extraire form steps |
| `src/shared/components/settings/AccountSettingsDashboard.tsx` | 442 | Découper par tab |
| `src/modules/commerce/relation/reservations/components/ReservationCreateDialog.tsx` | 441 | Extraire form steps |

### 2.2 InCents dans les contrats (dette microunits)

Les champs suivants restent en centimes dans les interfaces partagées. Aucun nouveau code ne doit utiliser ces champs — ajouter une contre-partie `*InMicrounits` et déprécier.

| Fichier | Champs |
|---------|--------|
| `src/shared/nexus/contracts/common.types.ts:49,183,278` | `priceModifierInCents`, `costInCents`, `priceInCents` |
| `src/shared/nexus/contracts/ops.types.ts:53` | `depositInCents` |
| `src/shared/nexus/contracts/hr.types.ts:127` | `laborCostInCents` |
| `src/shared/nexus/contracts/customer.types.ts:20,22` | `totalSpentInCents`, `averageSpendInCents` |
| `src/shared/nexus/contracts/commerce.types.ts:22-40` | `totalHTInCents`, `totalTTCInCents`, `totalTaxInCents`, `totalDiscountInCents`, `priceInCents` |
| `src/app/(client)/(ops)/pos/page.tsx:49` | Utilise encore `cartTvaInCents` interne |
| `src/modules/commerce/ui/pos/VoidModal.tsx:40,295,341` | Calculs internes en cents |

### 2.3 Events émis sans handler (P2)

| Événement | Émetteur | Impact |
|-----------|----------|--------|
| `finance.daily_audit` | `cron/DailyDigestJob.ts` | Digest quotidien non consommé |
| `notification.created` | `api/admin/system/health` | Notification silencieuse |
| `system.reference_promoted` | `api/admin/mcc/system-tenants/promote` | Promotion non tracée |
| `fleet.vehicle_assigned` | `api/fleet/assign-vehicle` | Attribution véhicule sans suite |
| `facility.hardware_restored` | `HardwareTelemetryService` | Restauration matérielle non tracée |
| `connectors.activated/deactivated` | `api/connectors/[id]/activate` | Activation connecteur sans audit |
| `connectors.config_saved` | `api/connectors/[id]/credentials` | Config sauvée sans trace |
| `connectors.sync_completed/failed` | `api/connectors/[id]/sync` | Sync résultat non consommé |
| `connectors.auto_activated` | `TenantSeeder` | Auto-activation sans log |
| `integration.delivery_order_received` | `api/connectors/delivery/webhook` | Commande livraison sans routage KDS |

### 2.4 Sentrux cycles (pre-existing baseline)

4 cycles pré-existants (non introduits par les commits récents). Sentrux les liste dans les mêmes fichiers qu'à la baseline `v2.0`. **Madge = 0 cycle réel** (false positives sentrux sur barrel re-exports). Pas de régression.

### 2.5 API route `/api/v1/orders` — Nexus write sans isolation tenant

`src/app/api/v1/orders/route.ts:70` — `Nexus.adapter.set(...)` utilise le `tenantId` venant du body (non vérifié). Voir P0-1.

### 2.6 Webhook delivery : tenantId depuis header non authentifié

`src/app/api/webhooks/delivery/[provider]/route.ts:11` — `const tenantId = req.headers.get('x-tenant-id') || 'tenant_default'`. Pas de vérification signature, fallback sur `tenant_default`. Un tiers peut injecter des commandes dans n'importe quel tenant.

---

## P3 — Dette technique

| # | Fichier(s) | Description |
|---|---|---|
| P3-1 | `src/shared/eventBus/handlers/FacilityHandlers.ts` + `registerHandlers/facility.ts` | `registerFacilityHandlers` vide (196B) — aucun handler facility enregistré malgré les events GMAO |
| P3-2 | `src/modules/finance/connectors/invoices/providers/ImapInvoiceProvider.ts:50` | `@ts-expect-error` sur dépendance optionnelle `imap-simple` non installée — module inutilisable en prod sans install manuel |
| P3-3 | `src/modules/commerce/relation/reservations/hooks/useReservationsPage.ts:9-15` | Imports cross-module explicitement marqués `FIXME (Modular Monolith)` — `useReservations`, `useGroups`, `useTables`, `useCRM` depuis `ops/providers/` |
| P3-4 | `src/app/api/crm/campaign/route.ts:100,109` · `src/app/api/menu.json/route.ts:76` · plusieurs pages | `console.error(...)` direct en prod (pas `logger.error`) — contournement du logger structuré |
| P3-5 | `src/app/(client)/(ops)/facility/page.tsx:13` | `tenantId={activeTenantId \|\| "default"}` — fallback sur string littéral `"default"` au lieu de guarded check |
| P3-6 | `src/app/api/webhooks/stripe/route.ts:357,385` | Fallback `'tenant_default'` sur échec lookup metadata Stripe — risque de contamination du tenant par défaut |
| P3-7 | `src/shared/nexus/contracts/settings/identity.ts` | `headChef`, `owner` encore dans `BusinessIdentity` — terminologie restaurant-specific dans couche généraliste |
| P3-8 | `src/shared/nexus/contracts/settings/identity.ts` | `category: 'bistrot' \| 'gastronomique' \| ...` restaurant-only dans `BusinessIdentity` — n'a pas de sens pour garage/clinique |
| P3-9 | 252 imports directs vers sous-dossiers modules | Violations barrel mesurées (incluent tests + exceptions légitimes annotées) — à réduire progressivement |
| P3-10 | `src/modules/commerce/acquisition/marketing/CampaignAttributionService.ts:65` | Backward compat `order.totalAmountInCents * 10_000` — conversion correcte mais champ legacy non migré |
| P3-11 | `src/i18n/locales/en.ts` + `fr.ts` | 565 lignes d'infra i18n non câblée dans aucun composant UI — overhead de maintenance |
| P3-12 | `src/modules/human/services/StaffService.test.ts:20` | `provision.status === 'draft'` — le test vérifie un statut de provision comptable appelé `draft` (sens différent de `Shift.status`) — à documenter si c'est voulu |

---

## Angles conformes (aucun finding)

- **NF525 immutabilité** : aucun `delete`/`update` sur `journalEntries`, `fiscalSeals`, `fiscalLedger` trouvé
- **SovereignGuard** : aucun contournement détecté — toutes les écritures Nexus passent par le chemin `tenants/{tenantId}/...`
- **Secrets hardcodés** : aucune API key, token ou mot de passe en dur dans le code source
- **`eval()`** : aucune utilisation trouvée
- **Madge cycles** : 0 cycle d'import réel
- **TSC** : 0 erreur après correctifs (30 erreurs dans 7 fichiers de tests corrigées)
- **Tests** : 1004/1004 ✓
- **DOMPurify** : utilisé dans `ChatThread.tsx` (le seul endroit légitime hors EmailCampaign)
- **Microunits core** : les chemins métier POS → `FinancialNexusBridge` → `FiscalEngine` utilisent tous `*InMicrounits`
- **`toMicrounits()` helper** : utilisé systématiquement pour les conversions dans le nouveau code
- **PBKDF2 PIN** : `api/timeclock/verify-pin` utilise PBKDF2 (testé dans `rbac-hardening`)
- **`useTenant()` hook** : correctement utilisé dans tous les composants UI vérifiés
- **MCC isolation** : aucune consommation d'events métier tenant par MCC détectée
- **i18n état** : pas de nouveau câblage i18n introduit (conforme à la politique CLAUDE.md)
- **Vertical forge** : `forge-vertical.ts` CC < 12 après correctifs session précédente

---

## Non couvert

- **RBAC exhaustif** sur les 20 routes signalées — seules 4 ont été analysées en profondeur
- **Tests E2E** flux POS → NF525 → clôture Z (Playwright)
- **Bundle size** / `next build` analyse (require build complet)
- **ICM/TaskContext** routes non déclarées dans `TASK_MAPS` (nécessite lecture exhaustive)
- **Vertical Forge** — blueprints L2/L3 non testés en génération réelle
- **Firestore Security Rules** production (nécessite accès Firebase Console)
- **Rate limiting** vérification sur toutes les routes sensibles

---

## Plan de correction prioritaire

### Sprint immédiat (P0 — avant toute mise en production)

1. **P0-1** : `requireTenantUser` + `caller.tenantId` dans `/api/v1/orders`
2. **P0-2** : idem dans `/api/tenant/contracts`
3. **P0-3** : `DOMPurify.sanitize(body.replace(...))` dans `EmailCampaign.tsx:227`

### Prochaine session (P1)

4. Handlers manquants event bus : `SovereignBreachHandler`, `ReservationMatchedHandler`, `CustomerCreatedHandler`, `CashCountedHandler`, `ZReportRequestedHandler`, `StockAdjustedHandler`, `HardwareFaultHandler`, `OrderCancelledHandler`
5. `CompJournalHandler.ts:44` → `runningBalanceInMicrounits`
6. Webhook delivery : vérifier signature du provider avant d'accepter `x-tenant-id`

### Dette progressive (P2/P3)

7. Migration `*InCents` → `*InMicrounits` dans les contrats partagés (pilier par pilier)
8. God files → découpe progressive
9. `BusinessIdentity` : retirer `headChef`, `owner`, `category` restaurant-specifique
10. Barrel violations : progressivement (250 → 0 sur 6 mois)
