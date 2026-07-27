# Plan — Audit Structure Piliers + Résidus Globaux

> Issu de l'analyse complète des 7 modules post-migration monolithe modulaire.
> Organisé par priorité : critique → élevé → mineur.

---

## Phase A — Intelligence : stubs parasites (CRITIQUE · XS)

Le module `intelligence/` a deux couches redondantes :
- `intelligence/agency/` (4 fichiers, 1 ligne chacun) → re-exporte depuis `domain/agency/`
- `intelligence/tools/` (2 fichiers, 1 ligne chacun) → re-exporte depuis `domain/agent/tools/`

Ces stubs n'ajoutent aucune valeur et créent de la confusion sur où vit le vrai code.

### Actions
- [ ] **[SUPPRIMER]** `modules/intelligence/agency/Zeus.ts` (1 ligne)
- [ ] **[SUPPRIMER]** `modules/intelligence/agency/types.ts` (1 ligne)
- [ ] **[SUPPRIMER]** `modules/intelligence/agency/useExpert.ts` (1 ligne)
- [ ] **[GARDER]** `modules/intelligence/agency/index.ts` → le transformer en export direct depuis `./domain/agency`
- [ ] **[SUPPRIMER]** `modules/intelligence/tools/types.ts` (1 ligne)
- [ ] **[GARDER]** `modules/intelligence/tools/index.ts` → pointer vers `./domain/agent/tools` (déjà fait)
- [ ] **[COMPLÉTER]** `modules/intelligence/index.ts` — n'exporte que `analytics`, ajouter :
  ```ts
  export * from './rag';
  export * from './agency';
  export * from './fleet/providers/NexusFleetProvider';
  export { AnomalyDetector } from './anomaly/AnomalyDetector';
  export { CircuitBreaker } from './resilience/CircuitBreaker';
  ```

**Gate** : `npx tsc --noEmit → 0`

---

## Phase B — Doublons globaux (CRITIQUE · S)

### B1 · FinancialNexusBridge en double
Deux copies du même fichier (9.8K) :
- `infrastructure/adapters/FinancialNexusBridge.ts` ← **canonique** (utilisé par tests, usePos, e2e)
- `modules/finance/banking/FinancialNexusBridge.ts` ← doublon (utilisé uniquement par SovereignPayout)

- [ ] **[SUPPRIMER]** `modules/finance/banking/FinancialNexusBridge.ts`
- [ ] **[METTRE À JOUR]** `modules/finance/payout/SovereignPayout.ts` :
  ```ts
  // Avant :
  import { FinancialNexusBridge } from '@/modules/finance/banking/FinancialNexusBridge';
  // Après :
  import { FinancialNexusBridge } from '@/infrastructure/adapters/FinancialNexusBridge';
  ```

### B2 · lib/printing/ vs infrastructure/hardware/printers/
- `lib/printing/` — PrintingService.ts, EscPosBuilder.ts, EpsonPrinter.ts, adapters/ (BLE, Browser, Network, Serial, USB)
- `infrastructure/hardware/printers/` — core/, escpos/, adapters/, index.ts

- [ ] **[AUDITER]** Vérifier quel dossier est importé par les routes et composants
- [ ] **[CONSOLIDER]** Fusionner dans `infrastructure/hardware/printers/` (source unique)
- [ ] **[SUPPRIMER]** `lib/printing/` une fois les imports mis à jour

**Gate** : `npx tsc --noEmit → 0` · `grep -r "lib/printing" src/ → 0`

---

## Phase C — Barrels incomplets (ÉLEVÉ · S)

### C1 · compliance/index.ts
Actuellement n'exporte que les types et hooks HACCP. Audit, RGPD, recall, donation, calendar sont invisibles de l'extérieur.

- [ ] **[AJOUTER]** dans `modules/compliance/index.ts` :
  ```ts
  export { AuditService } from './audit/AuditService';
  export { ErasureService } from './rgpd/ErasureService';
  export type { PiiRecord } from './rgpd/PiiVault';
  export { RecallService } from './recall/RecallService';
  export { FoodDonationService } from './donation/FoodDonationService';
  export { ComplianceCalendar } from './calendar/ComplianceCalendar';
  ```

### C2 · finance/index.ts — star-export dangereux
`export * from './services'` expose FiscalEngine, TreasuryEngine en public (moteurs internes).

- [ ] **[REMPLACER]** l'export star par des exports nommés explicites :
  ```ts
  // Avant :
  export * from './services';
  // Après :
  export { FinanceCore } from './services/FinanceCore';
  export { TransactionService } from './services/TransactionService';
  export { BillingService } from './services/BillingService';
  // FiscalEngine, TreasuryEngine, SovereignLedger → privés
  ```

**Gate** : `sentrux check . → 0` · `npx tsc --noEmit → 0`

---

## Phase D — Fichiers orphelins par module (ÉLEVÉ · M)

Même pattern dans 4 modules : des fichiers seuls dans `contexts/` ou `hooks/` à la racine du module au lieu d'être dans leur sous-module.

### D1 · OPS
- [ ] `contexts/FloorContext.tsx` → `engine/contexts/FloorContext.tsx`
- [ ] `prep/prepForecast.ts` (1 seul fichier) → `engine/services/prepForecast.ts` + supprimer `prep/`
- [ ] `providers/nexus-contract.ts` → renommer en `providers/ops-contract.ts`

### D2 · COMPLIANCE
- [ ] `contexts/RegistreContext.tsx` → `haccp/contexts/RegistreContext.tsx`
- [ ] `hooks/useHaccpPage.ts` → `haccp/hooks/useHaccpPage.ts`
- [ ] `components/CleaningPlan.tsx` → `haccp/components/CleaningPlan.tsx`
- [ ] `components/DLCTracker.tsx` → `haccp/components/DLCTracker.tsx`
- [ ] `components/NF525SelfAudit.tsx` → `haccp/components/NF525SelfAudit.tsx`
- [ ] `components/NonConformityForm.tsx` → `haccp/components/NonConformityForm.tsx`

### D3 · HUMAN
- [ ] `domain/hr/LiquidStaffingEngine.ts` → `hr/services/LiquidStaffingEngine.ts`
- [ ] `hooks/useStaffPage.ts` → `hr/hooks/useStaffPage.ts`
- [ ] `contexts/PlanningContext.tsx` → `hr/contexts/PlanningContext.tsx`

### D4 · INTELLIGENCE
- [ ] `contexts/IntelligenceContext.tsx` → `analytics/contexts/IntelligenceContext.tsx`
- [ ] `fleet/providers/` → aplatir en `fleet/NexusFleetProvider.tsx` + `fleet/MarketOracle.ts`
  (supprimer le sous-dossier `providers/` dans `fleet/`)

### D5 · LOGISTICS
- [ ] `migration/ReservationHistoryImporter.ts` → `modules/commerce/reservations/migration/ReservationHistoryImporter.ts`
  (les réservations appartiennent à commerce, pas logistics)
- [ ] `hooks/useOraclePrediction.ts` → renommer en `hooks/useStockPrediction.ts`
  ("Oracle" = marque intelligence, trompeur dans logistics)

**Gate après chaque sous-phase** : `npx tsc --noEmit → 0` · `npx madge --circular src/ → 0`

---

## Phase E — Commerce : single-file modules (MOYEN · M)

6 sous-modules de commerce ont chacun 1-2 fichiers sans structure. À consolider.

| Module actuel | Contenu | Action |
|---------------|---------|--------|
| `orders/GuestOrderService.ts` | 1 fichier | → `reservations/services/GuestOrderService.ts` |
| `payments/PayAtTableService.ts` | 1 fichier | → `ui/pos/PayAtTableService.ts` |
| `pos/CashCountService.ts` | 1 fichier | → `ui/pos/CashCountService.ts` puis supprimer `pos/` |
| `accounts/CustomerAccountService.ts` | 1 fichier | → `customers/services/CustomerAccountService.ts` |
| `loyalty/GiftCardService.ts` | 2 fichiers | → `loyalty/services/GiftCardService.ts` (créer structure) |
| `loyalty/LoyaltyEngine.ts` | (idem) | → `loyalty/services/LoyaltyEngine.ts` |
| `domain/marketing/YieldEngine.ts` | 1 fichier dans domain/ | → `marketing/services/YieldEngine.ts` |

- [ ] **[CLARIFIER]** chevauchement `modules/commerce/ui/pos/` vs `modules/ops/pos/components/` :
  - `commerce/ui/pos/` = modales UI (PinModal, TipPanel, VoidModal, CourseManager…) — **reste dans commerce**
  - `ops/pos/components/` = logique caisse (Cart, ProductGrid, PaymentDialog…) — **reste dans ops**
  - Documenter cette distinction dans les deux `index.ts`

**Gate** : `npx tsc --noEmit → 0`

---

## Phase F — Finance : fiscal fragmenté (MOYEN · S)

Le domaine fiscal est découpé en deux endroits :
- `fiscal/PeriodClosureService.ts` (1 fichier dans `fiscal/`)
- `services/FiscalEngine.ts` (dans `services/`)

- [ ] **[DÉPLACER]** `fiscal/PeriodClosureService.ts` → `services/PeriodClosureService.ts`
- [ ] **[SUPPRIMER]** le dossier `fiscal/` devenu vide
- [ ] **[DÉPLACER]** `components/accounting/AccountingConfig.ts` → `accounting/AccountingConfig.ts`

---

## Phase G — Résidus globaux (MINEUR · XS)

### G1 · src/hooks/ et src/context/ à la racine
- [ ] Auditer `src/hooks/` — hooks genuinement cross-module → `shared/hooks/`
- [ ] Auditer `src/context/` — contextes genuinement cross-module → `shared/contexts/`
- [ ] Supprimer les deux dossiers racine une fois vidés

### G2 · shared/providers/providers/ — chemin redondant
```
shared/providers/
├── NexusCoreProvider.tsx
├── NexusPulseOrchestrator.tsx
├── hooks/
└── providers/              ← redondant
```
- [ ] Aplatir le contenu de `shared/providers/providers/` dans `shared/providers/`
- [ ] Supprimer le sous-dossier `providers/`

### G3 · src/docs/LEXICON.md
- [ ] Déplacer `src/docs/LEXICON.md` → `docs/LEXICON.md` (racine du projet)
- [ ] Supprimer `src/docs/`

---

## Ordre d'exécution recommandé

```
Phase A (stubs intelligence · XS)
    ↓
Phase B (doublons globaux · S)
    ↓
Phase C (barrels incomplets · S)
    ↓
Phase D (orphelins par module · M)  ← peut se faire pilier par pilier
    ↓
Phase E (commerce single-files · M)
    ↓
Phase F (finance fiscal · S)
    ↓
Phase G (résidus globaux · XS)
```

---

## Gate final (après Phase G)

```bash
npx tsc --noEmit                    # 0 erreur TypeScript
npx madge --circular src/           # 0 dépendance circulaire
sentrux check .                     # 0 nouvelle violation
npx vitest run                      # 0 régression
grep -r "lib/printing" src/         # 0 résultat
grep -r "lib/events" src/           # 0 résultat (déjà fait)
./scripts/preflight.sh              # vert complet
```

---

## Récapitulatif effort total

| Phase | Priorité | Effort | Risque |
|-------|----------|--------|--------|
| A — Intelligence stubs | Critique | XS | Faible |
| B — Doublons globaux | Critique | S | Moyen |
| C — Barrels incomplets | Élevé | S | Faible |
| D — Orphelins par module | Élevé | M | Faible |
| E — Commerce consolidation | Moyen | M | Moyen |
| F — Finance fiscal | Moyen | S | Faible |
| G — Résidus globaux | Mineur | XS | Faible |
