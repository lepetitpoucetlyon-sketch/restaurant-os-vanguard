# Plan — Migration Monolithe Modulaire

> **Principe** : un module n'exporte que ce que son `index.ts` expose. Tout import qui court-circuite ce barrel est une violation d'architecture.

## Les 3 canaux légitimes de communication cross-module

| Canal | Usage | Existant |
|-------|-------|----------|
| `import { X } from '@/modules/<pilier>'` | Types, hooks, composants publics | à finaliser |
| `Nexus.adapter.get/set(...)` | Données persistées | ✓ |
| `NexusEventBus.emit/on(...)` | Effets de bord async | ✓ (à déplacer) |

---

## Phase 0 — Infrastructure des frontières
> Effort : XS · Poser les rails avant de bouger le moindre fichier

- [ ] **[NOUVEAU]** Ajouter règle ESLint `no-restricted-imports` : interdit tout import de `src/modules/<pilier>/<interne>` depuis un autre module — seul `@/modules/<pilier>` autorisé
- [ ] **[EXISTANT]** Mettre à jour sentrux `[5] MATRICE PILIERS` : remplacer "via bridge infrastructure" par "via `modules/<pilier>/index.ts` uniquement"
- [ ] **[NOUVEAU]** Déplacer le type `SensorReading` vers `src/domain/schemas/haccp.ts` — casse le couplage de type `HACCPLogService` ↔ `IoTSensorService`
- [ ] **[NOUVEAU]** Renommer `src/tests/` → `src/e2e/` + mettre à jour `tsconfig.json` et `vitest.config.ts`
- [ ] **[EXISTANT]** Mettre à jour `CLAUDE.md` avec les 3 canaux légitimes et la règle barrel

**Gate** : `npx tsc --noEmit → 0` · `npx eslint src/ → 0 new`

---

## Phase 1 — Rapatriement
> Effort : M–L · Vider les dossiers parasites — chaque code rejoint son pilier

### `components/` → `modules/`
- [ ] **[RISQUE]** `components/compliance/*` → `modules/compliance/components/`
- [ ] **[RISQUE]** `components/finance/*` → `modules/finance/components/`
- [ ] **[RISQUE]** `components/staff/*` → `modules/human/hr/components/`
- [ ] **[EXISTANT]** `components/mcc/*` (non-layout) → `shared/nexus/guards/admin/mcc/components/`
- [ ] **[FAIT]** `components/ui/` — reste en place (design system pur)

### `lib/` métier → `modules/`
- [ ] **[EXISTANT]** `lib/payroll/` (PrepaieBuilder, DSNBuilder, Silae…) → `modules/human/payroll/`
- [ ] **[EXISTANT]** `lib/billing/` → `modules/finance/billing/` (sous-dossier déjà existant)

### `lib/` infra → `infrastructure/`
- [ ] **[NOUVEAU]** `lib/cash-drawer/`, `lib/payment-terminal/` → `infrastructure/hardware/`
- [ ] **[NOUVEAU]** `lib/backup/`, `lib/telemetry/`, `lib/rate-limiter/`, `lib/offline/`, `lib/storage/` → `infrastructure/services/`
- [ ] **[NOUVEAU]** `lib/motion/`, `lib/a11y/` → `shared/utils/`

### `domain/` racine → `modules/`
- [ ] **[EXISTANT]** `domain/human/hr/` → `modules/human/domain/`
- [ ] **[EXISTANT]** `domain/procurement/` → `modules/logistics/domain/`
- [ ] **[EXISTANT]** `domain/agent/`, `domain/agency/` → `modules/intelligence/domain/`
- [ ] **[FAIT]** `domain/schemas/` (pos, orders, finance, haccp, primitives…) — reste à la racine

**Gate** : `npx tsc --noEmit → 0` · `npx madge --circular src/ → 0` · `npx vitest run → 0 régression`

---

## Phase 2 — Barrels complets
> Effort : M · Finaliser l'API publique de chaque module

- [ ] **[RISQUE]** `modules/ops/index.ts` — supprimer les re-exports depuis `@/engines/ops/` (violation de frontière — sera corrigé en Phase 4)
- [ ] **[EXISTANT]** `modules/finance/index.ts` — ajouter exports des composants rapatriés (Phase 1)
- [ ] **[EXISTANT]** `modules/compliance/index.ts` — ajouter exports HACCP + IoT après rapatriement
- [ ] **[EXISTANT]** `modules/human/index.ts` — ajouter exports payroll (rapatrié de `lib/payroll/`)
- [ ] **[FAIT]** `modules/index.ts` — barrel racine déjà en place, aucun changement

**Règle d'export** :
- ✅ Types Zod `z.infer<>` + interfaces publiques
- ✅ Hooks React (`use*`)
- ✅ Composants UI du module (post-Phase 1)
- ❌ Classes internes (FiscalEngine, PrepaieBuilder) — elles restent privées

**Gate** : `npx eslint src/ → 0 no-restricted-imports` · `sentrux check . → 0 matrice piliers`

---

## Phase 3 — Event Bus centralisé
> Effort : S · Déplacer NexusEventBus dans shared/ — le 3ème canal officiel

- [ ] **[EXISTANT]** `lib/events/NexusEventBus.ts` → `shared/eventBus/NexusEventBus.ts`
- [ ] **[EXISTANT]** `lib/events/registerHandlers.ts` + `handlers/` (5 handlers) → `shared/eventBus/handlers/`
- [ ] **[FAIT]** Événements ops existants : `order.placed`, `order.paid`, `order.cancelled`, `stock.low`, `stock.received`, `sovereign.breach` ✓
- [ ] **[NOUVEAU]** Ajouter `reservation.confirmed`, `reservation.cancelled` (commerce → compliance)
- [ ] **[NOUVEAU]** Ajouter `haccp.alert` (compliance → intelligence)
- [ ] **[NOUVEAU]** Ajouter `payroll.submitted` (human → finance)

**Gate** : `npx tsc --noEmit → 0` · `grep -r "lib/events" src/ → 0 résultats`

---

## Phase 4 — Absorption `engines/`
> Effort : L · Faire en dernier — le plus risqué

- [ ] **[RISQUE]** `engines/ops/` (NexusOpsProvider) → `modules/ops/providers/`
- [ ] **[RISQUE]** `engines/fiscal/` (NexusFiscalProvider) → `modules/finance/providers/`
- [ ] **[EXISTANT]** `engines/fleet/` → `modules/intelligence/fleet/providers/`
- [ ] **[EXISTANT]** `engines/core/` (NexusCoreProvider) → `shared/providers/`
- [ ] **[EXISTANT]** `engines/mcc/` + `provisioning/` → `shared/nexus/engines/mcc/`
- [ ] **[EXISTANT]** `engines/Simulacra/` → `infrastructure/adapters/`
- [ ] **[NOUVEAU]** `modules/ops/index.ts` : remplacer import `@/engines/ops/` par `./providers/`
- [ ] **[NOUVEAU]** `modules/finance/index.ts` : ajouter export depuis `./providers/NexusFiscalProvider`
- [ ] **[NOUVEAU]** Supprimer `src/engines/` après vérification TSC

**Gate** : `npx tsc --noEmit → 0` · `npx madge --circular src/ → 0` · `ls src/engines → absent`

---

## Phase 5 — Gate CI final
> Effort : S · Verrouiller l'architecture — plus de régression silencieuse possible

- [ ] **[EXISTANT]** `npx tsc --noEmit → 0`
- [ ] **[EXISTANT]** `npx madge --circular src/ → 0`
- [ ] **[EXISTANT]** `sentrux check . → 0 nouvelle violation`
- [ ] **[EXISTANT]** `npx vitest run → 0 régression`
- [ ] **[EXISTANT]** `./scripts/preflight.sh → vert`
- [ ] **[NOUVEAU]** CI : ajouter `npx eslint src/ --max-warnings 0` sur `no-restricted-imports`
- [ ] **[NOUVEAU]** Sentrux : ajouter règle `[10] BARREL CONTRACT`
- [ ] **[NOUVEAU]** Mettre à jour `CLAUDE.md` avec structure finale + règle des 3 canaux

**Gate final** : `./scripts/preflight.sh → vert` · `sentrux check . → 0 nouvelle violation`

---

## Structure cible

```
src/
├── app/                     # Routes uniquement — aucune logique métier
│
├── modules/                 # 7 piliers auto-suffisants
│   ├── ops/
│   │   ├── index.ts        # ← SEULE porte publique
│   │   ├── providers/      # ← ex engines/ops/
│   │   └── components/, domain/, hooks/, store/, engine/...
│   ├── finance/
│   │   ├── index.ts
│   │   ├── providers/      # ← ex engines/fiscal/
│   │   ├── billing/        # ← ex lib/billing/
│   │   └── components/, domain/, hooks/, store/...
│   ├── human/
│   │   ├── index.ts
│   │   ├── payroll/        # ← ex lib/payroll/
│   │   └── hr/components/  # ← ex components/staff/
│   ├── compliance/
│   │   ├── index.ts
│   │   └── components/     # ← ex components/compliance/
│   └── commerce/, intelligence/, logistics/
│       └── index.ts
│
├── shared/                  # Cross-pilier légitime
│   ├── eventBus/           # ← ex lib/events/
│   ├── providers/          # ← ex engines/core/
│   ├── nexus/              # guards, contracts, tokens (inchangé)
│   └── utils/              # ← ex lib/motion/, lib/a11y/
│
├── infrastructure/          # Adapters + hardware + services infra
│   ├── adapters/           # FinancialNexusBridge, FiscalAdapter, Simulacra
│   ├── hardware/           # ← ex lib/payment-terminal/, lib/cash-drawer/
│   └── services/           # ← ex lib/backup/, telemetry/, rate-limiter/
│
├── domain/                  # Primitives transversales UNIQUEMENT
│   └── schemas/            # pos, orders, finance, haccp... (inchangé)
│
└── lib/                     # Clients tiers + utils techniques (réduit)
    ├── nexus/              # NexusAdapter singleton
    ├── ai/, rag/, push/    # clients HTTP externes
    ├── server/, auth/      # helpers Next.js server-side
    └── icm/, sync/         # orchestration runtime
```

---

## Ordre d'exécution

```
Phase 0 (XS) → Phase 1 (M–L) → Phase 2 (M) → Phase 3 (S) → Phase 4 (L) → Phase 5 (S)
```

> Chaque phase se termine par son gate avant de passer à la suivante.
> Phases 0–3 peuvent être faites en sessions séparées sans risque.
> Phase 4 est la plus risquée — prévoir une session dédiée avec `git stash` de sécurité.
