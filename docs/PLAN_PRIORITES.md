# Plan Priorités — Restaurant OS Core
> Audit du 2026-08-01 · commit `f6dc42e52` · TSC 0 · 513/516 tests · sentrux ✗

---

## Pourquoi on a autant de problèmes ?

### La cause racine : vitesse × ordre d'introduction des règles

Ce repo a été construit à très haute vitesse — **259 commits, 75 sessions** en quelques semaines. Les règles d'architecture (barrel contract, inter-module walls, sentrux CC≤12) ont été introduites au commit `b511819ed` alors que le code existait déjà. **Tout le code écrit ensuite** par les sessions de feature (handlers, MCC, event-bus, destubbing) a continué à ignorer ces règles parce qu'ESLint ne bloque pas le commit — il avertit.

### Les 4 mécanismes concrets

**1. Le bus événementiel a grandi sans frein.**
`registerHandlers.ts` commence vide. 9 sessions de feature (event-bus, saga, partial promises, destubbing) y ajoutent des handlers — chacune importe directement les sous-modules internes. Fan-out : 0 → 96. Résultat : 93 handlers, 172 `register()` appels, un god file qui grossit à chaque sprint.

**2. Les deep imports (barrel violations) viennent du rapatriement progressif.**
La règle dit d'importer `@/modules/ops`. Le code rapatrié et les nouvelles features importent `@/modules/ops/service/pos/store/orderAtoms` parce que c'est plus précis et que `npx tsc` passe quand même. ESLint se plaint mais personne ne fait de `eslint --fix` systématique entre deux sprints. 288 violations s'accumulent ainsi.

**3. La complexité cyclomatique croît avec la logique métier réelle.**
La règle "jamais de stubs" (memory) pousse à implémenter la vraie logique NF525, HACCP, paie. `processOrder` gère 6 cas fiscaux, `useKDSController` 23 états possibles d'écran cuisine. CC élevé est souvent le signe que la logique est juste — mais non découpée.

**4. Les 3 tests en échec et les 2 routes non protégées sont des oublis de session.**
`TicketZHandler.test.ts` a été écrit avant que `emitDurable` soit ajouté au NexusEventBus. Les routes telemetry ont été créées par une session qui n'a pas relu le guard pattern. Ces deux choses auraient été catchées par une CI qui bloque sur ESLint + tests — la CI existe mais n'est pas le gate final du workflow actuel.

### Ce que ça n'est PAS
- Ce n'est pas une mauvaise architecture — les 8 piliers, la couche domaine, les barrels sont bien posés.
- Ce n'est pas de la dette cachée — tout est visible et mesurable.
- Ce n'est pas bloquant en prod — TSC est à 0, les fonctionnalités métier marchent.

C'est de la **dette de conformité** : le code fait ce qu'il doit faire, mais ne respecte pas encore les règles que le repo s'est lui-même données.

---

## État actuel (snapshot)

| Métrique | Valeur | Cible |
|----------|--------|-------|
| TypeScript errors | **0** | 0 ✓ |
| Tests verts | **513 / 516** | 516 / 516 |
| Sentrux gate | **✗ (2 violations)** | ✓ |
| ESLint errors | **445** | 0 |
| God files (fan-out > 15) | **3** | 0 |
| Fonctions CC > 12 | **18** | 0 |
| Barrel violations | **288** | 0 |
| Cross-module violations | **27** | 0 |
| `no-explicit-any` | **107** | 0 |
| Unused vars/imports | **97** | 0 |

---

## P0 — Bloquants immédiats · ~1h30

> CI rouge + faille RBAC. À faire avant tout autre chantier.

### P0.1 — 2 routes admin sans RBAC (30 min)

Les routes telemetry dans `/api/admin/` n'appellent pas de guard. L'`ArchitecturalHealthService` les détecte, passe le grade en `CRITICAL`, ce qui fait crasher la route `/api/admin/system/health` → test `health.test.ts` en échec.

**Fichiers :**
- `src/app/api/admin/fleet/telemetry/crash-report/route.ts`
- `src/app/api/admin/fleet/telemetry/heartbeat/route.ts`

**Fix :** ajouter `requireFleetAdmin` en tête de chaque handler `POST`/`GET`, identique aux autres routes admin.

```typescript
// En tête du handler, pattern standard
const caller = await requireFleetAdmin(request);
if (isDenied(caller)) return caller;
```

**Vérifie :** `npx vitest run src/__tests__/api/health.test.ts` → doit passer.

---

### P0.2 — Mock `emitDurable` dans TicketZHandler.test.ts (20 min)

`TicketZHandler.ts` appelle `NexusEventBus.emitDurable(...)` mais le mock du test ne le définit pas → `TypeError: emitDurable is not a function`.

**Fichier :** `src/__tests__/infrastructure/TicketZHandler.test.ts`

**Fix :** compléter le mock existant ligne ~57 :

```typescript
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    emitDurable: vi.fn().mockResolvedValue(undefined), // ← ajouter
  },
}));
```

**Vérifie :** `npx vitest run src/__tests__/infrastructure/TicketZHandler.test.ts` → 7/7 verts.

---

### P0.3 — Test health grade assertion (10 min, dépend de P0.1)

Le test attend `grade: 'X'` mais `ArchitecturalHealthService` renvoie `'X+++'` (quand propre) ou `'CRITICAL'` (avec routes non protégées). Une fois P0.1 corrigé, adapter l'assertion :

```typescript
// src/__tests__/api/health.test.ts
expect(['X', 'X+++'].includes(body.data.grade)).toBe(true);
```

**Vérifie final :** `npx vitest run` → **516 / 516**.

---

## P1 — Gate architecturale Sentrux · ~8h

> Sentrux bloque en CI. Ces corrections passent le gate au vert et réduisent la surface de dette pour toutes les sessions futures.

### P1.1 — God file `registerHandlers.ts` fan-out=96 · ~3h

Chaque session de feature a ajouté des handlers dans ce fichier. Il orchestre maintenant 93 handlers, 172 registrations. Plafond sentrux : 15.

**Stratégie :** créer `src/shared/eventBus/registerHandlers/` avec un fichier par domaine métier.

```
src/shared/eventBus/registerHandlers/
  index.ts           ← orchestrateur (importe les 6 groupes)
  ops.ts             ← handlers KDS, cuisine, prep, bar, floor
  finance.ts         ← handlers NF525, ticket-Z, fiscal, paie
  compliance.ts      ← handlers HACCP, recall, donation, audit
  commerce.ts        ← handlers CRM, marketing, réservations, livraison
  logistics.ts       ← handlers stock, approvisionnement, food cost
  intelligence.ts    ← handlers oracle, anomalie, RAG, fleet
```

`index.ts` n'importe que 6 fonctions `register*` → fan-out ≤ 10.

**Fichier source actuel :** `src/shared/eventBus/registerHandlers.ts`
**Règle :** chaque fichier de groupe doit rester sous fan-out 15.

**Vérifie :** `sentrux check . --rule no_god_files` → registerHandlers disparu des violations.

---

### P1.2 — God files `FinanceDashboard.tsx` et `NexusSyncService.ts` fan-out=18 · ~2h

Les deux dépassent le plafond de 15 par une légère marge — corrections rapides.

**`FinanceDashboard.tsx`** — extraire 3 sections en composants :
```
components/finance/sections/
  TresorerieSection.tsx   ← banking, payout, collection
  ComptaSection.tsx       ← accounting, FEC, billing
  FiscalSection.tsx       ← tax, TVA, déclarations
```
`FinanceDashboard.tsx` n'importe plus que 3 composants.

**`NexusSyncService.ts`** — `pillarSyncRegistry.ts` existe déjà dans `src/infrastructure/services/sync/`. Déplacer les imports de piliers qui restent dans `NexusSyncService.ts` vers ce registre. NexusSyncService n'importe plus que `pillarSyncRegistry`.

**Vérifie :** `sentrux check . --rule no_god_files` → 0 violation.

---

### P1.3 — 18 fonctions CC > 12 · ~3h

Ordre par impact décroissant :

| Fonction | CC actuel | Fichier | Stratégie |
|----------|-----------|---------|-----------|
| `useKDSController` | 23 | `kds/hooks/useKDSController.ts` | Extraire `useKDSFilters`, `useKDSActions`, `useKDSTimer` |
| `analyzeDailyLaborCost` | 21 | `hr/services/LaborCostAnalyzer.ts` | Découper en 3 fonctions pures par tranche horaire |
| `processOrder` | 19 | `infrastructure/adapters/FinancialNexusBridge.ts` | Extraire `applyVatLogic`, `buildJournalLine`, `validateNF525` |
| `registerFoodCostRecomputer` | 18 | `handlers/FoodCostRecomputer.ts` | Extraire `computeWasteImpact`, `computeIngredientCost` |
| `POST verify-pin` | 17 | `api/timeclock/verify-pin/route.ts` | Extraire `validatePinAttempt`, `buildLockoutResponse` |
| `useStripeSetupIntent` | 16 | `commerce/fidelite/widgets/widget/` | Extraire `handlePaymentError`, `buildConfirmParams` |
| `POST stripe webhook` | 15 | `api/webhooks/stripe/route.ts` | Switch → handler map par `event.type` |
| `generateFlashReport` | 15 | `dashboard/services/DailyConsolidationService.ts` | Extraire `buildRevenueSection`, `buildCoverSection` |
| `generateMonthlyBudgetReport` | 15 | `finance/comptabilite/accounting/services/` | Extraire `computeVariances`, `formatBudgetLines` |
| `KDSTicket` (composant) | 15 | `kds/components/KDSTicket.tsx` | Extraire `KDSTicketTimer`, `KDSTicketActions` |
| 8 autres (cc 13–14) | 13–14 | divers | Early return guards + extraction de helpers purs |

**Règle générale :** chaque `if/else` imbriqué à plus de 2 niveaux → helper privé. Chaque `switch` avec plus de 5 cas → handler map.

**Vérifie :** `sentrux check .` → **0 violation** (gate vert).

---

## P2 — Frontières architecturales · ~6h

> Consolider ce que la restructure a posé. P2.1 avant P2.2 car les cross-module violations sont sémantiquement pires.

### P2.1 — 27 violations `vanguard/no-inter-module-imports` (Mur de Chine) · ~2h

Ces imports font traverser des frontières de pilier directement — ils couplent des domaines qui doivent rester indépendants. Priorité sur les barrel violations car le risque de régression est plus fort.

**Fichiers principaux et corrections :**

| Fichier violateur | Import interdit | Correction |
|-------------------|-----------------|------------|
| `lib/nexus/NexusBridge.ts` (3×) | `@/modules/...` internes | Passer par le barrel racine du pilier |
| `lib/nexus/NexusInterceptor.ts` | idem | idem |
| `lib/nexus/TelemetryService.ts` | idem | idem |
| `lib/slm-data-generator.ts` (3×) | `@/modules/compliance/...` | Importer depuis `@/modules/compliance` |
| `ops/production/kitchen/KitchenDashboard.tsx` (2×) | `@/modules/compliance/...` | `NexusEventBus` ou barrel |
| `ops/workflow/engine/EndOfDayWizard.tsx` | `@/modules/finance/...` | Barrel `@/modules/finance` |
| `ops/workflow/engine/hooks/useRegistre.ts` | `@/modules/compliance/...` | Barrel |
| `intelligence/ia/fleet/NexusFleetProvider.tsx` | cross-module | Barrel ou EventBus |
| `finance/services/NexusYieldEngine.ts` (2×) | `@/modules/ops/...` | EventBus pour les données temps réel |
| `logistics/stock/inventory/InvoiceReviewModal.tsx` | `@/modules/finance/...` | Barrel `@/modules/finance` |
| `onboarding/migration/FECImportPanel.tsx` | `@/modules/finance/...` | Barrel |
| `onboarding/migration/ReservationHistoryImportPanel.tsx` | `@/modules/commerce/...` | Barrel |
| `shared/hooks/useStrategicOracle.ts` | `@/modules/intelligence/...` | Barrel |

**Règle :** si tu as besoin de données d'un autre pilier → `@/modules/<pilier>` (barrel). Si tu as besoin d'un effet de bord → `NexusEventBus.emit(...)`. Jamais de chemin interne.

---

### P2.2 — 288 barrel violations `no-restricted-imports` · ~4h

Deep imports qui court-circuitent les barrels. À traiter pilier par pilier avec batch sed — commencer par les deux plus chargés.

**Ordre de traitement :**

```
ops (66) → intelligence (65) → finance (49) → commerce (31) → human (30) → compliance (22) → logistics (13) → onboarding (11)
```

**Commande pattern par pilier (exemple ops) :**
```bash
# Trouver tous les fichiers qui font des deep imports ops
grep -rln "@/modules/ops/service/\|@/modules/ops/production/\|@/modules/ops/workflow/" src/ \
  --include='*.ts' --include='*.tsx' | grep -v "src/modules/ops/"

# Pour chaque fichier, remplacer par l'import via barrel
# Si le symbol est exporté par src/modules/ops/index.ts → changer l'import
# Si le symbol n'est PAS dans le barrel → l'ajouter au barrel d'abord
```

**Avant de faire le sed :** vérifier que le barrel `src/modules/<pilier>/index.ts` exporte bien le symbol. Si non, l'ajouter au barrel (c'est souvent là que la vraie dette est : des exports manquants dans les barrels).

**Vérifie par pilier :** `npx eslint src/ --ext .ts,.tsx 2>&1 | grep "no-restricted-imports" | grep -c "pilier"` → 0.

---

## P3 — Nettoyage typage & code mort · ~3h

> Largement mécanique. Peut se faire en parallèle d'autres chantiers.

### P3.1 — 107 `no-explicit-any` · ~2h

Top fichiers à corriger manuellement (les autres sont auto-fixables) :

| Fichier | Count | Pattern |
|---------|-------|---------|
| `app/(client)/(ops)/menu-builder/page.tsx` | 6 | Remplacer par types Zod inférés (`z.infer<typeof ProductSchema>`) |
| `app/api/admin/fleet/plugins/route.ts` | 5 | `unknown` + narrowing avec `z.safeParse` |
| `shared/eventBus/NexusEventBus.ts` | 5 | Generic sur `EventPayload<E>` — déjà partiellement typé |
| `handlers/AntiCorruptionLayerHandler.ts` | 5 | `unknown` + type guard |
| `commerce/acquisition/marketing/handlers/CRMVipHandler.ts` | 4 | Types CRM déjà dans `@nexus/contracts` |

**Commande pour les cas simples :**
```bash
npx eslint src/ --fix --rule '{"@typescript-eslint/no-explicit-any": "warn"}'
```

### P3.2 — 97 unused vars & imports · ~1h

Auto-fixable à 90% :
```bash
npx eslint src/ --fix \
  --rule '{"unused-imports/no-unused-imports": "error", "@typescript-eslint/no-unused-vars": ["error", {"varsIgnorePattern": "^_"}]}'
```

Vérifier manuellement les cas où la variable a l'air intentionnellement déclarée (interface partielle, unused parameter préfixé `_`).

---

## Ordre d'exécution recommandé

```
P0.1 → P0.2 → P0.3    (CI vert, sécurité corrigée)
     ↓
P1.1                   (registerHandlers splitté — débloque toutes les sessions futures)
     ↓
P1.2                   (god files restants)
     ↓
P1.3 (top 5 CC)        (sentrux vert)
     ↓
P2.1                   (murs de chine — violations sémantiques)
     ↓
P2.2 (ops + intel)     (barrel violations, piliers les plus chargés)
     ↓
P2.2 (reste)           (finance, commerce, human, compliance, logistics)
     ↓
P3 (parallélisable)    (any + unused — peut être fait par session dédiée)
```

**Point de contrôle entre chaque bloc :**
```bash
npx tsc --noEmit && npx vitest run && sentrux check .
```

---

## Ce qui ne doit PAS être fait maintenant

- **Sous-domaines** : les modules actuels n'ont pas la taille critique (>40 fichiers) pour justifier un 4e niveau de profondeur. Laisser émerger naturellement.
- **i18n** : infrastructure présente mais inactive. Ne pas câbler sans décision explicite produit.
- **Refacto `registerHandlers` complet** : seul le split par domaine est nécessaire pour passer le gate. Pas besoin d'un système de plugin dynamique.

---

## Métriques cibles post-plan

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Tests verts | 513 / 516 | **516 / 516** |
| Sentrux gate | ✗ | **✓** |
| God files | 3 | **0** |
| CC > 12 | 18 fonctions | **0** |
| ESLint errors | 445 | **< 30** (violations pré-existantes légitimes) |
| Cross-module violations | 27 | **0** |
| Barrel violations | 288 | **0** |
| `no-explicit-any` | 107 | **< 10** |

> Durée totale estimée : **~18h** réparties sur 4–5 sessions dédiées.  
> Commit de référence : `f6dc42e52` · Audit : 2026-08-01
