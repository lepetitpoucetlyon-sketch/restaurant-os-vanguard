# 🎯 PLAN MAÎTRE CORRIGÉ — Vibecoder Rescue v2

> **Document de référence unique.** Fusionne le *Master Rescue Plan* initial (corrigé) avec l'audit complet de la branche réalisé le 10 août 2026.
>
> **Branche** : `fix/coherence-ui-backend-securite` · **Working tree** : propre · **Base** : 1124 fichiers dans `modules/`, 164 routes API, 165 handlers EventBus, 8 verticals

---

# 🚦 DÉMARRAGE — LIS CETTE SECTION EN ENTIER AVANT D'ÉCRIRE UNE LIGNE

> Tu es l'agent chargé d'exécuter ce plan sur le dépôt `RESTAURANT-OS-CORE`.
> Ce document est ta **seule** source de vérité. Il est autoporteur : tout ce dont tu as besoin est dedans.

## Étape 0 — Établir l'état de départ (obligatoire, ~5 min)

Exécute ces commandes **dans l'ordre** et **note les résultats**. Tu en auras besoin pour mesurer tes progrès.

```bash
# 1. Où suis-je ?
git branch --show-current
git status --short | wc -l          # doit être 0 ou proche — sinon STOP, demande à l'humain

# 2. État de santé initial
npx tsc --noEmit 2>&1 | grep -c "error TS"        # attendu au 10/08/2026 : 12
npx vitest run 2>&1 | tail -5                      # attendu : 784 pass / 2 fail
npx eslint src --ext .ts,.tsx 2>&1 | tail -3       # attendu : ~502 erreurs
sentrux check . 2>&1 | tail -5                     # attendu : 4 cycles, 18 god files
```

**Si tes chiffres diffèrent notablement de ceux attendus** : le code a évolué depuis la rédaction de ce plan (10/08/2026). **Ne panique pas et n'improvise pas.** Signale l'écart à l'humain, puis continue — les tâches restent valables, seuls les compteurs changent.

## Étape 1 — Créer ton journal de bord (obligatoire)

Crée le fichier `PLAN_PROGRESS.md` à la racine du dépôt. C'est ton **système de vérification**. Tu le mets à jour après **chaque** tâche.

```markdown
# Journal d'exécution — PLAN_MAITRE_CORRIGE

## État initial (relevé le <DATE>)
| Métrique | Attendu | Constaté |
|----------|---------|----------|
| Erreurs TSC | 12 | ? |
| Tests | 784/2 | ? |
| Erreurs ESLint | ~502 | ? |
| Cycles sentrux | 4 | ? |

## Tâches

| # | Tâche | Statut | Commande de vérif | Sortie réelle | Commit |
|---|-------|--------|-------------------|---------------|--------|
| 0.1 | VALIDATION_ERROR | ⬜ | `grep -n VALIDATION_ERROR src/shared/nexus/errors.ts` | | |
| 0.8 | requireSession | ⬜ | `grep -rn "await verifySession(" src --include="*.action.ts"` → 0 | | |

Légende : ⬜ à faire · 🔄 en cours · ✅ fait+vérifié · ⛔ bloqué · ⏭️ écarté (avec raison)

## Blocages rencontrés
<!-- Chaque blocage : tâche, ce qui a été tenté, message d'erreur exact -->

## Écarts constatés entre le plan et le code
<!-- Chaque fois que la réalité diffère du plan -->
```

## Étape 2 — La boucle d'exécution

Pour **chaque** tâche du plan, dans l'ordre imposé :

```
1. LIRE     la tâche en entier, y compris les ⚠️ et 🔴 qui l'entourent
2. VÉRIFIER que la référence existe encore :
              grep -n "<symbole>" <fichier>       ← JAMAIS se fier au n° de ligne seul
3. FAIRE    le travail en entier — pas de stub, pas de TODO
4. VÉRIFIER en exécutant la commande de vérification de la tâche
5. CONTRÔLER la non-régression :
              npx tsc --noEmit    → 0 erreur
              npx vitest run      → toujours vert
6. COMMITER  un commit par tâche : <type>(<scope>): <tâche> — réf. plan §X.Y
7. NOTER     dans PLAN_PROGRESS.md : statut, sortie réelle de la vérif, hash du commit
```

**Si l'étape 4 ou 5 échoue** : ne passe pas à la tâche suivante. Corrige, ou marque ⛔ et explique.

## Étape 3 — Les portes de phase (gates)

À la fin de chaque phase, il y a un bloc **« ✅ Critère de sortie »**. Ce sont des **portes**, pas des suggestions.

```
⛔ INTERDIT de commencer la phase N+1 si la porte de la phase N n'est pas franchie.
```

Si tu ne peux pas franchir une porte : **arrête-toi**, écris ce qui bloque dans `PLAN_PROGRESS.md`, et rends la main à l'humain.

## Étape 4 — Reprise après interruption

Ta session sera interrompue — ce plan représente plusieurs semaines de travail.

**Au redémarrage** :
1. Lis `PLAN_PROGRESS.md` **en premier**
2. Reprends à la première tâche ⬜ ou 🔄
3. Ne refais **jamais** une tâche ✅ sans raison explicite
4. Relance l'Étape 0 pour vérifier que rien n'a bougé entre-temps

## ⛔ Les 5 comportements interdits

Ces réflexes sont naturels pour un modèle. Ils sont ici **des fautes**.

| Interdit | Pourquoi c'est grave ici |
|----------|--------------------------|
| **Cocher sans vérifier** | Le plan devient un mensonge, et personne ne sait où en est le projet |
| **`sed` global sur les montants** | `s/InCents/InMicrounits/g` renomme sans convertir → tous les montants ÷ 10 000, sur des écritures fiscales **scellées et irréversibles** |
| **Faire « le plus important » d'une liste** | Les listes de ce plan sont exhaustives par nécessité légale (NF525, RGPD, e-facture). Une tâche omise = une non-conformité |
| **Résoudre un conflit tout seul** | Ce plan contient des contraintes légales contradictoires (fiscal 10 ans ⇄ RGPD). Le mauvais arbitrage a des conséquences juridiques. **Signale, ne tranche pas.** |
| **Faire confiance à `rtk`** | Il a renvoyé `exit 0` sur 12 erreurs TSC et « 2 errors » sur ~502. **Lis toujours le compte réel dans la sortie, jamais le code de retour.** |

## 🎯 Par où commencer, concrètement

```
1er   §0.1   VALIDATION_ERROR       (~10 min)  → débloque 0.8 et la Phase 2
2e    §0.8   🚨 requireSession      (~4 h)     → FAILLE DE SÉCURITÉ ACTIVE
3e    §0.2   PrepaieBuilder         (~20 min)
…     suivre l'ordre du document
```

> 🚨 **La §0.8 est une faille de sécurité en production** : 41 Server Actions s'exécutent sans authentification effective, dont l'annulation fiscale et les mouvements de caisse. Si tu ne dois faire qu'une chose aujourd'hui, fais celle-là.

---

# 🤖 CONTRAT D'EXÉCUTION

**Ce document est un plan d'exécution, pas une source d'inspiration.** Chaque tâche cochable est un travail à livrer en entier.

## Règles non négociables

1. **Une tâche cochée = une tâche vérifiée.** Ne coche jamais `[x]` sans avoir exécuté la commande de vérification associée et constaté son résultat. Si tu ne peux pas vérifier, laisse `[ ]` et dis-le.

2. **Interdiction de réduire le périmètre en silence.** Si une tâche s'avère plus large que prévu, fais-la quand même **en entier**. Si elle est bloquée, écris explicitement : *« Tâche X non faite — raison précise »*. Ne la déclare jamais terminée partiellement.

3. **Interdiction des stubs déguisés.** Pas de `return true`, pas de `// TODO: implémenter`, pas de fonction vide qui compile. Une fonctionnalité demandée = logique métier complète de bout en bout.

4. **Vérifie les références avant de les suivre.** Les numéros de ligne de ce document ont été vérifiés le 10/08/2026. Le code a pu bouger depuis. **Toujours `grep` le symbole, jamais faire confiance au numéro seul.**

5. **Ne jamais se fier au code de sortie de `rtk`.** Il a renvoyé `exit 0` sur 12 erreurs TSC et « 2 errors » sur ~502 erreurs ESLint. **Lis toujours le compte réel dans la sortie.**

6. **Un commit par tâche cochée.** Jamais de commit fourre-tout. Message : `<type>(<scope>): <tâche> — réf. plan §X.Y`

7. **Si une correction en casse une autre, arrête-toi.** Signale le conflit, ne choisis pas seul quelle règle sacrifier. Ce plan contient des contraintes légales (NF525, RGPD, e-facture) où le mauvais arbitrage a des conséquences juridiques.

## Après CHAQUE tâche

```bash
npx tsc --noEmit                # doit rester à 0 erreur
npx vitest run                  # doit rester vert
```

Si l'un des deux régresse : **corrige avant de passer à la suite.** Ne jamais empiler.

## Rapport de fin de phase — format imposé

À la fin de **chaque** phase, produis ce bloc dans `PLAN_PROGRESS.md` **et** dans ta réponse à l'humain. Format strict, pas de prose libre.

```markdown
### PHASE <N> — <titre> — <TERMINÉE | PARTIELLE | BLOQUÉE>

**Tâches** : X/Y faites et vérifiées

**Porte de sortie** (copier le bloc du plan, remplir la colonne « constaté ») :
| Critère | Attendu | Constaté | ✅/❌ |
|---------|---------|----------|-------|
| npx tsc --noEmit | 0 erreur | ? | |
| npx vitest run | N/N | ? | |

**Sorties réelles des commandes de vérification** :
```
<coller la sortie brute, pas un résumé>
```

**Non fait / écarté** :
| Tâche | Raison précise |
|-------|----------------|

**Écarts plan ⇄ code constatés** :
| Ce que dit le plan | Ce que dit le code | Impact |
|--------------------|--------------------|--------|

**Commits produits** : <liste des hash + messages>

**Décision requise de l'humain** : <oui/non — si oui, la question exacte>
```

> 🔴 **« Sortie brute, pas un résumé »** est une règle, pas un détail. Un résumé permet de dire « tout est vert » sans que ce soit vrai. Le copier-coller de la sortie réelle, non.

## Quand demander à l'humain (et ne pas décider seul)

Remonte **systématiquement** dans ces cas :

| Situation | Pourquoi tu ne peux pas trancher |
|-----------|----------------------------------|
| Deux règles du plan se contredisent | Contraintes légales opposées — arbitrage juridique, pas technique |
| Une correction en casse une autre | Voir ci-dessus |
| Le code réel contredit le plan sur un point **fiscal ou RGPD** | Le plan peut être périmé, mais l'erreur coûte cher |
| Une tâche demande de supprimer des données | NF525 = append-only. Aucune suppression n'est jamais la bonne réponse |
| Le choix d'une PA (§7.5) | Décision commerciale et contractuelle |
| Le périmètre visuel (§6.0 bis) ou l'i18n (§6.2) | Décisions produit explicitement réservées à l'humain |
| Ouvrir la verticale `clinic` | Données de santé — analyse juridique préalable obligatoire |

## Ordre d'attaque

**Ne pas improviser l'ordre.** Il est vérifié et justifié dans la section *« Vérification chronologique »* en fin de document. Deux points en particulier :

- La **Phase 1 bis** (filet exécutable) doit précéder les Phases 2, 3, 5 et 7
- La **réception e-facture (7.3)** est hors séquence — échéance légale au 1ᵉʳ septembre 2026

---

## ⚠️ AVERTISSEMENT — Corrections apportées au plan initial

Le *Master Rescue Plan* d'origine contenait **4 erreurs factuelles majeures**, vérifiées ligne par ligne contre le code réel. Ne pas exécuter le plan original tel quel.

| # | Affirmation du plan original | Réalité vérifiée | Verdict |
|---|------------------------------|------------------|---------|
| 1A | « Supprimer l'usage de l'objet natif `Proxy` … implémenter `Object.freeze()` récursif » | **Aucun `Proxy`** dans `SovereignGuard.ts`. `freezeData<T>()` avec `Object.freeze` récursif **existe déjà** (l. 88–100). Le commentaire l. 84 dit : *« V8-Optimized Immutability (Replaces legacy Proxy-based interception) »* | ❌ **DÉJÀ FAIT** — supprimé du plan |
| 1B | « Supprimer la logique interne de Dead Letter Queue … déléguer à GCP Pub/Sub ou Redis » | DLQ/outbox = **34 fichiers**, services dédiés (`DLQRetryService`, `DLQQuarantineAlertHandler`, `PayloadMigrator`, route `drain-outbox`). Les 2 derniers commits EventBus **renforcent** la DLQ. GCP Pub/Sub et Redis **ne sont pas dans la stack** (Firebase/Firestore) | ❌ **DESTRUCTIF** — rejeté |
| 2B | « 293 `any` toxiques » | **67** erreurs `@typescript-eslint/no-explicit-any` réelles hors tests | ⚠️ **CHIFFRE ÷4** — corrigé |
| 2B | « Migration des Server Actions : `submitOrderAction`, `updateRecipeAction`, `upsertCustomerAction`, `signCleaningTaskAction` » | Ces 4 fonctions existent mais sont des **fonctions de hooks/composants client**, pas des Server Actions. Les vraies Server Actions sont les **13 fichiers `*.action.ts`** | ⚠️ **CIBLE CORRIGÉE** |
| ex. | Exemple `OrderPayloadSchema` avec `totalInCents: z.number()` | Contredit la convention microunits du projet. Écrire ce schéma tel quel **réintroduirait la dette que la Phase 5 supprime**, dans le module POS, le plus sensible | ⚠️ **CORRIGÉ EN MICROUNITS** |

### 📎 Trace historique — la mue `Proxy` → `Object.freeze` (déjà effectuée)

Le plan original documentait cette transformation comme à faire. Elle est **déjà en production**. Conservée ici comme référence de ce qui a été livré :

```diff
// AVANT (lent, poison pour l'optimiseur V8)
- function protectData(data) {
-    return new Proxy(data, {
-        set() { throw new Error("NF525 Sealed"); }
-    });
- }

// APRÈS — état actuel de src/shared/nexus/guards/SovereignGuard.ts:88
+ freezeData<T>(data: T): Readonly<T> {
+    if (data === null || typeof data !== 'object') return data as Readonly<T>;
+    if (Object.isFrozen(data)) return data as Readonly<T>;
+    Object.freeze(data);           // lève naturellement TypeError à la mutation
+    // ... récursion sur les propriétés
+ }
```

**Ne pas réécrire ce code.** Toute session qui le proposerait travaille sur une version périmée du dépôt.

**Éléments du plan original conservés tels quels** :
- ✅ `onValidated` sur le bus (vérifié : n'existe pas, ajout purement additif)
- ✅ Sanctuarisation des `unknown` d'adapters (204 réels, principe sain)
- ✅ Phase 3 fragmentation UI — **chiffres exacts au ligne près**, seule phase entièrement fiable

**Correction d'un chiffre de mon propre audit** : j'avais annoncé « 2 erreurs ESLint ». Le wrapper `rtk` tronquait le compte. Le vrai total est **~502 erreurs**. Cela déplace ESLint d'une broutille à un chantier de Phase 1.

---

## 📊 État de référence (mesuré, 10/08/2026)

| Indicateur | Valeur | Statut |
|------------|--------|--------|
| Tests | **784 pass / 2 fail** | 🟡 |
| TypeScript | **12 erreurs** (11 dans `scripts/crash-test/`, 1 en code prod) | 🟡 |
| ESLint | **~502 erreurs** | 🔴 |
| Sentrux — cycles | **4** (max autorisé : 0) | 🔴 |
| Sentrux — god files | **18** (fan-out > 15), dont 11 hors tests | 🔴 |
| Sentrux — complexité | **4 fonctions** cc > 20 | 🔴 |
| Score qualité Sentrux | **3393** | — |
| Migration microunits | **1652 `InMicrounits`** vs **686 `InCents`** (70,7 %) | 🟡 |
| Secrets en dur | **0** | 🟢 |
| Immuabilité NF525 | Gardée + testée | 🟢 |

### Détail ESLint par règle

| Règle | Occurrences | Nature |
|-------|-------------|--------|
| `no-restricted-imports` | **219** | Violation Barrel Contract (profondeur domaine/module) |
| `unused-imports/no-unused-imports` | **129** | Imports morts — **auto-fixable** |
| `vanguard/no-inter-module-imports` | **78** | Violation « Mur de Chine » inter-piliers |
| `@typescript-eslint/no-explicit-any` | **67** | `any` toxiques |
| `id` | 7 | Nommage |
| `react/display-name` | 1 | — |
| `prefer-const` | 1 | **auto-fixable** |

### Détail dette monétaire `InCents` par pilier

| Zone | Occurrences | Priorité |
|------|-------------|----------|
| `modules/finance` | **259** | 🔴 P0 — risque fiscal direct |
| `modules/ops` | **147** | 🔴 P0 — POS, encaissement |
| `shared/` | **97** | 🟠 P1 |
| `modules/logistics` | 39 | 🟠 P1 |
| `lib/` | 38 | 🟠 P1 |
| `modules/intelligence` | 32 | 🟡 P2 |
| `modules/commerce` | 27 | 🟡 P2 |
| `modules/human` | 20 | 🟡 P2 |
| `app/` | 20 | 🟡 P2 |
| `infrastructure/` | 5 | 🟢 P3 |
| `modules/compliance` · `modules/facility` | 1 · 1 | 🟢 P3 |

---

## 🗺️ Ordre de bataille corrigé

L'ordre original (Core → Types → UI) reposait sur l'idée que **les fondations sont instables**. Vérification faite, elles ne le sont pas : `SovereignGuard` est déjà optimisé, la DLQ est saine et récemment renforcée. L'ordre est donc réorganisé selon le **risque réel** et le **coût de non-correction** :

```
PHASE 0 → Colmatage        (~1 h)     remettre la suite au vert
PHASE 1 → Hygiène auto     (~2 h)     130 erreurs ESLint auto-fixables
PHASE 2 → Blindage types   (~2 j)     Zod aux frontières + éradication des any
PHASE 3 → Frontières arch. (~3 j)     Barrel Contract + Mur de Chine + cycles
PHASE 4 → Fragmentation UI (~2 j)     God files
PHASE 5 → Migration monnaie(~4 j)     686 InCents → microunits
```

---

# 🚑 PHASE 0 — Colmatage

> **Objectif** : suite de tests verte, TSC prod à zéro. Rien d'autre ne doit démarrer avant.
> **Durée** : ~1 h · **Risque** : nul · **Réversibilité** : totale

### 0.1 — `NexusErrorCode.VALIDATION_ERROR` inexistant

**Fichier** : `src/shared/eventBus/NexusEventBus.ts:70`
**Erreur** : `TS2339: Property 'VALIDATION_ERROR' does not exist on type 'typeof NexusErrorCode'`

L'enum réel (`src/shared/nexus/errors.ts`) contient uniquement :
```ts
ACCESS_DENIED · NF525_VIOLATION · INFRASTRUCTURE_ERROR · HYDRATION_FAILURE · BATCH_ACCESS_DENIED
```

**Action** : ajouter le membre manquant à l'enum — c'est la sémantique correcte, et la Phase 2 en aura besoin pour `onValidated`.

```ts
// src/shared/nexus/errors.ts
export enum NexusErrorCode {
    ACCESS_DENIED = 'ACCESS_DENIED',
    NF525_VIOLATION = 'NF525_VIOLATION',
    INFRASTRUCTURE_ERROR = 'INFRASTRUCTURE_ERROR',
    HYDRATION_FAILURE = 'HYDRATION_FAILURE',
    BATCH_ACCESS_DENIED = 'BATCH_ACCESS_DENIED',
    VALIDATION_ERROR = 'VALIDATION_ERROR',   // ← ajouter
}
```

- [ ] Ajouter `VALIDATION_ERROR = 'VALIDATION_ERROR',` à l'enum dans `src/shared/nexus/errors.ts`
- [ ] Vérifier : `grep -n "VALIDATION_ERROR" src/shared/nexus/errors.ts` → doit retourner **1 ligne**
- [ ] `npx tsc --noEmit 2>&1 | grep "NexusEventBus"` → **doit ne rien retourner**

> ⚠️ **Ne remplace pas `VALIDATION_ERROR` par `INFRASTRUCTURE_ERROR` dans `NexusEventBus.ts`.** C'est la « correction » facile qui compile, mais elle est fausse sémantiquement : un payload invalide n'est pas une panne d'infrastructure. Et surtout, **les Phases 2B.1 et 2C ont besoin de ce code d'erreur** — `createSafeAction` et `onValidated` le lèvent tous les deux. Le supprimer maintenant obligerait à le recréer dans deux jours.

> 💡 **Pourquoi l'appel du bus est déjà correct** : `NexusEventBus.ts:66-72` lève déjà `VALIDATION_ERROR` sur un `tenantId` manquant — le code anticipait le membre d'enum. C'est l'enum qui est en retard, pas l'appelant.

### 0.2 — `PrepaieBuilder` : garde nulle absente

**Fichier** : `src/modules/human/remuneration/payroll/PrepaieBuilder.ts:70`
**Erreur** : `TypeError: entriesRaw is not iterable`
**Test rouge** : `src/__tests__/helpers/saga.handlers.test.ts:262` — *« PayrollExportHandler exporte via le provider configuré et marque le statut completed »*

**Cause** : `Nexus.adapter.query()` peut retourner `undefined` (adapter mocké ou collection vide). Le `for...of` ligne 70 n'a aucune garde.

**Contexte exact** (`PrepaieBuilder.ts:54-66`) — trois requêtes déstructurées d'un `Promise.all`, **aucune n'est gardée** :

```ts
const [usersRaw, entriesRaw, leavesRaw] = await Promise.all([
    Nexus.adapter.query<User>(tenantPath('users')),
    Nexus.adapter.query<ShiftEntry>(tenantPath('shiftEntries'), { … }),
    Nexus.adapter.query<LeaveRequest>(tenantPath('leaveRequests'), { … }),
]);
```

Puis l. 70 : `for (const e of entriesRaw)` → explose si `query` retourne `undefined`.

**Action — corriger les TROIS, pas seulement celle qui plante.** `usersRaw` est itéré l. 79 et `leavesRaw` plus bas : ils ont exactement le même défaut, ils n'ont simplement pas encore été atteints par un test.

```ts
// ── APRÈS le Promise.all, avant toute itération ──────────────────────────
const users   = Array.isArray(usersRaw)   ? usersRaw   : [];
const entries = Array.isArray(entriesRaw) ? entriesRaw : [];
const leaves  = Array.isArray(leavesRaw)  ? leavesRaw  : [];
```

Puis remplacer chaque usage de `usersRaw` / `entriesRaw` / `leavesRaw` par `users` / `entries` / `leaves` dans tout le corps de la fonction.

- [ ] Ajouter les 3 gardes après le `Promise.all`
- [ ] `grep -n "usersRaw\|entriesRaw\|leavesRaw" src/modules/human/remuneration/payroll/PrepaieBuilder.ts` → **ne doit plus retourner que les 3 lignes de déstructuration et les 3 gardes**
- [ ] `npx vitest run src/__tests__/helpers/saga.handlers.test.ts` → vert

> ⚠️ **Ne corrige pas seulement `entriesRaw`.** C'est la tentation évidente puisque c'est la seule qui apparaît dans la stack trace. Les deux autres sont la même bombe, non amorcée.

> 💡 **Cause racine à signaler, pas à corriger ici** : `Nexus.adapter.query()` a un type de retour qui ment — il déclare `T[]` mais peut rendre `undefined`. Le vrai correctif serait de le faire retourner `T[]` garanti (`?? []` dans l'adapter). **Note-le, ne le fais pas maintenant** : ça touche tous les adapters et ça sort du périmètre du colmatage. À traiter en Phase 2 avec le blindage des frontières.

### 0.3 — `demo/simulation.test.ts` : STACK_TRACE_ERROR

**Fichier** : `demo/simulation.test.ts:30`
**Symptôme** : échec à la *collecte* du test, pas à l'exécution — erreur de chargement de module.

- [ ] Lancer isolément : `npx vitest run demo/simulation.test.ts --reporter=verbose`
- [ ] Identifier l'import qui casse (probablement un cycle — voir Phase 3.3)
- [ ] Si lié aux cycles `verticals/` → **reporter en 3.3** et marquer le test `.skip` avec un TODO référençant ce document

### 0.4 — 11 erreurs TSC dans `scripts/crash-test/`

Hors code de production, mais polluent le signal TSC.

| Fichier | Erreurs | Cause |
|---------|---------|-------|
| `audit_hr_payroll.ts` | 5 | `AgentAction[]` traité comme objet unique (`.confidence`, `.reason`, `.isApproved`) |
| `audit_mcc_fleet.ts` | 3 | Événement `'system.alert'` absent du registre typé |
| `audit_rag_security.ts` | 3 | `ingestPulse` / `searchSimilar` absents de `HermesKnowledgeManager` |

- [ ] `audit_hr_payroll.ts` : indexer le tableau (`actions[0].confidence`)
- [ ] `audit_mcc_fleet.ts` : déclarer `system.alert` dans `SYSTEMEvents` **ou** utiliser un événement existant
- [ ] `audit_rag_security.ts` : aligner sur l'API réelle de `HermesKnowledgeManager`

### 0.5 — 🔴 Aligner le gate Sentrux sur la charte UI (BLOQUANT REFONTE)

**Défaut** : la charte architecturale existe, mais **le gate ne la connaît pas**.

`.agents/agents.md:30` déclare :
> *« Aggregation Root (Permitted) : Page entry points (`src/app/**`), Root Providers (`*Provider.tsx`) et Top-Level Dashboards (`*Dashboard.tsx`) are permitted high fan-out (`fan_out <= 30`) provided they perform zero direct business computation and rely on dynamic lazy loading. »*

Or `.sentrux/rules.toml` ne contient que `no_god_files = true`, **sans aucune exception**. Le commentaire l. 40 parle même encore de `>300 lignes + >10 dépendances`.

**Preuve du décalage** — sentrux flague aujourd'hui comme violations exactement les fichiers que la charte autorise :

| Fichier flagué | Fan-out | Statut selon la charte |
|----------------|---------|------------------------|
| `src/app/(admin)/admin/mcc/page.tsx` | 18 | ✅ **autorisé** (page entry point, ≤ 30) |
| `modules/ops/production/kitchen/components/KitchenDashboard.tsx` | 18 | ✅ **autorisé** (`*Dashboard.tsx`, ≤ 30) |
| `shared/components/layout/NexusProviderStack.tsx` | 17 | ✅ **autorisé** (root provider) |
| `shared/providers/fleet/NexusFleetProvider.tsx` | 16 | ✅ **autorisé** (`*Provider.tsx`) |
| `modules/intelligence/ia/fleet/NexusFleetProvider.tsx` | 16 | ✅ **autorisé** (`*Provider.tsx`) |

**Conséquence directe** : `./scripts/preflight.sh` inclut `sentrux check`. Tant que la config n'est pas alignée, **toute PR contenant un dashboard riche échouera au gate**, quelle que soit la charte. La liberté annoncée est réelle côté agents IA (ils lisent `agents.md`), mais **fictive côté CI**.

- [ ] Ajouter l'exception d'agrégation dans `.sentrux/rules.toml` :

```toml
# Aggregation Roots — fan-out élevé autorisé (charte .agents/agents.md §30)
# Condition : zéro calcul métier direct + next/dynamic pour les panneaux lourds.
[[god_file_exceptions]]
paths = ["src/app/**", "**/*Provider.tsx", "**/*Dashboard.tsx"]
max_fan_out = 30
```
> ⚠️ Vérifier la syntaxe exacte supportée par ta version de sentrux (`sentrux check --help`). Si les exceptions par glob ne sont pas supportées, relever le seuil global à 30 **et** ajouter une règle ESLint compensatoire interdisant tout import de `*/services/*` ou `*/domain/*` depuis `src/app/**`.

- [ ] Mettre à jour le commentaire périmé l. 40 de `rules.toml` (`>300 lignes + >10 deps` → valeurs réelles)
- [ ] Régénérer `.sentrux/baseline.json` — le baseline actuel annonce `god_file_count: 0` et `cycle_count: 3` alors que la réalité est **18 et 4**. Il est périmé et ne protège plus de rien
- [ ] Créer un `AGENTS.md` à la racine (ou un lien) — la charte est aujourd'hui dans `.agents/agents.md`, chemin que peu d'outils lisent par défaut

### 0.6 — Resynchroniser `CLAUDE.md` sur la structure réelle

La documentation de référence est **périmée**. Le mapping structurel révèle **4 domaines non déclarés** :

| Domaine réel | Pilier | Fichiers | Statut dans CLAUDE.md |
|--------------|--------|----------|----------------------|
| `catalog/` | commerce | 6 | ❌ absent |
| `fleet/` | logistics | 3 | ❌ absent |
| `simulation/` | intelligence | 4 | ❌ absent |
| `agents/` | intelligence | 4 | ❌ absent |

Conséquence : toute session (humaine ou IA) qui lit `CLAUDE.md` comme source de vérité travaille sur une carte fausse — et peut « corriger » un domaine légitime en le croyant orphelin.

- [ ] Mettre à jour le tableau des piliers/domaines de `CLAUDE.md` — puis le **générer** définitivement (voir **1bis.4**) pour que la dérive ne puisse plus se reproduire
- [ ] Documenter le **3ᵉ motif architectural** : 69 modules utilisent `presentation/application/infrastructure` (hexagonal) au lieu de `components/hooks/services`. Trancher : motif officiel pour les nouveaux modules, ou scaffold à normaliser ?
- [ ] Corriger la mention `src/engines/` dans `.sentrux/rules.toml` l. 62 — **ce dossier n'existe plus**

### 0.7 — Éliminer le doublon `front-desk` / `frontdesk`

Deux modules quasi homonymes dans `ops/service/` :

| Module | Contenu | Importé par |
|--------|---------|-------------|
| `front-desk/` | scaffold hexagonal **vide** (`.gitkeep` uniquement) + `index.ts` avec `export {}` | personne |
| `frontdesk/` | `services/WaitlistManager.ts` — **1 fichier réel** | personne |

Risque : un développeur crée le prochain composant dans le mauvais dossier. Le doublon est invisible au compilateur.

- [ ] Choisir un nom canonique (`front-desk` suit la convention kebab-case du reste du projet)
- [ ] Déplacer `WaitlistManager.ts` dedans, supprimer l'autre
- [ ] Vérifier qu'aucune route hôtel ne référence l'ancien chemin

### 0.8 — 🚨 SÉCURITÉ CRITIQUE : l'authentification des Server Actions est fail-open

> 🔴 **Le défaut le plus grave de cet audit. À corriger avant tout le reste de la Phase 0.**

**Le fait, vérifié en lisant le fichier entier** (`src/lib/server/verifySession.ts`, 39 lignes) :

```ts
export async function verifySession(...): Promise<DecodedAuthToken | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;   // l. 20
    const token = authHeader.split(' ')[1];
    if (!token) return null;                                             // l. 23
    try   { return await provider.verifyIdToken(token); }
    catch { return null; }                                               // l. 30
}
```

**`verifySession` ne lève JAMAIS.** Elle retourne `null` sur les trois chemins d'échec.

**Et les 13 Server Actions l'appellent ainsi** :
```ts
await verifySession(tenantId);   // ← résultat jeté à la poubelle
// … le code métier s'exécute quoi qu'il arrive
```

**Ampleur mesurée — 41 appels, 0 vérifié :**

| Fichier | Appels non vérifiés |
|---------|--------------------|
| `kitchen.action.ts` | 9 |
| `marketing.action.ts` | 7 |
| `floor.action.ts` | 6 |
| `commerce.action.ts` | 4 |
| `inventory.action.ts` | 3 |
| `settings.action.ts` · `haccp.action.ts` · `nonConformity.action.ts` · `cashdrawer.action.ts` | 2 chacun |
| `finance.action.ts` · `timeclock.action.ts` · `eventQuote.action.ts` · `void.action.ts` | 1 chacun |
| **TOTAL** | **41 / 41 non vérifiés** |

**Conséquence** : un appel sans jeton, avec un jeton expiré ou invalide **s'exécute normalement**. Cela inclut `void.action.ts` (annulation fiscale NF525), `cashdrawer.action.ts` (mouvements de caisse) et `finance.action.ts`.

**Second défaut, dans la même fonction** : le paramètre `tenantId` **n'est jamais utilisé**. Ligne 8, le test `typeof requestOrTenant === 'object'` échoue pour une chaîne, donc on retombe sur `headers()`. Le jeton n'est **jamais comparé au tenant demandé**.
> 🟠 Atténué — mais pas annulé — par `SovereignGuard`, qui bloque les écritures cross-tenant au niveau Nexus. Toute action qui n'écrit pas via Nexus n'a aucune protection.

### Correction — en deux temps

**Temps 1 — colmatage immédiat (Phase 0)** : rendre la fonction fail-closed sans toucher aux 41 appels.

- [ ] Ajouter dans `src/lib/server/verifySession.ts` :
  ```ts
  /**
   * Variante fail-closed : lève si la session est invalide.
   * À utiliser dans toute Server Action. `verifySession` (nullable) reste
   * disponible pour les routes API qui gèrent elles-mêmes la réponse 401.
   */
  export async function requireSession(tenantId: string): Promise<DecodedAuthToken> {
      const decoded = await verifySession();
      if (!decoded) {
          throw new NexusError(NexusErrorCode.ACCESS_DENIED, 'Session invalide ou expirée');
      }
      if (decoded.tenantId && decoded.tenantId !== tenantId) {
          throw new NexusError(NexusErrorCode.ACCESS_DENIED, 'Jeton émis pour un autre tenant');
      }
      return decoded;
  }
  ```
  > ⚠️ Vérifier le nom réel du claim de tenant dans `DecodedAuthToken` (`ServerAuthProvider.ts`) — ne pas supposer `tenantId`.

- [ ] Remplacer les **41** `await verifySession(tenantId);` par `await requireSession(tenantId);`
  ```bash
  grep -rln "await verifySession(" src --include="*.action.ts"     # 13 fichiers
  # remplacer un par un, PAS de sed global : certaines routes API utilisent
  # légitimement la variante nullable avec unauthorizedResponse()
  ```
- [ ] Vérifier : `grep -rn "await verifySession(" src --include="*.action.ts"` → **0 résultat**
- [ ] Vérifier : `grep -rn "await requireSession(" src --include="*.action.ts" | wc -l` → **41**

**Temps 2 — Phase 2B** : `createSafeAction` absorbe `requireSession`, et le motif devient impossible à oublier.

### Tests obligatoires

- [ ] Sans en-tête `Authorization` → l'action **lève**, aucune écriture Nexus
- [ ] Jeton expiré ou malformé → l'action **lève**
- [ ] Jeton valide d'un autre tenant → l'action **lève**
- [ ] Jeton valide du bon tenant → l'action s'exécute

> 🔴 **Ne pas se contenter de « ça compile ».** Écrire les 4 tests. C'est un contrôle d'accès sur des écritures fiscales — le seul niveau de preuve acceptable est un test qui échoue quand on retire la garde.

### 0.9 — 🚨 SÉCURITÉ : le RBAC n'existe que côté client

> 🔴 **Deuxième faille structurelle, jumelle de la 0.8.** À traiter dans la foulée.

**Ce qui existe et qui est bon** — `src/shared/hooks/actionPermissionMap.ts`, 365 lignes :

```ts
pos: {
  offer_product:  { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: true },
  cancel_order:   { minLevel: PERMISSION_ROLE_LEVELS.manager, requiresPin: true },
  split_bill:     { minLevel: PERMISSION_ROLE_LEVELS.chef_rang },
  …
}
```

C'est une matrice de permissions bien conçue : par page, par action, avec `minLevel`, `requiresPin` et `limit`. **Source unique de vérité, exactement comme il faut.**

**Le problème : elle n'est appliquée que dans le navigateur.**

| Point de contrôle | État |
|-------------------|------|
| `useActionPermission` — hook React | ✅ applique `ACTION_MAP` |
| `useThresholdCheck` + `policyEngine` | ✅ seuils et escalade |
| `RoleGate.tsx` — composant | ✅ |
| `withRoleGuard` sur les handlers EventBus | 🟠 **6 handlers sur 165** |
| **Routes API avec contrôle de rôle** | 🔴 **0 sur 164** |
| **Server Actions avec contrôle de rôle** | 🔴 **0 sur 13** |

**Le scénario concret** : `ACTION_MAP` exige `manager` **+ PIN** pour annuler une commande. Mais `processVoidOrRefundAction` (`void.action.ts`) ne vérifie **ni le rôle ni le PIN** — seulement la session (et encore, voir 0.8). Un `serveur` qui appelle la Server Action directement, sans passer par l'UI, **annule la commande**.

> 🔴 **Cumulé avec la 0.8** : avant correction, cette action s'exécute même **sans session valide du tout**. Sur une annulation fiscale NF525, qui produit une écriture scellée irréversible.

### Correction — porter `ACTION_MAP` côté serveur

- [ ] **1.** Extraire `ACTION_MAP` vers un module **isomorphe** (utilisable client **et** serveur) :
  ```
  src/shared/rbac/actionPermissionMap.ts      ← déplacé depuis shared/hooks/
  src/shared/rbac/checkPermission.ts          ← logique pure, sans React
  ```
  > ⚠️ `shared/hooks/actionPermissionMap.ts` n'importe rien de React aujourd'hui — le déplacement est mécanique. Garder un ré-export à l'ancien chemin pour ne rien casser.

- [ ] **2.** Étendre `createSafeAction` (§2B.1) avec la vérification de rôle :
  ```ts
  export function createSafeAction<TInput, TOutput>(
      schema: z.ZodType<TInput>,
      permission: { page: string; action: string },   // ← NOUVEAU
      handler: (ctx: ActionContext, safeData: TInput) => Promise<TOutput>,
  ) {
      return async (tenantId: string, rawData: unknown): Promise<TOutput> => {
          const session = await requireSession(tenantId);              // 0.8
          assertPermission(session.role, permission.page, permission.action);  // 0.9
          const parsed = schema.safeParse(rawData);
          …
      };
  }
  ```

- [ ] **3.** Déclarer la permission sur les **13 Server Actions**. Les plus sensibles d'abord :
  | Action | Permission exigée |
  |--------|-------------------|
  | `void.action.ts` | `pos.cancel_order` — manager + PIN |
  | `cashdrawer.action.ts` | `pos.cash_movement` — manager |
  | `finance.action.ts` | `finance.*` — comptable |
  | `timeclock.action.ts` | `staff.*` — manager |

- [ ] **4.** Le **PIN** doit être vérifié côté serveur pour les actions `requiresPin: true`. Aujourd'hui c'est une modale cliente (`SecurityPinModal`, `PinModal`) — **contournable**. `PinHashService` existe déjà dans `lib/server/` : le brancher

- [ ] **5.** Étendre `withRoleGuard` aux handlers sensibles restants (6/165 aujourd'hui)

### Tests obligatoires

- [ ] Un `serveur` appelant `processVoidOrRefundAction` → **rejeté**
- [ ] Un `manager` sans PIN sur une action `requiresPin` → **rejeté**
- [ ] Un `manager` avec PIN valide → accepté
- [ ] La matrice serveur donne le **même verdict** que `useActionPermission` côté client, pour 10 couples rôle/action tirés au sort
  > 💡 Ce dernier test est le plus important : il garantit que les deux côtés ne divergeront pas. Un `ACTION_MAP` unique, deux points d'application.

> 📌 **Ne supprime pas le contrôle client.** Il reste utile — il masque les boutons interdits et évite un aller-retour. Mais il devient une **commodité d'affichage**, plus une sécurité. La sécurité est côté serveur, point.

### ✅ Critère de sortie Phase 0
```
npx tsc --noEmit          → 0 erreur
npx vitest run            → 786 / 786 + 4 tests d'auth + 4 tests RBAC
sentrux                   → les 5 aggregation roots ne sont plus flagués
baseline.json             → régénéré, cohérent avec la réalité
CLAUDE.md                 → 4 domaines manquants ajoutés
front-desk/frontdesk      → 1 seul module
🚨 Server Actions         → 41/41 sous requireSession, fail-closed, testé
```

---

# 🧹 PHASE 1 — Hygiène automatique

> **Objectif** : éliminer 130 des ~502 erreurs ESLint sans décision humaine.
> **Durée** : ~2 h · **Risque** : faible · **Gain** : −26 % d'erreurs

### 1.1 — Auto-fix ESLint

`unused-imports/no-unused-imports` (129) et `prefer-const` (1) sont **entièrement auto-fixables**.

```bash
npx eslint src --ext .ts,.tsx --fix
```

- [ ] Lancer l'auto-fix
- [ ] `git diff --stat` — inspecter l'ampleur avant commit
- [ ] `npx tsc --noEmit` → toujours 0
- [ ] `npx vitest run` → toujours vert
- [ ] Commit isolé : `chore(lint): auto-fix imports morts (130 erreurs)`

> ⚠️ **Commit séparé obligatoire.** Ne jamais mélanger un auto-fix de masse avec des corrections manuelles — la revue devient impossible.

### 1.2 — Corrections manuelles résiduelles

- [ ] `react/display-name` (1) — `src/__tests__/hooks/useActionPermission.test.ts:11`
- [ ] `id` (7) — conventions de nommage

### ✅ Critère de sortie Phase 1
```
ESLint : ~502 → ~364 erreurs
```

---

# 🕸️ PHASE 1 bis — Le filet exécutable

> **Objectif** : transformer la connaissance qui vit dans ta tête en vérifications qui tournent.
> **Durée** : ~2 j · **Risque** : 🟢 nul (ajouts purs) · **Position** : **avant** les Phases 2, 3, 5 et 7 — c'est ce qui garantit leur qualité

## Pourquoi cette phase existe

Les deux défauts les plus sérieux trouvés dans cet audit — **le pourboire encaissé puis perdu** (7.4) et **la collision `ErasureService` × factures immuables** (7.6) — n'ont été attrapés :

- ❌ ni par TypeScript (rien n'est mal typé, c'est la *somme* qui est fausse)
- ❌ ni par les 784 tests
- ❌ ni par sentrux (il voit la structure, pas le sens)

Ils ont été trouvés parce qu'un lecteur posait une question précise. **Ça ne passe pas à l'échelle sur 231 000 lignes.** Chaque défaut appartient pourtant à une **classe**, et chaque classe a un outil.

> 💡 **Le bénéfice caché** : ces outils sont aussi le **canal de transfert vers tes agents**. Aujourd'hui les règles sont en prose dans `CLAUDE.md` — et les agents s'en écartent (219 violations de barrel, 563 `InCents`). Une règle exécutable ne s'oublie pas et ne se néglige pas. **Chaque règle écrite est une chose que tu n'as plus à tenir en tête ni à réexpliquer.**

## 1bis.1 — 🔴 Invariants monétaires (fast-check) — priorité absolue

**Classe couverte** : invariant métier violé sans erreur de type. C'est exactement le bug du pourboire.

**[fast-check](https://github.com/dubzzz/fast-check)** génère des milliers de cas et réduit automatiquement au contre-exemple minimal.

```ts
// L'invariant que ton code viole aujourd'hui (voir 7.4)
fc.assert(fc.property(arbTicket(), arbTip(), (ticket, tip) => {
  const r = processOrder({ ...ticket, tip });
  return sum(r.journalLines) === r.amountCollected;   // ❌ échoue dès que tip > 0
}));
```

### Installation

```bash
npm i -D fast-check
mkdir -p src/__tests__/invariants
```

### Les 7 invariants à écrire — code de départ fourni

> 🔴 **Écris les 7. Pas 3, pas « les plus importants ».** Chacun couvre une classe de bug distincte, et l'un d'eux (le n°1) échoue déjà sur le code actuel.

- [ ] **1. `Σ écritures = Σ encaissé`** — attrape le bug du pourboire (7.4)
  ```ts
  // src/__tests__/invariants/money-conservation.pbt.test.ts
  import fc from 'fast-check';
  import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';

  const arbCartItem = fc.record({
    priceInMicrounits: fc.integer({ min: 1, max: 500_000_000 }),
    quantity: fc.integer({ min: 1, max: 20 }),
  });

  it('la somme des écritures égale le montant encaissé', () => {
    fc.assert(fc.property(
      fc.array(arbCartItem, { minLength: 1, maxLength: 30 }),
      fc.integer({ min: 0, max: 50_000_000 }),           // pourboire
      async (cartItems, tip) => {
        const r = await FinancialNexusBridge.processOrder({ cartItems, tipInMicrounits: tip, /* … */ });
        const sumLines = r.journalEntry.lines.reduce((a, l) => a + l.amountInMicrounits, 0);
        return sumLines === r.amountCollectedInMicrounits;
      }
    ));
  });
  ```
  > ⚠️ **Cet invariant DOIT échouer avant la correction 7.4.** S'il passe du premier coup, c'est que tu l'as mal écrit — vérifie que le pourboire est bien injecté.

- [ ] **2. `Σ factures d'un ticket ≤ total scellé`** — l'invariant du split (7.4). Générer un ticket, le splitter en N parts aléatoires, facturer chaque part, vérifier que la somme ne dépasse jamais le total scellé
- [ ] **3. `Σ TVA ventilée = TVA totale`** — générer un panier mêlant les 3 taux (`0.055`, `0.10`, `0.20` via `vatResolver.ts`), vérifier que `Σ taxBreakdown[taux] === totalTVA`. Protège l'e-reporting **et** les factures
- [ ] **4. `hash(n)` dépend de `hash(n-1)`** — sceller N écritures, muter une valeur au milieu, vérifier que **toutes** les suivantes deviennent invalides. C'est la définition d'une chaîne
- [ ] **5. `fromMicrounits(toMicrounits(x)) === x`** — aller-retour de conversion sur des entiers générés. **Filet de la Phase 5**
- [ ] **6. `split(total, n)` : `Σ parts === total` exactement** — `SplitBillDomainService` répartit déjà le reste (`i < remainderNumber ? basePlusOne : base`). Cet invariant prouve que la répartition ne perd ni ne crée de centime, **pour tout total et tout n**
- [ ] **7. Un document scellé n'est jamais modifiable** — tenter `Nexus.adapter.set()` sur `journalEntries`, `fiscalSeals`, `fiscalLedger` → **doit lever** à chaque fois

### Vérification de la phase

```bash
npx vitest run src/__tests__/invariants/     # 7 fichiers, 6 verts + 1 rouge attendu (n°1)
```

> 📌 L'invariant n°1 **doit être rouge** à ce stade. Il passera au vert en 7.4. C'est la preuve que le filet détecte un vrai bug — s'il est vert, le filet ne sert à rien.

> 🔴 **Si tu ne fais qu'une seule chose de tout ce plan en dehors de l'urgence réglementaire, fais celle-ci.** Tu manipules de l'argent scellé, immuable, transmis à l'administration fiscale. C'est là que le coût d'un bug est le plus élevé — et c'est précisément la classe qui a produit le bug du pourboire.

## 1bis.2 — Règles sémantiques (Semgrep)

**Classe couverte** : contradiction entre sous-systèmes, et régression de conventions. Sentrux voit la structure, pas le sens : il ne peut pas savoir que « collection immuable » et « cible d'effacement RGPD » se contredisent.

**[Semgrep](https://github.com/semgrep/semgrep)** encode tes règles métier en YAML.

```yaml
- id: no-write-on-immutable
  pattern: Nexus.adapter.set("$PATH", ...)
  metavariable-regex: { $PATH: '.*(journalEntries|fiscalSeals|fiscalLedger).*' }
  message: Collection immuable NF525 — passer par un avoir (voir 7.7.2)
  severity: ERROR
```

### Installation

```bash
brew install semgrep      # ou : pip install semgrep
mkdir -p .semgrep
```

### Les 7 règles à écrire — ce sont tes conventions, enfin appliquées

- [ ] 🔴 **1. Aucun nouveau champ `*InCents`** — **à écrire AVANT la Phase 5**, sinon la dette se recrée pendant qu'on la résorbe
  ```yaml
  # .semgrep/no-cents.yml
  rules:
    - id: no-new-incents-field
      languages: [typescript]
      severity: ERROR
      message: "Convention microunits — utiliser *InMicrounits (plan §5)"
      pattern-regex: '\b\w+InCents\b'
      paths:
        exclude:
          - "src/modules/finance/**"   # zones legacy — retirer au fil de la Phase 5
          - "src/modules/ops/**"
          - "**/*.test.ts"
  ```
  > 💡 **Le motif malin** : on exclut d'abord les zones encore en dette, puis on **retire une exclusion à chaque pilier converti**. La règle se resserre au rythme de la Phase 5 et empêche toute rechute sur le terrain déjà gagné.

- [ ] **2. Aucun `as Microunits` direct** — `pattern: $X as Microunits` → message : passer par `toMicrounits()`
- [ ] **3. Aucun `set`/`delete` sur collection immuable**
  ```yaml
  - id: no-write-on-immutable
    patterns:
      - pattern-either:
          - pattern: Nexus.adapter.set("$PATH", ...)
          - pattern: Nexus.adapter.delete("$PATH")
      - metavariable-regex:
          metavariable: $PATH
          regex: '.*(journalEntries|fiscalSeals|fiscalLedger).*'
    message: "Collection immuable NF525 — passer par un avoir (plan §7.7.2)"
    severity: ERROR
  ```
- [ ] **4. Aucune PII de personne physique dans un schéma de facture** — interdire `customerName`, `guestName`, `phone`, `email` dans tout fichier matchant `*Invoice*Schema*` (garantit 7.6)
- [ ] **5. Aucun hex en dur dans `modules/**/*.tsx`** — `pattern-regex: '#[0-9a-fA-F]{6}'` (garantit 6.1 après nettoyage). ⚠️ À n'activer **qu'après** le nettoyage des 97, sinon 97 erreurs bloquent la CI
- [ ] **6. Aucun `tenantId` littéral** hors sentinelles `__FLEET__`, `fleet`, `default`, `nexus_core`, `_demo_*`, `_test_*`, `_ref_*`
- [ ] **7. Aucun appel externe sur un tenant `_demo_*`** — Stripe, Resend, PA. C'est déjà une règle affichée dans `SystemTenantsTab` : *« zéro appel Stripe / Resend / webhook externe »*. La rendre exécutable

### Vérification de la phase

```bash
semgrep --config .semgrep/ --error    # doit sortir 0 sur les règles activées
```

> ⚠️ **N'active pas les 7 règles d'un coup en CI.** Active-les une par une, corrige les violations existantes de chacune, puis passe à la suivante. Sept règles activées simultanément sur 231 000 lignes = un mur d'erreurs que personne ne traite.

## 1bis.3 — Code mort et surface réelle (Knip)

**[Knip](https://github.com/webpro-nl/knip)** détecte fichiers, exports et dépendances inutilisés.

Il aurait sorti sans qu'on les cherche : le doublon `front-desk`/`frontdesk` (0.7), les 129 imports morts (1.1), et les exports orphelins des barrels.

- [ ] Installer et lancer une première passe
- [ ] ⚠️ **Configurer une allowlist pour les 69 scaffolds intentionnels** — ils ne sont pas du code mort, ils sont ta stratégie (6.0 bis). Sans ça, Knip crie sur ton squelette

## 1bis.4 — Documentation générée, jamais rédigée

**Classe couverte** : dérive documentaire. Les 4 domaines absents de `CLAUDE.md` (0.6) existaient parce qu'un humain devait penser à mettre un tableau à jour.

**Solution** : ne plus l'écrire, le **générer**.

- [ ] **1.** Encadrer la table existante dans `CLAUDE.md` par deux marqueurs :
  ```markdown
  <!-- AUTOGEN:PILLARS:START -->
  ... table générée ...
  <!-- AUTOGEN:PILLARS:END -->
  ```
- [ ] **2.** Écrire `scripts/gen-pillars-doc.ts` :
  ```ts
  // Parcourt src/modules/<pilier>/<domaine>/<module>/
  // Ignore les dossiers d'infra : providers, connectors, hooks, services,
  //                               store, domain, migration, types, components, actions, utils, constants
  // Régénère la table entre les deux marqueurs. N'écrit rien d'autre.
  ```
- [ ] **3.** Ajouter au pre-commit (ou à `scripts/preflight.sh`)
- [ ] **4.** Vérifier : `npx tsx scripts/gen-pillars-doc.ts && git diff CLAUDE.md` → doit faire apparaître les 4 domaines manquants (`commerce/catalog`, `logistics/fleet`, `intelligence/simulation`, `intelligence/agents`)

> 💡 **Pourquoi ça vaut plus que les 30 lignes qu'il coûte** : ce fichier est lu comme source de vérité par **toutes** tes sessions IA. Un `CLAUDE.md` périmé ne produit pas une erreur — il produit des agents qui travaillent avec confiance sur une carte fausse. C'est le pire mode de défaillance possible.

## 1bis.5 — Ce qu'il ne faut PAS ajouter

- ❌ **dependency-cruiser** / **ArchUnitTS** — excellents, mais **sentrux fait déjà ce travail**. Ajouter un second gate structurel créerait deux sources de vérité qui divergeront. Aligner sentrux (0.5) suffit
- ❌ Un outil de couverture supplémentaire — le problème n'est pas la quantité de tests, c'est leur **nature** : il faut des invariants, pas des cas

### ✅ Critère de sortie Phase 1 bis
```
fast-check   : 7 invariants monétaires et fiscaux au vert
Semgrep      : 7 règles actives en CI, dont l'anti-InCents AVANT la Phase 5
Knip         : passe propre, scaffolds en allowlist
CLAUDE.md    : table piliers/domaines générée, plus jamais rédigée à la main
```

> 📌 **Vérification de non-régression** : réécrire le bug du pourboire (7.4) et la collision `ErasureService` (7.6) **comme des tests**, et vérifier qu'ils échouent avant correction. Si le filet ne les rattrape pas, il ne rattrapera pas leurs successeurs.

---

# 🛡️ PHASE 2 — Blindage des frontières

> **Objectif** : rendre impossible l'entrée de données non validées.
> **Durée** : ~2 j · **Risque** : moyen · **Reprend** : Phases 2A/2B/2C du plan original, cibles corrigées

## 🚨 Pourquoi cette phase : l'illusion de la sécurité

Le compilateur TypeScript a été **aveuglé** par le code généré précédemment :

- **67 `any`** injectés en pleine logique métier *(chiffre mesuré — le plan original annonçait 293)*
- L'architecture « Souveraineté Grade X » (zéro erreur de compilation) est **contournée à l'exécution**
- Si le frontend envoie un `amount` de type `string` au lieu de `number`, le backend l'accepte sans broncher

> ⚠️ **Le point crucial** : TypeScript ne vérifie le type qu'à la **compilation**. À l'exécution, un payload `any` ou `unknown` peut contenir n'importe quoi. Pour un système POS et comptable soumis au NF525, c'est une faille de sécurité, pas une imperfection de style.

**La réponse** : double validation — typage statique (TypeScript) **+** validation dynamique (Zod). Le schéma Zod devient la source de vérité unique, et le type TypeScript en est **inféré**, jamais écrit deux fois.

```ts
// 1. Le schéma de validation runtime — source de vérité
export const OrderPayloadSchema = z.object({
    id: z.string().uuid(),
    totalInMicrounits: z.number().int().nonnegative(),   // ❗ microunits, PAS cents
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),           // bloque les quantités négatives
    })).min(1),
});

// 2. Le type statique est INFÉRÉ du schéma — une seule source
export type OrderPayload = z.infer<typeof OrderPayloadSchema>;
```

> 🔴 **Piège signalé** : l'exemple d'origine de ce schéma utilisait `totalInCents`. Sur le module POS, cela réintroduirait au cœur de l'encaissement l'erreur de facteur 10 000 que la Phase 5 est censée éliminer. **Tout nouveau schéma monétaire s'écrit en microunits, sans exception.**

## 2A — Le Pacte d'Agnosticisme (204 `unknown` sanctuarisés)

**Règle absolue — inchangée du plan original** : on ne touche **PAS** aux `unknown` qui résident dans :
- les Adapters réseau (`src/lib/adapters/`)
- le Storage persistant (`src/lib/Storage.ts`, `SovereignStorage`)
- l'Outbox / la DLQ (`src/shared/eventBus/`)

Leur nature polymorphe est **validée et intentionnelle**. Les convertir en types stricts casserait la sérialisation.

- [ ] Documenter cette règle dans `CLAUDE.md` pour qu'aucune session future ne les « corrige »

## 2B — Éradication des 67 `any` toxiques

> Chiffre corrigé : **67**, pas 293.

### 2B.0 — 🔄 Reprise de l'existant : la dette de schéma laissée par §0.9

> **Contexte.** La §0.9 (sécurité RBAC) a été livrée **avant** le typage strict — décision correcte, la faille était active. Les 13 actions sont passées sous `createSafeAction` avec des schémas provisoires. Cette section solde cette dette assumée.

**État mesuré** :

| Indicateur | Valeur |
|-----------|--------|
| Actions sous `createSafeAction` | ✅ **13 / 13** |
| `await verifySession(` restants | ✅ **0** |
| `z.tuple([...])` — arité et primitifs validés | ✅ acquis |
| **`z.any()` dans les schémas d'action** | 🔴 **25** |
| `z.unknown()` | 0 |

- [ ] **1. Basculer les 25 `z.any()` en `z.unknown()`** — à faire **immédiatement**, avant même les schémas stricts (~10 min)

  ```ts
  // ❌ z.any()  → le handler reçoit `any`, TypeScript arrête de vérifier en aval
  z.tuple([z.string(), z.any()])

  // ✅ z.unknown() → le handler doit restreindre, TypeScript continue de protéger
  z.tuple([z.string(), z.unknown()])
  ```
  Les deux ne valident rien à l'exécution — c'est assumé. Mais `z.any()` fait perdre **en plus** le typage statique, gratuitement. Le cast requis dans le handler est explicite et se grep.

  Vérification : `grep -rc "z\.any()" src --include="*.action.ts" | grep -v ":0" | wc -l` → **0**

- [ ] **2. 🔴 Piège à connaître** : `z.any()` est un **appel de fonction**, pas une annotation de type. La règle ESLint `@typescript-eslint/no-explicit-any` **ne le détecte pas**. Sans la règle Semgrep ci-dessous, la Phase 2 afficherait « 0 `any` » avec 25 payloads `any` qui circulent.

- [ ] **3. Règle Semgrep — 8ᵉ règle à ajouter à §1bis.2** :
  ```yaml
  - id: no-any-in-safe-action
    languages: [typescript]
    severity: ERROR
    message: "createSafeAction avec z.any() — utiliser z.unknown() ou un schéma strict (plan §2B.0)"
    pattern-regex: 'createSafeAction\([\s\S]{0,200}z\.any\(\)'
  ```

- [ ] **4. Critère de sortie renforcé** : la porte de la Phase 2 exige `z.any()` **ET** `z.unknown()` à 0 dans les `*.action.ts` — les schémas stricts de 2B.2 les remplacent tous

> 💡 **Bonne nouvelle pour 2B.2** : le squelette est déjà écrit. Chaque `z.tuple([...])` liste déjà les arguments dans l'ordre et leur type primitif. Passer au schéma strict, ce n'est plus concevoir la forme du payload — c'est **ajouter les contraintes métier** (quantités positives, montants non négatifs, `.strict()`). Le travail restant est réduit de moitié.

### 2B.1 — Créer l'intercepteur universel

**Nouveau fichier** : `src/lib/server/actionWrapper.ts` *(vérifié : n'existe pas)*

Objectif : ne **pas** dupliquer la validation dans 13 Server Actions. Un seul intercepteur enchaîne souveraineté → validation → métier.

> ✅ **Le pattern est déjà établi dans le dépôt.** `src/lib/server/verifySession.ts` existe et `shared/actions/settings.action.ts` l'appelle déjà en première ligne. Le wrapper ne fait que généraliser une pratique en place — il n'introduit rien de neuf.

```ts
// src/lib/server/actionWrapper.ts
import { z } from 'zod';
import { requireSession } from '@/lib/server/verifySession';   // ⚠️ variante fail-closed (0.8)
import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';

export function createSafeAction<TInput, TOutput>(
    schema: z.ZodType<TInput>,
    handler: (tenantId: string, safeData: TInput) => Promise<TOutput>,
) {
    return async (tenantId: string, rawData: unknown): Promise<TOutput> => {
        // 1. Souveraineté — LÈVE si la session est invalide (jamais `verifySession` nu)
        await requireSession(tenantId);

        // 2. Validation Zod — rejette immédiatement un payload corrompu
        const parsed = schema.safeParse(rawData);
        if (!parsed.success) {
            throw new NexusError(
                NexusErrorCode.VALIDATION_ERROR,   // ← dépend de la Phase 0.1
                `Payload invalide : ${parsed.error.issues.map(i => `${i.path.join('.')} ${i.message}`).join(' · ')}`,
                parsed.error.issues,
            );
        }

        // 3. Exécution métier — safeData est garanti conforme
        return handler(tenantId, parsed.data);
    };
}
```

> 🔴 **`requireSession`, jamais `verifySession`.** C'est tout l'objet de la correction 0.8 : `verifySession` retourne `null` sans lever, et 41 appels jetaient ce résultat. Si tu écris `await verifySession(tenantId)` ici, **tu recrées le trou de sécurité au cœur même du garde-fou censé l'empêcher.**

**Trois choix de conception à noter** :

1. **Session avant `safeParse`** — on ne dépense pas de cycles à valider le payload d'un appelant non autorisé, et on ne logge pas son contenu.
2. **`safeParse` plutôt que `parse`** — `parse` lève une `ZodError` brute qui traverse les couches sans code exploitable. `safeParse` + `NexusError` donne un code (`VALIDATION_ERROR`) que la DLQ et l'audit savent classer.
3. **Le wrapper rend l'oubli impossible** — une fois les 13 actions migrées, aucune ne peut plus omettre la vérification : elle est dans le chemin, pas dans la discipline du développeur.

- [ ] Créer `src/lib/server/actionWrapper.ts`
- [ ] Tests unitaires — les 4 cas :
  - payload valide + session valide → exécute
  - payload malformé → lève `VALIDATION_ERROR`, **handler jamais appelé**
  - session absente → lève `ACCESS_DENIED`, **schéma jamais évalué**
  - session d'un autre tenant → lève `ACCESS_DENIED`
- [ ] Vérifier l'ordre par test : avec une session invalide **et** un payload invalide, l'erreur levée doit être `ACCESS_DENIED`, pas `VALIDATION_ERROR`
- [ ] Aligner `settings.action.ts` sur le wrapper (il fait le `verifySession` à la main, l. 9 et l. 27)

### 2B.2 — Migrer les 13 Server Actions réelles

> **Correction du plan original** : les 4 noms cités (`submitOrderAction`, `updateRecipeAction`, `upsertCustomerAction`, `signCleaningTaskAction`) sont des fonctions de hooks/composants client, **pas des Server Actions**. Les vraies cibles sont les 13 fichiers `*.action.ts`.

| # | Fichier | Schéma Zod à appliquer | Contrainte métier |
|---|---------|------------------------|-------------------|
| 1 | `modules/ops/service/pos/actions/commerce.action.ts` | `OrderPayloadSchema` | ❗ interdire quantités et prix négatifs |
| 2 | `modules/ops/service/pos/actions/void.action.ts` | `VoidPayloadSchema` | ❗ motif obligatoire, traçabilité NF525 |
| 3 | `modules/ops/service/pos/actions/cashdrawer.action.ts` | `CashDrawerSchema` | ❗ montants en microunits, jamais négatifs |
| 4 | `modules/ops/service/pos/actions/kitchen.action.ts` | `RecipeUpdateSchema` | — |
| 5 | `modules/ops/service/pos/actions/floor.action.ts` | `FloorUpdateSchema` | — |
| 6 | `modules/finance/actions/finance.action.ts` | `JournalEntrySchema` | ❗ **NF525** — append-only, jamais d'update |
| 7 | `modules/compliance/qualite/haccp/actions/haccp.action.ts` | `HACCPRecordSchema` | ❗ timestamp forcé + bornes de température |
| 8 | `modules/compliance/qualite/haccp/actions/nonConformity.action.ts` | `NonConformitySchema` | ❗ sévérité énumérée |
| 9 | `modules/commerce/actions/marketing.action.ts` | `CampaignSchema` | — |
| 10 | `modules/commerce/relation/reservations/actions/eventQuote.action.ts` | `QuoteSchema` | ❗ montants en microunits |
| 11 | `modules/logistics/stock/inventory/actions/inventory.action.ts` | `StockMovementSchema` | ❗ interdire mouvements négatifs non justifiés |
| 12 | `modules/human/effectifs/hr/actions/timeclock.action.ts` | `TimeclockSchema` | ❗ anti-antidatage |
| 13 | `shared/actions/settings.action.ts` | `SettingsSchema.strict()` | ❗ `.strict()` bloque l'injection de champs |

**Ordre recommandé** : 6 → 7 → 1 → 3 → 12 (impact conformité/fiscal d'abord), puis le reste.

- [ ] Pour chaque action : définir le schéma dans `modules/<pilier>/domain/schemas/`
- [ ] Envelopper avec `createSafeAction`
- [ ] Test unitaire : payload valide accepté + payload malformé rejeté

### 2B.3 — Les 4 fonctions client mal identifiées

Elles méritent aussi une validation, mais **côté client** :

| Fonction | Fichier réel |
|----------|--------------|
| `submitOrderAction` | `modules/ops/providers/hooks/kitchenHooks.tsx` |
| `updateRecipeAction` | `modules/ops/providers/hooks/kitchenHooks.tsx` |
| `upsertCustomerAction` | `modules/ops/providers/hooks/commerceHooks.tsx` |
| `signCleaningTaskAction` | `modules/compliance/qualite/haccp/components/CleaningPlan.tsx` |

- [ ] Valider leur payload avec le **même schéma Zod** que la Server Action correspondante (source unique de vérité)

## 2C — `onValidated` sur le NexusEventBus

> ✅ **Seul item de la Phase 1 originale conservé.** Vérifié : `onValidated` n'existe pas (0 occurrence). Ajout purement additif — **ne nécessite aucune suppression de la DLQ**.

**Fichier** : `src/shared/eventBus/NexusEventBus.ts`

```ts
onValidated<T>(
    event: NexusEventName,
    schema: z.ZodType<T>,
    handler: (payload: T) => Promise<void>,
) {
    return this.on(event, async (raw: unknown) => {
        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
            throw new NexusError(
                NexusErrorCode.VALIDATION_ERROR,
                `Payload d'événement invalide sur ${event}`,
                parsed.error.issues,
            );
        }
        return handler(parsed.data);
    });
}
```

> 💡 Le `throw` est **volontaire** : il alimente la DLQ existante. C'est exactement le comportement que tes 2 derniers commits EventBus ont mis en place sur 25 handlers. **Ne pas l'avaler.**

### Le gain concret — cas `inventory.waste_logged`

```ts
// ❌ AVANT — payload: any, aucune garantie à l'exécution
NexusEventBus.on('inventory.waste_logged', async (payload: any) => {
    // Si quantityLost arrive à -50, la marge est falsifiée en silence.
    await FoodCostEngine.deduct(payload.quantityLost);
});

// ✅ APRÈS — le schéma refuse le payload avant d'atteindre le métier
NexusEventBus.onValidated(
    'inventory.waste_logged',
    WastePayloadSchema,          // impose quantityLost > 0
    async (payload) => {
        // payload est typé et garanti conforme ici
        await FoodCostEngine.deduct(payload.quantityLost);
    },
);
```

C'est précisément le scénario qui rend `WasteToFoodCostHandler` prioritaire dans la liste ci-dessous : une quantité de perte négative ne fait pas planter le système, elle **gonfle silencieusement la marge**. Le bug est invisible jusqu'à l'audit comptable.

### Handlers critiques à migrer vers `onValidated`

- [ ] `src/shared/eventBus/handlers/CashDrawerAnomalyHandler.ts` — anomalie de caisse
- [ ] `src/shared/eventBus/handlers/WasteToFoodCostHandler.ts` — ❗ interdire les quantités de perte négatives
- [ ] `src/shared/eventBus/handlers/PayrollExportHandler.ts` — lié au bug 0.2
- [ ] `src/shared/eventBus/handlers/HaccpCorrectiveActionHandler.ts`
- [ ] `src/shared/eventBus/handlers/MarginWarningHandler.ts`

### ✅ Critère de sortie Phase 2
```
ESLint no-explicit-any : 67 → 0
13/13 Server Actions sous Zod
5 handlers critiques sous onValidated
DLQ intacte — 34 fichiers, 0 suppression
```

---

# 🧱 PHASE 3 — Frontières architecturales

> **Objectif** : faire respecter la règle du Barrel et le Mur de Chine, casser les 4 cycles.
> **Durée** : ~3 j · **Risque** : moyen — beaucoup de fichiers touchés, mais mécanique
> **Absent du plan original** — c'est le plus gros poste de dette (297 erreurs)

## 3.0 — 🧭 Les deux décisions structurelles (à écrire AVANT tout déplacement)

> **Ces décisions orientent chaque déplacement des sections 3.1 à 3.4.** Les prendre après reviendrait à déplacer deux fois les mêmes fichiers.

### Décision 1 — Le métier vit dans les piliers, jamais dans les verticales

**La question concrète** : demain un garage signe, tu codes « prise en charge d'un véhicule ». Le fichier va où ?

| Option | Chemin |
|--------|--------|
| A | `src/verticals/garage/ops/RepairIntake.ts` |
| **B ✅** | `src/modules/ops/service/repair-intake/RepairIntake.ts` |

**Réponse : B, les piliers. Sans hésitation.**

**Pourquoi.** Regarde ce que sont réellement ces quatre opérations :

| Verticale | Opération |
|-----------|-----------|
| garage | prise en charge d'un véhicule |
| hôtel | check-in d'un client |
| clinique | accueil d'un patient |
| restaurant | installation d'une table |

**C'est la même opération** : on reçoit quelqu'un ou quelque chose, on ouvre un ticket de service, on l'assigne à une ressource, on suit son avancement. Seuls le vocabulaire et deux ou trois champs changent.

- Dans les **verticales** → tu l'écris **8 fois**. Un bug corrigé = 8 endroits à toucher, ou 7 oublis.
- Dans **`ops/service/`** → tu l'écris **1 fois**, chaque verticale n'apporte que sa différence via son adapter.

> 🎯 **Le test qui tranche** : *« si je corrige un bug, combien d'endroits je touche ? »* **Un seul = bon. Huit = mauvais.**

**Argument pratique** : le pilier a déjà `SovereignGuard`, l'accès Nexus et le câblage EventBus. Un dossier verticale devrait tout réimporter.

**Ce que devient `src/verticals/`** : uniquement de la **composition**. Quel plugin UI, quels adapters, quelle navigation, quels tokens. **Rien qui calcule.** Tes adapters font déjà 13 lignes — c'est exactement le bon signe, ils délèguent. Il faut juste **écrire que c'est la règle**, sinon le premier vrai développement garage la cassera sans le savoir.

### Décision 2 — Motif interne officiel : `components/hooks/services/store`

**La question concrète** : dans un module, tu ranges les fichiers comment ?

| Motif | Structure | Part du code |
|-------|-----------|--------------|
| **A ✅** | `components/` `hooks/` `services/` `store/` `types/` | **95 %** |
| B | `presentation/` `application/` `infrastructure/` | 69 scaffolds, quasi tous vides |

**Réponse : A comme motif officiel**, avec une porte de sortie documentée vers B pour les rares modules qui le justifient.

**Pourquoi A** :
- C'est déjà 95 % du code — migrer coûterait plus que ça ne rapporte
- **Ton outillage est calibré pour A** : contrat de Barrel, règles ESLint, sentrux. Changer de motif = réécrire les règles

**Mais la vraie raison est ailleurs.** Le bénéfice de l'hexagonal, c'est l'inversion de dépendance : le métier ne connaît pas l'infrastructure. **Tu l'as déjà — mais à l'étage au-dessus**, via Nexus, `SovereignGuard` et l'EventBus. Le refaire à l'intérieur de chaque module, c'est le faire deux fois. C'est de la cérémonie, pas de la protection.

**Quand B se justifie quand même** : un module à logique métier vraiment complexe **et** plusieurs implémentations d'infrastructure. Chez toi : la **facturation électronique** (plusieurs PA) et l'**open banking** (plusieurs providers). Pas un CRUD avec un écran.

### Décision 3 — Le RBAC doit devenir agnostique de la verticale

**Le problème mesuré.** `PERMISSION_ROLE_LEVELS` (`permissions.types.ts:35-47`) définit 11 rôles — **tous restaurant** :

```
super_admin 100 · directeur 90 · manager 70 · comptable 60 · chef_rang 50
chef_cuisinier 45 · serveur 40 · cuisinier 35 · barman 35 · hotesse 30 · plongeur 10
```

Un garage n'a ni `serveur`, ni `barman`, ni `plongeur`. Il a un réceptionnaire, un mécanicien, un chef d'atelier. Une clinique a un médecin, un infirmier, une secrétaire médicale.

> 🔴 **C'est le blocage structurel n°1 pour tes 7 autres verticales.** Le jour où un garage signe, soit tu lui donnes des rôles « serveur » et « plongeur », soit tu ajoutes 40 rôles à l'enum et il devient ingérable.

**La solution — séparer le NIVEAU du LIBELLÉ.**

Ce qui compte pour la sécurité, ce n'est pas le nom du rôle, c'est son **niveau d'autorité**. `ACTION_MAP` le prouve déjà : elle compare des `minLevel`, jamais des noms.

```
NIVEAUX — universels, jamais modifiés (le socle du RBAC)
  100 owner · 90 direction · 70 management · 60 finance
   50 supervision · 40 operation · 30 accueil · 10 support

LIBELLÉS — par verticale, purement cosmétiques
  restaurant : 50 → « chef de rang »      40 → « serveur »     10 → « plongeur »
  garage     : 50 → « chef d'atelier »    40 → « mécanicien »  30 → « réceptionnaire »
  clinique   : 50 → « médecin référent »  40 → « infirmier »   30 → « secrétaire »
  hôtel      : 50 → « chef de réception » 40 → « réceptionniste » 30 → « bagagiste »
```

**`ACTION_MAP` ne change pas d'une ligne** — elle continue de comparer des niveaux. Seul l'affichage change.

- [ ] Renommer les clés de `PERMISSION_ROLE_LEVELS` en niveaux universels, conserver les valeurs numériques
- [ ] Ajouter `roleLabels: Record<number, string>` au plugin de chaque verticale (`verticals/<v>/ui.ts` ou un `roles.ts` dédié)
- [ ] Table de correspondance rétro pour les tenants restaurant existants — **aucune migration de données** : les niveaux sont inchangés
- [ ] `RolesPermissionsPanel.tsx` affiche les libellés de la verticale active
- [ ] MCC : `users/role` propose les libellés de la verticale du tenant

> 💡 **Cohérent avec la Décision 1** : la logique d'autorisation vit dans le pilier (universelle), la verticale n'apporte que du vocabulaire. Ajouter une industrie = ajouter une table de libellés, **jamais** toucher au moteur de permissions.

> ⚠️ **Ordre** : faire la **0.9** (RBAC serveur) d'abord. Porter la matrice côté serveur avec les rôles actuels, **puis** renommer les niveaux. Faire les deux en même temps mélangerait un correctif de sécurité et un renommage — impossible à relire.

### Les 5 lignes à écrire dans `CLAUDE.md`

- [ ] Ajouter cette section — **avant** de commencer 3.1 :

```markdown
## Où vit le code

- Le MÉTIER vit dans `modules/<pilier>/<domaine>/<module>/`.
  Une opération commune à plusieurs industries s'écrit UNE fois dans le pilier.
- `verticals/<v>/` ne contient QUE de la composition : plugin UI, adapters,
  navigation, tokens. Aucun calcul métier.
- Motif interne officiel : `components/ hooks/ services/ store/ types/`.
  L'hexagonal (`presentation/application/infrastructure`) est réservé aux modules
  à logique complexe ET multi-implémentations d'infrastructure — le justifier en PR.
```

- [ ] Vérifier : `grep -c "Où vit le code" CLAUDE.md` → **1**

> 💡 Ces cinq lignes valent des semaines quand le premier garage arrivera, et donnent à l'agent une règle qu'il ne peut pas interpréter de travers.

## 3.1 — Barrel Contract (219 violations)

**Règle** (CLAUDE.md) : importer **uniquement** depuis `@/modules/<pilier>`. Toute profondeur `domaine/module` est interdite.

**Zones les plus touchées** (extraites du rapport ESLint) :

| Zone source | Exemple de violation |
|-------------|----------------------|
| `commerce/acquisition/onboarding/migration/**` | ~25 imports profonds (parsers, connectors, types) |
| `modules/*/domain/schemas/**` | ~30 imports directs de schémas |
| `intelligence/ia/ai/**` | `LLMManager`, `LLMProviderFactory`, `DNAInjector` |
| `ops/workflow/engine/types` | ~10 imports directs |
| `compliance/securite/**` | `AuditLogger`, `ImmunityAuditLogger`, `DocumentVault` |

### Procédure exacte, par pilier

**Étape 1 — Lister les symboles importés en profondeur**
```bash
PILIER=commerce
grep -rn "from '@/modules/$PILIER/[a-z]" src --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__\|\.test\." \
  | sed -E "s/.*import \{?([^}]*)\}? from.*/\1/" \
  | tr ',' '\n' | tr -d ' ' | sort -u
```

**Étape 2 — Exposer dans le barrel racine** `src/modules/<pilier>/index.ts`
```ts
export { LLMManager } from './ia/ai/LLMManager';        // export nommé explicite
export type { ImportCategory } from './acquisition/onboarding/migration/types';
```
> ⚠️ **Exports nommés, pas `export *`.** Un `export *` sur un sous-module lourd tire toutes ses dépendances dans le bundle de quiconque importe le pilier. C'est exactement le problème documenté pour `FloorPlanEditor` (Konva, ~1,2 Mo).

**Étape 3 — Remplacer les imports profonds**
```bash
grep -rln "from '@/modules/$PILIER/[a-z]" src --include="*.ts" --include="*.tsx" | grep -v "__tests__"
# éditer chaque fichier : '@/modules/commerce/relation/crm/X'  →  '@/modules/commerce'
```

**Étape 4 — Vérifier qu'aucun cycle n'a été créé**
```bash
npx tsc --noEmit
sentrux check . 2>&1 | grep max_cycles      # doit rester à 0
npx vitest run                              # ⚠️ guetter les TDZ au prerender SSR
```

> 🔴 **Le piège du barrel** : élargir un barrel peut créer un cycle `store → module → hooks → store`. Le fichier `store/pillars/ops.ts` le documente déjà en commentaire : *« la couche état ne doit pas importer les barrels de modules »*. Si `sentrux` passe de 0 à N cycles après ton élargissement, **c'est ton élargissement qui est fautif** — reviens en arrière et exporte le symbole depuis une source plus profonde et neutre.

**Étape 5 — Commit isolé par pilier**

> 💡 **Les tests sont exemptés.** La règle du Barrel autorise explicitement les imports profonds dans les tests qui mockent des chemins spécifiques. Ne les touche pas — `--include` les exclut déjà des commandes ci-dessus.

> ⚠️ **Piège des cycles** : le barrel `ops/index.ts` documente déjà que `FloorPlanEditor` (Konva, ~1,2 Mo) **ne doit pas** être ré-exporté. Même logique pour tout module lourd — utiliser `next/dynamic` plutôt que d'élargir le barrel.

- [ ] `commerce` (~60 violations)
- [ ] `compliance` (~35)
- [ ] `finance` (~30)
- [ ] `intelligence` (~30)
- [ ] `ops` (~30)
- [ ] `human` · `logistics` · `facility` (~34)

## 3.2 — Inversions de couche (178 réelles — chiffre corrigé)

> 🔄 **Correction issue du mapping structurel.** Une version précédente annonçait 78 violations, d'après le seul compteur ESLint `vanguard/no-inter-module-imports`. Le comptage direct des imports révèle **178 inversions** — ESLint n'en couvre qu'une partie.

Le socle importe le métier, alors que la dépendance doit aller dans l'autre sens :

| Inversion | Occurrences | Gravité |
|-----------|-------------|---------|
| `shared/` → `modules/` | **118** | 🔴 `shared/` est la fondation : 598 fichiers, 56 237 lignes |
| `lib/` → `modules/` | **49** | 🔴 `lib/` héberge le Nexus et le MCC |
| `store/` → `modules/` | **11** | 🟠 risque de cycle TDZ au build SSR — déjà documenté dans `store/pillars/ops.ts` |
| **Total** | **178** | |

**Pourquoi ça compte** : `shared/` et `lib/` sont chargés par *tout* le projet. Chaque import descendant vers `modules/` tire un pilier entier dans le graphe — c'est la cause mécanique des cycles et du poids de bundle.

**Bonne nouvelle du mapping** : la direction est **correcte au sommet** — `modules/ → app/` = **0** et `modules/ → verticals/` = **0**. La charte est respectée là où elle compte le plus. Le problème est concentré dans la couche transverse.

- [ ] Identifier les 2 fichiers agrégateurs de `shared/hooks` et `lib/` (106 et 120 violations de colonne à eux seuls)
- [ ] Les faire passer par les 3 canaux légitimes (barrel pilier / `Nexus.adapter` / `NexusEventBus`)
- [ ] Traiter les 11 inversions `store/ → modules/` **en priorité** : ce sont celles qui produisent les TDZ au prerender
- [ ] Réduire `shared/ → modules/` (118) puis `lib/ → modules/` (49)

> 💡 **Ordre malin** : faire la **Phase 1** (auto-fix des 129 imports morts) *avant* celle-ci. Un import mort qui pointe en profondeur compte aujourd'hui comme violation — le supprimer la fait disparaître sans effort. Le compteur baissera mécaniquement avant qu'on écrive une ligne.

## 3.3 — Casser les 4 cycles

**Tous localisés dans le système de verticals — dette fraîche, à traiter avant que les 8 variants ne la propagent.**

Boucle identifiée :
```
shared/components/ui/StatCard.tsx
  → shared/hooks/useVerticalComponent.ts
  → shared/plugins/VerticalUIRegistry.ts
  → shared/providers/VerticalUIProvider.tsx
  → verticals/garage/ui.ts → verticals/garage/ui/GarageStatCard.tsx
  → (retour) shared/components/ui/StatCard.tsx
```
Idem pour `salon`. Second cycle autour de `infrastructure/auth/hooks/useAuth.ts` ↔ `lib/auth/**` ↔ `instances/index.ts`.

### 🔬 Trace exacte du cycle (vérifiée ligne par ligne)

```
src/shared/components/ui/StatCard.tsx:8
  → import { useVerticalComponent } from '@/shared/hooks/useVerticalComponent'
src/shared/hooks/useVerticalComponent.ts:4
  → import { useVerticalUI } from '@/shared/providers/VerticalUIProvider'
src/shared/providers/VerticalUIProvider.tsx
  → import { VerticalUIRegistry } from '@/shared/plugins/VerticalUIRegistry'
src/shared/plugins/VerticalUIRegistry.ts:27-34
  → import('@/verticals/garage/ui')          ← auto-enregistrement des 8 verticals
src/verticals/garage/ui.ts
  → export { GarageStatCard } from './ui/GarageStatCard'
src/verticals/garage/ui/GarageStatCard.tsx:6
  → import type { StatCardIntent } from '@/shared/components/ui/StatCard'   ⟲ BOUCLE
```

**La cause n'est pas un accident de câblage : c'est le motif lui-même.**
Le composant de base (`StatCard`) **consomme son propre mécanisme d'override**. Il appelle `useVerticalComponent`, qui remonte au registry, qui charge les verticals, qui réimportent le composant de base.

> 🔴 **Conséquence directe pour la refonte** : sous ce motif, **chaque composant rendu surchargeable par un vertical créera un nouveau cycle**. Aujourd'hui seuls `garage` et `salon` surchargent `StatCard` — d'où exactement 2 des 4 cycles. Le jour où le graphiste rend `PremiumCard`, `Modal` ou `PageHeader` surchargeables, on passe à 6, 8, 10 cycles. **Il faut corriger le motif avant la refonte, pas après.**

### ✅ Le correctif minimal — vérifié dans le code

> 🔄 **Correction apportée à ce plan.** Une version précédente proposait de restructurer tout le motif d'override. **C'est inutile.** L'inspection du code montre que le mécanisme est propre — le cycle tient à **une seule arête**, celle du type.

**Mécanisme réel** (`StatCard.tsx:227`) :
```tsx
const StatCardBase = (props) => { /* rendu par défaut */ };        // composant pur
export type StatCardIntent = "brand" | "success" | … ;             // ← l. 87
export const StatCard = withVerticalOverride('StatCard', StatCardBase);   // ← l. 227
```

`withVerticalOverride` (`useVerticalComponent.ts:42-54`) est un HOC correct : il lit le plugin et rend l'override s'il existe. **Rien à changer là-dedans.**

**L'arête fautive est ailleurs** — `GarageStatCard.tsx:6` :
```tsx
import type { StatCardIntent } from '@/shared/components/ui/StatCard';   // ⟲ ferme la boucle
```

**Le correctif tient en trois étapes** :

- [ ] **1.** Créer `src/shared/components/ui/types.ts` :
  ```ts
  export type StatCardIntent = "brand" | "success" | "warning" | "danger" | "info" | "neutral";
  ```
- [ ] **2.** Dans `StatCard.tsx` : remplacer la déclaration l. 87 par un ré-export
  ```ts
  export type { StatCardIntent } from './types';   // compatibilité des imports existants
  ```
- [ ] **3.** Dans `GarageStatCard.tsx:6` **et** `SalonStatCard.tsx` : importer depuis `./types`
  ```tsx
  import type { StatCardIntent } from '@/shared/components/ui/types';
  ```

**Vérification** :
```bash
grep -rn "from '@/shared/components/ui/StatCard'" src/verticals/   # doit ne rien retourner
sentrux check . 2>&1 | grep max_cycles                              # 4 → 2
```

- [ ] **Généraliser la règle** : tout type partagé entre un composant de base et ses overrides vit dans `types.ts`, jamais dans le fichier du composant. **À écrire dans `CONTRIBUTING-UI.md` (6.3) avant que le graphiste n'ajoute des overrides**
- [ ] Casser le cycle `auth` (`infrastructure/auth/hooks/useAuth.ts` ↔ `lib/auth/**` ↔ `instances/index.ts`) — choisir **une** source canonique et faire pointer l'autre dessus
- [ ] `sentrux check .` → `max_cycles: 0`
- [ ] Revérifier `demo/simulation.test.ts` (voir 0.3) — son échec de collecte vient probablement d'un de ces cycles

> 💡 **Pourquoi ça marche** : `import type` est effacé à la compilation, l'arête est donc inoffensive **au runtime** — mais sentrux et le bundler la comptent dans le graphe statique. La déplacer vers un module neutre ouvre la boucle sans toucher à une seule ligne de logique.

## 3.4 — 🎯 La cible structurelle (orienter les déplacements, ne pas tout casser)

> **Ne fais PAS un big-bang.** Cette section donne la **direction** : quand 3.1 et 3.2 te font déplacer un fichier, envoie-le à sa place définitive plutôt qu'à une place intermédiaire. Déplacer une fois, pas deux.

### Le problème mesuré

`shared/` (598 fichiers, 56 237 lignes) **n'est pas une couche, c'en est trois** :

| Sous-dossier | Fichiers | Lignes | Nature réelle |
|--------------|---------:|-------:|---------------|
| `components/` | 152 | 22 218 | **Design system** + layouts + settings |
| `eventBus/` | 194 | 13 504 | **Colonne vertébrale d'orchestration** |
| `nexus/` | 119 | 10 343 | **Noyau** : contrats, guards, state, vault |
| autres | 133 | 10 172 | hooks, providers, seeds… |

Ces trois-là ont des rythmes de changement, des publics et des **dépendances autorisées** différents. Le design system doit légitimement connaître des types métier ; le noyau, **jamais**.

> 🔴 **C'est l'origine mécanique des 118 inversions `shared/ → modules/`.** Ce ne sont pas 118 erreurs isolées : ce sont les composants UI qui importent normalement du métier, et qui traînent le noyau avec eux dans le même sac. **Tant qu'ils cohabitent, la règle ne peut pas être exprimée — parce qu'elle n'est pas la même pour les trois.**

**Second problème** : trois racines transverses qui font le même métier — `shared/` (598), `lib/` (190), `infrastructure/` (43). La preuve la plus nette : **`useAuth` existe en double** (`infrastructure/auth/hooks/useAuth.ts` **et** `lib/auth/hooks/useAuth.ts`) — et c'est **l'un de tes 4 cycles**. `infrastructure/` fait 20 lignes par fichier de moyenne : couche fantôme, majoritairement des barrels.

### La cible

```
src/
├── kernel/        ← shared/nexus + lib/nexus + infrastructure/
│                    contrats, guards, vault, Nexus, auth
│                    RÈGLE : ne dépend de RIEN. Zéro import de modules/
│
├── orchestration/ ← shared/eventBus (194 fic.)
│                    bus, 165 handlers, outbox, DLQ
│                    RÈGLE : dépend de kernel + contrats de modules/, jamais de leur UI
│
├── modules/       ← les 8 piliers — INCHANGÉ, c'est ce qui marche
│
├── design/        ← shared/components (152 fic.)
│                    RÈGLE : peut connaître les types métier, jamais l'inverse
│
├── verticals/     ← composition uniquement (Décision 1)
│
└── app/           ← routes — inchangé
```

`lib/` et `infrastructure/` disparaissent, absorbés par `kernel/` — **et le doublon `useAuth` avec eux**, ce qui règle un cycle au passage.

- [ ] Écrire cette cible dans `CLAUDE.md` — c'est une **direction**, pas un chantier
- [ ] Pendant 3.2 : chaque fichier déplacé va **directement** à sa destination cible
- [ ] Résoudre le doublon `useAuth` en choisissant **une** source canonique → règle le cycle n°2 de 3.3
- [ ] Ne **pas** planifier de migration de masse : la cible se remplit au fil des Phases 3, 4 et 5

> 💡 **Pourquoi l'EventBus mérite son propre étage** : 194 fichiers, 165 handlers. Ce n'est pas un utilitaire partagé, c'est la couche d'orchestration du système. L'enterrer dans `shared/` sous-estime ce qu'il est et rend ses règles de dépendance floues — d'où les `registerHandlers/*` qui apparaissent en god files alors que ce sont des registres légitimes (voir 4.3).

### ✅ Critère de sortie Phase 3
```
Décisions 1 et 2                    : écrites dans CLAUDE.md
ESLint no-restricted-imports        : 219 → 0
Inversions shared|lib|store → modules : 178 → 0
sentrux max_cycles                  :   4 → 0
Doublon useAuth                     : résolu, 1 seule source
Cible structurelle                  : documentée, déplacements orientés
```

---

# 🧩 PHASE 4 — Fragmentation UI

> **Objectif** : fan-out < 12, fichiers < 400 lignes.
> **Durée** : ~2 j · **Risque** : faible
> ✅ **Phase reprise du plan original — chiffres vérifiés exacts.**

> ⚠️ **Dépendance chronologique** : les sections **4.1** et **4.5** touchent des montants. Elles doivent être **synchronisées avec la Phase 5**, sinon le travail est fait deux fois. Voir la matrice de dépendances en fin de document.

## 4.1 — `SplitBillDialog.tsx` (484 lignes → ~80)

**Fichier** : `src/modules/ops/service/pos/components/SplitBillDialog.tsx`

**État actuel mesuré** : **10 `useState`** dans un seul composant (l. 41-50). C'est la cause de la taille, pas le JSX.

**Extraction 1 — `useSplitBillState.ts`** (regroupe 6 états liés, via `useReducer`)
```
mode · splitCount · convivePayments · selectedItems · customAmounts · payingConvive
+ syncSplitState (l. 53) · getConviveTotal (l. 75) · handlePayConvive (l. 79)
+ dérivés : amountPerPerson (l. 71) · paidCount (l. 72) · remainingAmount (l. 73)
```
> 💡 Ces 6 états changent **ensemble** à chaque modification du mode ou du nombre de convives — d'où `useReducer` plutôt que 6 `useState` qu'il faut penser à synchroniser (c'est exactement ce que fait `syncSplitState` à la main aujourd'hui).

**Extraction 2 — `usePaymentTerminal.ts`** (machine à états matérielle, 4 états)
```
selectedPaymentMethod · isProcessing · terminalState · terminalError
+ handleConfirmPayment (l. 84)
```
> 💡 `terminalState: 'idle' | 'pending' | 'manual_wait' | 'error'` est déjà une machine à états. L'isoler la rend testable **sans terminal physique** — c'est le vrai gain, pas la réduction de lignes.

**Extraction 3 — composants visuels**
- [ ] `<SplitBillHeader />` — titres, background blur
- [ ] `<ConviveGrid />` — liste des convives et leurs parts
- [ ] `<PaymentMethodSelector />` — boutons Cash / Card / Mobile
- [ ] `<SplitModeSelector />` — les 3 boutons de mode (l. 268-274)

**Vérification**
```bash
wc -l src/modules/ops/service/pos/components/SplitBillDialog.tsx    # 484 → ~80
npx vitest run src/modules/ops/**/split*                            # vert
```

> 🔴 **Ne convertis PAS les montants en microunits pendant cette extraction.** La Phase 5 « ops » le fait, et le faire deux fois produit des doubles conversions. **Ordre imposé** : Phase 5 « ops » d'abord, extraction ensuite. Voir *Conflit 1* dans la matrice chronologique.

> ⚠️ **Ce composant est régi par un invariant** (1bis.1 n°6) : `Σ parts === total`, exactement. Après extraction, relancer `npx vitest run src/__tests__/invariants/` — si l'invariant du split passe au rouge, l'extraction a cassé la répartition du reste (`i < remainderNumber ? basePlusOne : base`).

## 4.2 — `LandingDashboard.tsx` (488 lignes)

**Fichier** : `src/modules/commerce/acquisition/landing/components/LandingDashboard.tsx`

- [ ] Isoler la logique de souscription newsletter dans un hook
- [ ] Isoler le tracking Analytics dans un hook
- [ ] Remplacer les imports massifs de sections par `next/dynamic` → gain de TTI

## 4.3 — God files hors tests (11 fichiers)

> 🔄 **Correction apportée à ce plan.** Une version précédente marquait `admin/mcc/page.tsx`, `KitchenDashboard.tsx` et les `*Provider.tsx` comme « à découper ». C'était faux : la charte `.agents/agents.md:30` les classe en **Aggregation Roots** avec un fan-out autorisé jusqu'à 30. Ils ne doivent **pas** être fragmentés — il faut aligner le gate (voir **0.5**), pas mutiler l'UI.

| Fichier | Fan-out | Traitement |
|---------|---------|------------|
| `app/(admin)/admin/mcc/page.tsx` | 18 | ✅ **Aggregation Root — ne pas toucher.** Vérifier seulement : 0 calcul métier + `next/dynamic` |
| `modules/ops/production/kitchen/components/KitchenDashboard.tsx` | 18 | ✅ **Aggregation Root — ne pas toucher.** Idem |
| `shared/components/layout/NexusProviderStack.tsx` | 17 | ✅ **Root Provider — ne pas toucher** |
| `shared/providers/fleet/NexusFleetProvider.tsx` | 16 | ✅ **Root Provider — ne pas toucher** |
| `modules/intelligence/ia/fleet/NexusFleetProvider.tsx` | 16 | ⚠️ **doublon apparent** du précédent — vérifier et dédupliquer (le fan-out n'est pas le sujet) |
| `shared/eventBus/registerHandlers/ops.ts` | 24 | 🟠 Registre — exempter dans `rules.toml` ou découper par domaine |
| `shared/eventBus/registerHandlers/human.ts` | 18 | 🟠 Registre — idem |
| `shared/eventBus/registerHandlers/finance.ts` | 17 | 🟠 Registre — idem |
| `shared/eventBus/registerHandlers/intelligence.ts` | 17 | 🟠 Registre — idem |
| `lib/NexusSyncService.ts` | 19 | 🔴 **vrai god file** — logique d'infra, à découper |
| `shared/providers/hooks/useNexusTenantLogic.ts` | 16 | 🔴 **vrai god file** — hook métier, à découper |

- [ ] **Vérifier le pacte** sur les 5 aggregation roots : zéro calcul métier direct, `next/dynamic` sur les panneaux lourds. C'est la **contrepartie** de leur exemption — si un dashboard calcule une marge en ligne, il perd son statut
- [ ] Étendre l'exception `rules.toml` aux 4 `registerHandlers/*` (registres par nature)
- [ ] Découper les **2 vrais god files** (🔴) : `NexusSyncService`, `useNexusTenantLogic`
- [ ] Élucider le doublon `NexusFleetProvider`

## 4.4 — Complexité cyclomatique (4 fonctions cc > 20)

| Fonction | cc | Fichier |
|----------|-----|---------|
| `isProductInCategory` | 27 | `shared/utils/categoryMatcher.ts` |
| `POST` | 24 | `app/api/webhooks/stripe/route.ts` |
| `analyzeDailyLaborCost` | 21 | `modules/human/effectifs/hr/services/LaborCostAnalyzer.ts` |
| `analyzeUnknownNode` | 45 | `scripts/extract_unknown_context_v2.ts` — *hors prod* |

- [ ] `isProductInCategory` → table de correspondance plutôt qu'une cascade de `if`
- [ ] Webhook Stripe `POST` → dispatch par type d'événement
- [ ] `analyzeDailyLaborCost` → extraire les sous-calculs

## 4.5 — Les 2 composants jamais transplantés

Reliquat de l'audit UI précédent (50/52 transplantés) :

- [ ] `ReconciliationHub.tsx` → `src/modules/finance/comptabilite/accounting/components/reconciliation/`
- [ ] `AggregationWidget.tsx` → idem

Source récupérable : `git show origin/main:src/modules/finance/components/accounting/reconciliation/<fichier>`
❗ **Adapter `InCents` → microunits à la transplantation**, ne pas réintroduire de la dette.

### ✅ Critère de sortie Phase 4
```
sentrux no_god_files    : 18 → ≤ 6 (registres exemptés)
sentrux complexité      : 4 → 0 fonctions cc > 20 en prod
Aucun composant UI > 400 lignes
```

---

# 💰 PHASE 5 — Migration monétaire microunits

> **Objectif** : éliminer les 686 `InCents` restants.
> **Durée** : ~4 j · **Risque** : 🔴 **ÉLEVÉ — le plus critique du document**
> **Absent du plan original.** C'est pourtant le seul poste porteur d'un **risque financier réel**.

## Pourquoi c'est le point le plus dangereux

Le projet fait cohabiter deux conventions monétaires :
- `1 cent = 0,01 €`
- `1 microunit = 0,000001 €`

**Facteur d'écart : 10 000.** À chaque frontière où un `InCents` croise un `InMicrounits` sans conversion, l'erreur n'est pas de 1 % — elle est de **1 000 000 %**. Sur un ticket de caisse ou une écriture au journal, c'est une anomalie fiscale immédiate.

`modules/finance` (**259 occurrences**) et `modules/ops` (**147**) concentrent 59 % de la dette et sont précisément les deux piliers où l'erreur est irrattrapable (NF525 = append-only, pas de correction rétroactive possible).

## Méthode — pilier par pilier, jamais en masse

> 🔴 **Interdiction absolue du `sed` global.** `sed -i 's/InCents/InMicrounits/g'` renomme le champ **sans convertir la valeur**. Le code compile, les tests passent, et **tous les montants sont divisés par 10 000**. C'est le scénario catastrophe de cette phase : silencieux, généralisé, et irrattrapable sur des écritures scellées.

### Procédure exacte, à répéter pour chaque pilier

**Étape 1 — Cartographier**
```bash
grep -rn "InCents" src/modules/<pilier> --include="*.ts" --include="*.tsx" | grep -v "\.test\." > /tmp/cents-<pilier>.txt
wc -l /tmp/cents-<pilier>.txt      # doit correspondre au tableau ci-dessus
```

**Étape 2 — Classer chaque occurrence en 3 catégories**

| Catégorie | Traitement |
|-----------|------------|
| **Champ de données** (`totalInCents: number`) | renommer **et** convertir la valeur × 10 000 |
| **Variable locale de calcul** | renommer, convertir à la source |
| **Frontière externe** (export XML, API tierce, Stripe) | 🔴 **NE PAS CONVERTIR** — l'extérieur attend des centimes. Convertir *au passage de la frontière* |

> ⚠️ La catégorie 3 est le piège. `FacturXGenerator.ts:15` porte ce commentaire : *« Prix unitaire en euros (pas en microunits — export XML externe) »*. Stripe attend des centimes. Toute conversion aveugle de ces points casse l'intégration.

**Étape 3 — Écrire le test de non-régression AVANT de toucher au code**
```ts
it('<pilier> : montant connu → montant attendu', () => {
  // valeur métier réelle, pas 0 ni 1
  expect(computeX({ priceInMicrounits: 12_500_000 })).toBe(/* attendu en µ */);
});
```

**Étape 4 — Convertir**
- `xInCents: number` → `xInMicrounits: number`
- Valeur : `cents * 10_000`, **jamais** `as Microunits` — utiliser `toMicrounits()`
- Affichage : `formatCurrency(value / 1_000_000)`

**Étape 5 — Vérifier**
```bash
npx tsc --noEmit                                    # 0 erreur
npx vitest run                                      # vert, invariants compris
npx vitest run src/__tests__/invariants/            # ⚠️ le n°5 (aller-retour) doit rester vert
grep -rn "InCents" src/modules/<pilier> | grep -v "\.test\." | wc -l   # doit avoir baissé du compte attendu
```

**Étape 6 — Commit isolé**
```
refactor(<pilier>): migration microunits — N occurrences — réf. plan §5
```

### Ordre imposé, et pourquoi

- [ ] **P0 — `modules/finance` (259)** — journal, écritures, FEC
  > 🔴 **Vérification supplémentaire obligatoire** : après conversion, les sceaux NF525 **déjà émis** doivent rester vérifiables. Le hash porte sur `canonicalStringify(dataSnapshot)` — si un nom de champ change dans le snapshot, **toute la chaîne historique devient invérifiable**. Avant de toucher à `FinancialNexusBridge`, vérifier ce qui entre exactement dans `dataSnapshot` et **figer ces noms de champs**, ou prévoir une migration versionnée du format de snapshot.
- [ ] **P0 — `modules/ops` (147)** — POS, encaissement, split. À faire **avant** 4.1 (conflit 1)
- [ ] **P1 — `shared/` (97)** — helpers partagés : se propage à tous les piliers, donc à faire tôt
- [ ] **P1 — `modules/logistics` (39)** — coûts d'achat, valorisation de stock
- [ ] **P1 — `lib/` (38)**
- [ ] **P2 — `modules/intelligence` (32)** · `commerce` (27) · `human` (20) · `app/` (20)
- [ ] **P3 — `infrastructure/` (5)** · `compliance` (1) · `facility` (1)

> 💡 **Après chaque pilier converti, retire son exclusion de la règle Semgrep n°1** (1bis.2). Le terrain gagné devient définitivement protégé contre la rechute.

### Ordre d'exécution

- [ ] **P0 — `modules/finance` (259)** — journal, écritures, FEC. ❗ Vérifier que les scellements NF525 existants restent vérifiables après conversion
- [ ] **P0 — `modules/ops` (147)** — POS, encaissement, split de note. À coupler avec la Phase 4.1
- [ ] **P1 — `shared/` (97)** — helpers partagés, propagation à tous les piliers
- [ ] **P1 — `modules/logistics` (39)** — coûts d'achat, valorisation de stock
- [ ] **P1 — `lib/` (38)**
- [ ] **P2 — `modules/intelligence` (32)** · `commerce` (27) · `human` (20) · `app/` (20)
- [ ] **P3 — `infrastructure/` (5)** · `compliance` (1) · `facility` (1)

### 🔴 Garde-fous à installer AVANT la première conversion

Cette phase est la plus risquée du plan. **Ne pas l'attaquer sans le filet de la Phase 1 bis.**

- [ ] **Règle Semgrep anti-`InCents`** (1bis.2) — interdit tout **nouveau** champ hors zones legacy déclarées. Sans elle, la dette se recrée pendant qu'on la résorbe
- [ ] **Invariant fast-check `toMicrounits(x) / 1_000_000 === x`** (1bis.1) — attrape une conversion fautive sur des milliers de valeurs générées, y compris les arrondis limites qu'un test manuel ne pense jamais à écrire
- [ ] **Invariant `Σ TVA ventilée = TVA totale`** — garantit qu'une conversion ne casse pas la ventilation qui alimente l'e-reporting

### ✅ Critère de sortie Phase 5
```
InCents en code prod : 686 → 0
Tests de non-régression monétaire sur finance + ops
Règle ESLint anti-régression active
```

---

# 🎨 PHASE 6 — Préparation de la refonte UI (travail avec un graphiste)

> **Objectif** : rendre le dépôt réellement prêt pour une refonte visuelle externe.
> **Durée** : ~2 j de préparation, puis la refonte elle-même
> **Peut démarrer** : dès que **0.5** et **3.3** sont faits — pas avant

## 6.0 — Verdict : oui, mais deux verrous d'abord

**Le socle est bon.** Mesuré sur le code :

| Signal | Mesure | Lecture |
|--------|--------|---------|
| Classes sémantiques (`bg-surface`, `text-text-`, `border-border`…) | **3607** | Le style passe par des tokens, pas par des valeurs |
| Couleurs hex en dur dans `modules/` | **97** | **97,4 % de discipline** |
| Bibliothèque de composants | **39** dans `shared/components/ui/` | Point d'entrée unique |
| Tokens CSS | `empire-design-system.css` + `globals.css` | glass, ombres, typo fluide (`clamp`), z-index |
| Thème sombre | `[data-theme]` **+** `prefers-color-scheme` | Les deux mécanismes, correctement |
| Charte par tenant | `BrandingService` · `BrandingProvider` | Personnalisation par client déjà en place |

**Concrètement** : changer les variables CSS de `empire-design-system.css` et `globals.css` re-thème **3607 points d'usage d'un coup**. C'est exactement ce qu'on veut pour une refonte. Un graphiste peut travailler par tokens sans toucher à la logique.

**Mais deux verrous bloquent aujourd'hui :**

### 🔒 Verrou 1 — Le gate refuse ce que la charte autorise
Traité en **0.5**. Sans cet alignement, chaque dashboard riche livré par le graphiste échoue à `preflight.sh`. C'est ~15 min de config, mais c'est bloquant.

### 🔒 Verrou 2 — Les 4 cycles sont dans le chemin de l'UI
Traité en **3.3**. Ce n'est pas un cycle abstrait au fond de l'infra : il traverse `StatCard.tsx`, le composant le plus réutilisé du design system.

```
shared/components/ui/StatCard.tsx
  → shared/hooks/useVerticalComponent.ts
  → shared/plugins/VerticalUIRegistry.ts
  → import('@/verticals/garage/ui')
  → verticals/garage/ui/GarageStatCard.tsx
  → (retour) shared/components/ui/StatCard.tsx      ⟲
```

**Cause exacte** : `VerticalUIRegistry.ts` auto-enregistre les 8 verticals par `import('@/verticals/*/ui')` en fin de module. Le commentaire du fichier dit que le lazy import « évite les deps circulaires à l'init » — c'est vrai **à l'exécution** (pas de TDZ), mais l'arête reste dans le graphe statique, donc le cycle existe pour sentrux et pour le bundler.

**Le risque pour la refonte** : un graphiste qui retouche `StatCard` — le composant qu'on retouche en premier dans toute refonte — travaille au milieu d'un cycle. Symptômes typiques : `undefined` à l'import selon l'ordre de chargement, HMR qui décroche, comportement différent entre dev et build.

- [ ] **Inverser l'enregistrement** : retirer les 8 `import()` de `VerticalUIRegistry.ts`. Chaque vertical s'enregistre depuis son propre point d'entrée, chargé par `VerticalUIProvider` selon le variant actif du tenant — le registry ne connaît alors plus aucun vertical

## 6.1 — Nettoyer les 97 couleurs en dur

Ces valeurs **ne suivront pas** un changement de charte : elles resteront à l'ancienne palette pendant que le reste bascule. À traiter avant que le graphiste ne commence, sinon il découvrira des îlots incohérents.

Fichiers concernés :
- `commerce/relation/crm/components/ProspectingDashboard.tsx`
- `commerce/acquisition/marketing/components/crm/BasketAnalysis.tsx`
- `commerce/acquisition/marketing/components/crm/CRMSidebar.tsx`
- `commerce/acquisition/marketing/components/seo/ScoreGauge.tsx`
- `commerce/acquisition/onboarding/wizard/SimpleFloorPlanEditor.tsx`
- `intelligence/ia/simulator/components/SimulationDashboard.tsx`
- `compliance/qualite/haccp/components/quality/DigitalSignature.tsx`
- `facility/spaces/settings/ZoneService.tsx`

- [ ] Remplacer chaque hex par un token existant, ou créer le token s'il manque
- [ ] Ajouter une règle ESLint interdisant les hex littéraux dans `src/modules/**/*.tsx` (garde anti-régression)

> 💡 Exception légitime : les couleurs **de données** (séries de graphiques, jauges) peuvent rester littérales — mais elles doivent alors vivre dans une palette dédiée exportée, pas en ligne dans le composant.

## 6.2 — 🔴 Ancrer l'i18n **pendant** la refonte (décision prise : multilingue par utilisateur)

**Objectif produit** : chaque **utilisateur** choisit la langue qu'il parle — pas le tenant, pas le pays. Un serveur hispanophone dans un restaurant français doit pouvoir travailler en espagnol.

### État réel de l'infrastructure (audité)

| Élément | État | Verdict |
|---------|------|---------|
| `src/i18n/locales/fr.ts` · `en.ts` | 19,3 Ko · 19,2 Ko | 🟢 substantiels |
| `es.ts` · `ja.ts` · `pt.ts` | 5,1 · 4,5 · 4,2 Ko | 🟠 ~25 % de couverture |
| `loadTranslations(lang)` + type `Language` | présents dans `translations.ts` | 🟢 le mécanisme existe |
| Composants utilisant `t()` | **0** | 🔴 dormant |
| `src/store/languageAtoms.ts` | **fichier vide** | 🔴 à écrire |
| `src/i18n/domains/` | **n'existe pas** — `translations.ts` le référence pourtant en commentaire | 🔴 doc périmée |
| Préférence de langue sur le profil utilisateur | **absente** des contrats | 🔴 à ajouter |

### La solution : extraire pendant, pas après

**Le principe.** Une refonte rouvre de toute façon presque tous les composants pour changer titres, libellés et états vides. C'est **exactement le même geste** que d'extraire la chaîne vers un fichier de traduction. Fait pendant : une passe. Fait après : deux passes sur les mêmes fichiers.

**Règle à inscrire dans le brief du graphiste** :

```tsx
// ❌ INTERDIT pendant la refonte — fige le français dans le composant
<h1 className="text-2xl">Plan de salle</h1>

// ✅ EXIGÉ — la chaîne part dans locales/, le composant ne connaît qu'une clé
<h1 className="text-2xl">{t('floorPlan.title')}</h1>
```

### Ordre d'exécution

- [ ] **1.** Ajouter `preferredLanguage: Language` au contrat utilisateur (`auth.types.ts`) — **par utilisateur**, pas par tenant
- [ ] **2.** Écrire `src/store/languageAtoms.ts` (aujourd'hui vide) : atome dérivé du profil utilisateur, avec repli sur la langue du tenant puis `'fr'`
- [ ] **3.** Câbler `useLanguage()` / `t()` dans `NexusOpsProvider` — le branchement décrit dans `.agents/agents.md:31`
- [ ] **4.** Corriger `translations.ts` : il documente une arborescence `domains/` qui n'existe plus, seul `locales/` est réel
- [ ] **5.** Sélecteur de langue dans le profil utilisateur (écran compte)
- [ ] **6.** **Puis seulement** lancer la refonte, avec la règle `t()` obligatoire
- [ ] **7.** Compléter `es` / `pt` / `ja` au niveau de `fr` / `en` — peut se faire **après**, en continu (les clés existent, seules les valeurs manquent)

> 💡 **Le point clé** : les étapes 1 à 5 sont du câblage technique, pas de la traduction. Elles se font en amont et ne bloquent pas. La traduction elle-même (étape 7) est incrémentale : une clé sans valeur retombe sur le français, l'app ne casse jamais.

> ⚠️ `.agents/agents.md:31` classe l'i18n en « Option B — Dormant » et interdit de le câbler sans décision produit explicite. **Cette décision est désormais prise** — mettre la charte à jour en conséquence (voir 0.6).

## 6.3 — Cadrer le travail du graphiste

Une fois les verrous levés, voici le périmètre sûr :

| ✅ Zone libre | 🚫 Zone interdite |
|---------------|-------------------|
| Variables de `empire-design-system.css` et `globals.css` | Toute logique dans `modules/*/services`, `*/domain`, hooks |
| Les 39 composants de `shared/components/ui/` | Les schémas Zod et les types |
| Composition des pages `src/app/**` (fan-out ≤ 30) | Les montants et leurs unités — **microunits, jamais de recalcul en UI** |
| Les `*Dashboard.tsx` (fan-out ≤ 30) | Contourner le Barrel Contract (`@/modules/<pilier>` uniquement) |
| Framer Motion, transitions, glassmorphism | Ajouter un hex en dur |

**Le pacte à respecter pour garder le fan-out ≤ 30** : ces gros fichiers UI ne font **aucun calcul métier direct** (ils délèguent aux hooks/sagas) et chargent les panneaux lourds via `next/dynamic`. C'est la contrepartie de la liberté accordée.

- [ ] Rédiger un `CONTRIBUTING-UI.md` d'une page reprenant ce tableau, remis au graphiste
- [ ] Vérifier que le storybook / la page `src/app/(admin)/design-system/` est à jour — c'est la vitrine de travail du graphiste

## 6.0 bis — Le squelette généraliste (requalifié)

> 🔄 **Correction de lecture.** Une version précédente de ce plan qualifiait les 800 dossiers vides de « surface fantôme », c'est-à-dire de défaut. **C'est faux.** Ces scaffolds sont une **stratégie produit délibérée** : l'arborescence est construite d'abord pour que n'importe quelle industrie s'y branche ensuite. Quand un garagiste signe, on remplit `repair-bay/` — on n'invente pas où le mettre. Ce qui suit n'est donc pas une liste de trous à boucher, mais l'**inventaire de ce qui est branché et de ce qui attend**.

**Ce qui est vrai** : 7 verticales sur 8 n'ont pas encore de métier implémenté.
**Ce qui change** : ce n'est pas un problème à corriger, c'est un périmètre à cadrer pour le graphiste.

### Les 17 modules métier de verticales sont des coquilles vides

Contenu réel de chacun : un commentaire `// Variant: X` et `export {};`

| Verticale | Modules déclarés vides |
|-----------|------------------------|
| **garage** | `repair-bay` · `repair-intake` · `spare-parts` · `bays` · `courtesy-cars` · `diagnostic-assist` |
| **clinic** | `consultation` · `medical-secrecy` · `waivers` · `bio-hazard` |
| **hotel** | `housekeeping` · `rooms` · `beds` · `front-desk` |
| **retail** | `serial-tracking` · `warranty-claims` |

**+ 12 pages de verticales rendues par `VerticalPageStub`** : salon (3), bakery (4), retail (5).

### Le chiffrage réel

| Élément | Mesure |
|---------|--------|
| Scaffolds hexagonaux créés | **69** |
| Dossiers vides dans `modules/` | **800** |
| Fichiers `.gitkeep` | **879** |
| Modules métier verticales réellement implémentés | **1 seul** (`frontdesk/WaitlistManager.ts`) |

✅ **Point rassurant** : aucun de ces modules vides n'est exporté dans un barrel pilier. Ils ne polluent pas l'API publique et ne cassent rien. C'est de la **surface annoncée**, pas de la dette active.

### Pourquoi c'est bloquant pour le brief du graphiste

Si on demande « refais l'UI des 8 verticales », le graphiste va découvrir que 7 mènent à des stubs ou à des écrans partagés sans spécificité métier. Il produira des maquettes pour des écrans qui n'existent pas, ou attendra des specs qui ne viendront pas.

### ✅ Périmètre visuel — tranché par la vision produit

La stratégie généraliste **répond d'elle-même à la question**. Puisque chaque industrie hérite du socle, c'est le **socle** qu'on dessine :

> **Le graphiste travaille sur les 39 composants de `shared/components/ui` et les 8 jeux de `scopedTokens`. Il ne dessine aucun écran métier de verticale.**

Bénéfice direct : le design vaut aussi pour les industries **pas encore créées**. Le jour où `repair-bay/` est rempli, il est déjà à la charte.

- [ ] Écrire ce périmètre dans `CONTRIBUTING-UI.md` (6.3), avec la liste explicite des écrans hors scope
- [ ] **Retirer les 12 `VerticalPageStub` du parcours de recette** — ils feraient perdre du temps au graphiste
- [ ] Recette sur les tenants `_demo_*` des verticales **déjà remplies** (restaurant, garage, clinic, hotel) — pas sur salon/bakery/retail dont les pages sont des stubs

## 6.4 — Le système 24 tenants (8 verticales × 3 tiers) — audit MCC

**Architecture réelle**, vérifiée dans `src/lib/mcc/SystemTenantRegistry.ts` :

| Tier | Convention | Écriture | Rôle |
|------|-----------|----------|------|
| **DEMO** | `_demo_<variant>` | 🔒 bloquée — Simulacra Mode | Vitrine prospect, store réel intact après chaque session |
| **TEST** | `_test_<variant>` | ✅ libre | Bac à sable dev, reset à la demande |
| **REFERENCE** | `_ref_<variant>` | 🔒 bloquée — promotion MCC uniquement | Maître cloneable vers les clients |
| *client* | `tenant_<siret>` | ✅ libre | Production |

**8 variants** × 3 = **24 tenants système**. Flux : `_test_` → *promotion MCC* → `_ref_` → *clonage* → `tenant_<siret>`.

### ✅ Ce qui est correctement câblé

| Point | Vérification |
|-------|--------------|
| `isWritable()` **est appliqué** | `SovereignGuard.ts:219` — `isSystemTenant(id) && !isWritable(id)` → rejet. **Fail-closed** |
| Simulacra auto-activé pour DEMO | `SplashGate.tsx:70-76` sur `getSystemTenantTier(id) === 'DEMO'` |
| Backstop si Simulacra échoue | `isWritable('_demo_x')` = `false` → le guard bloque quand même. L'échec est **visible**, pas silencieux |
| Auth des 3 routes MCC | `promote`, `reset-test`, `reset-demo` → toutes sous `requireFleetAdmin` |
| Bootstrap des 24 | `scripts/bootstrap-system-tenants.ts` |
| Clonage `_ref_` → client | `cloneFromReference()` — **exclut les collections NF525** (chaîne fiscale propre par tenant) ✅ |
| Isolation des tokens UI | `scopedTokens` appliqués sur le wrapper DOM, **jamais sur `:root`** — zéro contamination inter-verticales |
| Fleet cliente | `isFleetVisible()` masque les 24 système de la fleet client |
| ADN par verticale | 8 seeds dans `shared/seeds/` — un par variant |

**Verdict : l'architecture est saine.** Les garde-fous existent et sont branchés. Les points ci-dessous sont des écarts, pas des trous béants.

### 🔴 6.4.1 — Zéro test sur la barrière d'isolation

`isWritable`, `isSystemTenant`, `getSystemTenantTier`, `getSystemTenantId` : **aucun test unitaire**. Recherche dans `src/__tests__` → 0 fichier.

C'est la fonction qui protège les 8 tenants `_ref_*` — les maîtres dont **tous les clients futurs sont clonés**. Une régression silencieuse ici corrompt la référence, et chaque client provisionné ensuite hérite de la corruption.

- [ ] `SystemTenantRegistry.test.ts` — les 4 helpers, les 24 ids, les 4 cas de `isWritable` (DEMO/TEST/REF/client)
- [ ] Test d'intégration : écriture sur `_ref_restaurant` via `Nexus.adapter.set()` → **doit lever**
- [ ] Test d'intégration : écriture sur `_test_restaurant` → **doit passer**
- [ ] Test : `isFleetVisible` exclut bien les 24 de la fleet

### 🟠 6.4.2 — Divergence EventBus / Registry

`src/shared/eventBus/NexusEventBus.ts:75` réimplémente la règle **en dur** :

```ts
const isWritable = !tenantId.startsWith('_ref_');   // ← ne bloque QUE _ref_
```

Deux problèmes :
1. Le fichier **importe déjà** `isWritable` du registry — la constante locale **masque l'import** (shadowing). Un lecteur croit voir la règle canonique appliquée ; il voit une copie divergente.
2. Si un 4ᵉ tier apparaît (`_staging_`, `_archive_`…), le registry le connaîtra, **le bus l'ignorera**.

- [ ] Remplacer par l'appel canonique : `if (!isWritable(tenantId)) throw …`
- [ ] Vérifier l'impact sur DEMO : le bus laisse aujourd'hui passer `_demo_*` en marquant `isSimulation = true`. Si c'est intentionnel, **l'écrire en commentaire** — sinon la prochaine session « corrigera » l'incohérence et cassera la démo

### 🟠 6.4.3 — Le variant `custom` n'a pas de tokens

Couverture des plugins UI par verticale :

| Verticale | Layout | Tokens | StatCard |
|-----------|:------:|:------:|:--------:|
| restaurant · hotel · bakery · clinic · retail | ✅ | ✅ | — |
| garage · salon | ✅ | ✅ | ✅ |
| **custom** | ✅ | ❌ | ❌ |

`custom` est précisément le variant censé porter l'**UI sur mesure**, et c'est le seul sans jeu de tokens. Un client en `custom` retombe donc sur les tokens globaux, sans point d'entrée de personnalisation.

- [ ] Doter `custom` d'un jeu de `scopedTokens`, même minimal — c'est le gabarit que le graphiste dupliquera pour chaque client sur mesure
- [ ] Décider : `custom` hérite-t-il de `restaurant` par défaut, ou part-il d'une base neutre ?

### 🟡 6.4.4 — Points à valider avant la refonte

- [ ] `scripts/bootstrap-system-tenants.ts` est-il **idempotent** ? Le relancer ne doit pas dupliquer ni écraser les `_ref_*`
- [ ] `DEMO_SUBDOMAIN_MAP` (8 entrées) est-il synchronisé avec le DNS / la résolution de domaine (`api/resolve-domain`) ?
- [ ] `CLONABLE_COLLECTIONS` (7 collections) : une verticale non-restaurant (clinic, garage) a-t-elle des collections propres à cloner qui manquent à cette liste ?
- [ ] Après promotion `_test_` → `_ref_`, existe-t-il un **diff/preview** avant écrasement du maître ? Sinon une promotion accidentelle est irréversible

### 🎨 6.4.5 — Ce que ça change pour le graphiste

La matrice réelle du travail visuel est **8 verticales × (tokens + overrides) × 3 tiers d'aperçu** :

- Les tenants `_demo_*` sont le **banc d'essai idéal** : Simulacra intercepte les écritures, le store reste intact, aucun appel Stripe/Resend/webhook externe. Le graphiste peut itérer sans rien polluer.
- Les 8 sous-domaines `DEMO_SUBDOMAIN_MAP` donnent un accès direct à chaque verticale (`demo`, `demo-hotel`, `demo-garage`…) — **une URL par verticale à recetter**.
- ⚠️ **Recette obligatoire sur les 8**, pas seulement sur `restaurant` : les `scopedTokens` sont par verticale **et par route**. Une refonte validée sur `restaurant` ne prouve rien pour `clinic`.

- [ ] Ajouter au `CONTRIBUTING-UI.md` (6.3) : la liste des 8 URLs de démo comme parcours de recette
- [ ] Confirmer que les 24 tenants sont bien bootstrappés **avant** de donner les accès au graphiste

## 6.5 — 🔍 Read models : ce qui rend la profondeur d'UI possible

> **Sans cette section, chaque niveau de détail ajouté à l'UI multiplie les requêtes.** C'est la contrainte technique qui plafonne la richesse des écrans.

### Le diagnostic

Ton back-end expose **toutes** les primitives nécessaires — et c'est mieux que la moyenne :

| Capacité | État | Où |
|----------|------|-----|
| `query` avec `where` · `orderBy` · `limit` | ✅ | `INexusAdapter` |
| **Pagination curseur** — `startAfter` `endBefore` `cursorAfter` `cursorBefore` | ✅ | `storage.contracts.ts:51-59` |
| **Temps réel** — `onSnapshot`, déjà utilisé **51 fois** | ✅ | `INexusAdapter` |
| `runTransaction` · `batch` · `increment` · `serverTimestamp` | ✅ | `INexusAdapter` |
| EventBus — 165 handlers | ✅ | `shared/eventBus/` |
| **Read models / projections** | 🔴 **AUCUN** | — |

> 🎯 **Le diagnostic en une phrase** : tu as bâti un côté **écriture** remarquable (chaîne scellée, outbox, DLQ, transactions, guard) et presque aucun côté **lecture**. C'est du CQRS dont seul le **C** existe.

### La preuve dans le code

`CustomerDetailPanel.tsx` — une fiche client :
```
l. 38  Nexus.adapter.query("reservations", …)
l. 45  Nexus.adapter.query("orders", …)
puis   6 opérations .filter / .find / .map côté navigateur
```

Ça marche aujourd'hui. Mais une **vraie fiche 360** — commandes, réservations, fidélité, factures, préférences, allergies, réclamations, no-shows — c'est **7 requêtes à chaque ouverture**, jointes dans le navigateur. Sur une liste de 50 clients avec aperçu, le problème n'apparaît qu'en production, chez le client qui a le plus de données.

### La solution — la machinerie est déjà là

Tes 165 handlers sont exactement l'outil qui construit des projections. **Rien à installer.**

```
order.paid          ─┐
reservation.created ─┤→  handler  →  tenants/{id}/projections/customer/{customerId}
loyalty.earned      ─┤              { lastVisit, totalSpentInMicrounits, visitCount,
invoice.issued      ─┘                favoriteItems[], allergies[], noShowCount }
```

L'écran fait **une seule lecture**, sans jointure. Et via `onSnapshot`, il se met à jour tout seul quand un handler écrit.

- [ ] **Projection `customer/{id}`** — la fiche 360
- [ ] **Projection `table/{id}`** — état, commande en cours, durée d'occupation, CA du service
- [ ] **Projection `dashboard/daily`** — KPI du jour précalculés, au lieu d'être recalculés à chaque affichage

### Les deux règles non négociables

> 🔴 **1. Une projection est JETABLE.** Elle se reconstruit intégralement depuis les événements. **Ne jamais y stocker ce qui n'existe nulle part ailleurs** — sinon tu crées une source de vérité parallèle, non scellée, et tu perds la garantie NF525.

> 🔴 **2. Une projection n'a JAMAIS autorité.** Elle peut afficher un total ; l'écriture scellée reste la seule vérité. Un contrôle fiscal lit `journalEntries`, pas `projections`.

- [ ] Ajouter `projections/` aux collections **exclues** du clonage `_ref_` → client (elles se reconstruisent)
- [ ] **Invariant fast-check** (§1bis.1) : *projection reconstruite depuis les événements === projection courante*. C'est le seul test qui prouve qu'elle n'a pas dérivé
- [ ] Écrire un `rebuildProjection(tenantId, type)` déclenchable depuis le MCC — indispensable après tout changement de logique de handler

### La règle pour le graphiste et l'agent

> **Un écran = une lecture.** Si un écran a besoin de trois sources, ce n'est pas l'écran qu'il faut simplifier — c'est une projection qu'il faut créer.

- [ ] Inscrire cette règle dans `CONTRIBUTING-UI.md` (§6.3)
- [ ] **Ne pas construire de projections « au cas où »** : dessiner d'abord l'écran, compter les requêtes, créer une projection au-delà de 2-3

## 6.6 — 🎨 Personnalisation tenant : standard vs charte propre

### Ce qui existe déjà — audité, et c'est du solide

Le système de charte graphique par tenant est **construit et cohérent** :

| Élément | État | Fichier |
|---------|------|---------|
| Mode `'default' \| 'custom'` | ✅ | `shared/nexus/tokens/brand.ts:71` |
| Couleurs — `primaryColor` `primaryHover` `accentColor` | ✅ validées en hex par Zod | `brand.ts:18-20` |
| **3 rôles de police distincts** + URL Google Fonts | ✅ | `brand.ts:33-42` |
| `logoUrl` | ✅ | `brand.ts:45` |
| **Splash au démarrage** — conditionné à `mode='custom'` **et** `splashEnabled` | ✅ | `SplashGate.tsx:7` |
| Une seule fois par session, puis retour à la dernière page | ✅ | `SplashGate.tsx:8-9` |
| Injection au provisioning MCC | ✅ | `injectBrandingVars()` |
| Éditeur de marque | ✅ | `useBrandEditor` · `useBrandCapabilities` |

**Deux détails qui montrent que c'est bien pensé** :
- La séparation en **3 rôles typographiques** — `--font-brand` (titres, KPI), `--font-ui` (corps, navigation), `--font-mono` (tickets, codes produit, timestamps KDS). C'est la bonne granularité, avec des fallbacks corrects.
- `--text-on-primary` est **calculé** par `getContrastTextColor(primaryColor)` (`BrandingProvider.tsx:161`). Le contraste du texte s'adapte automatiquement à la couleur choisie par le client. C'est de l'accessibilité intégrée, pas décorative.

### 🔴 Le conflit de précédence à trancher

**Deux systèmes écrivent les mêmes variables CSS, à deux niveaux différents :**

```
:root                              ← BrandingProvider  (charte du TENANT)
  └─ div[data-vertical-scope]      ← VerticalUIProvider (tokens de la VERTICALE)
       └─ les composants
```

La cascade CSS donne la priorité au plus proche. **Donc la verticale écrase la charte du client.**

**Chevauchement mesuré aujourd'hui** :

| Variable | Écrite par `:root` (tenant) | Écrite par le wrapper (verticale) | Gagnant actuel |
|----------|:---:|:---:|---|
| `--radius-btn` | ✅ | ✅ | 🔴 **la verticale** |
| `--radius-card` | ✅ | ✅ | 🔴 **la verticale** |
| `--font-brand` · `--font-ui` · `--font-mono` | ✅ | — | tenant ✅ |
| `--glass-blur` · `--glass-opacity` | ✅ | — | tenant ✅ |

**Conséquence concrète** : un garagiste qui choisit des angles arrondis dans sa charte les voit silencieusement écrasés par les tokens de la verticale garage.

> ⚠️ **Deux variables aujourd'hui, donc dégât limité. Mais la Phase 6 prévoit d'étendre les `scopedTokens` des 8 verticales** — le conflit s'élargira exactement au moment où le graphiste travaille, et sera attribué à un bug de CSS.

### La décision à prendre

- [ ] **Trancher la règle de précédence** (décision produit) :
  - **Option A ✅ recommandée** — *la charte du tenant gagne toujours*. La verticale fournit un **défaut**, le client peut tout surcharger. Cohérent avec la promesse commerciale « votre charte, vos couleurs »
  - **Option B** — la verticale gagne sur les variables structurelles (rayons, densité), le tenant sur l'identité (couleurs, polices, logo)
- [ ] **Implémenter la règle choisie.** Pour l'option A, appliquer les tokens de verticale **avant** ceux du tenant, ou passer les deux au même niveau avec un ordre explicite
- [ ] **Documenter dans `brand.ts`** quelles variables sont surchargeables par le tenant et lesquelles ne le sont pas
- [ ] **Test de non-régression** : tenant en `mode='custom'` avec `--radius-btn` défini + verticale garage → vérifier que la valeur appliquée est bien celle attendue par la règle

### Nettoyage lié

- [ ] `src/infrastructure/branding/WhiteLabelBrandingInjector.ts` fait **1 ligne** (`export * from '@/lib/branding/…'`). C'est un vestige de la couche fantôme `infrastructure/` — le supprimer et pointer les imports sur `lib/branding/` (cohérent avec la cible §3.4)

### Ce qu'il reste à ajouter pour une personnalisation complète

Ton système couvre couleurs, polices, logo et splash. Pour une expérience client vraiment complète, il manque :

- [ ] **Favicon et titre d'onglet** par tenant — aujourd'hui l'onglet du navigateur affiche la marque plateforme
- [ ] **Manifeste PWA dynamique** — nom, icône et couleur de thème à l'installation sur mobile. Sans ça, l'app installée porte ton nom, pas celui du client
- [ ] **Marque sur les documents imprimés** — le ticket ESC/POS et les PDF (facture, contrat de privatisation) doivent porter le logo du tenant
- [ ] **Emails transactionnels** — confirmation de réservation, facture : à la charte du client
- [ ] **Mode sombre de la charte custom** — `globals.css` gère `[data-theme]`, mais une couleur primaire choisie pour le clair peut être illisible en sombre. Prévoir soit une variante, soit un ajustement automatique de luminosité

> 💡 Ces cinq points sont ce qui sépare « l'app est aux couleurs du client » de « l'app **est** celle du client ». Aucun n'est difficile — ce sont des points d'application oubliés, pas des fonctionnalités manquantes.

### ✅ Critère de sortie Phase 6
```
sentrux max_cycles          : 0   (StatCard hors cycle, motif d'override corrigé)
Aggregation roots           : non flagués par le gate
Hex en dur dans modules/    : 97 → 0
Décision i18n               : tranchée et écrite
SystemTenantRegistry        : couvert par des tests (isWritable en tête)
EventBus                    : appelle isWritable() canonique
custom                      : doté de scopedTokens
CONTRIBUTING-UI.md          : livré, avec les 8 URLs de recette
```

---

# 📌 Tableau de bord d'exécution

> 📖 **Ordre de lecture** : les Phases 0 à 6 précèdent ce tableau. La **Phase 7** (interopérabilité + facturation électronique) le suit, ainsi que la **matrice chronologique** qui vérifie l'enchaînement de l'ensemble.

| Phase | Objet | Durée | Risque | Sortie mesurable |
|-------|-------|-------|--------|------------------|
| **0** | Colmatage **+ 🚨 fix sécurité** | ~4 h | 🟡 moyen | TSC 0 · 786/786 · 41 actions fail-closed |
| **1** | Hygiène auto | ~2 h | 🟢 faible | ESLint 502 → 364 |
| **1 bis** | **Filet exécutable** | ~2 j | 🟢 nul | 7 invariants · 7 règles Semgrep · doc générée |
| **2** | Blindage types | ~2 j | 🟡 moyen | 0 `any` · 13/13 actions Zod |
| **3** | Frontières arch. | ~3 j | 🟡 moyen | 0 violation barrel · 0 cycle |
| **4** | Fragmentation UI | ~2 j | 🟢 faible | 0 fichier > 400 l. · cc < 20 |
| **5** | Monnaie | ~4 j | 🔴 élevé | 0 `InCents` |
| **6** | Prép. refonte UI + i18n ancré | ~3 j | 🟢 faible | 0 hex · 0 cycle · `t()` câblé |
| **7** | Interop inter-tenant + e-facture | ~8 j | 🔴 élevé | Exchange + PDP connectée |

**Total estimé : ~23 jours-homme.**

> 🚨 **La RÉCEPTION de factures électroniques (7.3) n'obéit pas à cet ordre — calendrier VÉRIFIÉ le 10/08/2026.**
> **Obligation au 1ᵉʳ septembre 2026 pour toutes les entreprises assujetties TVA, soit ≈ 3 semaines.**
> Elle passe **avant tout le reste de ce document**. La dette technique attend, la loi non.
> Bonne nouvelle : seule la **réception** est due en septembre. L'émission et l'e-reporting de tes clients TPE/PME ont jusqu'à **septembre 2027**.

## 🎨 Chemin court « je veux lancer la refonte UI maintenant »

La refonte n'a pas besoin d'attendre les 14 jours. Le sous-ensemble strictement bloquant est court :

```
0.5     Aligner le gate sur la charte             ~15 min   🔴 bloquant
3.3     Corriger le motif d'override (StatCard)   ~4 h      🔴 bloquant
6.0bis  Trancher le périmètre visuel              décision  🔴 bloquant  ← surface fantôme
6.4.1   Tests SystemTenantRegistry                ~2 h      🔴 bloquant
6.1     Nettoyer les 97 hex en dur                ~3 h      🟠 fortement conseillé
6.4.3   Doter `custom` de scopedTokens            ~1 h      🟠 gabarit sur-mesure
6.2     Trancher l'i18n                           décision  🟠 avant, sinon double passe
6.3     CONTRIBUTING-UI.md + URLs de recette      ~1 h      🟢
```

**≈ 1,5 journée** de technique + **2 décisions produit** (périmètre visuel, i18n), et le graphiste peut démarrer sans rien casser pendant que les Phases 2 et 5 avancent en parallèle sur le back-end.

> 🔴 **Les deux décisions produit sont le vrai chemin critique, pas la technique.** 6.0 bis (quelles verticales sont dans le périmètre) et 6.2 (i18n avant ou après) ne se délèguent pas — et se tromper coûte une seconde passe complète sur chaque composant.

> 🔴 **Le plus important de cette liste est 3.3.** Ce n'est pas un nettoyage de dette : sous le motif actuel, **chaque composant que le graphiste rendra surchargeable ajoutera un cycle**. Corriger après la refonte coûtera N fois le prix de le corriger avant.

---

# 🚫 Interdits absolus

Repris et complétés depuis les conventions du projet :

1. ❌ **Ne pas supprimer la DLQ / l'outbox** — 34 fichiers, sous-système résilient délibéré, renforcé par les 2 derniers commits EventBus
2. ❌ **Ne pas réécrire `SovereignGuard.freezeData`** — déjà optimisé V8, le `Proxy` a déjà été retiré
3. ❌ **Ne pas toucher aux 204 `unknown`** des adapters réseau / storage / outbox
4. ❌ **Jamais de `delete` ni d'`update`** sur `journalEntries`, `fiscalSeals`, `fiscalLedger` (NF525)
5. ❌ **Jamais de nouveau champ `*InCents`** — y compris dans un **schéma Zod** écrit en Phase 2. Un schéma est une source de vérité : y inscrire `totalInCents` propage la dette à tout ce qui l'infère
6. ❌ **Jamais `as Microunits`** — passer par `toMicrounits()`
7. ❌ **Ne pas élargir le barrel `ops`** avec `FloorPlanEditor` (Konva ~1,2 Mo) — `next/dynamic` obligatoire
8. ❌ **Ne pas mélanger auto-fix de masse et corrections manuelles** dans un même commit

---

# 🔗 PHASE 7 — Interopérabilité inter-tenant (Nexus Exchange)

> **Objectif** : permettre à deux clients de la plateforme d'échanger — un restaurateur consulte le catalogue et le stock de son fournisseur de vin, les factures circulent entre les deux — **sans jamais fusionner leurs données**.
> **Durée** : ~8 j · **Risque** : 🔴 élevé (touche la souveraineté) · **Prérequis** : Phases 0, 2 et 5 « finance »

## 7.0 — Le principe : une API, pas une porte dérobée

`SovereignGuard` **interdit par conception** l'accès cross-tenant. C'est la garantie qui fait que même toi, super-admin, ne lis pas les données de tes clients. **Cette barrière ne doit pas être percée.**

Le bon modèle n'est pas « ouvrir un accès » mais **publier un contrat** :

```
Fournisseur de vin (tenant A)          Restaurateur (tenant B)
  │                                       │
  │  décide CE QU'IL PUBLIE :             │
  │   • catalogue (réf, millésime, prix)  │
  │   • disponibilité (en stock / rupture)│
  │   ✗ jamais : marges, autres clients,  │
  │     stock exact, données RH           │
  ▼                                       │
┌─────────────────────────────────────┐   │
│   NEXUS EXCHANGE (nouveau)          │◄──┘  lit UNIQUEMENT le publié
│   • grants explicites A → B         │
│   • projections en lecture seule    │
│   • journal d'accès horodaté        │
└─────────────────────────────────────┘
```

**Trois invariants non négociables** :
1. **Aucune lecture directe** du store de A par B. B lit une **projection** que A a explicitement publiée
2. **Consentement explicite et révocable** — A autorise B, champ par champ, et peut couper à tout moment
3. **Traçabilité** — chaque accès inter-tenant est journalisé (RGPD + preuve en cas de litige commercial)

## 7.1 — Ce qui existe déjà

| Élément | État |
|---------|------|
| `logistics/approvisionnement/edi-b2b/` | 📁 **scaffold vide** — l'emplacement prévu, comme conçu |
| `logistics/connectors/suppliers/` | présent — connecteurs fournisseurs externes |
| `SovereignGuard` | barrière cross-tenant active — **c'est le socle, pas l'obstacle** |
| `NexusEventBus` | 165 handlers, DLQ, outbox — **le transport existe déjà** |
| « B2B » dans le code | ⚠️ désigne **tes clients qui s'abonnent**, pas deux clients qui se parlent. Ne pas confondre |

**Rien à démolir.** Tout est à ajouter dans un emplacement déjà prévu.

## 7.2 — Construire le Nexus Exchange

- [ ] **Schéma de grant** — `ExchangeGrantSchema` : `{ fromTenantId, toTenantId, scopes: ['catalog:read', 'stock:availability', 'invoice:receive'], expiresAt, revokedAt }`
- [ ] **Collection `exchangeGrants`** sous le tenant **émetteur** (A garde la maîtrise), à ajouter aux collections protégées de `SovereignGuard`
- [ ] **Projections publiées** — A écrit dans `tenants/A/published/catalog`. Une projection ne contient **que** des champs whitelistés : jamais de coût d'achat, jamais de marge
- [ ] **Résolveur d'accès** `ExchangeResolver.read(callerTenantId, targetTenantId, scope)` — vérifie le grant, lit la projection, journalise. **Seul point autorisé à traverser les tenants**, et il ne lit que `published/`
- [ ] **Journal d'accès** — collection append-only `exchangeAccessLog`
- [ ] **Étendre `SovereignGuard`** : autoriser la lecture cross-tenant **uniquement** sur le chemin `tenants/*/published/*` **et** via `ExchangeResolver`. Tout le reste reste interdit
- [ ] **UI côté fournisseur** — écran « Partenaires » : qui a accès, à quoi, depuis quand, bouton révoquer
- [ ] **UI côté acheteur** — catalogue fournisseur intégré dans le module commande

> 🔴 **Test de sécurité obligatoire** : un tenant sans grant qui appelle `ExchangeResolver` → refus. Un tenant avec grant `catalog:read` qui tente `stock:exact` → refus. À écrire **avant** la fonctionnalité.

## 7.3 bis — 📐 Taxonomie des 4 flux de facturation

**Le piège de ce chantier : ce n'est pas un flux, c'en est quatre.** Chacun a une obligation légale différente, un canal différent et un format différent. Les confondre, c'est se retrouver non conforme sur trois d'entre eux.

```
                         ┌─────────────────────────────┐
                         │   Qui reçoit le document ?  │
                         └──────────────┬──────────────┘
                     ┌─────── PRO ──────┴───── PARTICULIER ───────┐
                     ▼                                            ▼
        ┌────────────────────────┐                   ┌────────────────────────┐
        │   e-INVOICING          │                   │   e-REPORTING          │
        │   facture structurée   │                   │   données de           │
        │   via PDP              │                   │   transaction          │
        └───────────┬────────────┘                   └───────────┬────────────┘
          ┌─────────┴─────────┐                                  │
          ▼                   ▼                                  ▼
     ① DANS ton réseau   ② HORS réseau                    ③ B2C pur
     (tenant → tenant)   (tenant → externe)               (couvert restaurant)
          │                   │                                  │
          │                   │                        ④ ⚠️ bascule B2C → B2B
          │                   │                        (le convive est un pro
          │                   │                         et demande une facture)
          └───────────────────┴──────────────────────────────────┘
                      tous passent par une PDP
```

### ① B2B **dans** ton réseau — deux clients de la plateforme

*Exemple : le restaurateur commande son vin au fournisseur, tous deux tes clients.*

| Couche | Rôle | Où |
|--------|------|-----|
| **Métier** | catalogue, stock, commande | **Nexus Exchange** (7.2) |
| **Légale** | la facture elle-même | **PDP** — obligatoire |

> 🔴 **Le piège le plus coûteux du chantier.** Même entre deux tenants de *ta* plateforme, la facture doit **légalement transiter par une PDP**. Un échange direct tenant→tenant, aussi propre soit-il, **ne vaut pas facturation électronique**. L'Exchange transporte le *métier*, la PDP transporte le *document légal*. **Les deux, jamais l'un à la place de l'autre.**

- [ ] Émission : générer Factur-X → transmettre à la PDP → notifier le tenant destinataire via l'Exchange
- [ ] Réception : la PDP dépose chez le destinataire → rapprochement automatique avec la commande de l'Exchange
- [ ] **Avantage unique de ta position** : les deux côtés étant sur ta plateforme, le rapprochement facture ↔ commande ↔ livraison est automatisable à 100 %. C'est un argument commercial fort — mais il ne dispense **jamais** du passage par la PDP

### ② B2B **hors** réseau — un client et un tiers externe

*Exemple : le restaurateur facture un traiteur, ou reçoit la facture d'un fournisseur non client.*

- [ ] **Émission** vers n'importe quel assujetti via la PDP (annuaire officiel des destinataires)
- [ ] **Réception** de n'importe quel émetteur — 🔴 **l'obligation qui touche 100 % de tes clients**, y compris les plus petits
- [ ] Ingestion : Factur-X / UBL / CII → écriture comptable + rapprochement bancaire
- [ ] Gestion des **statuts de cycle de vie** (déposée, rejetée, encaissée) — obligatoire, souvent oublié

### ③ B2C pur — le quotidien du restaurant

*Exemple : 180 couverts payés par des particuliers.*

**Ce n'est pas de la facturation électronique, c'est de l'e-reporting** : transmission périodique des **données de transaction et d'encaissement**, pas de facture unitaire.

- [ ] Agrégateur e-reporting branché sur les tickets Z existants
- [ ] Périodicité selon le régime TVA du tenant
- [ ] Transmission via PDP
- [ ] **Ton atout** : la chaîne NF525 (scellement, hash chaîné, append-only) fournit déjà des données **inaltérables et horodatées**. C'est précisément ce que l'e-reporting exige. Il manque le *transport*, pas l'intégrité

### ④ ⚠️ La bascule B2C → B2B — **le cas des 150 €**

*Exemple : un commercial déjeune avec un client, note à 210 €, il demande une facture pour récupérer la TVA.*

**C'est le cas le plus subtil, et celui que le code ne sait pas traiter aujourd'hui.**

Le même repas change de nature juridique selon l'identité du convive :

| Situation | Document | Canal |
|-----------|----------|-------|
| Convive particulier | ticket / note | ③ e-reporting |
| Convive professionnel, **≤ 150 € HT** | **facture simplifiée** — mentions réduites, identité acheteur non exigée | ① ou ② e-invoicing |
| Convive professionnel, **> 150 € HT** | **facture complète** — identité acheteur **obligatoire** (raison sociale, adresse, SIREN/TVA) | ① ou ② e-invoicing |

> ⚠️ **Sur le seuil de 150 €.** Il s'agit du régime de la **facture simplifiée** (150 € **HT**), issu de la directive TVA et transposé à l'annexe II du CGI. Au-delà, toutes les mentions obligatoires s'appliquent, dont l'identification de l'acheteur. **Fais confirmer par ton expert-comptable** l'application exacte au secteur de la restauration et l'articulation avec la réforme — mes informations s'arrêtent à mai 2026 et ce point a des subtilités sectorielles.

**Ce que ça impose au POS** — et rien de tout cela n'existe :

- [ ] Au moment de l'encaissement : bouton **« Facture entreprise »**
- [ ] Saisie ou rappel de l'identité acheteur : raison sociale, adresse, **SIREN/TVA intracommunautaire**
- [ ] **Bascule automatique du type de document au franchissement de 150 € HT** — simplifiée en dessous, complète au-dessus
- [ ] Le ticket **sort du flux e-reporting** et entre dans le flux e-invoicing → PDP
- [ ] Refus de finaliser une facture > 150 € HT sans identité acheteur complète (garde-fou de conformité)

### 🔍 Ce que le code sait déjà faire — et ce qu'il ignore

| Brique | État | Fichier |
|--------|------|---------|
| Structure acheteur Factur-X | 🟢 **existe** — `FacturXBuyer` + `<ram:BuyerTradeParty>` | `FacturXGenerator.ts:28,110` |
| Distinction particulier / entreprise | 🟢 **existe** — `type: 'individual' \| 'company'` | `commerce.types.ts:34` |
| Chaîne NF525 inaltérable | 🟢 solide | `FiscalSealer`, `FiscalAdapter` |
| SIRET sur le ticket | ⚠️ c'est celui du **commerçant** (NF525), **pas de l'acheteur** | `EscPosBuilder.ts:127` |
| Champ SIREN/TVA sur la fiche client | 🔴 **absent** | `commerce.types.ts` |
| Seuil 150 € HT | 🔴 **absent** — 0 occurrence | — |
| Pont ticket POS → facture | 🔴 **absent** — 0 occurrence | — |
| Mentions légales sur la facture | 🔴 `InvoiceEngine` = 81 lignes, aucune mention | `InvoiceEngine.ts` |
| e-reporting | 🔴 **absent** — 0 occurrence | — |
| Connexion PDP | 🔴 **absente** | — |

**Lecture** : les fondations sont là (Factur-X, NF525, typage client). Ce qui manque est **le pont entre le POS et la facturation**, et **le transport vers l'extérieur**.

### 📋 Ordre d'implémentation recommandé

```
1. Vérifier le calendrier réglementaire applicable        ← AVANT TOUT
2. RÉCEPTION (② hors réseau)   → touche 100 % des clients, échéance la plus proche
3. Champ SIREN/TVA sur la fiche client + mentions légales InvoiceEngine
4. Pont ticket → facture + seuil 150 € HT (④)             → débloque la restauration
5. ÉMISSION via PDP (① et ②)
6. e-reporting B2C (③)                                    → le plus gros volume
7. Nexus Exchange (7.2)                                   → la couche métier, en dernier
```

> 💡 **Pourquoi la réception d'abord** : c'est l'obligation qui s'applique à *tous* tes clients quelle que soit leur taille, et un client qui ne peut pas recevoir une facture de son fournisseur est bloqué dans son activité — pas seulement non conforme.

---

## 7.3 — 🚨 Facturation électronique : le point le plus urgent du plan

**La circulation des factures entre plateformes n'est pas qu'une feature : c'est une obligation réglementaire française avec une échéance proche.**

### État réel du code (audité)

| Élément | Fichier | Verdict |
|---------|---------|---------|
| Générateur Factur-X | `finance/comptabilite/documents/FacturXGenerator.ts` — 166 l. | 🟠 **profil MINIMUM** uniquement, XML seul |
| Bouton de téléchargement | `finance/components/FacturXDownloadButton.tsx` | 🟢 présent |
| Chorus Pro (secteur public B2G) | `shared/components/settings/ChorusProSettings.tsx` — 167 l. | 🟢 présent |
| Transmission | `finance/fiscalite/tax/FiscalTransmitter.ts` | 🔴 `transmitToEDIProvider(_xmlContent)` — **paramètre inutilisé = stub** |
| Connexion à une PDP | — | 🔴 **inexistante** |
| **Réception** de factures entrantes | — | 🔴 **inexistante** |

### Les manques structurants

1. **Aucune connexion PDP.** La réforme impose de passer par une **Plateforme de Dématérialisation Partenaire** immatriculée. Le code génère un XML mais **ne sait l'envoyer nulle part**.
2. **Aucune capacité de réception.** L'obligation de *recevoir* des factures électroniques s'applique à **toutes** les entreprises assujetties, y compris les plus petites — donc à tous tes clients.
3. **Profil MINIMUM seul.** Suffisant pour certains flux, insuffisant dès qu'il faut le détail des lignes. À confirmer selon les flux visés.
4. **e-reporting non traité** — la transmission des données de transaction et d'encaissement (notamment B2C, ce qui est le quotidien d'un restaurant) n'apparaît nulle part dans le code.

### 📅 Calendrier officiel — VÉRIFIÉ le 10 août 2026

| Échéance | Obligation | Qui | Reste |
|----------|-----------|-----|-------|
| **1ᵉʳ sept. 2026** | 🔴 **RÉCEPTION** de factures électroniques | **TOUTES** les entreprises assujetties TVA | **≈ 3 SEMAINES** |
| **1ᵉʳ sept. 2026** | ÉMISSION | Grandes entreprises + ETI | ≈ 3 semaines |
| **1ᵉʳ sept. 2027** | ÉMISSION | TPE / PME / micro | ~13 mois |
| **1ᵉʳ sept. 2027** | **e-REPORTING** (données B2C) | TPE / PME | ~13 mois |

> ⚠️ **Changement de terminologie** : depuis juillet 2025, on ne dit plus « PDP » mais **PA — Plateforme Agréée**. **138 PA** étaient immatriculées en juin 2026. Ce plan utilise désormais « PA ». Mets à jour ton vocabulaire produit et commercial.

**Ce que ça signifie pour tes clients restaurateurs (TPE/PME)** :
- **Septembre 2026** → doivent pouvoir **recevoir**. C'est tout, mais c'est obligatoire et c'est dans 3 semaines
- **Septembre 2027** → émission B2B + e-reporting B2C

> 🎯 **Conclusion opérationnelle : la RÉCEPTION est le seul chantier réellement urgent.** L'émission et l'e-reporting ont 13 mois devant eux. Concentre l'effort de septembre sur la capacité à recevoir — c'est aussi le plus simple des trois.

### Plan d'action réordonné selon le calendrier réel

- [ ] **🔴 SPRINT SEPTEMBRE — RÉCEPTION uniquement** — détail opérationnel :

  **J1-J2 — Choix de la PA**
  - [ ] Partir de la liste officielle DGFiP (impots.gouv.fr), pas d'un comparatif commercial
  - [ ] Filtrer sur les critères 1, 2, 3 et 5 de la section **7.5** (API publique · REST+OAuth2+webhooks · sandbox · **modèle multi-tenant éditeur**)
  - [ ] Ouvrir un compte sandbox chez 2 candidats

  **J3-J5 — Interface d'abord, connecteur ensuite**
  - [ ] Créer `src/modules/finance/connectors/einvoicing/IEInvoicingProvider.ts` :
    ```ts
    export interface IEInvoicingProvider {
      receive(payload: unknown): Promise<InboundInvoice>;   // parse + normalise
      getStatus(invoiceId: string): Promise<InvoiceLifecycleStatus>;
      // send() viendra en 2027 — ne PAS l'implémenter maintenant
    }
    ```
  - [ ] `MockProvider.ts` **en premier** — les tenants `_demo_*` ne doivent émettre aucun appel externe
  - [ ] `<PA>Provider.ts` ensuite

  **J6-J8 — Ingestion**
  - [ ] Route webhook `src/app/api/einvoicing/inbound/route.ts`
    > 🔴 Vérifier la **signature** du webhook (motif déjà en place dans `lib/server/webhookVerify.ts`). Une route d'ingestion non signée accepte n'importe quelle facture forgée.
  - [ ] Parser Factur-X (XML embarqué dans PDF/A-3), UBL et CII → un modèle interne unique
  - [ ] Schéma Zod `InboundInvoiceSchema` — **montants en microunits** dès l'entrée
  - [ ] Écriture dans `tenants/{id}/supplier-invoices/{id}`

  **J9-J10 — Cycle de vie et UI**
  - [ ] Statuts obligatoires : `reçue` → `approuvée` | `rejetée` → `payée`. Ce n'est pas optionnel : l'émetteur attend le retour de statut
  - [ ] Écran « Factures reçues » avec action approuver / rejeter (motif de rejet obligatoire)
  - [ ] Rapprochement avec les `receptionLogs` HACCP existants

  **Vérification de fin de sprint**
  ```bash
  # sandbox PA → webhook → doit apparaître en base avec le bon montant
  npx vitest run src/__tests__/einvoicing/
  ```
  - [ ] Test : facture sandbox reçue → montant en microunits exact, statut `reçue`
  - [ ] Test : webhook non signé → **rejeté en 401**
  - [ ] Test : tenant `_demo_*` → `MockProvider` utilisé, **zéro appel réseau**

> 🔴 **Ne PAS implémenter l'émission dans ce sprint.** Elle est due en septembre **2027** pour tes clients TPE/PME. La tentation sera forte parce que `FacturXGenerator` existe déjà — résiste. Un sprint qui livre une réception fiable vaut mieux que deux moitiés.
- [ ] **🟠 D'ICI SEPT. 2027 — ÉMISSION**
  - [ ] Compléter `FacturXGenerator` (profil MINIMUM → BASIC si les flux l'exigent)
  - [ ] Remplacer le stub `transmitToEDIProvider(_xmlContent)`
  - [ ] Pont ticket → facture (voir **7.4**)
- [ ] **🟠 D'ICI SEPT. 2027 — e-REPORTING**
  - [ ] Agrégation quotidienne par taux de TVA → transmission PA
- [ ] **🟢 ENSUITE — Nexus Exchange** (7.2), la couche métier

### 🎁 Bonne nouvelle vérifiée sur l'e-reporting

L'e-reporting attend précisément : **les données d'encaissement agrégées quotidiennement, ventilées par taux de TVA**, issues d'une caisse NF525.

**Tu produis déjà exactement ça :**

| Attendu par la réforme | Ce que tu as | Fichier |
|------------------------|--------------|---------|
| Caisse NF525 certifiée | chaîne scellée SHA-256, append-only | `FiscalSealer`, `FinancialNexusBridge` |
| Agrégation quotidienne | clôture Z | `TicketZHandler.ts` |
| Ventilation par taux TVA | **`ticketZ.taxBreakdown`** | `TicketZHandler.ts:122` |
| Taux restauration | `dine_in: 0.10` · `takeaway: 0.055` · alcool `0.20` | `vatResolver.ts:13-21` |
| Structure `taxBaseByRate` | déjà typée | `fiscalite/tax/types.ts:8` |

**Il ne manque que le transport vers la PA.** Le calcul, la ventilation et l'inaltérabilité sont faits. C'est le chantier le moins coûteux des trois, malgré son apparence.

> 💡 **La bonne nouvelle** : ton socle NF525 (scellement, chaîne SHA-256, append-only) est exactement la fondation qu'exige cette réforme. Tu as déjà l'intégrité et la traçabilité. Il manque **le transport**, pas la conformité des données.

## 7.4 — Le pont ticket → facture (NF525-safe, split bills compris)

### 🔒 La contrainte qui gouverne tout

Ton flux actuel, vérifié dans `FinancialNexusBridge.processOrder()` :

```
Encaissement
  → generateSequentialReceiptNumber(tenantId)
  → sealDataAtomically()  → hash = SHA-256(snapshot + previousHash)
  → JournalEntry SET      → tenants/{id}/journalEntries/{entryId}
  → FiscalSeal            → chaîne fiscale
```

`journalEntries` et `fiscalSeals` sont dans les `IMMUTABLE_COLLECTIONS` du `SovereignGuard`. **Aucun update, aucun delete.**

> 🔴 **Règle d'or du pont** : une facture **ne modifie jamais** le ticket scellé. Elle est un **document nouveau qui le référence**. Si le convive demande sa facture 3 jours après, le ticket d'origine reste intact, bit pour bit — c'est ce qui rend la chaîne vérifiable en contrôle fiscal.

### Le modèle : append-only, jamais mutation

```
tenants/{id}/journalEntries/{entryId}        ← SCELLÉ, INTOUCHABLE
        │
        │ referencedBy (jamais l'inverse)
        ▼
tenants/{id}/invoices/{invoiceId}            ← NOUVEAU document
   { sourceEntryId, sourceSealHash,          ← ancrage cryptographique
     splitIndex?, buyer, lines, vatBreakdown }
```

- [ ] Créer la collection `invoices` — **append-only**, à ajouter aux `IMMUTABLE_COLLECTIONS`
- [ ] Champ `sourceSealHash` : copie du hash du sceau d'origine → prouve le lien sans toucher au ticket
- [ ] Une correction = **facture d'avoir** (nouveau document), jamais une modification
- [ ] Numérotation de facture **séquentielle et distincte** de celle des tickets — réutiliser le mécanisme de `generateSequentialReceiptNumber`

### ⚠️ Le cas des split bills — le plus délicat

**Fait vérifié** : un split produit **UNE seule écriture scellée** portant un tableau `partialPayments[]` (`FinancialNexusBridge.ts:56`), et émet `order.split` avec `payments[{ amount, guest, method }]`.

Donc si 4 convives partagent et qu'**un seul** veut une facture entreprise, il faut facturer **sa part uniquement**, alors que le sceau couvre le ticket entier.

**Les 3 modes n'ont pas la même difficulté** (`SplitMode = 'equal' | 'by-item' | 'custom'`) :

| Mode | Part | Calcul de la TVA | Difficulté |
|------|------|------------------|------------|
| `by-item` | lignes précises | ✅ **exacte** — chaque article porte son taux | 🟢 simple |
| `equal` | total ÷ N | ⚠️ **prorata** sur chaque taux présent | 🟠 moyen |
| `custom` | montant libre | 🔴 **prorata** sur des bases hétérogènes | 🔴 délicat |

> 🔴 **Le piège TVA de la restauration.** Un ticket mélange couramment **10 %** (nourriture sur place), **5,5 %** (vente à emporter) et **20 %** (alcool). Quand un convive paie « 50 € » sur une note de 200 € en mode `custom`, sa facture doit ventiler ces 50 € **au prorata des bases par taux** — sinon la TVA déductible est fausse, et la facture est juridiquement invalide pour son entreprise.

**Règle d'implémentation** :

```
Pour chaque taux t présent dans le ticket :
    part_HT(t)  = base_HT(t)  × (montant_payé / total_TTC_ticket)
    part_TVA(t) = base_TVA(t) × (montant_payé / total_TTC_ticket)

Invariant : Σ(toutes les factures d'un ticket) ≤ total scellé, à l'arrondi près
```

- [ ] Implémenter le prorata par taux dans `SplitBillDomainService` — utiliser `SovereignMath` (déjà employé, gère les microunits)
- [ ] **Garde-fou d'invariant** : refuser l'émission si la somme des factures d'un ticket dépasse le total scellé
- [ ] Stocker `splitIndex` sur la facture → traçabilité vers `partialPayments[i]`
- [ ] **Gérer le dernier centime** : `SplitBillDomainService` fait déjà la répartition du reste (`i < remainderNumber ? basePlusOne : base`). Appliquer la même logique à la ventilation TVA
- [ ] En mode `by-item`, **ne pas proratiser** — calculer la TVA sur les lignes réelles, c'est exact et plus simple

### Le déclencheur au POS — bascule à 150 € HT

```
Encaissement
   │
   ├─ pas de demande de facture ─────────► ticket → e-reporting (flux ③)
   │
   └─ bouton « Facture entreprise »
         │
         ├─ part ≤ 150 € HT ──► facture SIMPLIFIÉE  (identité acheteur non exigée)
         │
         └─ part > 150 € HT ──► facture COMPLÈTE
                                 🔒 BLOQUER tant que raison sociale
                                    + adresse + SIREN/TVA sont absents
```

- [ ] Bouton « Facture entreprise » dans `PaymentDialog` et `SplitBillDialog`
- [ ] Formulaire acheteur avec **rappel depuis la fiche client** si déjà connu
- [ ] Seuil `150 € HT` en constante nommée (`INVOICE_SIMPLIFIED_THRESHOLD_MICROUNITS = 150_000_000`), **jamais en dur dans un composant**
- [ ] **Refus de finalisation** au-delà du seuil sans identité complète — c'est le garde-fou qui protège ton client
- [ ] Le seuil s'applique à **la part facturée**, pas au total du ticket : sur une note de 400 € splitée en 4, chaque part de 100 € reste sous le seuil

### Sous le seuil : la mention manuscrite (opportunité produit)

Sous 150 € HT, le ticket suffit — **mais le client professionnel doit inscrire lui-même, à la main, le nom et l'adresse de son entreprise au dos du ticket** pour ouvrir droit à la déduction. Sans cette mention, sa dépense n'est pas déductible.

C'est une friction réelle, et une **différenciation facile** :

- [ ] Imprimer au dos du ticket un **encadré pré-tracé** « Société : ____ / Adresse : ____ » (ESC/POS le permet — `EscPosBuilder` existe déjà)
- [ ] Si le client est déjà connu comme `type: 'company'` : **pré-imprimer** raison sociale et adresse. Plus rien à écrire
- [ ] Option QR code sur le ticket → page web qui régénère un justificatif nominatif

> 💡 Aucune de ces trois options n'est obligatoire. Toutes réduisent une friction que **tous** tes clients restaurateurs subissent.

### 🔴 Pourboires — AUDIT TERMINÉ : encaissés puis perdus

> ✅ **Bonne nouvelle d'abord** : la **TVA est correcte**. Le pourboire n'entre pas dans la base taxable — c'est le traitement légalement juste. Je soupçonnais l'inverse, c'est vérifié et infondé.

**Mais le pourboire disparaît des livres.** Trace exacte du flux :

```
usePosPage.ts:90   handleTipConfirmed(tip) → setTipInMicrounits(tip) → handleCheckout()
usePos.ts:79       cartGrandTotal = cartTotal + tipInMicrounits
pos/page.tsx:273   PaymentDialog total={cartGrandTotal}     ← le client PAIE cartTotal + pourboire
posOrderSubmit.ts:32  processOrder({ cartItems, ... })      ← ❌ le pourboire N'EST PAS transmis
                                                              aucun paramètre `tip` dans BridgePayload
```

**Conséquence** : le terminal encaisse `cartTotal + pourboire`, la chaîne fiscale scelle `cartTotal`. **L'écart n'est enregistré nulle part.**

| Impact | Gravité |
|--------|---------|
| Rapprochement bancaire : encaissement > écriture, écart inexpliqué **à chaque service** | 🔴 |
| NF525 : le montant réellement encaissé ≠ le montant scellé | 🔴 |
| Personnel : les pourboires ne sont **jamais** répartis | 🔴 |
| Social / paie : traitement des pourboires par carte non tracé | 🟠 |

### ✅ L'infrastructure existe déjà — c'est un défaut de câblage, pas de conception

| Brique | État |
|--------|------|
| Compte PCG `708500 — Pourboires collectés` | 🟢 **existe** — `pcg-accounts.ts:71` |
| `TipDistributedHandler` — répartit entre le staff, écrit dans `payroll/tips/` | 🟢 **existe** |
| Événement `hr.tip_distributed` | 🟢 défini |
| Émetteur de l'événement | 🔴 **uniquement** `RestaurantHumanAdapter.distributeTips()` — **jamais appelé par le POS** |
| `tip` dans `BridgePayload` | 🔴 **absent** |

**Il manque deux fils**, pas un module.

- [ ] Ajouter `tipInMicrounits?: number` à `BridgePayload` et le transmettre depuis `posOrderSubmit.ts:32`
- [ ] Dans `FinancialNexusBridge` : ligne comptable dédiée sur le **708500**, **hors base TVA** — ne jamais l'intégrer à `totalTTCInMicrounits`
- [ ] Vérifier que `ticketZ.taxBreakdown` **exclut** le pourboire (il l'exclut aujourd'hui de fait ; le garantir par test après le câblage)
- [ ] Émettre `hr.tip_distributed` depuis le POS à l'encaissement → `TipDistributedHandler` prend le relais
- [ ] Sur une facture > 150 € : pourboire en pied de document, **hors TVA**
- [ ] Sur un split : le pourboire suit la part du payeur qui l'a donné, pas le prorata général
- [ ] **Test de non-régression** : ticket 100 € + 10 € de pourboire → TVA sur 100 € · encaissement 110 € · ligne 708500 de 10 € · `Σ écritures = Σ encaissé`
- [ ] **Écrire d'abord l'invariant fast-check** `Σ écritures = Σ encaissé` (1bis.1) : il doit **échouer** sur le code actuel, puis passer après correction. C'est la preuve que le filet fonctionne — et il gardera cette classe de bug pour toujours

> 🔴 **À traiter avant la facturation.** Tant que l'encaissement réel diffère du scellé, l'e-reporting (flux ③) transmettra des données d'encaissement fausses — et c'est précisément ce que la réforme contrôle.

### Les champs manquants à créer

| À ajouter | Où | Pourquoi |
|-----------|-----|----------|
| `siret` · `vatNumber` · `legalName` · `billingAddress` | contrat client (`commerce.types.ts` — a déjà `type: 'individual' \| 'company'`) | mentions obligatoires > 150 € HT |
| Mentions légales complètes | `InvoiceEngine` (81 l., aucune aujourd'hui) | conformité de la facture |
| `sourceEntryId` · `sourceSealHash` · `splitIndex` | schéma `Invoice` | ancrage NF525 |
| `subjectId` (jeton PiiVault) | schéma `Invoice` | ⚠️ **voir 7.6** — sépare données d'entreprise et données personnelles |

- [ ] Écrire `InvoiceSchema` (Zod) — **en microunits**, conformément à la Phase 2
- [ ] Détail TVA obligatoire sur la facture : **10 %** nourriture et softs sur place · **5,5 %** à emporter · **20 %** alcool

### ✅ Critère de sortie 7.4
```
Ticket scellé          : jamais modifié — vérifié par test
Facture                : document append-only référençant sourceSealHash
Split by-item          : TVA exacte par ligne
Split equal / custom   : TVA proratisée par taux, invariant Σ ≤ total scellé
Seuil 150 € HT         : bascule automatique + blocage si identité incomplète
Test NF525             : tenter un update sur journalEntries → doit lever
```

## 7.7 — Les variantes de facturation du restaurateur (au-delà du ticket)

Le pont 7.4 couvre le repas individuel. **Un restaurateur émet et reçoit bien d'autres documents**, chacun avec ses règles.

### État de l'existant

| Document | Existant | Manque |
|----------|----------|--------|
| Devis événement | 🟢 `EventQuoteModal`, `QuoteEngine`, `quotes-service` | conversion devis → facture |
| Contrat de privatisation | 🟢 `PrivatisationContract.ts` — **acompte 30 % déjà calculé** (l. 85) | c'est un **PDF**, pas une facture structurée |
| Groupes | 🟢 `GroupFormModal`, `useGroups`, `groups.types.ts` | aucune facturation de groupe |
| Remboursement | 🟢 Stripe `refund()`, `RefundExtourneHandler` | 🔴 **aucun avoir structuré** |
| Facture d'acompte | 🔴 absente | — |
| Facture récurrente | 🔴 absente | — |

### 7.7.1 — Groupes et événements : le cycle complet

*Un séminaire réserve pour 40 couverts, verse 30 % d'acompte, solde le jour même.*

```
Devis  ──accepté──►  Facture d'ACOMPTE (30 %)  ──►  Prestation
                              │                          │
                              │                          ▼
                              └──── déduite de ────► Facture de SOLDE
```

- [ ] **Conversion devis → facture** : reprendre les lignes du devis, conserver `sourceQuoteId`
- [ ] **Facture d'acompte** — c'est une **vraie facture**, soumise à l'e-invoicing comme les autres
  > ⚠️ Sur une **prestation de services**, la TVA est exigible **à l'encaissement de l'acompte**, pas à la prestation. L'acompte doit donc porter sa propre ventilation TVA. Faire confirmer par ton expert-comptable la ventilation quand le menu mêle 10 % et 20 %
- [ ] **Facture de solde** : déduire explicitement l'acompte déjà facturé (ligne « Acompte du JJ/MM — facture n° X »), pour ne jamais taxer deux fois
- [ ] Transformer `PrivatisationContract` : garder le PDF contractuel, **et** produire la facture structurée Factur-X
- [ ] Rattacher les tickets POS du jour J à la facture de groupe — sinon le repas est encaissé deux fois (une fois en ticket, une fois en solde)

> 🔴 **Le piège du groupe** : le jour de l'événement, le POS enregistre normalement les consommations. Si la facture de groupe est émise en parallèle, la même prestation est comptée deux fois. Il faut un mode « table rattachée à un groupe » qui **n'encaisse pas** mais alimente le décompte du groupe.

### 7.7.2 — Avoirs (notes de crédit) — 🔴 manquant

Un ticket scellé ne se modifie pas. **Toute correction est un avoir** : erreur de facturation, geste commercial, annulation d'événement, remboursement partiel.

- [ ] Schéma `CreditNote` — même socle que `Invoice`, montants négatifs, `sourceInvoiceId` obligatoire
- [ ] Numérotation séquentielle **dédiée**, distincte des factures
- [ ] Un avoir est **aussi** soumis à l'e-invoicing — il transite par la PA comme la facture
- [ ] Brancher sur `RefundExtourneHandler` existant : un remboursement Stripe génère l'avoir
- [ ] Append-only : un avoir ne s'annule pas, il se contre-passe

### 7.7.3 — Réception côté restaurateur

Le restaurateur **reçoit** aussi : fournisseurs, énergie, loyer, assurances, maintenance.

- [ ] Ingestion PA → collection `supplier-invoices`
- [ ] **Rapprochement automatique** avec les `receptionLogs` HACCP existants — une facture fournisseur correspond à une livraison contrôlée. C'est un croisement que **peu de logiciels savent faire** et que ton architecture permet nativement
- [ ] Détection d'écart prix commandé / prix facturé → alerte
- [ ] Rapprochement bancaire avec le module `tresorerie/banking` existant

## 7.8 — Préparer la base pour les 8 verticales

**La facturation n'est pas identique d'une industrie à l'autre.** Concevoir le moteur uniquement pour le restaurant obligerait à tout refaire pour chaque nouvelle verticale — l'inverse de ta stratégie généraliste.

### Ce qui change d'une verticale à l'autre

| Verticale | Spécificité facturation | Piège |
|-----------|------------------------|-------|
| **restaurant** | 10 % sur place · 5,5 % à emporter · 20 % alcool · pourboires | ventilation multi-taux |
| **hotel** | nuitées + extras · **taxe de séjour** | 🔴 la taxe de séjour est **collectée pour la commune** — ni chiffre d'affaires, ni TVA. Ligne à part obligatoire |
| **clinic** | actes médicaux · tiers payant · mutuelle | 🔴 **actes médicaux exonérés de TVA** — la facture n'a pas la même structure. Faire confirmer le périmètre exact d'exonération |
| **garage** | devis → ordre de réparation → facture · pièces + main-d'œuvre · garantie | pièces (20 %) et MO (20 %) mais garantie = ligne à 0 € qui doit apparaître |
| **salon** | prestations + revente de produits | prestation et produit peuvent différer de taux |
| **bakery** | 5,5 % à emporter · 10 % sur place | **le même croissant change de taux** selon la consommation |
| **retail** | 20 % · retours · garanties | avoirs fréquents, gestion des retours |
| **custom** | inconnu par définition | doit rester paramétrable |

### L'architecture à poser dès maintenant

Étendre le motif d'adapters par verticale **déjà en place** (`RestaurantFinanceAdapter` existe) :

```
modules/finance/comptabilite/invoicing/
├── InvoiceEngine.ts              ← socle commun : numérotation, sceau, PA, avoirs
├── IVerticalInvoicingAdapter.ts  ← contrat par verticale
└── verticals/
    ├── RestaurantInvoicingAdapter.ts   pourboires, multi-taux, groupes
    ├── HotelInvoicingAdapter.ts        taxe de séjour hors CA
    ├── ClinicInvoicingAdapter.ts       exonération TVA, tiers payant
    └── …
```

**Ce que porte le socle commun** (identique partout) : numérotation séquentielle, ancrage `sourceSealHash`, mentions légales, seuil 150 € HT, génération Factur-X, transmission PA, avoirs, `subjectId` PiiVault.

**Ce que porte l'adapter** (spécifique) : résolution des taux de TVA, lignes hors chiffre d'affaires (taxe de séjour), exonérations, libellés métier.

- [ ] Écrire `IVerticalInvoicingAdapter` **avant** le premier connecteur PA — sinon le restaurant sera câblé en dur dans le socle
- [ ] Implémenter `RestaurantInvoicingAdapter` en premier (seul métier réellement rempli)
- [ ] Les 7 autres : **stubs qui héritent du socle**, cohérent avec ta stratégie de squelette
- [ ] `vatResolver.ts` gère déjà `dine_in` / `takeaway` par variante — **c'est le bon point d'extension**, le généraliser plutôt que le dupliquer

> 💡 **Le principe qui protège l'avenir** : aucune règle propre au restaurant (pourboire, seuil 150 €, taux 10 %) ne doit vivre dans `InvoiceEngine`. Tout ce qui est sectoriel vit dans un adapter. C'est ce qui permettra d'ouvrir une verticale sans rouvrir le moteur.

## 7.6 — 🔴 RGPD × NF525 : le conflit à résoudre AVANT d'écrire la facture

### La collision, détectée dans le code

`ErasureService.ts:6-12` liste les collections qu'il anonymise sur demande d'effacement :

```ts
const COLLECTIONS_WITH_SUBJECT_REF = [
    'orders', 'reservations', 'invoices', 'quotes', 'customers',
] as const;
```

Il y fait un `Nexus.adapter.set()` pour remplacer `customerName` par `[EFFACÉ]`.

> 🔴 **Collision frontale avec le 7.4.** Ce plan propose de rendre `invoices` **immuable** (append-only, ancrée NF525). Si on le fait tel quel : à la première demande d'effacement RGPD portant sur une facture, `SovereignGuard` **rejette l'écriture** et la demande échoue. Un client exerce un droit légal → l'application lève une exception. **Les deux obligations s'annulent.**

### La solution : le crypto-shredding — déjà à moitié construite

`PiiVault.ts` (130 lignes) chiffre les données personnelles avec une **clé dérivée par tenant + sujet**, stockées séparément dans `tenants/{id}/piiVault/{subjectId}`.

C'est exactement l'architecture qui résout le conflit :

```
tenants/{id}/invoices/{invoiceId}          ← IMMUABLE · conservée 10 ans
  ├─ legalName, siret, vatNumber, adresse  ← PERSONNE MORALE
  │    → pas une donnée personnelle, aucun droit à l'effacement
  ├─ lignes, TVA, sourceSealHash           ← données fiscales
  └─ subjectId: "sub_a1b2c3"               ← simple JETON, aucune PII

tenants/{id}/piiVault/sub_a1b2c3           ← CHIFFRÉ · EFFAÇABLE
  └─ nom du salarié, convives, téléphone   ← PERSONNE PHYSIQUE
```

**Effacement RGPD** = détruire l'entrée du coffre. La facture reste scellée et intacte, son jeton ne résout plus rien. **Intégrité fiscale préservée, droit à l'effacement satisfait.** Aucune des deux obligations n'est violée.

> 💡 **Le principe juridique qui débloque tout** : une **entreprise** est une personne morale — SIREN, raison sociale et adresse du siège **ne sont pas des données personnelles** et n'ouvrent aucun droit à l'effacement. Seules les données de **personnes physiques** (le salarié qui a payé, les convives invités) le sont. La facture peut donc rester immuable 10 ans, à condition que les PII n'y soient jamais écrites en clair.

- [ ] **Retirer `'invoices'` de `COLLECTIONS_WITH_SUBJECT_REF`** — remplacé par la destruction du coffre
- [ ] Ne **jamais** écrire de nom de personne physique dans le document `invoices` — uniquement le `subjectId`
- [ ] Faire de même pour `orders` si elles deviennent fiscalement scellées
- [ ] Test : effacement RGPD d'un sujet → coffre détruit, facture toujours vérifiable, chaîne de sceaux intacte
- [ ] Test : `ErasureService` ne doit **jamais** lever sur une collection immuable

### Les identités de convives — le piège de la note de frais

Le fisc exige l'identité des convives pour prouver le caractère professionnel du repas. Ces personnes ne sont **ni ton client, ni le client de ton client** — ce sont des tiers.

- [ ] Champ « convives » stocké **exclusivement dans le `PiiVault`**, jamais sur la facture
- [ ] 🔴 **Interdire techniquement** la réutilisation de ces noms par le CRM, le marketing ou le RAG. Base légale = obligation fiscale, **pas** prospection
- [ ] Vérifier que `PulseSanitizer` (qui filtre déjà `iban`, `cardNumber`, `bankAccount`) **exclut aussi les convives** de l'indexation RAG
- [ ] Test d'étanchéité : un nom de convive ne doit apparaître dans **aucune** campagne, segment ou réponse d'agent IA

### Le profil client créé au comptoir

Le restaurateur propose « je vous crée un compte » pour accélérer la prochaine facture > 150 €. Il associe alors une **personne physique** (le salarié) à une **personne morale** (son employeur).

- [ ] Information préalable **avant** collecte du mobile ou de l'email personnel du salarié
- [ ] Consentement **séparé** pour tout usage marketing — ne jamais le déduire de la création du compte
- [ ] Purge automatique si l'entreprise ne revient plus — brancher sur `retention_days` (déjà présent dans `compliance.schemas.ts:75`)
- [ ] Droit d'accès et de suppression exposé dans l'UI, pas seulement via une API admin

### Données bancaires — ✅ déjà conforme

**Vérifié, et c'est bon** :

| Contrôle | État |
|----------|------|
| Empreinte CB | `SetupIntent` Stripe + `stripePaymentMethodId` — **tokenisation PCI-DSS** ✅ |
| Numéro de carte en clair | **absent** du code ✅ |
| Scrub RAG | `PulseSanitizer:49` filtre `iban`, `bankAccount`, `cardNumber` ✅ |

- [ ] Vérifier que le ticket imprimé **masque** le PAN (format `**** **** **** 1234`)
- [ ] Ne jamais lier une empreinte CB **de façon permanente** au profil entreprise — la tokenisation Stripe est le seul stockage autorisé

### Le conflit des durées de conservation

| Régime | Exigence |
|--------|----------|
| **Fiscal** (Code de commerce) | conserver factures et justificatifs **10 ans** |
| **RGPD** | minimisation — les données personnelles superflues doivent être masquées ou anonymisées dès qu'elles ne servent plus |

Le crypto-shredding réconcilie les deux : le **document fiscal** vit 10 ans, les **données personnelles** vivent le temps utile.

- [ ] Politique de rétention **par catégorie de donnée**, pas par collection
- [ ] Purge programmée du `PiiVault` selon `retention_days`, **sans jamais toucher** aux collections fiscales
- [ ] Documenter le registre de traitement : finalité, base légale, durée — par catégorie
- [ ] Restreindre l'accès aux PII résiduelles au seul rôle d'audit

### 7.6.1 — 🔴 Câblage RGPD côté tenant : la catégorie « Registres & Conformité »

**Tout ce qui précède (crypto-shredding, cloisonnement des convives, purge par rétention) doit atterrir quelque part dans l'interface du restaurateur. Aujourd'hui, ça n'atterrit nulle part.**

### État audité de la surface RGPD

| Élément | État | Emplacement |
|---------|------|-------------|
| `ErasureService` | 🟠 **existe mais n'est appelé par personne** — code mort | `compliance/reglementaire/rgpd/` (2 fichiers) |
| Page politique de confidentialité | 🟢 existe | `app/(public)/legal/rgpd/page.tsx` |
| Route de purge | 🔴 **fleet uniquement** — `requireFleetAdmin` + `requireMccLevel` | `api/admin/fleet/rgpd-purge/` |
| Route RGPD côté **tenant** | 🔴 **inexistante** | — |
| Entrée RGPD dans la navigation | 🔴 **inexistante** — 0 occurrence dans `navConfig.ts` | — |
| Section RGPD dans `/registre` | 🔴 **absente** des 7 sections existantes | — |
| Méthode RGPD dans `RestaurantComplianceAdapter` | 🔴 absente (n'expose que HACCP, température, rappel) | — |

### 🚨 L'incohérence de souveraineté à corriger

Aujourd'hui, si un client d'un restaurant exerce son droit à l'effacement :
- le **restaurateur ne peut pas le traiter** — aucune interface, aucune route tenant
- seul le **super-admin fleet** peut exécuter la purge

**C'est inversé sur trois plans** :

| Plan | Problème |
|------|----------|
| **Juridique** | Le restaurateur est **responsable de traitement**, tu es **sous-traitant**. C'est au responsable d'exécuter les droits des personnes — pas à toi |
| **Souveraineté** | Ton modèle est explicite : tu n'accèdes jamais aux données de tes clients. Là, tu es **obligé** d'y toucher pour honorer une demande |
| **Opérationnel** | Chaque demande d'effacement remonte à toi. Ça ne passe pas à l'échelle sur 10 000 instances |

> 🎯 **La bonne cible** : `/registre` — écran « Registres & Conformité », badge **OBLIGATOIRE** dans `navConfig.ts:228`. Il porte déjà 7 registres légaux (DUERP, Incendie, Cerfa 13984, PMR, Prestataires, Interventions, Conformité sanitaire). **Le registre de traitement RGPD est exactement de la même nature** — un registre obligatoire tenu par l'exploitant.

### Le câblage à réaliser

- [ ] **1. `RGPDSection.tsx`** — 8ᵉ section du registre, à côté de `DUERPSection.tsx`
  ```
  src/modules/ops/engine/components/registre/RGPDSection.tsx
  ```
  L'ajouter au barrel `registre/index.ts` (les 7 autres y sont déjà)

- [ ] **2. Contenu de la section** — quatre blocs :
  - **Registre de traitement** : finalité · base légale · catégories de données · durée de conservation. Alimenté par les catégories définies en 7.6
  - **Demandes des personnes** : liste des demandes d'accès / rectification / effacement, avec leur statut et le délai légal restant
  - **Bouton d'effacement** → appelle `ErasureService` (aujourd'hui code mort) **côté tenant**
  - **Purges programmées** : ce que `retention_days` va supprimer, et quand

- [ ] **3. Route tenant** — `src/app/api/tenant/rgpd/erasure/route.ts`
  - Gardée par `requireSession(tenantId)` (voir **0.8**), **pas** par `requireFleetAdmin`
  - Appelle `ErasureService.eraseSubject(tenantId, subjectId, requestedBy)`
  - ⚠️ **Prérequis** : la correction 7.6 doit être faite avant — retirer `'invoices'` de `COLLECTIONS_WITH_SUBJECT_REF`, sinon l'appel lèvera sur les factures immuables

- [ ] **4. Entrée de navigation** dans `src/config/navConfig.ts`, catégorie `registre` :
  ```ts
  { label: "Données personnelles", key: "rgpd", href: "/registre?tab=rgpd",
    icon: ShieldCheck, category: "registre", badge: "OBLIGATOIRE",
    requiredCapability: "mod_registre" },
  ```

- [ ] **5. Adapter de verticale** — ajouter à `RestaurantComplianceAdapter` :
  ```ts
  emitDataSubjectRequest(payload: { tenantId: string; subjectId: string;
                                    type: 'access' | 'rectification' | 'erasure';
                                    requestedBy: string }) {
    NexusEventBus.emitDurable('rgpd.subject_request', { v: 1 as const, ...payload });
  }
  ```
  > 💡 **Conforme à la Décision 1 (§3.0)** : le métier RGPD vit dans `compliance/reglementaire/rgpd/`, la verticale n'expose qu'un adapter. Les 7 autres verticales hériteront du même registre sans une ligne de code — l'obligation est identique pour toutes les industries.

- [ ] **6. Handler d'audit** — journaliser chaque demande dans `auditService` (déjà appelé par `ErasureService`), avec horodatage et délai de réponse

- [ ] **7. Conserver la route fleet** `rgpd-purge` — mais **la restreindre à son vrai usage** : purge à la résiliation d'un tenant, pas droit des personnes

### Tests

- [ ] Un restaurateur authentifié peut déclencher un effacement **sur son propre tenant**
- [ ] Un restaurateur **ne peut pas** déclencher d'effacement sur un autre tenant → `ACCESS_DENIED`
- [ ] Après effacement : entrée `PiiVault` détruite, **facture toujours scellée et vérifiable** (invariant 7.6)
- [ ] La demande apparaît dans le journal d'audit avec sa date

> 📌 **Ce câblage transforme du code mort en conformité réelle.** `ErasureService` existe depuis un moment sans être appelé nulle part — le brancher sur `/registre` lui donne enfin un chemin d'exécution, et rend le restaurateur autonome sur ses obligations.

### RGPD sur les nouveaux flux (7.7 et 7.8)

Chaque variante de facturation introduit ses propres données personnelles. À traiter au moment de les écrire, pas après.

| Flux | Donnée personnelle | Traitement |
|------|-------------------|------------|
| **Groupes / événements** | liste des participants, contact organisateur | 🔴 la liste des participants est une **collection de données de tiers**. `PiiVault` obligatoire, jamais sur la facture. Purge après l'événement + délai de réclamation |
| **Devis** | contact prospect | base légale = mesures précontractuelles. Purge si le devis n'est pas converti |
| **Factures fournisseurs reçues** | nom du commercial, signataire de livraison | déjà présent dans `receptionLogs` — vérifier que la signature de réception (`DigitalSignature.tsx`) est bien couverte par une base légale et une durée |
| **Avoirs** | reprend les données de la facture d'origine | même règle : PII dans le coffre, jamais dans le document |
| **clinic** (futur) | 🔴 **données de santé** — catégorie particulière (art. 9 RGPD) | ⚠️ régime **beaucoup plus strict** : hébergement HDS certifié, consentement explicite, secret médical. Le module `reglementaire/medical-secrecy` existe (vide) — **ne pas ouvrir la verticale santé sans étude dédiée** |
| **hotel** (futur) | fiche de police étrangers, données de séjour | obligation légale spécifique, durée imposée |

- [ ] Étendre le registre de traitement à chaque nouveau flux **au moment de l'implémenter**
- [ ] 🔴 **Verticale clinic** : bloquer son ouverture commerciale tant que le volet données de santé n'a pas fait l'objet d'une analyse dédiée (AIPD probablement requise). C'est le seul point de ce plan où une verticale peut être **juridiquement interdite** avant traitement
- [ ] Généraliser la règle « PII → `PiiVault`, jamais dans un document fiscal » dans `IVerticalInvoicingAdapter` — pour qu'aucune verticale future ne puisse l'ignorer

### ✅ Critère de sortie 7.6
```
invoices              : immuable ET compatible effacement RGPD
PII                   : jamais en clair dans un document fiscal
ErasureService        : ne lève jamais sur collection immuable
Convives              : cloisonnés — 0 fuite vers CRM / marketing / RAG
Participants groupe   : dans le coffre, purgés après événement
Pourboires            : encaissés = comptabilisés, hors base TVA, vérifié par test
Rétention             : par catégorie de donnée, purge PiiVault automatisée
clinic                : verrouillée tant que données de santé non traitées
```

## 7.5 — Choisir la Plateforme Agréée (PA)

**138 PA immatriculées** (juin 2026), liste officielle publiée par la DGFiP sur impots.gouv.fr. **Toutes ne se valent pas pour un éditeur SaaS.**

### Critères de sélection — dans cet ordre

| # | Critère | Pourquoi c'est éliminatoire pour toi |
|---|---------|--------------------------------------|
| 1 | **API publique ouverte aux tiers** | Toutes les PA ont une interface d'interconnexion, mais **certaines la réservent à leurs propres clients**. Sans API ouverte, tu ne peux pas intégrer |
| 2 | **REST + OAuth2 + webhooks** | Le motif standard. Les webhooks sont indispensables pour les statuts de cycle de vie |
| 3 | **Sandbox de test** | Tu ne peux pas tester en production sur des factures réelles de clients |
| 4 | **OpenAPI / Swagger** | Génération de client typé, cohérent avec ton TypeScript strict |
| 5 | **Modèle multi-tenant** | 🔴 **Le critère spécifique à ton cas** : tu es éditeur avec N clients. La PA doit gérer une hiérarchie « éditeur → tenants » et non un compte par client |
| 6 | Tarification à l'usage | Ton coût doit suivre le volume de tes tenants |
| 7 | Rate limits | Un service du soir = pic de transactions |

> 🔴 **Le critère 5 est le vrai discriminant.** La plupart des PA sont conçues pour *une* entreprise. Toi tu en as N, avec isolation stricte (`SovereignGuard`). Demande explicitement : *« Proposez-vous un modèle éditeur/partenaire avec sous-comptes par tenant et une seule intégration API ? »* Certaines PA proposent du **marque blanche / API-first** conçu exactement pour ça.

### Démarche recommandée

- [ ] Partir de la **liste officielle DGFiP** sur impots.gouv.fr — pas d'un comparatif commercial
- [ ] Explorer le **portail développeur du PPF** : `api.portail-facturation.gouv.fr` (documentation, exemples de code, collections Postman) — utile pour comprendre les formats même si tu passes par une PA
- [ ] Présélectionner 3 PA sur les critères 1, 2, 3, 5
- [ ] Tester l'intégration en sandbox sur **un flux de réception** avant de t'engager
- [ ] Vérifier la clause de **réversibilité** — changer de PA doit rester possible

### Architecture d'intégration recommandée

**Ne câble pas une PA en dur.** Applique le motif déjà utilisé pour l'open banking (`refactor(banking): open banking 100% agnostique — plug-in provider pattern`) :

```
modules/finance/connectors/einvoicing/
├── IEInvoicingProvider.ts        ← interface : send, receive, getStatus
├── providers/
│   ├── <PA-choisie>Provider.ts
│   └── MockProvider.ts           ← pour tests et démo (_demo_* = zéro appel externe)
└── EInvoicingRegistry.ts         ← résolution par tenant
```

- [ ] Créer l'interface `IEInvoicingProvider` **avant** d'écrire le premier connecteur
- [ ] `MockProvider` obligatoire — les tenants `_demo_*` ne doivent émettre **aucun appel externe** (déjà une règle affichée dans `SystemTenantsTab`)
- [ ] Permettre une PA différente **par tenant** — certains de tes clients en auront déjà une

### ✅ Critère de sortie Phase 7
```
Grants inter-tenant     : schéma + collection + révocation
ExchangeResolver        : seul chemin cross-tenant, journalisé
SovereignGuard          : lecture autorisée UNIQUEMENT sur published/*
Tests de sécurité       : accès sans grant refusé, hors-scope refusé

Les 4 flux couverts :
  ① B2B réseau      : Exchange (métier) + PA (légal) — les DEUX
  ② B2B hors réseau : émission + réception via PA
  ③ B2C             : e-reporting branché sur les tickets Z
  ④ bascule 150 €   : POS capture l'identité acheteur, change de document

Conformité croisée :
  NF525 × facture   : append-only, sourceSealHash, jamais de mutation
  NF525 × RGPD      : crypto-shredding via PiiVault — les deux satisfaits
  Split × TVA       : prorata par taux, invariant Σ ≤ total scellé
  Pourboires        : isolés hors base TVA
```

> 🔴 **Le critère qui compte le plus** : qu'aucun des 4 flux ne soit traité *à la place* d'un autre. Un Exchange qui remplacerait la PDP sur le flux ①, ou un e-reporting qui couvrirait le flux ④, laisse le tenant non conforme sans que rien ne le signale.

---

# 🛰️ ALIGNEMENT MCC — ce que le plan ajoute doit être pilotable depuis la flotte

> **Vérification transverse.** Le MCC est ton plan de contrôle. Chaque capacité ajoutée par ce plan doit y être **supervisable**, sinon elle devient ingérable à 10 000 instances.

## Surface MCC existante — auditée

**11 onglets** : Fleet · SystemTenants · Compliance · EventBus · Lifecycle · PatchCenter · Plugins · Treasury · Intelligence · Tutorial · FleetSidebar
**~40 routes** `api/admin/fleet/*` : provisioning, billing, backup/restore, OTA, rollout, télémétrie, support IA, RGPD-purge, drain-outbox, users/role, impersonate, trusted-devices…

**Verdict : le socle est là et il est riche.** Le plan n'a pas besoin de le refonder — seulement de brancher les nouveautés.

## Ce qui est DÉJÀ couvert par le plan

| Capacité ajoutée | Surface MCC | État |
|------------------|-------------|------|
| 24 tenants système (§6.4) | `SystemTenantsTab` + 3 routes | ✅ existe |
| Reconstruction de projections (§6.5) | `rebuildProjection` déclenchable MCC | ✅ prévu |
| Purge RGPD à la résiliation (§7.6.1) | `rgpd-purge` conservée, périmètre restreint | ✅ prévu |
| Outbox / DLQ | `EventBusTab` + `drain-outbox` | ✅ existe |
| Charte graphique tenant (§6.6) | `injectBrandingVars` au provisioning | ✅ existe |

## 🔴 Ce que le plan ajoute SANS surface MCC — à corriger

- [ ] **1. Facturation électronique (§7.3, §7.5) — le manque le plus lourd**

  Aucun onglet ne supervise l'e-facturation. À 10 000 instances, il te faut :
  - Configuration de la **PA par tenant** (certains clients en auront déjà une)
  - **Tableau de bord des flux** : factures reçues / émises / rejetées par tenant
  - **Alerte sur échec de transmission** — une facture bloquée est un problème client immédiat
  - **État de conformité par tenant** : qui est prêt pour l'échéance, qui ne l'est pas
  > 🎯 Ce dernier point est un **outil commercial** autant que technique : savoir qui appeler avant le 1ᵉʳ septembre.

  → Créer un onglet **`EInvoicingTab.tsx`** + route `api/admin/fleet/einvoicing/status`

- [ ] **2. Nexus Exchange (§7.2) — supervision des liens inter-tenants**

  Quand deux clients s'échangent catalogues et factures, tu dois pouvoir constater qui est relié à qui — sans jamais lire le contenu.
  - Liste des **grants actifs** (émetteur → destinataire → scopes → date)
  - **Volumétrie** des échanges, pas leur contenu
  - Révocation d'urgence en cas d'incident
  > 🔒 **Règle de souveraineté** : le MCC voit **l'existence** du lien, jamais les données échangées. Afficher « tenant A partage son catalogue avec tenant B » — jamais le catalogue.

  → Onglet **`ExchangeTab.tsx`** + route `api/admin/fleet/exchange/grants`

- [ ] **3. RBAC multi-verticale (Décision 3, §3.0)**

  `users/role` existe, mais devra proposer les **libellés de la verticale du tenant** — pas « serveur » à un garagiste.
  → Adapter la route `api/admin/fleet/users/role` pour résoudre les libellés via le plugin de verticale

- [ ] **4. Santé de conformité par tenant — vue agrégée**

  `cron/nf525-audit` existe. Le plan ajoute e-facture, RGPD, RBAC serveur. Il te faut **une ligne par tenant** répondant à : NF525 ✅ · e-facture ✅ · RGPD ✅ · sauvegarde ✅
  → Étendre `ComplianceTab` avec cette matrice

- [ ] **5. Verticales : quelles sont réellement ouvertes ?**

  Le plan (§6.0 bis) acte que 7 verticales sur 8 sont des squelettes. Le MCC doit **refléter cette réalité** — sinon on provisionne un tenant `clinic` vers un produit vide.
  → Dans `SystemTenantsTab`, marquer chaque verticale : `PRODUCTION` · `BÊTA` · `SQUELETTE`
  → 🔴 **Bloquer le provisioning** d'un tenant sur une verticale `SQUELETTE`, et **verrouiller `clinic`** tant que le volet données de santé n'est pas traité (§7.6)

## Principe directeur

> **Toute capacité que ce plan ajoute au produit doit répondre à trois questions côté MCC :**
> **1.** Comment je vois que ça marche chez un client ? *(supervision)*
> **2.** Comment je vois que ça a cassé ? *(alerte)*
> **3.** Comment j'interviens sans lire ses données ? *(souveraineté)*
>
> Si une des trois n'a pas de réponse, la fonctionnalité n'est pas exploitable à l'échelle de la flotte.

- [ ] Passer chaque nouvelle capacité du plan par ces trois questions avant de la déclarer terminée

---

# ⛓️ Vérification chronologique — matrice de dépendances

Chaque phase a été confrontée à celles qui la précèdent et la suivent. **Trois conflits d'ordre ont été trouvés et sont corrigés ci-dessous.**

## Dépendances dures (ordre non négociable)

| Ce qui doit être fait… | …avant | Pourquoi |
|------------------------|--------|----------|
| **0.8** `requireSession` fail-closed | 🚨 **TOUT le reste** | 41 Server Actions s'exécutent aujourd'hui sans authentification effective, dont l'annulation fiscale et les mouvements de caisse. **Rien d'autre ne devrait être livré avant.** |
| **0.1** `VALIDATION_ERROR` | **0.8** `requireSession` · **2B.1** `createSafeAction` · **2C** `onValidated` | Les trois lèvent `NexusError`. Sans le membre d'enum, le code ne compile pas |
| **0.5** Gate aligné | **4.3** God files · **Phase 6** | Sans l'exception, on découperait des aggregation roots légitimes, et toute PR UI échouerait |
| **0.6** `CLAUDE.md` resynchronisé | **Phase 3** Barrel | On ne peut pas exposer proprement les barrels de domaines que la doc ignore |
| **1.1** Auto-fix imports morts | **3.1 / 3.2** Frontières | Supprimer 129 imports morts fait **baisser mécaniquement** les compteurs de violations avant tout travail manuel |
| **1bis.2** Règle Semgrep anti-`InCents` | **Phase 5** Monnaie | Sans elle, la dette monétaire se recrée pendant qu'on la résorbe |
| **1bis.1** Invariants fast-check | **Phase 5** · **7.4** Pourboires · **7.4** Split | C'est le filet qui rend ces chantiers sûrs. Les faire sans lui, c'est convertir 686 montants à l'aveugle |
| **1bis.4** Doc générée | toute session future | Un `CLAUDE.md` périmé fait travailler humains **et agents** sur une carte fausse |
| **3.3** Motif d'override corrigé | **Phase 6** Refonte UI | Sous le motif actuel, chaque composant surchargeable ajoute un cycle |
| **6.0 bis** Périmètre visuel tranché | **6.3** Brief graphiste | Sans arbitrage, le graphiste conçoit des écrans qui n'existent pas |
| **6.4.1** Tests `SystemTenantRegistry` | Tout provisioning client | La barrière qui protège les 8 maîtres `_ref_*` n'est pas testée |

## 🔧 Conflit 1 — Phase 4.1 ⇄ Phase 5 (POS / microunits)

**Problème** : la section 4.1 demande de « profiter du découpage de `SplitBillDialog` pour basculer ses calculs en microunits ». Or la Phase 5 traite `modules/ops` (147 occurrences `InCents`) séparément. Deux passes sur le même fichier, avec un risque de conversion partielle entre les deux.

**Correction** — traiter `SplitBillDialog` **une seule fois**, dans cet ordre :

```
1. Phase 5 « ops »  → convertir les montants du POS en microunits, tests de non-régression
2. Phase 4.1        → fragmenter SplitBillDialog, désormais déjà en microunits
```

- [ ] Ne **pas** convertir les montants pendant la fragmentation — convertir d'abord, fragmenter ensuite

## 🔧 Conflit 2 — Phase 4.5 ⇄ Phase 5 (transplantation finance)

**Problème** : 4.5 transplante `ReconciliationHub` et `AggregationWidget` depuis `origin/main` en demandant d'« adapter `InCents` → microunits ». Mais la Phase 5 « finance » (259 occurrences) définit justement les conventions de conversion du pilier.

**Correction** :

```
1. Phase 5 « finance » → établir les conventions (helpers, arrondis, tests)
2. Phase 4.5           → transplanter en appliquant ces conventions
```

- [ ] Repousser 4.5 après le démarrage de la Phase 5 « finance » — sinon on transplante avec des règles d'arrondi qui seront redéfinies après

## 🔧 Conflit 3 — Phase 2 ⇄ Phase 5 (schémas Zod monétaires)

**Problème** : la Phase 2 écrit 13 schémas Zod dont plusieurs portent des montants (`OrderPayloadSchema`, `CashDrawerSchema`, `QuoteSchema`, `StockMovementSchema`). Un schéma est une **source de vérité dont le type est inféré**. S'il est écrit avant la conversion du pilier, il fige la mauvaise unité.

**Correction** : **aucun report nécessaire** — mais règle absolue déjà inscrite aux interdits :

- [ ] Tout schéma Zod monétaire s'écrit **directement en microunits**, même si le pilier n'est pas encore converti. Le schéma devient alors la cible que la Phase 5 vient rejoindre, pas l'inverse

## ✅ Phases parallélisables sans risque

| Peut tourner en parallèle | Condition |
|---------------------------|-----------|
| **Phase 2** (Zod / back-end) ⇄ **Phase 6** (refonte UI) | Périmètres disjoints — le graphiste ne touche pas aux actions |
| **Phase 5** « intelligence / commerce / human » ⇄ **Phase 6** | Piliers hors chemin visuel critique |
| **6.4.1** (tests registry) ⇄ tout le reste | Ajout pur, aucune dépendance |

## 📐 Ordre final vérifié

```
🚨 0.8 SÉCURITÉ requireSession ─────────────────► EN PREMIER, avant tout
                                                  41 actions non authentifiées

🚨 7.3 RÉCEPTION e-facture ────────────────────► 1ᵉʳ SEPT. 2026 · hors séquence
                                                  la loi n'attend pas la dette

0.1 → 0.8 → 0.2 → 0.3 → 0.4 → 0.5 → 0.6 → 0.7  Colmatage + sécurité + doc + gate
        ↓
      1.1 → 1.2                                 Auto-fix (fait baisser les compteurs de 3)
        ↓
      1 bis  ←──── LE FILET                     invariants + règles + doc générée
        ↓          (rend sûr tout ce qui suit)
      3.3    ←──── BLOQUANT REFONTE             Motif d'override
        ↓
   ┌────┴─────────────────────────────┐
   ↓                                  ↓
 2 (Zod, back-end)            6.0bis → 6.1 → 6.4.1 → 6.4.3 → 6.2 → 6.3
   ↓                                  ↓
 3.1 → 3.2 (frontières)          REFONTE UI (graphiste)
   ↓
 7.4 pourboires  ← invariant d'abord, correction ensuite
   ↓
 5 « finance » → 4.5              ← conflit 2 résolu
 5 « ops »     → 4.1              ← conflit 1 résolu
   ↓
 5 (piliers restants) → 4.2 → 4.3 → 4.4
   ↓
 7.7 variantes → 7.8 base verticales → 7.2 Exchange
```

**Chemin critique** : `0.1 → 0.5 → 1.1 → 1bis → 3.3 → 6.x`. Tout le reste peut s'y greffer en parallèle.

> 🕸️ **La Phase 1 bis est le pivot du plan.** Elle ne produit aucune fonctionnalité — elle rend sûr tout ce qui vient après. Les deux chantiers les plus risqués (Phase 5 monnaie, 7.4 pourboires) deviennent des travaux mesurables au lieu de conversions à l'aveugle. Deux jours qui changent le coût de tous les autres.

---

# 🔁 Protocole par phase

À répéter systématiquement :

```bash
npx tsc --noEmit                # 0 erreur attendue
npx vitest run                  # suite verte, invariants compris
npx eslint src --ext .ts,.tsx   # compte en baisse
sentrux check .                 # score en hausse
npx semgrep --config .semgrep/  # 0 violation de convention   (après 1 bis)
npx knip                        # 0 code mort hors allowlist  (après 1 bis)
```

> ⚠️ **Ne pas se fier au code de sortie de `rtk`.** Il a renvoyé `exit 0` sur 12 erreurs TSC et « 2 errors » sur ~502 erreurs ESLint. **Toujours lire le compte réel dans la sortie**, jamais le code de retour.

---

---

# 📋 ANNEXE — Registre des tâches (à copier dans `PLAN_PROGRESS.md`)

> Copie ce tableau tel quel au démarrage. Remplis les colonnes au fur et à mesure.
> **Chaque ligne a sa commande de vérification.** Aucune ne se coche sans avoir exécuté la commande et constaté sa sortie.

| # | Tâche | Commande de vérification | Attendu | Statut |
|---|-------|--------------------------|---------|--------|
| **0.1** | `VALIDATION_ERROR` dans l'enum | `npx tsc --noEmit 2>&1 \| grep NexusEventBus` | vide | ⬜ |
| **0.8a** | `requireSession` créée | `grep -n "export async function requireSession" src/lib/server/verifySession.ts` | 1 ligne | ⬜ |
| **0.8b** | 41 appels migrés | `grep -rn "await verifySession(" src --include="*.action.ts" \| wc -l` | **0** | ⬜ |
| **0.8c** | 4 tests d'auth | `npx vitest run src/__tests__/**/auth*` | 4 verts | ⬜ |
| **0.9a** | 🚨 `ACTION_MAP` isomorphe | `ls src/shared/rbac/checkPermission.ts` | existe | ⬜ |
| **0.9b** | 13 actions sous permission | `grep -c "createSafeAction(" src/**/*.action.ts` | **13** | ⬜ |
| **0.9c** | PIN vérifié serveur | `grep -rn "PinHashService" src/lib/server/actionWrapper.ts` | ≥1 | ⬜ |
| **0.9d** | 4 tests RBAC serveur | `npx vitest run src/__tests__/**/rbac*` | 4 verts | ⬜ |
| **0.2** | `PrepaieBuilder` 3 gardes | `npx vitest run src/__tests__/helpers/saga.handlers.test.ts` | vert | ⬜ |
| **0.3** | `demo/simulation.test.ts` | `npx vitest run demo/simulation.test.ts` | vert ou ⏭️ justifié | ⬜ |
| **0.4** | 11 erreurs TSC scripts | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | **0** | ⬜ |
| **0.5** | Gate aligné sur la charte | `sentrux check . 2>&1 \| grep -A3 god_files` | 5 aggregation roots absents | ⬜ |
| **0.6** | `CLAUDE.md` 4 domaines | `grep -c "catalog\|fleet\|simulation\|agents" CLAUDE.md` | ≥ 4 | ⬜ |
| **0.7** | Doublon front-desk | `ls -d src/modules/ops/service/front*` | 1 seul dossier | ⬜ |
| — | **🚪 PORTE PHASE 0** | `npx tsc --noEmit && npx vitest run` | 0 erreur · tout vert | ⬜ |
| **1.1** | Auto-fix ESLint | `npx eslint src --ext .ts,.tsx 2>&1 \| tail -3` | ~502 → ~364 | ⬜ |
| **1.2** | display-name + id | idem | −8 | ⬜ |
| — | **🚪 PORTE PHASE 1** | ESLint en baisse, TSC 0, tests verts | | ⬜ |
| **1bis.1** | 7 invariants fast-check | `npx vitest run src/__tests__/invariants/` | 6 verts + **n°1 ROUGE** | ⬜ |
| **1bis.2** | 7 règles Semgrep | `semgrep --config .semgrep/ --error` | règles actives 1 à 1 | ⬜ |
| **1bis.3** | Knip + allowlist | `npx knip` | 0 hors allowlist | ⬜ |
| **1bis.4** | Doc générée | `npx tsx scripts/gen-pillars-doc.ts && git diff CLAUDE.md` | table à jour | ⬜ |
| — | **🚪 PORTE PHASE 1 bis** | invariant n°1 rouge = filet prouvé | | ⬜ |
| **2A** | Règle `unknown` documentée | `grep -c "unknown" CLAUDE.md` | ≥ 1 | ⬜ |
| **2B.1** | `createSafeAction` + 4 tests | `npx vitest run src/__tests__/**/actionWrapper*` | 4 verts | ⬜ |
| **2B.2** | 13 Server Actions sous Zod | `grep -rln "createSafeAction" src --include="*.action.ts" \| wc -l` | **13** | ⬜ |
| **2B.3** | 4 fonctions client validées | `grep -c "Schema" <les 4 fichiers>` | ≥ 4 | ⬜ |
| **2C** | `onValidated` + 5 handlers | `grep -rln "onValidated" src/shared/eventBus/handlers/ \| wc -l` | **5** | ⬜ |
| **2B.0** | `z.any()` → `z.unknown()` (25) | `grep -rn "z\.any()" src --include="*.action.ts" \| wc -l` | **0** | ⬜ |
| — | **🚪 PORTE PHASE 2** | `eslint \| grep -c no-explicit-any` **ET** `grep -rn "z\.\(any\|unknown\)()" src --include="*.action.ts" \| wc -l` | **0 et 0** | ⬜ |
| **3.1** | Barrel — 8 piliers | `npx eslint … \| grep -c no-restricted-imports` | 219 → **0** | ⬜ |
| **3.2** | Inversions de couche | `grep -rn "from '@/modules/" src/shared src/lib src/store \| wc -l` | 178 → **0** | ⬜ |
| **3.3** | 🔴 Cycles (bloque la refonte) | `sentrux check . 2>&1 \| grep max_cycles` | **0** | ⬜ |
| — | **🚪 PORTE PHASE 3** | 0 violation barrel · 0 cycle | | ⬜ |
| **5-finance** | 259 `InCents` | `grep -rn "InCents" src/modules/finance \| grep -v test \| wc -l` | **0** | ⬜ |
| **5-ops** | 147 `InCents` | idem sur `src/modules/ops` | **0** | ⬜ |
| **4.5** | ReconciliationHub + Widget | `find src -name "ReconciliationHub.tsx"` | 1 résultat | ⬜ |
| **4.1** | SplitBillDialog fragmenté | `wc -l src/modules/ops/service/pos/components/SplitBillDialog.tsx` | ≤ 100 | ⬜ |
| **7.4-tip** | 🔴 Pourboires câblés | `npx vitest run src/__tests__/invariants/money-conservation*` | **n°1 VERT** | ⬜ |
| **5-reste** | shared 97 · logistics 39 · lib 38 · autres | `grep -rn "InCents" src \| grep -v test \| wc -l` | **0** | ⬜ |
| **4.2** | LandingDashboard | `wc -l …/LandingDashboard.tsx` | ≤ 200 | ⬜ |
| **4.3** | 2 vrais god files | `sentrux check . 2>&1 \| grep -c "fan-out"` | ≤ 6 | ⬜ |
| **4.4** | 3 fonctions cc > 20 | `sentrux check . 2>&1 \| grep "cc="` | 0 en prod | ⬜ |
| — | **🚪 PORTE PHASES 4+5** | 0 `InCents` · 0 fichier > 400 l. | | ⬜ |
| **6.0bis** | ⚠️ Périmètre visuel | décision **humaine** écrite dans `CONTRIBUTING-UI.md` | — | ⬜ |
| **6.1** | 97 hex en dur | `grep -rn "#[0-9a-fA-F]\{6\}" src/modules --include="*.tsx" \| wc -l` | **0** | ⬜ |
| **6.2** | ⚠️ i18n ancré | `grep -rc "t(" src/shared/components/ui/ \| grep -v ":0" \| wc -l` | > 0 | ⬜ |
| **6.3** | `CONTRIBUTING-UI.md` | `ls CONTRIBUTING-UI.md` | existe | ⬜ |
| **6.4.1** | Tests SystemTenantRegistry | `npx vitest run src/__tests__/**/SystemTenant*` | verts | ⬜ |
| **6.4.2** | EventBus `isWritable` | `grep -n "isWritable(tenantId)" src/shared/eventBus/NexusEventBus.ts` | 1 ligne | ⬜ |
| **6.4.3** | `custom` scopedTokens | `grep -c "Tokens" src/verticals/custom/ui.ts` | ≥ 1 | ⬜ |
| **6.5** | Read models (3 projections) | `ls src/shared/eventBus/handlers/*Projection*` · invariant reconstruction | existent · vert | ⬜ |
| **6.6a** | ⚠️ Précédence charte ⇄ verticale | décision **humaine** + test de non-régression | tranchée | ⬜ |
| **6.6b** | Personnalisation complète | favicon · PWA · ticket · emails · dark mode | 5/5 | ⬜ |
| — | **🚪 PORTE PHASE 6** | refonte UI peut démarrer | | ⬜ |
| **7.3** | 🚨 RÉCEPTION e-facture | `npx vitest run src/__tests__/einvoicing/` | verts | ⬜ |
| **7.4** | Pont ticket → facture | tests NF525 append-only | verts | ⬜ |
| **7.6** | RGPD × NF525 | `grep -n "'invoices'" …/ErasureService.ts` | **absent** | ⬜ |
| **7.6.1** | RGPD câblé au registre tenant | `grep -c "rgpd" src/config/navConfig.ts` · `ls …/registre/RGPDSection.tsx` | ≥1 · existe | ⬜ |
| **7.7** | Groupes · acomptes · avoirs | tests dédiés | verts | ⬜ |
| **7.8** | `IVerticalInvoicingAdapter` | `ls src/modules/finance/comptabilite/invoicing/` | existe | ⬜ |
| **7.2** | Nexus Exchange | tests de sécurité des grants | verts | ⬜ |
| **MCC-1** | Onglet e-facturation | `ls src/app/(admin)/admin/mcc/_tabs/EInvoicingTab.tsx` | existe | ⬜ |
| **MCC-2** | Onglet Exchange | `ls …/_tabs/ExchangeTab.tsx` | existe | ⬜ |
| **MCC-3** | Rôles par verticale | `grep -c "roleLabels" src/app/api/admin/fleet/users/role/route.ts` | ≥1 | ⬜ |
| **MCC-4** | Matrice conformité | `grep -c "einvoicing\|rgpd" …/_tabs/ComplianceTab.tsx` | ≥2 | ⬜ |
| **MCC-5** | Statut verticales + blocage clinic | `grep -c "SQUELETTE\|PRODUCTION" …/_tabs/SystemTenantsTab.tsx` | ≥1 | ⬜ |
| — | **🚪 PORTE PHASE 7** | 4 flux couverts · PA connectée | | ⬜ |

## Ordre d'exécution en une ligne

```
0.1 → 0.8 → 0.2…0.7 → 🚪 → 1.1 → 1.2 → 🚪 → 1bis → 🚪 → 3.3 → 2 → 3.1 → 3.2 → 🚪
   → 5-finance → 4.5 → 5-ops → 7.4-tip → 4.1 → 5-reste → 4.2 → 4.3 → 4.4 → 🚪
   → 6.x → 🚪 → 7.x → 🚪

⚡ HORS SÉQUENCE : 7.3 RÉCEPTION e-facture — échéance légale 1ᵉʳ septembre 2026
```

---

*Document généré le 10 août 2026 — audit complet de la branche `fix/coherence-ui-backend-securite`.*
*Chaque chiffre et chaque référence de ligne de ce plan ont été mesurés sur le code, pas estimés.*
*Les numéros de ligne peuvent avoir bougé : toujours `grep` le symbole avant d'éditer.*
