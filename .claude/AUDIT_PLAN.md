# AUDIT_PLAN — A4 → A18 | Avant push GitLab

> Document de référence · généré le 2026-08-15  
> Contexte : preflight 8 étapes, 87 fichiers de test, multi-session (respecter sessions.md)  
> **Règles absolues** : pas de Co-Authored-By dans les commits, push GitLab uniquement (pas GitHub), NF525 jamais delete/update, SovereignGuard jamais contourné.

---

## Table des matières

| # | Audit | Bloquant push ? | Effort estimé |
|---|-------|:-:|:-:|
| [A4](#a4--vitest--suite-verte) | Vitest — suite verte | ✅ OUI | ~3h |
| [A5](#a5--madge--zéro-cycle-dimport) | Madge — zéro cycle | ⚠️ NON (non-bloquant, dette signalée) | ~30 min |
| [A6](#a6--next-build--build-de-production) | next build | ✅ OUI | ~1h |
| [A7](#a7--sentrux-check--frontières-architecturales) | sentrux check | ✅ OUI (violations frontières) | ~1h |
| [A8](#a8--sentrux-gate--anti-régression-baseline) | sentrux gate | ✅ OUI | ~20 min |
| [A9](#a9--nf525--immuabilité-fiscale) | NF525 immuabilité | ✅ OUI (légal) | ~45 min |
| [A10](#a10--sovereignguard--aucun-contournement) | SovereignGuard bypass | ✅ OUI (sécurité) | ~30 min |
| [A11](#a11--microunits--aucun-prix-en-cents) | Microunits compliance | ✅ OUI | ~30 min |
| [A12](#a12--tenantid--jamais-hardcodé) | tenantId hardcodé | ✅ OUI (multi-tenant) | ~20 min |
| [A13](#a13--composants-orphelins--rapatriement) | Composants orphelins | ⚠️ NON | ~45 min |
| [A14](#a14--eventbus-handlers--santé-du-bus) | EventBus handlers | ⚠️ NON | ~30 min |
| [A15](#a15--rbac--action_map-et-fail-closed) | RBAC ACTION_MAP | ✅ OUI | ~30 min |
| [A16](#a16--route-isolation--app-client-vs-admin) | Route isolation | ✅ OUI | ~20 min |
| [A17](#a17--secrets-env--aucune-clé-en-dur) | Secrets env | ✅ OUI (sécurité) | ~20 min |
| [A18](#a18--consolelog--nettoyage-avant-prod) | console.log | ⚠️ NON | ~15 min |

---

## A4 — Vitest — Suite verte

**Commande preflight** : `npx vitest run` (étape 4/8 — bloquante)  
**État actuel** : 700 pass / 62 fail / 1 skip · 20 fichiers échouent · Durée ~56s  

### 4.1 — Inventaire complet des 62 échecs

| Fichier de test | Fail | Tests concernés | Catégorie |
|---|:-:|---|---|
| `saga.ops.test.ts` | 4 | PaymentLedgerHandler (×2), NoShowTableReleaseHandler (×2) | event-name bug + spy |
| `saga.ops2.test.ts` | 4 | KdsPassNotifier, KdsPrintFallback, BigGroupAlert, ResaReminder | vi.clearAllMocks spy |
| `saga.commerce2.test.ts` | 3 | SegmentTargeting, MarketingCampaignRouter, AggregatorStockSync | audit spy |
| `saga.compliance.test.ts` | 2 | IotOfflineAlert, RecallPOSBlocker | audit spy |
| `saga.finance2.test.ts` | 4 | RefundExtourne, TechAuditLedger, CryptoIntegrityCheck, AutoIndexation | audit spy + LightRAG timeout |
| `saga.handlers.test.ts` | 2 | WasteStockReconciliation, PayrollExport | spy |
| `saga.human.test.ts` | 4 | PayrollAutoCalc, LaborCostAnalyzer, ScheduleNotifier, EndOfService | spy |
| `saga.intelligence.test.ts` | 4 | SovereignBreach, ReportRetry, DeliveryDriverUnlock, DeliveryRushMode | spy |
| `saga.logistics2.test.ts` | 1 | StockRestitution | spy |
| `saga.crm.test.ts` | 0 | — | PASSÉ |
| `saga.stock.test.ts` | 0 | — | PASSÉ |
| `hermes.knowledge.test.ts` | 7 | isReady, getHealth, query ×2, indexCollection ×2 | vi.mock isolation |
| `ocrParsers.test.ts` | 5 | parse JPEG, markdown fence, JSON invalide, PDF texte, PDF scanné | vi.mock isolation |
| `HACCPLogService.test.ts` | 2 | recordNonConformity, appendTemperatureHistory | vi.mock isolation |
| `piiVault.test.ts` | 1 | erases PII | vi.mock isolation |
| `changelogService.test.ts` | 7 | query/filter (5), écrit changelog, query sans filtre | vi.mock isolation |
| `importers.test.ts` | 5 | CSV produits, Zelty, employés, CRM, inventaire | vi.mock isolation |
| `middleware.test.ts` | 4 | PolicyEngine: SoD, custom, threshold, bearer | vi.mock isolation |
| `falange/sync.test.ts` | ? | synchronisation Falange | à investiguer |
| `verification/isolation.test.ts` | ? | isolation tenant | à investiguer |
| `verification/ram_plateau.test.ts` | ? | RAM plateau | à investiguer |

### 4.2 — Diagnostic des 3 classes de bugs

#### Classe A — Bug d'event name (saga.ops.test.ts uniquement)

**Symptôme** : `mockSet` est appelé avec le chemin `tenants/T/kdsOrders/ord-1` au lieu de `tenants/T/paymentLedger/ord-1`.

**Cause racine** : Les tests PaymentLedgerHandler appellent `capturedHandlers['order.placed']` mais `PaymentLedgerHandler` s'inscrit sur `'order.paid'`. Le handler KDS (qui s'inscrit bien sur `'order.placed'`) est dans `capturedHandlers['order.placed']` depuis le describe précédent — c'est lui qui est invoqué.

**Fichier** : `src/__tests__/helpers/saga.ops.test.ts`  
**Lignes à corriger** : L134, L145, L166 — remplacer `capturedHandlers['order.placed']` par `capturedHandlers['order.paid']` dans les 3 tests PaymentLedgerHandler.

```typescript
// AVANT
await capturedHandlers['order.placed']({ ...baseOrderPaid, paymentMode: 'cash' });
// APRÈS  
await capturedHandlers['order.paid']({ ...baseOrderPaid, paymentMode: 'cash' });
```

#### Classe B — vi.clearAllMocks() dans beforeEach de describe tue les spies globaux

**Symptôme** : `mockSendToRole`, `mockEmit`, `empireAudit.log` montrent 0 appels malgré le `vi.spyOn` global.

**Cause racine** : L'ordre d'exécution Vitest est `beforeEach global → beforeEach describe`. Le beforeEach global établit les spies avec `vi.spyOn(X, 'method').mockImplementation(mockFn)`. Puis le beforeEach describe appelle `vi.clearAllMocks()` qui — en Vitest 4.1.2 — vide les `mock.calls` ET les `mockImplementation` des fonctions hoistées (comportement observé, diverge de la doc). Résultat : quand le handler appelle `browserPush.sendToRole(...)`, la spy existe mais `mockSendToRole` n'a plus d'implémentation et retourne `undefined` sans enregistrer d'appel.

**Pattern de correction** : Remplacer `vi.clearAllMocks()` par un reset sélectif de seulement les mocks qui doivent être propres entre tests :

```typescript
// AVANT (dans chaque describe-level beforeEach)
beforeEach(() => {
  vi.clearAllMocks();
  registerXHandler();
});

// APRÈS
beforeEach(() => {
  // Reset uniquement les call counts sans toucher aux implémentations
  mockGet.mockClear();
  mockSet.mockClear();
  mockUpdate.mockClear();
  mockEmit.mockClear();
  mockSendToRole.mockClear();
  // empireAudit.log si présent
  registerXHandler();
});
```

Ce pattern s'applique à **tous les fichiers saga.*.test.ts** qui ont `vi.clearAllMocks()` dans leurs describe-level beforeEach.

#### Classe C — vi.mock isolation (module cache key mismatch)

**Symptôme** : Les fonctions mockées retournent leurs valeurs par défaut (undefined) ou les vraies implémentations sont appelées.

**Cause racine** : Vitest 4.x `vi.mock('@/alias/path')` crée une instance de module séparée de celle chargée par les handlers via des chemins relatifs (ex: `import { X } from '../services/X'` ≠ `@/path/to/X` dans le cache de module). Les deux chemins résoudent vers le même fichier physique mais Vitest maintient des instances séparées.

**Solution déjà appliquée** : `vi.spyOn(realSingleton, 'method').mockImplementation(mockFn)` — modifie l'objet en mémoire, partagé quelle que soit la clé de cache.

**Application à hermes.knowledge.test.ts** :
```typescript
// Remplacer vi.mock('@/modules/intelligence/knowledge/rag/SovereignRAGClient', ...)
// par :
import { SovereignRAGClient } from '@/modules/intelligence/knowledge/rag/SovereignRAGClient';
// dans beforeEach :
vi.spyOn(SovereignRAGClient, 'sovereignHealth').mockResolvedValue({...});
vi.spyOn(SovereignRAGClient, 'sovereignQuery').mockResolvedValue({...});
vi.spyOn(SovereignRAGClient, 'sovereignIngest').mockResolvedValue(undefined);
```

**Application à ocrParsers.test.ts** :
```typescript
// Remplacer vi.mock('@/lib/ai') par vi.spyOn sur le singleton AI
import { ai } from '@/lib/ai'; // ou la forme exportée réelle
vi.spyOn(ai, 'parseImage').mockResolvedValue({...});
```

**Application à HACCPLogService.test.ts** :
```typescript
// Même pattern — spyOn Nexus.adapter.set et audit depuis tests/setup.ts
```

### 4.3 — Fichiers spéciaux : falange, verification

Ces 3 fichiers (`falange/sync.test.ts`, `verification/isolation.test.ts`, `verification/ram_plateau.test.ts`) sont des tests d'intégration hors du dossier `__tests__/`. Investiguer en priorité :

```bash
npx vitest run tests/falange/sync.test.ts --reporter=verbose 2>&1 | tail -50
npx vitest run tests/verification/isolation.test.ts --reporter=verbose 2>&1 | tail -50
npx vitest run tests/verification/ram_plateau.test.ts --reporter=verbose 2>&1 | tail -50
```

Chercher : imports Firebase réels non mockés, timers, imports dynamiques asynchrones.

### 4.4 — AutoIndexation / LightRAG timeout (saga.finance2.test.ts)

Le test `AutoIndexationHandler > met à jour le statut du document après indexation LightRAG` prend **5017ms** — il appelle le vrai client LightRAG HTTP. Correction :

```typescript
import { LightRAGClient } from '@/modules/intelligence/knowledge/rag/LightRAGClient';
// dans beforeEach global du fichier saga.finance2.test.ts :
vi.spyOn(LightRAGClient.prototype, 'ingest').mockResolvedValue({ ok: true });
// ou si c'est un singleton :
vi.spyOn(LightRAGClient, 'ingest').mockResolvedValue({ ok: true });
```

### 4.5 — Séquence d'exécution recommandée

```bash
# 1. Fixer Classe A — event name dans saga.ops.test.ts (2 min)
# 2. Fixer Classe B — vi.clearAllMocks → vi.XXX.mockClear() dans tous les saga
#    Dans l'ordre : saga.ops, saga.ops2, saga.commerce2, saga.compliance,
#                   saga.finance2, saga.handlers, saga.human, saga.intelligence,
#                   saga.logistics2 (9 fichiers)
# 3. Fixer Classe C — hermes.knowledge, ocrParsers, HACCPLogService, piiVault,
#                     changelogService, importers, middleware (7 fichiers)
# 4. Investiguer falange + verification (3 fichiers)
# 5. Vérification finale
npx vitest run
# Cible : 762 pass / 0 fail / 1 skip
```

### 4.6 — Critères de sortie

- `npx vitest run` retourne **exit 0**
- Aucune ligne `FAIL` dans la sortie
- Durée < 90s (supprimer le timeout LightRAG)
- Commit : `test(A4): vitest suite 100% verte — 762/762`

---

## A5 — Madge — Zéro cycle d'import

**Commande preflight** : `npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src` (étape 5/8 — **non-bloquante** par design dans preflight.sh, génère un warning)

### 5.1 — Exécution et lecture des résultats

```bash
npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src 2>&1 | head -80
```

Format de sortie :
```
Found N circular dependencies!

1) src/modules/X → src/modules/Y → src/modules/X
2) src/lib/A → src/shared/B → src/lib/A
...
```

### 5.2 — Triage : cycles légitimes vs pathologiques

| Type | Impact | Action |
|---|---|---|
| Cycle dans `store/base.ts` ↔ atoms Jotai | TDZ SSR potentiel | Tracer — séparer types dans `store/base.ts` |
| Cycle pilier A ↔ pilier B | Violation isolation | Extraire l'interface commune vers `shared/` ou `kernel/` |
| Cycle `lib/nexus/` ↔ `shared/nexus/` | Architecturale | Toujours `shared/nexus/` → `lib/nexus/`, jamais l'inverse |
| Cycle intra-module (X/index ↔ X/types) | Barrel self-reference | Déplacer les types dans un fichier séparé non barrelisé |

### 5.3 — Commandes de diagnostic par cycle

```bash
# Tracer le chemin complet d'un cycle spécifique
npx madge --image /tmp/cycle.png --extensions ts,tsx --ts-config tsconfig.json src

# Lister tous les imports d'un fichier suspect
npx madge --extensions ts,tsx --ts-config tsconfig.json src --list src/store/base.ts
```

### 5.4 — Correction type : cycle via type import

```typescript
// AVANT — src/modules/A/index.ts importe depuis src/modules/B/types.ts
//         src/modules/B/index.ts importe depuis src/modules/A/types.ts  (cycle)

// APRÈS — extraire les types partagés dans src/shared/types/AB.ts
// src/modules/A/index.ts → import { SharedType } from '@/shared/types/AB'
// src/modules/B/index.ts → import { SharedType } from '@/shared/types/AB'
```

### 5.5 — Critères de sortie

- Préférable : 0 cycle (ok madge)
- Acceptable : cycles identiques à ceux d'avant l'audit (aucune régression)
- Commit si des cycles ont été résolus : `refactor(A5): résolution N cycles madge`
- **Ne pas bloquer le push** si des cycles pré-existants persistent — ils étaient là avant

---

## A6 — next build — Build de production

**Commande preflight** : `npx next build` (étape 6/8 — bloquante)  
**Règle** : toujours appeler `npx next build` directement, jamais via `rtk` (peut masquer un exit non-0).

### 6.1 — Lancement et interprétation

```bash
npx next build 2>&1 | tee /tmp/next-build.log
echo "Exit: $?"
```

Chercher dans la sortie :
- `Type error:` → erreur TypeScript au build (distinct de `tsc --noEmit`)
- `Error:` au niveau de la génération de routes → route dynamique mal configurée
- `warn` sur des imports dynamiques → possibles problèmes de code-splitting
- Taille des bundles — `First Load JS` > 500 kB sur une route = problème

### 6.2 — Erreurs fréquentes et corrections

**Erreur : "cannot use import statement in..."**
```bash
# Un module ESM est importé côté serveur sans transpilation
# → ajouter dans next.config.ts :
transpilePackages: ['problematic-package']
```

**Erreur : "SyntaxError: Unexpected token" sur un fichier .ts**
```bash
# Vérifier que le fichier n'a pas d'annotation de type TS illégale post-transform
# Chercher les double-exports : export { X }; export default X; dans le même fichier
```

**Erreur : "Module not found: '@/lib/xxx'"**
```bash
# Alias manquant dans tsconfig.json paths OU fichier déplacé sans mise à jour du barrel
grep -r "from '@/lib/xxx'" src/ --include="*.ts" --include="*.tsx"
```

**Erreur : "SovereignGuard / NexusAdapter" chargé côté SSR**
```bash
# NexusAdapter utilise IndexedDB — réserver aux "use client" uniquement
# Vérifier qu'aucun Server Component n'importe directement depuis lib/nexus/
grep -r "from '@/lib/nexus/NexusAdapter'" src/app/ --include="*.tsx" | grep -v "use client"
```

### 6.3 — Analyse des routes générées

```bash
# Après le build, vérifier les routes statiques vs dynamiques
cat .next/routes-manifest.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('Static:', len(data.get('staticRoutes', [])))
print('Dynamic:', len(data.get('dynamicRoutes', [])))
for r in data.get('dynamicRoutes', []):
    print(' ', r['page'])
"
```

### 6.4 — Critères de sortie

- `npx next build` retourne **exit 0**
- Aucun `Type error:` dans la sortie
- Aucun bundle > 500 kB (First Load JS) sur les routes critiques (POS, KDS, finance)
- Commit : `build(A6): next build production clean`

---

## A7 — sentrux check — Frontières architecturales

**Commande preflight** : `sentrux check .` (étape 7/8)  
**Bloquant** : violations de frontières `[Error]` (hors max_cc, max_cycles, no_god_files)

### 7.1 — Vérification de l'installation

```bash
which sentrux || echo "ABSENT"
sentrux --version
```

Si absent :
```bash
brew install sentrux/tap/sentrux
# Ou selon .sentrux/README.md
```

### 7.2 — Lancement et triage

```bash
sentrux check . 2>&1 | tee /tmp/sentrux-check.log

# Violations bloquantes (frontières)
grep "\[Error\]" /tmp/sentrux-check.log | grep -v "max_cc\|max_cycles\|no_god_files"

# Violations non-bloquantes (dette CC)
grep "max_cc" /tmp/sentrux-check.log
```

### 7.3 — Groupes de règles (référence .sentrux/rules.toml)

| Groupe | Règles | Violation = |
|---|---|---|
| [1] Contraintes globales | max_cycles, max_cc, no_god_files | ⚠️ Non-bloquant |
| [2] Couches (layers) | app → modules → lib → domain | ✅ Bloquant |
| [3] Nexus bypass | rien ne contourne SovereignGuard | ✅ Bloquant (sécurité) |
| [4] SSR/Store purity | store/pillars → atoms uniquement | ✅ Bloquant |
| [5] Matrice piliers | ops ↮ finance ↮ commerce... (35 règles) | ✅ Bloquant |
| [6] Pureté domaine | domain/schemas ne remonte jamais | ✅ Bloquant |
| [7] Ségrégation routes | (client) ↮ (admin) ↮ api | ✅ Bloquant |
| [8] Direction infra | adapters ne descendent pas dans les piliers | ✅ Bloquant |
| [9] Guards accès | guards admin réservés aux routes admin | ✅ Bloquant |

### 7.4 — Corrections type

**Violation [5] inter-piliers — ex: `ops` importe depuis `finance`**
```typescript
// AVANT (interdit)
import { JournalEntry } from '@/modules/finance/comptabilite/...'

// APRÈS — passer par le barrel pilier
import { JournalEntry } from '@/modules/finance'
// OU — si le type doit être partagé, l'extraire dans shared/
```

**Violation [3] Nexus bypass — accès direct Firestore sans passer par Nexus**
```typescript
// AVANT (interdit)
import { db } from '@/lib/adapters/firebase';
const doc = await db.collection('tenants/X/Y').get();

// APRÈS (obligatoire)
import { Nexus } from '@/lib/nexus/NexusAdapter';
const doc = await Nexus.adapter.get('tenants/X/Y');
```

**Violation [4] SSR purity — barrel pilier importé dans un store atom**
```typescript
// AVANT (interdit dans store/pillars/ops.ts)
import { usePosSession } from '@/modules/ops'

// APRÈS — importer depuis la source directe de l'atom
import { posAtom } from '@/modules/ops/service/pos/atoms'
```

### 7.5 — Critères de sortie

- 0 ligne `[Error]` dans la sortie sentrux hors exclusions (max_cc, max_cycles, no_god_files)
- OK pour les violations CC pré-existantes (documentées, non-bloquantes)
- Commit : `arch(A7): 0 violation frontière sentrux check`

---

## A8 — sentrux gate — Anti-régression baseline

**Commande preflight** : `sentrux gate .` (étape 8/8)  
**Baseline** : `.sentrux/baseline.json` (figée)

### 8.1 — Exécution

```bash
sentrux gate . 2>&1
echo "Exit: $?"
```

- Exit 0 → pas de régression → OK
- Exit 1 → score qualité sous la baseline → régression → **BLOQUER**
- Exit 2 → pas de baseline (jamais figée)

### 8.2 — Si pas de baseline

```bash
# Vérifier l'état de la baseline
cat .sentrux/baseline.json

# Si elle est vide ou absente et que A7 passe :
# ./scripts/sentrux-baseline.sh
# ATTENTION : ne lancer qu'après que A7 est clean
# Ne jamais relancer pour masquer une régression
```

### 8.3 — Si régression détectée

```bash
# Identifier la source de régression
sentrux check . 2>&1 | grep -E "\[Error\]|\[Warn\]" | head -30

# Comparer le score actuel vs baseline
cat .sentrux/baseline.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Baseline score: {d.get(\"score\", \"?\")}'); print(f'Baseline date: {d.get(\"date\", \"?\")}');"
```

La régression vient souvent :
1. D'un nouveau fichier qui viole une règle de couche
2. D'une augmentation de complexité cyclomatique (CC) dans un module existant
3. D'un nouveau god file (>300 lignes, >10 dépendances)

### 8.4 — Critères de sortie

- `sentrux gate .` retourne **exit 0**
- `.sentrux/baseline.json` existe et est cohérente
- Commit : `arch(A8): sentrux gate — pas de régression`

---

## A9 — NF525 — Immuabilité fiscale

**Contexte légal** : Certification française NF525. Toute modification ou suppression des collections fiscales (`journalEntries`, `fiscalSeals`, `fiscalLedger`) est une infraction légale.

### 9.1 — Grep : opérations interdites sur collections fiscales

```bash
# Chercher tout delete/update sur les collections NF525
grep -rn "\.delete\|\.remove\|\.update\|adapter\.update" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -E "journalEntries|fiscalSeals|fiscalLedger|journalEntry" \
  | grep -v ".test." \
  | grep -v "node_modules"
```

Résultat attendu : **aucune ligne**. Toute ligne = violation critique.

```bash
# Vérifier aussi les suppressions directes Firestore
grep -rn "deleteDoc\|delete(" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -E "journal|fiscal|seal" \
  | grep -v ".test." \
  | grep -v "node_modules"
```

### 9.2 — Vérifier le chaînage des scellés

```bash
# FiscalAdapter.ts doit implémenter le hash chaîné SHA-256(data + previousHash)
grep -n "previousHash\|CryptoService.generateHash\|sealEntry" \
  src/modules/finance/fiscalite/FiscalAdapter.ts
```

Attendu :
- `previousHash` présent dans la signature de `sealEntry`
- `CryptoService.generateHash` appelé avec `data + previousHash`
- Aucun contournement (hash constant, hash vide)

### 9.3 — Vérifier FinancialNexusBridge

```bash
# Toute vente POS doit passer par processOrder()
grep -n "processOrder\|JournalEntry\|FiscalSeal" \
  src/modules/finance/comptabilite/FinancialNexusBridge.ts | head -30

# Vérifier que processOrder() n'utilise pas adapter.update/delete sur les entrées fiscales
grep -n "adapter.update\|adapter.delete" \
  src/modules/finance/comptabilite/FinancialNexusBridge.ts
```

Attendu : 0 résultat pour `adapter.update/delete` dans ce fichier.

### 9.4 — Collections protégées dans SovereignGuard

```bash
# Vérifier que journalEntries, fiscalSeals, fiscalLedger sont dans la liste protégée
grep -n "journalEntries\|fiscalSeals\|fiscalLedger" \
  src/shared/nexus/SovereignGuard.ts 2>/dev/null || \
  find src/ -name "SovereignGuard.ts" -exec grep -n "journalEntries\|fiscalSeals" {} \;
```

### 9.5 — Critères de sortie

- 0 opération delete/update sur journalEntries, fiscalSeals, fiscalLedger dans le code source
- Hash chaîné SHA-256 implémenté et non contournable
- processOrder() est l'unique point d'entrée pour la création d'entrées fiscales
- Commit : `audit(A9): NF525 immuabilité confirmée — 0 violation`

---

## A10 — SovereignGuard — Aucun contournement

**Contexte** : SovereignGuard est la barrière cross-tenant. Un contournement = fuite de données entre tenants.

### 10.1 — Grep : accès direct sans SovereignGuard

```bash
# Imports directs vers firebase sans passer par NexusAdapter
grep -rn "from '@/lib/adapters/firebase'\|from 'firebase/firestore'\|collection(" \
  src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "lib/nexus/\|lib/adapters/firebase.ts\|node_modules\|.test." \
  | grep -v "src/app/api/"
```

Toute ligne hors des adapters légitimes = violation.

```bash
# Accès direct à db Firestore hors du layer Nexus
grep -rn "import { db }" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "lib/nexus/\|lib/offline/\|tests/\|.test."
```

### 10.2 — Vérifier le singleton NexusAdapter

```bash
# NexusAdapter doit instancier automatiquement NexusInterceptor + SovereignGuard
grep -n "NexusInterceptor\|SovereignGuard" \
  src/lib/nexus/NexusAdapter.ts
```

Attendu : les deux sont wrappés dans le constructeur ou via une factory.

### 10.3 — Vérifier que les paths Nexus incluent toujours tenantId

```bash
# Chercher des appels Nexus.adapter.get/set/update sans "tenants/"
grep -rn "Nexus\.adapter\.\(get\|set\|update\|delete\)" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "tenants/\${tenantId}\|tenants/${tenantId}\|tenants/\`\|tenants/" \
  | grep -v ".test." \
  | grep -v "mcc/\|platform/" # MCC a ses propres paths légitimes
```

### 10.4 — Critères de sortie

- 0 import direct de firebase hors du layer Nexus
- 0 path Nexus sans `tenants/{tenantId}` (hors MCC)
- SovereignGuard instancié dans NexusAdapter
- Commit : `audit(A10): SovereignGuard — 0 contournement`

---

## A11 — Microunits — Aucun prix en cents dans le nouveau code

**Convention** : 1 microunit = 0,000 001 € · `*InMicrounits` dans tous les champs prix

### 11.1 — Grep : champs en cents dans le nouveau code

```bash
# Champs *InCents qui ne sont pas dans des bridges de migration
grep -rn "InCents\|inCents\|_cents\|priceCents\|amountCents" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test." \
  | grep -v "node_modules" \
  | grep -v "bridge\|Bridge\|legacy\|Legacy" \
  | grep -v "// legacy\|// migration"
```

Les seules occurrences légitimes :
- `usePos.ts` — `CartItem` legacy (bridge via `toMicrounits()`)
- Commentaires explicatifs

```bash
# Vérifier que le bridge Zelty utilise bien toMicrounits()
grep -n "toMicrounits\|InCents" \
  src/modules/commerce/acquisition/importers/ZeltyImporter.ts 2>/dev/null || \
  find src/ -name "*Zelty*" -exec grep -n "toMicrounits\|InCents" {} \;
```

### 11.2 — Vérifier le type branded Microunits

```bash
# toMicrounits() doit être le seul point de cast
grep -rn "as Microunits" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test." \
  | grep -v "toMicrounits"
```

Attendu : 0 résultat (aucun cast direct `as Microunits` hors de la fonction).

### 11.3 — Critères de sortie

- 0 champ `*InCents` dans le nouveau code hors bridges explicitement documentés
- 0 cast `as Microunits` direct
- `toMicrounits()` est le seul point de conversion
- Commit : `audit(A11): microunits compliance — 0 violation`

---

## A12 — tenantId — Jamais hardcodé

**Convention** : `tenantId` toujours depuis `useTenant()` ou le payload d'événement. Jamais une string littérale dans les paths Nexus.

### 12.1 — Grep : tenantId hardcodé

```bash
# Strings qui ressemblent à des tenantIds en dur dans des paths Nexus
grep -rn "tenants/[a-z0-9_\-]\{4,\}/" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test." \
  | grep -v "node_modules" \
  | grep -v "// exemple\|// exemple\|// docs\|// example"
```

```bash
# Vérifier aussi les seeds et seeders (tolérés pour _demo_ tenants)
grep -rn "tenantId.*=.*['\"]" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "useTenant()\|payload\|context\|props\|activeTenantId" \
  | grep -v ".test.\|Seeder\|seed\|_demo_\|node_modules"
```

### 12.2 — Vérifier useTenant() dans les composants

```bash
# Composants qui utilisent un path Nexus sans useTenant()
grep -rn "Nexus\.adapter\." src/modules/ \
  --include="*.tsx" \
  | grep -v "useTenant\|tenantId" \
  | grep -v ".test."
```

### 12.3 — Critères de sortie

- 0 tenantId hardcodé dans les paths Nexus hors seeds/_demo_
- `useTenant()` utilisé systématiquement dans les composants
- Commit : `audit(A12): tenantId — 0 hardcode`

---

## A13 — Composants orphelins — Rapatriement

**Contexte** : Rapatriement progressif de `components/<pilier>/` et `domain/<pilier>/` vers `src/modules/<pilier>/`. Règle : tout nouveau code va dans `modules/`.

### 13.1 — Inventaire des fichiers orphelins

```bash
# Fichiers dans components/ qui ont une cible dans modules/
find src/components/ -name "*.tsx" -o -name "*.ts" 2>/dev/null \
  | grep -v "node_modules" | head -50

# Fichiers dans domain/ hors schemas/ (gelés)
find src/domain/ -name "*.ts" -o -name "*.tsx" 2>/dev/null \
  | grep -v "schemas\|node_modules" | head -30

# Fichiers dans engines/ (hors modules/)
find src/engines/ -name "*.ts" 2>/dev/null | head -20
```

### 13.2 — Triage : rapatrier ou garder ?

| Règle | Décision |
|---|---|
| Fichier référencé uniquement depuis `modules/<pilier>/` | Rapatrier dans `modules/<pilier>/` |
| Fichier référencé depuis `app/` ET `modules/` | Créer un barrel dans `modules/<pilier>/index.ts` |
| Fichier générique UI (Button, Card, Input) | Garder dans `components/ui/` — pas de pilier |
| Fichier dans `domain/schemas/` | NE PAS TOUCHER (gelé — stratégie migration schemas) |

### 13.3 — Procédure de rapatriement sûre

```bash
# 1. Vérifier les imports existants
grep -rn "from.*components/finance/X" src/ --include="*.ts" --include="*.tsx"

# 2. Déplacer (git mv conserve l'historique)
git mv src/components/finance/X.tsx src/modules/finance/comptabilite/X.tsx

# 3. Mettre à jour les imports
# (sed ou IDE global replace)
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  "s|from '@/components/finance/X'|from '@/modules/finance'|g"

# 4. Exporter depuis le barrel pilier
# Ajouter dans src/modules/finance/index.ts :
# export { X } from './comptabilite/X'

# 5. Vérifier
npx tsc --noEmit
```

### 13.4 — Critères de sortie

- Liste des orphelins documentée
- Au minimum : les orphelins touchés dans cette session sont rapatriés
- Aucun nouveau fichier créé dans `components/<pilier>/` ou `domain/<pilier>/`
- Commit : `refactor(A13): rapatriement N composants orphelins`

---

## A14 — EventBus handlers — Santé du bus

**Contexte** : Tous les handlers métier s'inscrivent via `NexusEventBus.on()`. Un handler non-inscrit = événement silencieusement ignoré.

### 14.1 — Inventaire des handlers existants

```bash
# Lister tous les fichiers de handlers
find src/shared/eventBus/handlers/ -name "*.ts" | sort

# Lister toutes les fonctions register*
grep -rn "^export function register" src/shared/eventBus/handlers/ \
  --include="*.ts" | awk -F: '{print $1, $3}'
```

### 14.2 — Vérifier que chaque handler est bien inscrit

```bash
# Trouver le point d'initialisation du bus (NexusOpsProvider ou équivalent)
grep -rn "register[A-Z].*Handler()" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test.\|node_modules"
```

Chaque `register*Handler()` doit apparaître dans un provider ou un initializer.

```bash
# Handlers définis mais jamais appelés (potentiellement orphelins)
DEFINED=$(grep -rn "^export function register" src/shared/eventBus/handlers/ \
  --include="*.ts" | grep -o "register[A-Z][a-zA-Z]*" | sort)
CALLED=$(grep -rn "register[A-Z][a-zA-Z]*Handler()" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test.\|handlers/" | grep -o "register[A-Z][a-zA-Z]*" | sort)
comm -23 <(echo "$DEFINED") <(echo "$CALLED")
```

Résultat = handlers définis mais jamais initialisés.

### 14.3 — Vérifier les noms d'événements

```bash
# Tous les événements utilisés dans les handlers
grep -rn "NexusEventBus.on(" src/shared/eventBus/handlers/ \
  --include="*.ts" | grep -o "'[a-z._]*'" | sort | uniq

# Comparer avec le catalogue d'événements
grep -rn "^\s*'" src/shared/eventBus/events/catalog.ts | grep -o "'[a-z._]*'" | sort | uniq
```

Les événements utilisés par les handlers doivent être présents dans le catalogue.

### 14.4 — Critères de sortie

- Tous les handlers présents dans `handlers/` sont initialisés quelque part
- Tous les noms d'événements sont dans le catalogue `events/catalog.ts`
- Commit si corrections : `fix(A14): handlers non-initialisés — inscription manquante`

---

## A15 — RBAC — ACTION_MAP et fail-closed

**Contexte** : RBAC fail-closed = si une action n'est pas dans `ACTION_MAP`, l'accès est REFUSÉ (pas accordé par défaut).

### 15.1 — Vérifier la politique fail-closed

```bash
# Trouver le fichier ACTION_MAP / RBAC principal
find src/ -name "*.ts" | xargs grep -l "ACTION_MAP\|actionMap\|PERMISSIONS" 2>/dev/null \
  | grep -v ".test.\|node_modules" | head -10
```

```bash
# Vérifier la logique de fallback (fail-closed obligatoire)
grep -n "ACTION_MAP\[action\]\|hasPermission\|checkPermission" \
  $(find src/ -name "*.ts" | xargs grep -l "ACTION_MAP" 2>/dev/null | grep -v ".test." | head -3)
```

La condition doit être : `if (!ACTION_MAP[action]) return false;` (jamais `return true`).

### 15.2 — Vérifier useActionPermission

```bash
# useActionPermission doit utiliser ACTION_MAP avec fail-closed
grep -n "useActionPermission\|ActionPermission" \
  src/shared/rbac/useActionPermission.ts 2>/dev/null || \
  find src/ -name "useActionPermission.ts" -exec grep -n "return false\|return true\|ACTION_MAP" {} \;
```

### 15.3 — Audit des routes admin sans garde

```bash
# Routes /api/admin/ sans guard RBAC (déjà vérifié par preflight step 2 mais approfondir)
for f in $(find src/app/api/admin/ -name "route.ts" 2>/dev/null); do
  if ! grep -q "requireMcc\|requireAuth\|requireTenantAdmin\|adminAuthGuard\|verifyIdToken\|requireRole" "$f"; then
    echo "SANS GUARD: $f"
  fi
done
```

### 15.4 — Critères de sortie

- `ACTION_MAP` fallback = false (fail-closed)
- 0 route `/api/admin/` sans guard d'authentification
- Commit si corrections : `security(A15): RBAC fail-closed — N corrections`

---

## A16 — Route isolation — (client) vs (admin)

**Contexte** : Les routes `app/(client)/` et `app/(admin)/` ont des layouts et middlewares distincts. Un composant admin dans une route client = fuite de surface d'attaque.

### 16.1 — Vérifier la ségrégation des layouts

```bash
# Layouts distincts
ls src/app/\(client\)/ 2>/dev/null || ls "src/app/(client)/" 2>/dev/null
ls src/app/\(admin\)/ 2>/dev/null || ls "src/app/(admin)/" 2>/dev/null

# Vérifier que (client) et (admin) ont des layout.tsx séparés
find "src/app/(client)" -name "layout.tsx" | head -5
find "src/app/(admin)" -name "layout.tsx" | head -5
```

### 16.2 — Grep : imports croisés client ↔ admin

```bash
# Composants admin importés dans des routes client
grep -rn "from '@/app/(admin)\|from '../(admin)\|from '../../(admin)" \
  "src/app/(client)" --include="*.tsx" --include="*.ts" 2>/dev/null

# Composants client importés dans des routes admin
grep -rn "from '@/app/(client)\|from '../(client)\|from '../../(client)" \
  "src/app/(admin)" --include="*.tsx" --include="*.ts" 2>/dev/null
```

Attendu : 0 résultat.

### 16.3 — Routes publiques — deux groupes

```bash
# Vérifier la distinction plateforme vs tenant
ls "src/app/(public)/" 2>/dev/null       # pages PLATEFORME
ls "src/app/(client)/(public)/" 2>/dev/null  # pages TENANT

# Vérifier que (public) n'a pas de NexusOpsProvider
grep -rn "NexusOpsProvider" "src/app/(public)/" --include="*.tsx" 2>/dev/null
```

### 16.4 — Critères de sortie

- Layouts admin et client sont distincts et séparés
- 0 import croisé client ↔ admin
- Routes (public) sans NexusOpsProvider
- Commit si corrections : `fix(A16): route isolation — N corrections`

---

## A17 — Secrets env — Aucune clé en dur

**Contexte** : Aucune clé API, token, ou secret ne doit apparaître dans le code source.

### 17.1 — Grep : patterns de clés en dur

```bash
# Clés génériques (patterns)
grep -rn \
  -e "sk-[a-zA-Z0-9]\{20,\}" \
  -e "AIza[0-9A-Za-z\-_]\{35\}" \
  -e "AAAA[a-zA-Z0-9_\-]\{7\}:[a-zA-Z0-9_\-]\{140\}" \
  -e "pk_live_\|sk_live_\|rk_live_" \
  -e "Bearer [a-zA-Z0-9+/=]\{20,\}" \
  src/ --include="*.ts" --include="*.tsx" --include="*.js" \
  | grep -v ".test.\|node_modules\|// exemple\|// example"
```

```bash
# Variables process.env utilisées directement (vérifier qu'elles sont déclarées dans .env.example)
grep -rn "process\.env\.[A-Z_]\+" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test.\|node_modules" \
  | grep -o "process\.env\.[A-Z_]*" | sort | uniq > /tmp/env_vars_used.txt

# Comparer avec .env.example
grep -o "^[A-Z_]*" .env.example 2>/dev/null | sort > /tmp/env_vars_declared.txt
comm -23 /tmp/env_vars_used.txt /tmp/env_vars_declared.txt
```

Variables utilisées mais non déclarées dans `.env.example` = à documenter.

### 17.2 — Vérifier .gitignore

```bash
grep -E "\.env$|\.env\.local|\.env\.production" .gitignore
```

`.env`, `.env.local`, `.env.production` doivent être ignorés.

### 17.3 — VAPID keys (WebPush)

```bash
# Les clés VAPID ne doivent PAS être en dur
grep -rn "VAPID\|vapid" src/ --include="*.ts" \
  | grep -v "process\.env\|NEXT_PUBLIC_VAPID\|node_modules\|.test."
```

Attendu : 0 résultat (les clés VAPID passent par `process.env.VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`).

### 17.4 — Critères de sortie

- 0 clé API / secret en dur dans le code source
- Toutes les variables `process.env` documentées dans `.env.example`
- `.gitignore` couvre les fichiers `.env*`
- Commit : `security(A17): audit secrets — 0 clé en dur`

---

## A18 — console.log — Nettoyage avant prod

**Contexte** : Les `console.log/warn/error` directs sont interdits en production — utiliser `logger` depuis `@/lib/logger`.

### 18.1 — Inventaire

```bash
# console.log/warn/error dans le code source (hors tests et node_modules)
grep -rn "console\.\(log\|warn\|error\|debug\|info\)" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test.\|node_modules\|eslint-disable" \
  | grep -v "// debug\|// TODO" \
  | wc -l

# Avec détail
grep -rn "console\.\(log\|warn\|error\|debug\|info\)" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v ".test.\|node_modules\|eslint-disable" \
  | head -30
```

### 18.2 — Remplacement systématique

```typescript
// AVANT
console.log('[Module] message', data);
console.error('[Module] erreur', err);
console.warn('[Module] warning', msg);

// APRÈS
import { logger } from '@/lib/logger';
logger.info('[Module] message', data);
logger.error('[Module] erreur', err);
logger.warn('[Module] warning', msg);
```

### 18.3 — Exceptions légitimes (ne pas toucher)

- `src/app/api/` route handlers : `console.error` pour les logs serveur Next.js (accepté)
- Scripts CLI dans `scripts/` : `console.log` pour les outputs de terminal
- `logger.ts` lui-même : il utilise `console.*` en interne

### 18.4 — Critères de sortie

- `console.log/warn/error` dans `src/modules/` et `src/lib/` : **0** (hors exceptions listées)
- Tous remplacés par `logger.*`
- Non-bloquant pour le push si quelques instances résiduelles dans des paths non-critiques
- Commit : `chore(A18): console.log → logger — nettoyage`

---

## Ordre d'exécution recommandé

```
A4 (3h)  →  A9 (45 min)  →  A10 (30 min)  →  A11 (30 min)
→  A12 (20 min)  →  A15 (30 min)  →  A16 (20 min)  →  A17 (20 min)
→  A6 (1h)  →  A7 (1h)  →  A8 (20 min)
→  A5 (30 min)  →  A13 (45 min)  →  A14 (30 min)  →  A18 (15 min)
→  Push GitLab
```

**Logique** :
1. A4 en premier — une suite de tests verte garantit que les corrections suivantes ne cassent rien
2. Audits sécurité/légal (A9, A10, A11, A12, A15, A16, A17) — risque maximal, à valider tôt
3. Build et architecture (A6, A7, A8) — s'appuient sur un code propre
4. Audits non-bloquants en dernier (A5, A13, A14, A18)

## Checklist finale avant push GitLab

```bash
./scripts/preflight.sh
# Toutes les 8 étapes doivent retourner ✅ (sauf madge qui peut être ⚠️)
```

```bash
# Vérifications manuelles additionnelles
git log --oneline -10       # Pas de Co-Authored-By Claude
git remote -v               # Seul GitLab en remote (pas github.com)
git status                  # Aucun fichier non-commité non intentionnel
```

```bash
# Push
git push gitlab main
```

---

*Fin du plan · AUDIT_PLAN.md · 2026-08-15*
