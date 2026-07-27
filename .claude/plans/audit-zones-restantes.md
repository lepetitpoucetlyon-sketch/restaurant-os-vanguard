# Plan — Zones Restantes (app/ · lib/ · components/ · store/)

> Même principe que les piliers : chaque code rejoint son propriétaire légitime.
> Une route orchestre, elle n'implémente pas.

---

## Zone 1 — `src/app/` : God-file pages (CRITIQUE · L)

### Principe

Une `page.tsx` Next.js devrait faire ~30 lignes :
```tsx
// Avant (490 lignes de JSX + logique)
export default function ReceptionPage() { /* tout */ }

// Après (orchestrateur pur)
import { InventoryReceptionDashboard } from '@/modules/logistics';
export default function ReceptionPage() {
  return <InventoryReceptionDashboard />;
}
```

La logique et le JSX vont dans le module propriétaire, pas dans la route.

### Pages à traiter (par priorité)

| Page | Lignes | Module cible |
|------|--------|--------------|
| `admin/inventory/reception/page.tsx` | 490 | `modules/logistics/reception/` |
| `(ops)/operations/page.tsx` | 487 | `modules/ops/engine/` |
| `(public)/page.tsx` | 482 | `modules/commerce/landing/` |
| `(ops)/kds/page.tsx` | 435 | `modules/ops/kds/` |
| `admin/prospecting/page.tsx` | 413 | `modules/commerce/crm/` |
| `(ops)/recruitment/page.tsx` | 362 | `modules/human/hr/` |
| `(ops)/finance/page.tsx` | 361 | `modules/finance/` |
| `account-settings/page.tsx` | 333 | `shared/components/settings/` |
| `(ops)/kitchen/page.tsx` | 330 | `modules/ops/kitchen/` |
| `(ops)/timeclock/page.tsx` | 306 | `modules/human/hr/` |
| `(ops)/planning/page.tsx` | 305 | `modules/human/hr/` |
| `admin/simulation/page.tsx` | 304 | `modules/intelligence/` |
| `settings/page.tsx` | 303 | `shared/components/settings/` |

### Pattern d'extraction (identique pour chaque page)

1. Créer `modules/<pilier>/<feature>/components/<Feature>Dashboard.tsx`
2. Y déplacer tout le JSX + hooks locaux
3. Créer si besoin `modules/<pilier>/<feature>/hooks/use<Feature>Page.ts`
4. Remplacer `page.tsx` par l'orchestrateur de 30 lignes
5. Exporter le composant depuis le barrel du pilier
6. Gate : `npx tsc --noEmit → 0`

### Pages qui restent légitimement grandes

- `(public)/legal/*` — contenu statique, pas de logique
- `[slug]/reservations/page.tsx` — route publique tenant-specific, normal

---

## Zone 2 — `src/lib/` : Rapatriement métier (ÉLEVÉ · M)

### Ce qui RESTE dans lib/ (légitime)

```
lib/
├── firebase.ts, firebase-admin-init.ts  ← clients SDK externes
├── logger.ts, sentry.ts, axiom.ts       ← observabilité
├── auth/                                ← helpers auth Next.js server
├── server/                              ← adminAuthGuard, tenantFromHost
├── nexus/                               ← NexusAdapter singleton (fichier clé CLAUDE.md)
├── icm/                                 ← orchestration runtime ICM-lite (fichier clé CLAUDE.md)
├── push/                                ← WebPush client
├── client/authedFetch.ts               ← fetch authentifié
├── dates.ts, formatters.ts, utils.ts   ← utils généraux
├── bloom-filter.ts, crypto.utils.ts    ← utils techniques
├── shared-kernel.ts                    ← primitives transversales
├── constants.ts, helpers.ts            ← constantes globales
├── docs/                               ← données du portail d'aide in-app
├── docs-data.ts, tutorialContent.ts    ← contenu tutorial
└── mock-data.ts                        ← données de test
```

### Ce qui va dans `infrastructure/` (Phase Lib-A)

```
lib/MasterBridge.ts          → infrastructure/adapters/MasterBridge.ts
lib/NexusSyncService.ts      → infrastructure/services/NexusSyncService.ts
lib/NexusTransaction.ts      → infrastructure/adapters/NexusTransaction.ts
lib/QuantumCrypto.ts         → infrastructure/services/QuantumCrypto.ts
lib/RuntimeValidator.ts      → infrastructure/services/RuntimeValidator.ts
lib/SelfHealingEngine.ts     → infrastructure/services/SelfHealingEngine.ts
lib/TimeSync.ts              → infrastructure/services/TimeSync.ts
lib/sync/                    → infrastructure/services/sync/
lib/sovereign/               → infrastructure/services/sovereign/
lib/services/                → infrastructure/services/
  CommunicationService.ts
  GlobalRegistryService.ts
  IDService.ts
  ImmunityAuditLogger.ts
  MigrationService.ts
  MosyleClient.ts
  email-service.ts
lib/branding/                → infrastructure/services/branding/
lib/audit.ts                 → infrastructure/services/audit.ts
```

### Ce qui va dans `modules/` (Phase Lib-B)

```
lib/ai/                      → modules/intelligence/ai/
  AIProviderRouter.ts
  AgentEngine.ts
  DNAInjector.ts
  HermesEngine.ts
  LLMManager.ts
  ShieldedContext.ts
  types.ts

lib/rag/SovereignRAGClient.ts → modules/intelligence/rag/
lib/simulator/               → modules/intelligence/simulator/
  Simulation.worker.ts
  SimulatorDB.ts
  TemporalSimulator.ts

lib/migration/               → modules/onboarding/
  importers/                 (nouveau pilier léger ou sous-module logistics)
  parsers/
  hooks/
  *.tsx (panels UI)
  types.ts

lib/documents/               → modules/finance/documents/
  FacturXGenerator.ts
  PrivatisationContract.ts

lib/reports/weeklyReport.ts  → modules/intelligence/reports/
lib/marketing-engine.ts      → modules/commerce/marketing/
lib/quotes-service.ts        → modules/commerce/
lib/brands.ts                → modules/commerce/ ou infrastructure/branding/
```

### Gate Phase Lib-A
```bash
grep -r "from '@/lib/MasterBridge\|from '@/lib/NexusSyncService\|from '@/lib/SelfHealing" src/ → 0
npx tsc --noEmit → 0
```

### Gate Phase Lib-B
```bash
grep -r "from '@/lib/ai/\|from '@/lib/rag/\|from '@/lib/simulator/" src/ → 0
npx tsc --noEmit → 0
```

---

## Zone 3 — `src/components/` : Clarification (MOYEN · S)

### Ce qui RESTE dans components/ (légitime)

```
components/
├── ui/          ← design system pur (INTACT — fichier clé)
├── layout/      ← chrome applicatif global (Header, Sidebar, etc.)
├── dev/         ← outils développeur (PerformanceMonitor) — ok
└── blueprint/   ← outils de visualisation architecture — ok (ou → tools/)
```

### Ce qui bouge (Phase Comp-A)

```
components/modals/
  ProductFormModal.tsx               → modules/ops/pos/components/
  product-form/ProductFinancials.tsx → modules/ops/pos/components/product-form/
  product-form/ProductIngredients.tsx
  product-form/ProductSteps.tsx

components/widget/
  EmbedSnippets.tsx                  → modules/commerce/widgets/
  OnlineBookingToggle.tsx            → modules/commerce/widgets/
  ROICalculator.tsx                  → modules/commerce/widgets/
  ReservationWidget.tsx              → modules/commerce/widgets/

components/seo/
  MenuJsonLd.tsx                     → modules/commerce/seo/

components/layout/voice/
  ChatInput.tsx                      → shared/components/voice/
  ChatThread.tsx                     → shared/components/voice/
  NexusSphere.tsx                    → shared/components/voice/
  SessionHistory.tsx                 → shared/components/voice/
  voice-utils.ts                     → shared/components/voice/

components/system/ (split)
  ErrorBoundary.tsx                  → shared/components/
  NexusServiceInitializer.tsx        → shared/providers/
  SovereignShield.tsx                → shared/nexus/guards/sovereign/
  RecipeTechnicalSheet.tsx           → modules/ops/kitchen/components/
  MigrationPlaceholder.tsx           → modules/onboarding/ (avec lib/migration/)
  DocumentationPortal.tsx            → composant system — reste ou → lib/docs/
  AlertSync.tsx, TutorialBubble.tsx, VoiceCommandListener.tsx → shared/components/system/

components/shared/
  VisionScanner.tsx                  → shared/components/ (aplatir — supprimer shared/shared/)
  atomic/GlassInput.tsx              → components/ui/ (design system)
  atomic/GoldSwitch.tsx              → components/ui/

components/ServiceWorkerRegistration.tsx → infrastructure/services/ ou shared/
```

### Gate Phase Comp-A
```bash
npx tsc --noEmit → 0
# Vérifier qu'aucun import ne pointe vers les anciens chemins
grep -r "from '@/components/modals\|from '@/components/widget\|from '@/components/seo" src/ → 0
```

---

## Zone 4 — `src/store/` : Rangement Jotai (MINEUR · XS)

Le store est globalement bien organisé (`base.ts` + `pillars/` + `selectors/`). Seuls 3 atoms ont une mauvaise adresse :

```
store/simulatorAtoms.ts   → modules/intelligence/simulator/store/simulatorAtoms.ts
store/tutorialAtoms.ts    → shared/ ou components/system/ (cross-cutting)
store/languageAtoms.ts    → shared/ (i18n futur)
```

Les autres atoms racine (`dashboardAtoms`, `ingestionAtoms`, `tenantAtoms`, etc.) sont légitimement cross-module → **restent dans store/**.

### Gate Phase Store-A
```bash
npx tsc --noEmit → 0
grep -r "from '@/store/simulatorAtoms'" src/ → mis à jour
```

---

## Ordre d'exécution recommandé

```
Zone App-A  (god files · L)        ← le plus impactant pour la vélocité
    ↓
Zone Lib-A  (infra racine · M)     ← déplace les services d'infra
    ↓
Zone Lib-B  (métier dans lib/ · M) ← intelligence + migration + documents
    ↓
Zone Comp-A (components/ · S)      ← nettoyage résiduel
    ↓
Zone Store-A (store/ · XS)        ← mineur, faire au passage
```

**Note** : Zone App-A peut se faire route par route au fil des développements.
Chaque page touchée = occasion de la réduire à 30 lignes.

---

## Structure cible finale

```
src/
├── app/                     ← routes uniquement, ~30 lignes chacune
├── modules/                 ← 7 piliers + onboarding (nouveau)
│   ├── ops/
│   ├── commerce/
│   │   ├── landing/         ← ex (public)/page.tsx
│   │   ├── widgets/         ← ex components/widget/
│   │   └── seo/             ← ex components/seo/
│   ├── finance/
│   │   └── documents/       ← ex lib/documents/
│   ├── compliance/
│   ├── human/
│   ├── intelligence/
│   │   ├── ai/              ← ex lib/ai/
│   │   ├── simulator/       ← ex lib/simulator/
│   │   └── reports/         ← ex lib/reports/
│   ├── logistics/
│   └── onboarding/          ← ex lib/migration/ (nouveau pilier léger)
├── shared/
│   ├── components/
│   │   ├── settings/        ← déjà fait
│   │   ├── voice/           ← ex components/layout/voice/
│   │   └── system/          ← ex components/system/ (cross-cutting)
│   └── nexus/
├── infrastructure/
│   ├── adapters/            ← + MasterBridge, NexusTransaction
│   ├── services/            ← + tout lib/services/, lib/sync/, lib/sovereign/
│   └── hardware/
├── components/
│   ├── ui/                  ← INCHANGÉ
│   ├── layout/              ← INCHANGÉ (sans voice/)
│   ├── dev/                 ← INCHANGÉ
│   └── blueprint/           ← INCHANGÉ
├── lib/                     ← clients tiers + utils techniques uniquement
├── store/                   ← atoms cross-module (base.ts + pillars/ + selectors/)
└── domain/                  ← schemas Zod (INCHANGÉ)
```

---

## Récapitulatif effort

| Zone | Priorité | Effort | Impact |
|------|----------|--------|--------|
| App/ god files | Critique | L | ★★★★★ vélocité quotidienne |
| Lib/ → infra | Élevé | M | ★★★★ clarté infra |
| Lib/ → modules | Élevé | M | ★★★★ modules complets |
| Components/ | Moyen | S | ★★★ lisibilité |
| Store/ | Mineur | XS | ★★ |
