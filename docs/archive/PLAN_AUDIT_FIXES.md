# Plan Audit Fixes — 2026-08-06

> Exécution séquentielle sans arrêt.  
> ✅ = terminé · 🔄 = en cours · ⬜ = à faire

---

## 🔴 P0 — Critiques (blocants prod)

| # | Tâche | Fichier(s) | Statut |
|---|-------|-----------|--------|
| P0-1 | Supprimer secret hardcodé `'fallback-secret-for-dev'` | `api/tenant/api-keys/validate/route.ts:37`, `api/tenant/api-keys/route.ts:22` | ⬜ |
| P0-2 | IDOR menu.json — ajouter guard tenant (limiter à config publique) | `api/menu.json/route.ts` | ⬜ |
| P0-3 | `MenuTool.ts:65` — remplacer `priceInCents` → `priceInMicrounits` | `modules/intelligence/domain/agent/tools/MenuTool.ts` | ⬜ |

---

## 🟠 P1 — Importants

| # | Tâche | Fichier(s) | Statut |
|---|-------|-----------|--------|
| P1-1 | NF525 — déplacer `fiscalLedger/locks` → `fiscalPeriodLocks` | `handlers/PeriodLockGuardHandler.ts` | ⬜ |
| P1-2 | XSS ChatThread — sanitiser `formatText` avec DOMPurify | `shared/components/voice/ui/ChatThread.tsx` | ⬜ |
| P1-3 | Enregistrer les 2 handlers SAGA manquants : SilaeExportHandler, SupportTicketAnalysisHandler | `registerHandlers/human.ts`, `registerHandlers/intelligence.ts` | ⬜ |
| P1-4 | NotificationGateway stub — implémenter email réel via Resend/fetch | `lib/adapters/NotificationGateway.ts` | ⬜ |
| P1-5 | tenantId hardcodés dangereux (4 occurrences) | `useInstanceGuard.ts`, `SovereignBreachHandler.ts`, `SovereignGenome.ts`, `InvoiceExtractionService.ts` | ⬜ |
| P1-6 | StripeTerminalAdapter — 8 @ts-ignore → typage correct | `ops/service/pos/infrastructure/payment-terminal/adapters/StripeTerminalAdapter.ts` | ⬜ |

---

## 🟡 P2 — Dette technique

| # | Tâche | Fichier(s) | Statut |
|---|-------|-----------|--------|
| P2-1 | Dead code — supprimer 4 services sans importeurs | `HandoffService.ts`, `NoShowService.ts`, `CashCountService.ts`, `PayAtTableService.ts` | ⬜ |
| P2-2 | 2 `eval('require')` → `import('node:crypto')` async | `SovereignGuard.ts:102`, `CryptoService.ts:119` | ⬜ |
| P2-3 | InCents leaks actives (3 cas critiques) | `MenuTool`, `FinanceTool`, `MarketplaceSyncService` | ⬜ |
| P2-4 | `status/route.ts` écriture Firestore sans auth | `api/status/route.ts` | ⬜ |
| P2-5 | Modules sans barrel index.ts | `modules/admin/`, `modules/dashboard/`, `modules/settings/` | ⬜ |
| P2-6 | console.log debug dans `InMemoryReservationRepository.ts` | `reservations/infrastructure/repositories/InMemoryReservationRepository.ts` | ⬜ |

---

## 🟢 P3 — Maintenance

| # | Tâche | Fichier(s) | Statut |
|---|-------|-----------|--------|
| P3-1 | `infrastructure/` doublons avec `lib/` — consolider 9 fichiers | Multiple | ⬜ |
| P3-2 | `lib/` repatriation top 5 (AmbianceService, audit.ts, DocumentVault, etc.) | Multiple | ⬜ |
| P3-3 | Barrel violations top 5 fichiers (144 total) | `domain/services/index.ts`, `pillarSyncRegistry.ts`, etc. | ⬜ |

---

## Totaux
- P0 : 3 items
- P1 : 6 items
- P2 : 6 items
- P3 : 3 items
- **Total : 18 items**

Commits après chaque bloc (P0, P1, P2/P3).
