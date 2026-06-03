# HANDOVER — RESTAURANT-OS-CORE
## Session interrompue — reprendre ici

---

## État git actuel

**Branche** : `grade-x-vanguard`
**Dernier commit propre** : `eba3f0d4 types(sweep-1)` — ~45 `any` typés

**Working tree dirty** : ~57 fichiers modifiés, **non commités**.
Ces modifications sont le sweep complet des 188 `any` restants.

### Ce qui est fait dans le working tree (pas encore commité)

- **tsc** : `TypeScript: No errors found` ✅
- **Tests** : `173/173 PASS, 0 FAIL` ✅
- ~188 `any` remplacés par des types précis dans ~78 fichiers applicatifs

### Commande à faire EN PREMIER

```bash
cd ~/RESTAURANT-OS-CORE
git add -A src/ scripts/audit-telemetry.ts scripts/migrate-admin.ts
# EXCLURE les fichiers non touchés par le sweep (drift préexistant) :
git reset HEAD src/app/api/admin/nam/analyze/route.ts
git reset HEAD src/domain/agents/
git reset HEAD src/domain/finance/billing/CronosBillingEngine.ts
git reset HEAD src/domain/finance/payout/SovereignPayout.ts
git reset HEAD src/domain/finance/tax/FiscalTransmitter.ts
git reset HEAD src/domain/procurement/ProcurementBridge.ts
git reset HEAD src/domain/services/OracleEngine.ts
git reset HEAD src/domain/services/QualityEngine.ts
git reset HEAD src/domain/services/SovereignLedger.ts
git reset HEAD src/infrastructure/adapters/GeminiAdapter.ts
git reset HEAD src/infrastructure/adapters/SovereignLedgerAdapter.ts
git reset HEAD src/shared/nexus/guards/admin/simulator/SimulatorConsole.tsx
git reset HEAD src/store/nexusNodeFactory.ts

git commit -m "types(sweep-2): eliminate remaining 188 no-explicit-any in app code

Complete pass over all non-test application files — proper types or
unknown+narrowing casts throughout. No rule downgrades, no eslint-disable.

tsc: 0 errors. vitest: 173/173 pass.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Plan maître — où on en est

Plan complet dans : `/Users/mohammed-aliboudjaadar/.claude/plans/async-sniffing-quasar.md`

```
P0 Sécurité           ✅ COMMITÉ  (secrets Neo4j, PIN, TRAINING_MODE_HASH)
P1 Dette              ✅ COMMITÉ  (legacy pos supprimé, ESLint config, pagination)
P1 any sweep lot 1    ✅ COMMITÉ  (eba3f0d4 — 45 any)
P1 any sweep lot 2    🔄 WORKING TREE — à commiter ci-dessus (188 any restants)
P2.1 RAG URL env      ✅ COMMITÉ  (040dfbce)
P2.3 zcpoBridge       ✅ COMMITÉ  (040dfbce)
P2.2 Handlers IA      ⏳ À FAIRE
P2.4 ForensicButton   ⏳ À FAIRE
P2.x Câblage zcpo     ⏳ À FAIRE
P3 Provisioning       ⏳ À FAIRE  (LE chantier commercial — TenantSeeder, signup)
P4 Tests/coverage     ⏳ À FAIRE
P5 GTM/Billing        ⏳ À FAIRE
```

---

## Prochain travail après le commit

### Phase 2 — Architecture (complétion)

**2.2 — Handlers IA réels** (`src/lib/events/handlers/IntelligenceHandler.ts`)
- Ligne 35 : `analyzeStockTrend` → appeler `HermesKnowledgeManager.query()` depuis `src/modules/intelligence/rag/HermesKnowledgeManager.ts`
- Ligne 46 : `analyzeRevenueSignal` → moyenne glissante 7j + alerte si écart > 2σ

**2.4 — ForensicButton** (`src/components/sovereign/ForensicButton.tsx`)
- Ligne 28 TODO : dispatcher vers `POST /api/admin/finance/fec/export`
- Headers requis : `x-nexus-tenant-id`, body : `{ entries, siren, yearMonth }`

**2.x — Câbler zcpoBridge dans NexusSyncService**
- Fichier : `src/lib/NexusSyncService.ts`
- Dans `init()`, après `registerNexusHandlers()`, appeler `readZcpoState()` (depuis `src/lib/icm/zcpoBridge.ts`), puis `degradeImportanceMap(icm.importance, zcpoState)` avant l'init des modules

### Phase 3 — Provisioning (priorité commerciale absolue)

Fichiers clés à créer :

1. **`src/shared/seeds/pcg-accounts.ts`** — Plan comptable général France (classes 1-7, ~50 comptes de base)

2. **`src/domain/services/TenantSeeder.ts`** — Seed à la création :
   - `tenants/{id}/tenantConfig`
   - `tenants/{id}/accounts` (PCG)
   - `tenants/{id}/users` (admin + PIN)
   - `tenants/{id}/fiscalSeals` (seal genesis GENESIS_ROOT_0000000000000000)
   - `tenants/{id}/tables`, `floors`, `zones`
   - Pattern existant à réutiliser : `RESTAURANT_FULL_DNA` dans `src/shared/seeds/restaurant-full-dna.ts`
   - Idempotent + rollback si échec

3. **Brancher dans `src/domain/services/ProvisioningEngine.ts`** :
   - Après `pushSiteTelemetry()`, appeler `TenantSeeder.seed()`
   - Implémenter le flag `copyBaseTemplates` (défini mais jamais utilisé)

4. **`src/instances/index.ts`** — Rendre `getTenantConfig()` dynamique :
   - Lookup statique PUIS fallback Firestore `tenants/{id}`

5. **`src/app/(client)/(public)/signup/page.tsx`** — Page signup SaaS :
   - Champs : email, mdp, nom resto, SIRET, URL site
   - L'URL déclenche `BrandScraper` (déjà construit dans `src/components/settings/BrandScraper.tsx`)

6. **`src/app/api/signup/route.ts`** — Orchestrateur server-side :
   - Firebase Auth `createUserWithEmailAndPassword`
   - `ProvisioningEngine.provisionNewInstance()`
   - `TenantSeeder.seed()`
   - `BrandingService.extractFromUrl()` (déjà construit)
   - Email de bienvenue

---

## Fichiers importants à connaître

| Fichier | Rôle |
|---------|------|
| `src/infrastructure/adapters/FinancialNexusBridge.ts` | Bridge POS→NF525 (déjà complet) |
| `src/lib/events/NexusEventBus.ts` | Bus événements métier |
| `src/lib/icm/TaskContext.ts` | Importance maps par route |
| `src/lib/icm/zcpoBridge.ts` | Dégradation ICM sous pression mémoire |
| `src/domain/services/ProvisioningEngine.ts` | ~50% complet — enregistre mais ne seed pas |
| `src/infrastructure/components/ProvisioningWizard.tsx` | UI 3 étapes (100% complet) |
| `src/shared/seeds/restaurant-full-dna.ts` | DNA template (défini, inutilisé) |
| `src/domain/services/BrandingService.ts` | extractFromUrl() + Playwright (100% complet) |
| `src/hooks/useBrandEditor.ts` | Upload Firebase Storage + save BrandTokens |
| `src/components/settings/BrandScraper.tsx` | UI scraper URL→charte |

## Conventions à respecter

- **Microunits** : 1€ = 1 000 000 µ. Helper : `toMicrounits()` depuis `@/domain/schemas/primitives`
- **NF525** : journalEntries + fiscalSeals = JAMAIS delete/update
- **Multi-tenant** : path `tenants/{tenantId}/{collection}` — tenantId via `useTenant().activeTenantId`
- **No `any`** : règle `no-explicit-any` = error dans eslint.config.mjs

---

## Phase 4 — Tests & Déploiement (~4h)

### 4.1 Coverage vitest
- Ajouter dans `vitest.config.ts` :
  ```typescript
  coverage: { reporter: ['text', 'lcov'], thresholds: { lines: 70 } }
  ```
- Tests prioritaires manquants : `TenantSeeder`, `zcpoBridge` (déjà fait), signup flow, IntelligenceHandler

### 4.2 Preflight + CI
- `scripts/preflight.sh` existe déjà — le câbler dans `.nexus/` (pipeline CI)
- Ajouter un job de provisioning e2e en staging

### 4.3 Docker complet
- `docker-compose.yml` a déjà le service `neo4j` + healthcheck (ajouté en P0)
- Tester `docker-compose up` → app + lightrag + neo4j tous verts

**Vérif** : `./scripts/preflight.sh` vert ; coverage ≥ 70% ; `docker-compose up` 3 services sains.

---

## Phase 5 — Go-to-Market (~6h)

### 5.1 Billing Stripe
- **Nouveaux fichiers** :
  - `src/domain/services/BillingService.ts`
  - `src/app/api/billing/webhook/route.ts`
- 3 tiers déjà configurés dans les instances : STANDARD 79€ / PREMIUM 149€ / ENTERPRISE 299€
- `SaaSBillingGate` **existe déjà** dans `src/shared/nexus/guards/` — il consomme le statut d'abonnement, il attend juste que Stripe le nourrisse
- Stripe Checkout à déclencher à la fin du signup (après provisioning)

### 5.2 Dashboard gérant épuré
- Vue simplifiée post-signup (pas l'admin master-console complet)
- Le `TrainingOverlay` existe déjà (`src/components/layout/TrainingOverlay.tsx`) pour l'onboarding guidé

### 5.3 Landing → signup
- Page `/welcome` existe déjà (marketing, belle)
- Brancher son CTA "Commencer" vers `/signup` (une ligne à changer)

**Vérif finale** : parcours complet prospect → `/welcome` → `/signup` (URL resto) → Stripe test → instance seedée (PCG + tables + charte) → login POS → ticket payé → JournalEntry NF525 dans `/audit-portal` → stock déduit → Ticket Z mis à jour.

---

## Stack technique

Next.js 16, TypeScript strict, Firebase Firestore (local-first), Jotai 2, Zod 4, Vitest 4, Google Gemini, LightRAG Python sidecar (port 9621)
