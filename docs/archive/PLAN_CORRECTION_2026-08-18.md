# 🛠️ PLAN DE CORRECTION & AJUSTEMENT — Livraisons semaine 15→17 août 2026

> **Date de rédaction** : 2026-08-18
> **Auteur** : session `plan-correction-semaine`
> **Base** : croisement de `AUDIT_2026-08-18_full.md` (138 findings, score 52/100) × 50 commits livrés 15-17/08 × working tree résiduel
> **Objectif** : finir proprement la semaine + corriger les régressions introduites + traiter les critiques bloquants qui touchent les zones remaniées
> **Non-objectif** : refaire les audits déjà menés (12 dimensions couvertes) ; les livrables non commités non nommés ci-dessous doivent être stashés avant tout `git checkout`

---

## Table des matières

- [0. Préambule opérationnel](#0-préambule-opérationnel)
- [0-bis. État consolidé du repo & ordre d'attaque](#0-bis-état-consolidé-du-repo--ordre-dattaque)
- [1. Prérequis — Gate runtime 30 min](#1-prérequis--gate-runtime-30-min)
- [2. Vague 1 — Hygiène immédiate (J+0 → J+1)](#2-vague-1--hygiène-immédiate-j0--j1)
- [3. Vague 2 — Finition des livraisons semaine (J+2 → J+6)](#3-vague-2--finition-des-livraisons-semaine-j2--j6)
- [4. Vague 3 — Critiques bloquants NF525 / MCC / Bus (J+7 → J+15)](#4-vague-3--critiques-bloquants-nf525--mcc--bus-j7--j15)
- [5. Vague 4 — Gouvernance & ADRs (parallèle continu)](#5-vague-4--gouvernance--adrs-parallèle-continu)
- [5-bis. Vague 5 — Corrections métier issues d'anglemort.md (J+15 → J+45)](#5-bis-vague-5--corrections-métier-issues-danglemortmd-j15--j45)
- [6. Matrice des dépendances](#6-matrice-des-dépendances)
- [7. Anticipation des conséquences et régressions](#7-anticipation-des-conséquences-et-régressions)
- [8. Stratégie de rollback par vague](#8-stratégie-de-rollback-par-vague)
- [9. Métriques de sortie & critères d'acceptation](#9-métriques-de-sortie--critères-dacceptation)
- [10. Journal d'exécution — template](#10-journal-dexécution--template)

---

## 0. Préambule opérationnel

### 0.1 Contexte

Sur 3 jours (15-17/08), **50 commits** ont livré :
- Généralisation universelle 8 piliers (`cabf1f436`), registre de 12 verticales (`b41779ffa`)
- Chantier facility/GMAO massif (5 commits, ~+15k lignes)
- ML forecasting + assistant IA multi-vertical
- Legal e-sign / contract engine sovereign
- Couche DB & auth plug-and-play (Postgres/Mongo/SQLite)
- Modularisation Phase 1+2 : 23 God-Files décomposés
- RBAC canonique final (`fleet_admin`/`SUPER_ADMIN` supprimés)
- Purge 24 composants morts, réalignement 8 piliers

**Contreparties non résolues** :
- 13 fichiers modifiés + 5 dossiers/fichiers non trackés dans le working tree
- 138 findings audit dont **13 critical** — plusieurs bloquent des livraisons de la semaine
- Nouveau god-file `accounting-portal/page.tsx` (593 lignes) livré alors que `9260dad5e` prétendait "0 god file"
- Nouveau domaine `commerce/franchise/` hors canon CLAUDE.md

### 0.2 Sessions collision — Zone chaude

Les corrections ci-dessous **touchent 6 sessions historiquement actives** :
- `audit-complet-v3` (active depuis 07/08, fantôme)
- `typing-unknown-eradication` (active depuis 07/08, fantôme)
- `mcc-fixes` (terminée mais fichiers en collision possible)
- `db-agnostic-plugplay` (terminée, refacto 5 fichiers en collision RBAC)
- `backlog-h1-fixes` (terminée, réservations en collision)
- `rbac-rename` (terminée, PermissionRole en collision)

**Action préalable obligatoire** : passer les 2 sessions fantômes en `terminée` avant tout Edit/Write (cf. finding Doc-M5).

### 0.3 Convention effort

| Symbole | Charge |
|:-:|---|
| **XS** | < 1 h |
| **S** | < 1 jour |
| **M** | 1-3 jours |
| **L** | 3-7 jours |
| **XL** | > 1 semaine |

### 0.4 Numérotation des actions

Chaque action porte un identifiant stable `[V<n>-<domaine>-<seq>]` (ex : `V1-RBAC-01`) pour tracking dans `sessions.md`, PR, et journal.

---

## 0-bis. État consolidé du repo & ordre d'attaque

Cette section répond à la question méta : **faut-il refaire un audit avant d'attaquer ce plan ?** Réponse : **non pour le technique, oui pour le métier en parallèle.**

### 0-bis.1 Ce qui est déjà solide (pas d'audit à refaire)

| Bloc | Statut | Preuve |
|------|:------:|--------|
| Audit technique 12 dimensions | ✅ | `AUDIT_2026-08-18_full.md` — 138 findings ancrés fichier:ligne, daté du jour, commit `9054d08c1` |
| Audits historiques par pilier | ✅ | `.claude/sessions.md` — 100+ audits menés (POS, KDS, commerce, finance, compliance, human, logistics, intelligence, MCC, UI, MCC-2, RBAC, integrations) |
| Typage strict + sentrux + preflight | ✅ | `tsconfig.json` strict partiel + `.sentrux/rules.toml` 47 règles + `scripts/preflight.sh` 8 étapes |
| Chaîne NF525 SHA-256 chaînée | ✅ | `FiscalSealer.ts` + `FiscalEngine.sealEntry()` + tests intégration |
| RBAC MCC 3 niveaux + MFA + Trusted Device | ✅ | `adminAuthGuard.ts` + `MCCRoleHierarchy` |

**⇒ Ne pas relancer d'audit technique — c'est du temps perdu.**

### 0-bis.2 Ce qui manque et peut invalider ce plan si non fait

| Zone d'ombre | Impact si ignoré | Traitement |
|--------------|------------------|-----------|
| **Gate runtime avant tout** — l'audit est statique | Chaque correction risque d'aggraver si TSC/vitest rouge | ⇒ **PREREQ (section 1)** obligatoire 30 min |
| **`anglemort.md` × code jamais croisé** — 45 blind spots métier (fraudes, TIAC, DGFiP inopinée, biodéchets 2024, limiteur 85dBA, chrono-dynamique) | Risques business que l'audit technique ne peut pas voir | ⇒ **Audit métier parallèle en background** pendant Vague 1 → alimente **Vague 5** |
| **DB-agnostic livré `7298d59ff` non testé** sur Postgres/Mongo/SQLite | Feature promise mais aucun backend ≠ Firestore validé | ⇒ **V2-INFRA-05** (post-Vague 3 différable si Firestore reste seul provider actif prod) |
| **`invariants-2-3-4` clos sans preuve invariants #5, #6, #7** | Reliquat split, factures ticket, projection reconstruite non revérifiés post-refactos semaine | ⇒ **PREREQ-07** ajouté ci-dessous |

### 0-bis.3 Ordre d'attaque recommandé

```
T+0        │ Gate runtime PREREQ-01 → 07  (30 min)
           │      ├── ✅ vert → continuer
           │      └── ❌ rouge → STOP, fixer les gates avant tout
           │
T+30 min   │ Lancer audit anglemort × code en background
           │ (agent Explore ou Workflow séparé, ne bloque pas)
           │
T+30 min   │ Vague 1 (hygiène + 6 quick-wins < 1 j)
           │
J+1        │ Vérifier retour audit anglemort → alimenter Vague 5
           │
J+2 → J+6  │ Vague 2 (finition livraisons semaine)
           │
J+7 → J+15 │ Vague 3 (critiques bloquants NF525/MCC/Bus)
           │
Parallèle  │ Vague 4 (gouvernance & ADRs) — fait par tranches quand
           │ Vagues 2/3 avancent
           │
J+15 → J+45│ Vague 5 (corrections métier issues anglemort)
```

### 0-bis.4 Baseline runtime mesurée (2026-08-18 15:00)

Preuves réelles à T+0 (avant Vague 1) — mesurées lors de la rédaction du plan :

| Signal | Résultat | Verdict | Commentaire |
|--------|----------|:-------:|-------------|
| `npx tsc --noEmit` | exit 0 | ✅ | 0 erreur TypeScript |
| Fichiers de tests | 153 (`.test.ts` + `.test.tsx`) | ✅ | Baseline vitest à mesurer en Vague 1 |
| `npx madge --extensions ts,tsx --ts-config tsconfig.json --circular src/modules` | **921 cycles** | 🚨 | **Contradiction avec session `preflight-green` (30/07) qui affirmait 0 cycle** — soit la commande preflight scope différemment (accept barrel self-cycles), soit régression massive depuis. À investiguer en **PREREQ-09** avant Vague 1. |
| `wc -l anglemort.md` | 1392 lignes | 📖 | Volume conséquent pour PREREQ-08 |
| `git status --short` | 13M + 5 non trackés | ⚠️ | Confirme PREREQ-05 obligatoire |
| Sessions actives fantômes | 2 (`audit-complet-v3`, `typing-unknown-eradication`) | ⚠️ | Confirme PREREQ-06 |

**Verdict de passage** :
- ✅ **TSC vert** — pas de blocage
- 🚨 **Cycles à réconcilier** — ajoute PREREQ-09
- ⚠️ **Working tree + sessions** — traités par PREREQ-05 et 06

### 0-bis.5 Ce qui est explicitement HORS périmètre de ce plan

- **Pentest offensif** — à programmer trimestre 2, hors périmètre code.
- **Audit LNE/AFNOR NF525** — dossier d'homologation tiers.
- **Refonte i18n active** — infra présente mais inactive volontairement (cf. CLAUDE.md).
- **Migration vers cloud provider ≠ GCP** — pas de signal métier.
- **Refonte design system** — l'audit UI global de 07/08 est déjà couvert.

---

## 1. Prérequis — Gate runtime 30 min

**Non négociable — bloque tout le reste.** L'audit du 18/08 est statique (aucune exécution). Il faut connaître l'état réel du code avant d'y toucher.

### [PREREQ-01] Vérifier TSC 0

```bash
npx tsc --noEmit 2>&1 | tail -20
```

- ✅ **0 erreur attendu** (session `db-agnostic-plugplay` a annoncé TSC 0 le 17/08 au commit `7298d59ff`)
- ❌ Si erreurs → **STOP** ; investiguer, ne rien démarrer. Regarder d'abord les fichiers staged non commités : `src/app/api/oracle/route.ts`, `src/modules/intelligence/services/AssistantAction*`, `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts`.

### [PREREQ-02] Vérifier vitest passant

```bash
npx vitest run --reporter=default 2>&1 | tail -30
```

- ✅ **≥ 668 tests OK attendu** (baseline `plan-vertical-exec` du 07/08)
- ❌ Si régression → `git bisect` sur les 50 commits pour isoler
- ⚠️ Note : `AdversarialSecurityAndResilience.test.ts` staged mais non commit peut casser la suite

### [PREREQ-03] Cycles Madge

```bash
npx madge --circular src/modules 2>&1 | tail -10
npx madge --circular src/lib 2>&1 | tail -10
```

- ✅ **0 cycle attendu** (baseline `preflight-green` du 30/07)
- ❌ Si cycles → probable régression `9054d08c1` (réalignement piliers) ou `5bb19de57` (fragmentation God-Files)

### [PREREQ-04] Sentrux check

```bash
sentrux check . 2>&1 | tail -20
```

- ✅ **Baseline v2.0 respectée** (préflight du 30/07)
- ❌ Si dérive → sentrux baseline à re-baseline avant tout push

### [PREREQ-05] Working tree propre ou explicité

```bash
git status --short
```

- Le tree contient **13 modifiés + 5 dossiers/fichiers non trackés** → décision explicite requise :
  - **Option A** : commit atomique par thème (résa/assistant/webhooks/security) → recommandé
  - **Option B** : `git stash push -u -m "wip-2026-08-18-pre-plan"` → alternative safe
  - **Option C** : `git checkout` → **INTERDIT** (perte garantie)

### [PREREQ-06] Fermer sessions fantômes

Éditer `.claude/sessions.md`, ligne 111 et 112 : `active` → `terminée`.

### [PREREQ-07] Re-vérifier invariants #5, #6, #7 post-semaine

**Contexte** : session `invariants-2-3-4` (15/08) a livré l'invariant #2 (stock atomique). Les invariants **#5 (reliquat split)**, **#6 (Σ factures ticket ≤ scellé)** et **#7 (projection reconstruite = courante)** ont un test unitaire mais peuvent avoir dérivé suite aux refactos massifs de la semaine (`5bb19de57` 12 God-Files, `9260dad5e` dette Grade X).

```bash
npx vitest run src/__tests__/invariants/  2>&1 | tail -20
```

- ✅ **≥ 5 tests invariants OK attendus**
- ❌ Si régression → tracer via `git bisect` (probable régression `d54cd78c8` acompte groupes ou `97c526112` stock)

### [PREREQ-09] Réconcilier compte cycles Madge (921 vs 0)

**Contexte** : `npx madge --extensions ts,tsx --ts-config tsconfig.json --circular src/modules` reporte 921 cycles au 2026-08-18 alors que la session `preflight-green` (30/07) affirmait 0. Deux hypothèses :

- **H1** : le `preflight.sh` utilise une invocation qui exclut les barrel self-cycles (pattern `index.ts > useX.ts > index.ts`), qui représentent la majorité des 921 cycles listés.
- **H2** : régression réelle liée aux refactos Phase 2 (`5bb19de57`, `9260dad5e`, `9054d08c1`).

**Actions** :
1. Lire `scripts/preflight.sh` pour trouver l'invocation exacte de madge
2. Rejouer la MÊME invocation pour comparer
3. Si H1 : documenter dans le plan la commande "officielle" (self-cycles exclus) — nouvelle baseline
4. Si H2 : `git bisect` sur les commits de la semaine pour isoler la régression

**Bloquant Vague 1** : oui si H2. Non si H1.

**Durée** : 15-30 min.

### [PREREQ-08] Lancer audit anglemort × code en background

**Non bloquant pour la Vague 1 mais à lancer en même temps** pour maximiser le parallélisme.

```
Agent Explore (breadth "very thorough") avec brief :
  "Lis /Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/anglemort.md
   (45 angles morts métier). Pour chaque angle mort qui pourrait être
   partiellement adressé dans le code, retourne :
   - Numéro angle mort + zone (FOH/BOH/SRM/NF525/RH/HACCP/Hardware/RBAC)
   - Fichiers/services concernés
   - Statut : COUVERT / PARTIEL / ABSENT
   - Preuve : fichier:ligne ou grep
   Format compact YAML, < 500 lignes total.
   Ne modifie rien, lecture seule."
```

Le rapport revient en J+1 et alimente la **Vague 5**.

### Décision de passage

| Résultat | Action |
|---|---|
| ✅ 8/8 verts | Passer à Vague 1 |
| ⚠️ TSC ou vitest cassé | Rollback commit en cause avant plan |
| ⚠️ Invariants cassés | Diagnostiquer via git bisect avant Vague 1 |
| 🚫 Working tree non résolu | Bloquer sur PREREQ-05 |

---

## 2. Vague 1 — Hygiène immédiate (J+0 → J+1)

**Objectif** : rendre le repo commitable + débloquer les régressions critiques introduites par la semaine.
**Durée totale** : 1 jour ouvré.
**Volume total** : 8 actions, effort ~1 j.

### [V1-WT-01] Committer working tree résiduel

**Effort** : XS
**Priorité** : 🔴 bloquant

**Fichiers** :
- Staged : `src/app/api/oracle/route.ts`, `src/modules/intelligence/services/AssistantActionDispatcher.ts`, `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts`, `src/__tests__/intelligence/AdversarialSecurityAndResilience.test.ts`, `anglemort.md`
- Modifiés : `BACKLOG.md`, `src/app/api/widget/book/route.ts`, `src/lib/cron/ReservationReminderJob.ts`, `src/modules/commerce/relation/reservations/**`, `src/modules/facility/spaces/floor-plan/TableInsightPanel.tsx`, `src/shared/eventBus/events/common.events.ts`, `src/shared/nexus/contracts/**`
- Non trackés : `AUDIT_2026-08-18_full.md`, `AUDIT_2026-08-18_partiel.md`, `src/__tests__/api/sms-inbound-webhook.test.ts`, `src/__tests__/commerce/reservation-customizer-pacing.test.ts`, `src/app/(public)/preview/`, `src/app/api/webhooks/sms/`, `src/lib/security/ReservationTokenSigner.ts`, `src/lib/templates/`

**Découpage suggéré (3 commits atomiques)** :

1. **`chore(audits): archive audit reports 2026-08-18`** — `AUDIT_2026-08-18_*.md` + `anglemort.md`
2. **`feat(reservations): SMS inbound webhook + token signer + templates`** — `src/app/api/webhooks/sms/`, `src/lib/security/ReservationTokenSigner.ts`, `src/lib/templates/`, `src/__tests__/api/sms-inbound-webhook.test.ts`, `src/lib/cron/ReservationReminderJob.ts`, `src/app/api/widget/book/route.ts`, `src/modules/commerce/relation/reservations/**`, `src/shared/nexus/contracts/**`
3. **`feat(intelligence): adversarial resilience test + assistant updates + oracle route`** — `src/modules/intelligence/services/AssistantActionDispatcher.ts`, `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts`, `src/app/api/oracle/route.ts`, `src/__tests__/intelligence/AdversarialSecurityAndResilience.test.ts`
4. **`feat(public): preview route + BACKLOG + TableInsightPanel + common.events`** — `src/app/(public)/preview/`, `src/modules/facility/spaces/floor-plan/TableInsightPanel.tsx`, `src/shared/eventBus/events/common.events.ts`, `BACKLOG.md`

**Vérification** :
```bash
git status --short  # doit renvoyer vide sauf PLAN_CORRECTION*.md
npx tsc --noEmit    # doit rester à 0
npx vitest run --changed  # les nouveaux tests doivent passer
```

**Conséquence attendue** : working tree propre, base saine pour Vague 1 suivante.

**Régression possible** : `common.events.ts` déjà à 796 lignes ; si la modification en attente touche des types partagés, casse potentielle en chaîne. À vérifier via `npx tsc --noEmit` avant chaque commit.

**Rollback** : `git reset HEAD~4` (ou N selon nombre de commits atomiques réels) — pas de push tant que Vague 1 pas complète.

---

### [V1-SESSIONS-02] Clôturer sessions fantômes

**Effort** : XS
**Priorité** : 🟢 hygiène

**Fichiers** : `.claude/sessions.md` lignes 111, 112.

**Actions** :
- Ligne 111 `audit-complet-v3` → status `terminée`, ajouter note "Auto-clôturée 2026-08-18, aucun livrable identifié"
- Ligne 112 `typing-unknown-eradication` → status `terminée`, ajouter note "Auto-clôturée 2026-08-18, périmètre repris par `plan-correction-semaine`"

**Conséquence** : le hook `check-session-collision.sh` cessera de faux-positiver sur ces périmètres.

---

### [V1-RBAC-03] Fix RBAC-C1 — role `owner` provisioning MCC

**Effort** : S (2-4 h)
**Priorité** : 🔴 CRITICAL BLOQUANT (aucun nouveau tenant ne peut se connecter aujourd'hui)

**Origine** : `AUDIT_2026-08-18_full.md#RBAC-C1`
**Fichiers** :
- `src/lib/mcc/provisioning/steps/provisioningSteps.ts:87,96`
- `src/lib/AccessPolicyManager.ts` (ou source équivalente de `PERMISSION_ROLE_LEVELS`)
- `src/app/api/signup/route.ts:119` (référence canonique)

**Décision architecturale** (2 options — choisir 1) :

- **Option A (recommandée)** : remplacer `role: 'owner'` par `role: 'admin'` dans `provisioningSteps.ts:87,96` — cohérent avec `signup/route.ts`, aucune migration
- **Option B** : ajouter `'owner'` à `PermissionRole` enum + `PERMISSION_ROLE_LEVELS['owner'] = 100` + `TENANT_ADMIN_ROLES.push('owner')` — plus lourd, casse le typage aval

**Recommandation** : **Option A**. Motif : cohérence + minimalisme + zéro migration.

**Tests obligatoires à ajouter/adapter** :
```typescript
// src/__tests__/mcc/provisioning-owner-role.test.ts
describe('MCC provisioning owner role', () => {
  it('provisions tenant owner with valid PermissionRole', async () => {
    const { userDoc } = await provisionNewClient({ ... });
    expect(PERMISSION_ROLE_LEVELS[userDoc.role]).toBeGreaterThanOrEqual(90);
  });
  it('freshly provisioned owner passes requireTenantAdmin', async () => {
    // simuler login owner → GET /api/tenant/config → 200
  });
});
```

**Conséquence** :
- ✅ Débloque tous les tenants provisionnés depuis semaine dernière (cf. sessions `mcc-fixes`, `db-agnostic-plugplay`)
- ⚠️ Vérifier qu'aucun autre code ne teste `role === 'owner'` (grep obligatoire)
- ⚠️ Impact `AssistantIA/resolveRoleLevel` (finding RBAC-L1) qui déclare `owner` — cf. V1-RBAC-04

**Grep de vérification** :
```bash
rg "role\s*===?\s*['\"]owner['\"]" src/
rg "\brole:\s*['\"]owner['\"]" src/
```

**Rollback** : revert commit, aucun impact prod tant qu'aucun tenant non provisionné entre-temps.

---

### [V1-RBAC-04] Corriger `resolveRoleLevel` Assistant IA (référentiel fantôme)

**Effort** : XS (30 min)
**Priorité** : 🟠 High (dépend de V1-RBAC-03)

**Origine** : `AUDIT_2026-08-18_full.md#RBAC-L1`
**Fichier** : `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts` (staged, à finaliser dans commit V1-WT-01#3)

**Actions** :
- Si Option A retenue en V1-RBAC-03 : supprimer référence `'owner'` de `resolveRoleLevel`, aligner sur `PermissionRole` officiel
- Retirer `'proprietaire'`, `'responsable_site'`, `'receptionniste'`, `'apprenti'`, `'stagiaire'` (rôles fantômes)
- Si vraiment besoin d'un rôle "propriétaire" métier, réutiliser `admin` (Option A)

**Conséquence** : matrice RBAC Assistant IA alignée sur canon = 1 seule source de vérité côté intelligence.

**Test** : ajouter mini-test qui vérifie que tous les rôles retournés par `resolveRoleLevel` sont dans `PermissionRole`.

---

### [V1-MCC-05] Fix MCC-H1 — PIN owner interpolé dans email

**Effort** : XS (30 min)
**Priorité** : 🔴 Bloquant (nouveau tenant ne connaît pas son PIN)

**Origine** : `AUDIT_2026-08-18_full.md#MCC-H1`
**Fichier** : `src/lib/mcc/provisioning/steps/provisioningSteps.ts` (`setupOwnerAccount`)

**Action** :
- Repérer le template email de bienvenue (probablement `src/lib/templates/welcome-owner.ts` — dossier créé cette semaine)
- Ajouter placeholder `{{pinPlain}}` + interpolation lors de l'envoi
- Ajouter note sécurité : "PIN à modifier au premier login" + rotation obligatoire J+7

**Test** :
```typescript
it('welcome email contains freshly generated PIN', async () => {
  const emailBody = await captureEmail(() => setupOwnerAccount(...));
  expect(emailBody).toMatch(/\d{4,6}/);  // format PIN
});
```

**Conséquence** :
- ✅ Owner reçoit son PIN → premier login possible
- ⚠️ Sécurité : PIN en clair dans email = OK pour bootstrap tant que rotation J+7 obligatoire côté API

**Régression possible** : si `pinPlain` fuit dans logs (finding sécu adjacent), à croiser avec `3d6a1826d` (PII redaction) — vérifier que le logger scrub `pinPlain` OK.

---

### [V1-VERT-06] Fix Verticales-H1 — `CUSTOM_FULL_DNA` dans DNA_REGISTRY

**Effort** : XS (20 min)
**Priorité** : 🔴 High (variant `custom` retombe silencieusement sur restaurant)

**Origine** : `AUDIT_2026-08-18_full.md#Vert-H1`, aggravé par `b41779ffa` (registry 12 verticales sans corriger le fallback)

**Fichiers** :
- `src/shared/seeds/index.ts` (ou `DNA_REGISTRY` équivalent)
- `src/shared/seeds/custom-full-dna.ts` (existe 93 lignes, non importé)

**Action** :
```typescript
// src/shared/seeds/index.ts
import { CUSTOM_FULL_DNA } from './custom-full-dna';
export const DNA_REGISTRY = {
  restaurant: RESTAURANT_FULL_DNA,
  hotel: HOTEL_FULL_DNA,
  // ... autres ...
  custom: CUSTOM_FULL_DNA,  // ← AJOUT
};
```

**Test** :
```typescript
it('resolveDNA("custom") does NOT fallback to restaurant', () => {
  const dna = resolveDNA('custom');
  expect(dna.name).not.toBe('RESTAURANT_FULL_DNA');
  expect(dna).toBe(CUSTOM_FULL_DNA);
});
```

**Conséquence** : tenants `variant='custom'` reçoivent enfin leur DNA propre — capabilities filtered correctement.

---

### [V1-BUS-07] Fix Bus-H4 — remplacer `.catch(() => {})` silencieux

**Effort** : XS (15 min)
**Priorité** : 🟠 High (erreurs fiscales masquées en silence)

**Origine** : `AUDIT_2026-08-18_full.md#Bus-H4`
**Fichier** : `src/modules/finance/comptabilite/FinancialNexusEvents.ts:22,33,43,52`

**Action** : 4 remplacements :

```typescript
// AVANT (4 occurrences)
NexusEventBus.emit('order.paid', payload).catch(() => {});

// APRÈS
NexusEventBus.emit('order.paid', payload).catch(err =>
  logger.error('[FinancialNexusEvents] order.paid emit failed', { err, orderId: payload.orderId })
);
```

**Vérification** : grep pour être sûr qu'aucun autre `.catch(() => {})` traîne dans le pilier finance :
```bash
rg "\.catch\(\(\)\s*=>\s*\{\s*\}\)" src/modules/finance/
```

**Conséquence** : visibilité totale des échecs de scellement/paiement.

**Régression possible** : les logs vont augmenter — s'assurer que Axiom/Sentry ne saturent pas. Rate-limit côté logger si volume > 100/min.

---

### [V1-SEC-08] Fix Sécu-H1 — bypass `mcc-dev-bypass` gardé par NODE_ENV

**Effort** : XS (10 min)
**Priorité** : 🟠 High (rétrogradé — voir vérification code)
**Sévérité vérifiée** : l'exploit demande **DEUX conditions cumulatives** : (a) `MCC_DEV_MODE_SERVER === 'true'` en env prod ET (b) le client envoie `Authorization: Bearer mcc-dev-bypass` (chaîne exacte). Le simple leak du flag env ne suffit pas ; il faut aussi que l'attaquant devine la chaîne. Sévérité rétrogradée 🔴 → 🟠 mais fix toujours pertinent (défense en profondeur).

**Origine** : `AUDIT_2026-08-18_full.md#Sec-H1`, cross-cutting avec RBAC-H2 et MCC-L3
**Fichier** : `src/lib/server/adminAuthGuard.ts:66-72` (`requireMccLevel`)

**Action** :
```typescript
// AVANT
if (process.env.MCC_DEV_MODE_SERVER === 'true') {
  return { uid: 'dev_admin', role: 'super_admin' };
}

// APRÈS
if (process.env.NODE_ENV !== 'production' &&
    process.env.MCC_DEV_MODE_SERVER === 'true') {
  return { uid: 'dev_admin', role: 'super_admin' };
}
```

**Symétrie à vérifier** : `verifyCaller` (ligne 194 mentionnée dans audit) est déjà gardé correctement — à confirmer par lecture.

**Test** :
```typescript
it('MCC_DEV_MODE_SERVER=true is ignored in production', () => {
  process.env.NODE_ENV = 'production';
  process.env.MCC_DEV_MODE_SERVER = 'true';
  expect(() => requireMccLevel(mockReq, 'super_admin'))
    .rejects.toThrow(/unauthorized/i);
});
```

**Conséquence** : impossible de faire fuiter super_admin même si le flag traîne en env prod par erreur.

---

### [V1-ARCH-09] Rattacher `franchise/` au canon (audit livraison b092f6142)

**Effort** : S (2-3 h)
**Priorité** : 🟡 Medium (nouveau domaine hors CLAUDE.md — dette architecturale immédiate)

**Origine** : commit `b092f6142` livre `src/modules/commerce/franchise/` — pas dans les 3 domaines canoniques (`acquisition/`, `relation/`, `fidelite/`)

**Décision architecturale** (choisir 1) :

- **Option A** : déplacer `franchise/` → `commerce/relation/franchise/` (rattacher au domaine "relation client B2B")
- **Option B** : documenter explicitement dans CLAUDE.md que `commerce/franchise/` est un 4ᵉ domaine canonique
- **Option C** : ré-évaluer périmètre franchise (peut-être ça relève de `system/` ou d'un pilier neuf `network/`)

**Recommandation** : **Option A**. Motif : évite d'ouvrir un 4ᵉ domaine sans nécessité, `franchise` = relation B2B multi-sites.

**Actions Option A** :
1. `git mv src/modules/commerce/franchise src/modules/commerce/relation/franchise`
2. Mettre à jour tous les imports (grep + sed)
3. Vérifier barrel `src/modules/commerce/index.ts` re-exporte OK
4. Mettre à jour `src/modules/commerce/relation/index.ts`
5. Sentrux check + TSC + vitest

**Test** : ajouter un test de barrel qui échoue si `franchise` sort du canon.

**Conséquence** :
- ✅ CLAUDE.md reste source de vérité canonique
- ⚠️ Migration `git mv` — préserver l'historique git-blame

**Régression possible** : imports directs (`@/modules/commerce/franchise/*`) qui deviennent invalides — grep obligatoire, `tsc --noEmit` en gate.

---

### 📊 Sortie Vague 1

**Métriques attendues** :
- ✅ Working tree propre
- ✅ Sessions.md sans fantôme
- ✅ Tenants MCC provisionnés se connectent au premier login (test manuel)
- ✅ TSC 0, vitest passant, sentrux vert
- ✅ 6 findings audit résolus (RBAC-C1, MCC-H1, Vert-H1, Bus-H4, Sec-H1, Arch-M1)
- ✅ 0 domaine hors canon dans `src/modules/`

**Score audit estimé après Vague 1** : 52 → 56/100 (+4)

---

## 3. Vague 2 — Finition des livraisons semaine (J+2 → J+6)

**Objectif** : consolider ce qui a été livré à moitié cette semaine — pour ne pas laisser des chantiers "80% faits" pourrir.

### [V2-VERT-01] Aligner les 4 sources verticales (ADR-004)

**Effort** : M (2 j)
**Priorité** : 🔴 Bloquant nouveaux tenants gym/coworking/veterinary/florist

**Origine** : `AUDIT_2026-08-18_full.md#Vert-C1`
**Fichiers** :
- `src/modules/system/domain/schemas/tenant.ts:4-13` (`PlatformVariant` enum)
- `src/shared/seeds/index.ts` (`DNA_REGISTRY`)
- `src/verticals/_shared/catalog/VerticalBlueprintRegistry.ts:30-46` (12 blueprints)
- `src/verticals/*/` (12 dossiers)

**Décision** : la **source de vérité** devient `VerticalBlueprintRegistry` (12 slugs). Générer `PlatformVariant` depuis cette source.

**Actions** :

1. **Générer `PLATFORM_VARIANTS` depuis registry** :
```typescript
// src/modules/system/domain/schemas/tenant.ts
import { getAllBlueprintSlugs } from '@/verticals/_shared/catalog/VerticalBlueprintRegistry';

const PLATFORM_VARIANTS = getAllBlueprintSlugs();  // 12 valeurs
export const PlatformVariantSchema = z.enum(PLATFORM_VARIANTS as [string, ...string[]]);
```

2. **Ajouter les 4 DNA manquants** : `gym-full-dna.ts`, `coworking-full-dna.ts`, `veterinary-full-dna.ts`, `florist-full-dna.ts` (même patron que `salon-full-dna.ts`).

3. **Compléter les modules vides** — a minima 1 fichier metadata par module pour que le TS ne casse pas :
   - `src/modules/commerce/relation/appointments/`
   - `src/modules/facility/spaces/rooms/`
   - `src/modules/facility/spaces/bays/`
   - `src/modules/ops/service/consultation/`

4. **Test de cohérence** :
```typescript
// src/__tests__/verticals/four-sources-consistency.test.ts
it('PlatformVariant enum matches VerticalBlueprintRegistry slugs', () => {
  const registrySlugs = getAllBlueprintSlugs().sort();
  const enumValues = PlatformVariantSchema.options.sort();
  expect(enumValues).toEqual(registrySlugs);
});

it('every PlatformVariant has a DNA in DNA_REGISTRY', () => {
  for (const variant of PlatformVariantSchema.options) {
    expect(DNA_REGISTRY[variant]).toBeDefined();
    expect(resolveDNA(variant).name).not.toBe(RESTAURANT_FULL_DNA.name);
  }
});
```

5. **Retirer `luxury_vault`** mort dans `VERTICAL_NAV_OVERRIDES` (finding Vert-M4).

**Conséquence** :
- ✅ Provisioning tenant `variant='gym'` fonctionne enfin
- ✅ Test bloque toute future divergence
- ⚠️ Migration : tenants existants n'ont pas de champ `variant` cohérent — script de migration à écrire (voir V2-VERT-02)

**Régression possible** :
- Zod devient plus strict : anciens tenants sans `variant` échoueront à la validation. Ajouter fallback `variant='restaurant'` en runtime avec log warn.

**Rollback** : revert commit + ré-ouvrir 4 issues séparées.

---

### [V2-VERT-02] Script de migration tenants → variant valide

**Effort** : S (4 h)
**Priorité** : 🟠 High (post V2-VERT-01)

**Fichier** : `scripts/migrate-tenants-variant.ts` (nouveau)

**Logique** :
```typescript
// pour chaque tenant sans variant → set 'restaurant' (default historique)
// pour chaque tenant avec variant non listé → log + set 'custom'
// écriture idempotente + audit log
```

**Test** : script sur simulateur avec 24 tenants système + 5 tenants demo.

**Rollback** : script est idempotent, aucun rollback nécessaire (mais dump JSON avant/après).

---

### [V2-VERT-03] Adapters minimaux pour 4 verticales orphelines

**Effort** : L (1 semaine)
**Priorité** : 🟠 High (bloque go-to-market gym/coworking/veterinary/florist)

**Origine** : `AUDIT_2026-08-18_full.md#Vert-H2`
**Fichiers à créer** (par verticale) :
- `src/verticals/<slug>/adapters/commerce.ts`
- `src/verticals/<slug>/adapters/finance.ts`
- `src/verticals/<slug>/adapters/ops.ts`
- `src/verticals/<slug>/<Slug>Vertical.ts` (plugin)

**Modèle** : copier `src/verticals/hotel/` (6 KB de patrons stables).

**Sous-tâches par verticale** (4 × ~S = L total) :
- Gym : adapter `commerce.reservations` → `sessions/cours`, `logistics.stock` → `boissons/équipements`
- Coworking : `commerce.reservations` → `desks/salles`, `finance.billing` → `plans mensuels`
- Veterinary : `commerce.reservations` → `consultations`, `compliance.haccp` → `dossier animal` (RGPD-vet)
- Florist : `logistics.stock` → `fleurs coupées + périssables`, `finance.billing` → `commandes évènement`

**Tests** : 1 test par verticale vérifiant `resolveDNA(<slug>)` cohérent + capabilities filtrées correctement.

**Conséquence** : les 4 verticales passent de "coquille vide" à "MVP fonctionnel". Utilisateurs peuvent au minimum provisionner + configurer.

**Anticipation** : équipe métier doit valider chaque adapter (gym ≠ resto). Prévoir 1 j de review métier.

---

### [V2-DETTE-04] Décomposer `accounting-portal/page.tsx` (593 lignes)

**Effort** : M (1-2 j)
**Priorité** : 🟠 High (nouveau god-file livré cette semaine, contradictoire avec `9260dad5e`)

**Origine** : `AUDIT_2026-08-18_full.md#Dette-M2`, généré par commit `8e362a334`
**Chemin exact vérifié** : `src/app/(client)/(ops)/accounting-portal/page.tsx` (593 lignes confirmées `wc -l`)

**Actions** :

1. **Extraire logique métier** vers `src/modules/finance/comptabilite/services/AccountingPortalService.ts`
2. **Fragmenter UI** en 3-5 composants dans `src/modules/finance/comptabilite/components/accountant/` :
   - `<MonthlyClosePackage />` (bouton 1-click)
   - `<AccountantExportsTable />`
   - `<AccountantAccessManager />` (RBAC lecture-seule)
   - `<AccountingPortalHeader />`
3. **Ajouter tests unitaires** :
   - `AccountingPortalService.test.ts` (agrégation, FEC, DGFiP)
   - `MonthlyClosePackage.test.tsx` (comportement bouton, feedback erreur)

**Conséquence** :
- ✅ Cohérence chantier "0 god file" restaurée
- ✅ Testabilité du portail comptable

**Régression possible** : route Next.js `page.tsx` change de forme — vérifier chargement + role gating (rôle `comptable`).

---

### [V2-INFRA-05] Valider DB-agnostic layer sur au moins 1 backend alternatif — DIFFÉRABLE

**Effort** : M (2 j)
**Priorité** : 🟡 Medium (fonctionnalité livrée `7298d59ff` mais non testée)
**Différable jusqu'à post-Vague 3** : tant que Firestore reste le seul provider actif prod, cette validation ne bloque personne. À déclencher **avant** toute annonce commerciale de multi-provider ou tout POC client sur Postgres/Mongo/SQLite.

**Origine** : commit `7298d59ff` livre NexusInfra PITR agnostique + `IServerAuthProvider` étendu, aucun test avec un backend ≠ Firestore

**Actions** :
1. Configurer un container docker `postgres:16` (déjà en dep éventuellement)
2. Implémenter un `PostgresNexusAdapter` minimal (juste `get/set/delete/query`)
3. Écrire un test d'intégration qui rejoue les invariants #2, #3, #4 sur Postgres
4. Documenter dans `docs/BIBLE_TECHNIQUE.html` §27 le matrix "provider × invariant validé"

**Conséquence** :
- ✅ Validation réelle de la promesse "plug-and-play"
- ⚠️ Si Postgres échoue sur invariant #2 (increment atomique), il faut soit corriger l'adapter, soit reconnaître la limite dans §27

**Anticipation** : le vrai risque est que les 5 refactos serveur (`signup`, `assign-role`, etc.) reposent implicitement sur des API Firestore-only. À isoler par tests.

**Rollback** : si Postgres non validable, marquer `IServerAuthProvider` comme "Firestore-only pour l'instant" dans docs.

---

### [V2-IA-06] Tester le RBAC membrane du tool registry Assistant multi-vertical

**Effort** : S (4-6 h)
**Priorité** : 🟠 High (feature livrée `7eff50071`, aucun test)

**Origine** : commit `7eff50071` livre "multi-vertical AI tool registry across 8 sectors with strict RBAC membrane"

**Actions** :
1. Cartographier les tools exposés par sector dans `src/modules/intelligence/ia/tools/registry/`
2. Écrire tests :
```typescript
// src/__tests__/intelligence/tool-registry-rbac.test.ts
it('hotel tenant does not see restaurant-specific tools', () => {
  const tools = getToolsForTenant({ variant: 'hotel', role: 'admin' });
  expect(tools.map(t => t.name)).not.toContain('createReservationDinner');
});

it('waiter role does not see admin tools', () => {
  const tools = getToolsForTenant({ variant: 'restaurant', role: 'serveur' });
  expect(tools.map(t => t.name)).not.toContain('rotateFiscalKey');
});

it('MCC super_admin sees fleet-level tools only when on MCC surface', () => {
  const tools = getToolsForTenant({ variant: 'restaurant', role: 'super_admin', surface: 'tenant' });
  expect(tools.map(t => t.name)).not.toContain('provisionNewTenant');
});
```

**Conséquence** : garantie que la promesse RBAC membrane est réellement enforced (finding sécu latent sinon).

---

### [V2-E2E-07] Auditer specs Playwright livrées (durcir isVisible/catch)

**Effort** : S (4 h)
**Priorité** : 🟠 High (`92e5d2e16`, `6feb31458` — tests peuvent passer verts sur UI cassée)

**Origine** : `AUDIT_2026-08-18_full.md#Tests-H4`

**Actions** :
1. Grep les nouvelles specs livrées cette semaine :
```bash
git diff --name-only 92e5d2e16^..HEAD | rg "\.spec\.ts$"
```
2. Pour chaque spec : remplacer `if (await X.isVisible())` par `await expect(X).toBeVisible()` (fail-loud)
3. Remplacer `.catch(() => {})` par `.catch(err => { throw err })` OU laisser tomber si volontaire (documenter)
4. Activer `webServer` dans `playwright.config.ts` :
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

**Conséquence** : E2E peuvent réellement échouer → utile pour CI.

**Régression possible** : les E2E vont soudain rougir. Prévoir 1 j de fix des specs qui étaient silencieusement vertes.

---

### [V2-FAC-08] Tests unitaires GMAO/facility

**Effort** : M (1-2 j)
**Priorité** : 🟡 Medium (5 commits facility livrés sans tests — dette de couverture)

**Origine** : commits `81487715b`, `cff3479fe`, `f9e4aca26`, `b5300bc56`, `cd7bc6d99`

**Tests à écrire** (minimum viable) :
- `src/__tests__/facility/heatmap-occupancy.test.ts` — calculs de heatmap floor-plan
- `src/__tests__/facility/preventive-maintenance-scheduler.test.ts` — planification cyclique
- `src/__tests__/facility/cleaning-traceability.test.ts` — HACCP + signature
- `src/__tests__/facility/gmao-parc-materiel.test.ts` — CRUD équipements + factures

**Grep barrel** : vérifier zéro import profond `@/modules/facility/spaces/**` (Règle du Barrel).

**Conséquence** : ratio tests unitaires +4 fichiers, dette technique GMAO stabilisée.

---

### 📊 Sortie Vague 2

**Métriques attendues** :
- ✅ 4 verticales gym/coworking/veterinary/florist provisionnables
- ✅ 0 god-file (accountant portal fragmenté)
- ✅ DB-agnostic validé sur ≥ 1 backend
- ✅ RBAC IA testé
- ✅ E2E fail-loud
- ✅ GMAO couvert par 4 tests

**Score audit estimé après Vague 2** : 56 → 62/100 (+6)

---

## 4. Vague 3 — Critiques bloquants NF525 / MCC / Bus (J+7 → J+15)

**Objectif** : traiter les 8 items du Top-10 audit qui touchent zones remaniées cette semaine — chantier majeur, ne peut pas attendre.

### [V3-NF525-01] Étendre SovereignGuard aux SET/UPDATE sur collections immuables

**Effort** : M (2-3 j)
**Priorité** : 🔴 CRITICAL (chaîne NF525 réversible via `Nexus.adapter.set()`)

**Origine** : `AUDIT_2026-08-18_full.md#NF525-C1`
**Fichier** : `src/lib/nexus/NexusInterceptor.ts:242-256`

**Action** :
```typescript
// Ajouter avant la branche WRITE
if (operation === 'WRITE' && this.guard.isFiscallySealed(path)) {
  const existing = await this.adapter.get(path);
  if (existing) {
    throw new NF525_VIOLATION({
      code: 'NF525_IMMUTABLE_WRITE',
      path,
      message: `Cannot SET/UPDATE fiscally sealed document at ${path}`,
    });
  }
  // création initiale autorisée
}
```

**Ajouter `wormArchives`** à `IMMUTABLE_COLLECTIONS` (finding NF525-H1).

**Tests obligatoires** :
```typescript
describe('SovereignGuard immutable write protection', () => {
  it('blocks SET on existing journalEntry', async () => {
    const path = 'tenants/t1/journalEntries/j1';
    await Nexus.adapter.set(path, { ... });  // create OK
    await expect(Nexus.adapter.set(path, { ... }))
      .rejects.toThrow(/NF525_IMMUTABLE_WRITE/);
  });
  it('allows initial SET (create-only semantics)', async () => { ... });
  it('blocks SET on wormArchives', async () => { ... });
});
```

**Conséquence** :
- ✅ Chaîne NF525 non-réécrivable → conformité renforcée
- ⚠️ Impact potentiel : code existant qui faisait update seal (à identifier par grep + tests intégration)

**Grep de risque** :
```bash
rg "\.adapter\.set\(.*journalEntries" src/
rg "\.adapter\.set\(.*fiscalSeals" src/
rg "\.adapter\.update\(.*(journalEntries|fiscalSeals|fiscalLedger|wormArchives)" src/
```
Si résultats > 0 → étudier chaque cas avant blocage strict.

**Rollback** : simple revert, mais tenants qui auraient créé des journalEntries via SET sans SEALER seront cassés → gate obligatoire.

---

### [V3-NF525-02] Câbler `usePrintReceipt` sur `FinancialNexusBridge.processOrder`

**Effort** : M (2-3 j)
**Priorité** : 🔴 CRITICAL (ticket POS violent art. 286-I-3 bis CGI)

**Origine** : `AUDIT_2026-08-18_full.md#NF525-C2`
**Fichiers** :
- `src/app/(client)/(ops)/pos/_hooks/usePrintReceipt.ts:30-66`
- `src/lib/printing/EscPosBuilder.ts` (`appendNf525Footer`)

**Actions** :
1. Refactor `usePrintReceipt` pour dépendre de `FinancialNexusBridge.processOrder()` :
   - Récupérer `receiptNumber` séquentiel serveur
   - Récupérer `fiscalSealHash`
   - Récupérer `siret` du tenant config
2. Retirer l'early-return `if (!ticket.nf525Hash || !ticket.siret) return`
3. Ajouter fallback UX si scellement en cours (loader + retry) plutôt qu'imprimer sans mentions

**Test intégration** :
```typescript
it('POS receipt contains SIRET + NF525 hash + sequential receiptNumber', async () => {
  const receipt = await placeOrderAndPrint({ tenantId: 't1', items: [...] });
  expect(receipt).toContain(/SIRET \d{14}/);
  expect(receipt).toContain(/NF525:/);
  expect(receipt).toMatch(/T-\d{4,}\/\d{4,}/);  // séquentiel, pas Date.now()
});
```

**Conséquence** :
- ✅ Ticket client conforme fiscalement
- ⚠️ Latence impression POS : +200-500 ms (attente sceau serveur) — UX à valider

**Anticipation** :
- Multi-caisse concurrent : dépend de V3-BUS-04 (inFlight) pour ne pas bloquer
- Mode offline : mode dégradé (mention "hors ligne, ticket non conforme, régularisation à J+1")

**Rollback** : impact utilisateur si latence trop forte → feature flag `printReceipt.strictNF525` avec possibilité de désactiver 24 h le temps de fixer un edge case.

---

### [V3-SEC-03] Refactor middleware `/api/admin/*` (JWT au lieu de Bearer statique)

**Effort** : M (2 j)
**Priorité** : 🔴 CRITICAL (100% des routes MCC → 404 en prod, ou MCC_ADMIN_SECRET fuité au client)

**Origine** : `AUDIT_2026-08-18_full.md#Sec-C1`
**Fichiers** :
- `src/middleware.ts:31-32` (`checkAdminApiGate`)
- `src/lib/client/authedFetch.ts:13-29`

**Action** : remplacer la vérif `Authorization === Bearer ${MCC_ADMIN_SECRET}` par une délégation à `adminAuthGuard.requireMccLevel()` :

```typescript
// AVANT
if (auth !== `Bearer ${MCC_ADMIN_SECRET}`) return NextResponse.json({...}, {status: 404});

// APRÈS
try {
  await requireMccLevel(request, 'mcc_junior_dev');  // délégation JWT
  return NextResponse.next();
} catch {
  return NextResponse.json({error: 'Not Found'}, {status: 404});
}
```

**Tests bout-en-bout obligatoires** (hors mock) :
- Login MCC super_admin → GET `/api/admin/fleet/tenants` → 200
- Login tenant user → GET `/api/admin/fleet/tenants` → 404
- Sans token → 404
- Token expiré → 404

**Conséquence** :
- ✅ MCC accessible en prod
- ✅ MFA + Trusted Device Registry restent enforced
- ⚠️ Migration : si `MCC_ADMIN_SECRET` est utilisé quelque part côté serveur-to-serveur, canal séparé à isoler

**Grep** :
```bash
rg "MCC_ADMIN_SECRET" src/ .env*
```
Si résultats hors middleware → canal séparé documenté nécessaire.

**Rollback** : middleware peut redevenir Bearer statique en 1 revert, mais MCC re-cassé.

---

### [V3-BUS-04] Refactor `inFlight` par emissionId unique

**Effort** : M (2 j)
**Priorité** : 🔴 CRITICAL (multi-caisse concurrent bloqué)

**Origine** : `AUDIT_2026-08-18_full.md#Bus-C1`
**Fichier** : `src/shared/eventBus/NexusEventBus.ts:40,137,145,226`

**Action** :
```typescript
// AVANT
private inFlight = new Set<string>();  // event name
if (this.inFlight.has(event)) return;
this.inFlight.add(event);
// ... after execution
this.inFlight.delete(event);

// APRÈS
private inFlight = new Set<string>();  // event:emissionId
const emissionId = crypto.randomUUID();
const key = `${event}:${emissionId}`;
this.inFlight.add(key);
// ... after execution
this.inFlight.delete(key);
```

**Tests** :
```typescript
it('two concurrent order.paid emissions are both dispatched', async () => {
  const spy = vi.fn();
  bus.on('order.paid', spy);
  await Promise.all([
    bus.emit('order.paid', { orderId: 'a' }),
    bus.emit('order.paid', { orderId: 'b' }),
  ]);
  expect(spy).toHaveBeenCalledTimes(2);
});
```

**Conséquence** :
- ✅ Multi-caisse OK
- ⚠️ Si le circuit-breaker existait pour prévenir des cascades infinies, revoir la garde (par ex. throttle par (event, tenantId) plutôt que blocage global)

**Anticipation** : combiné avec V3-BUS-05 et V3-NF525-02, permet enfin le flow "2 caisses paient en même temps sans double-scellement".

---

### [V3-BUS-05] `eventId` obligatoire — ADR-001

**Effort** : L (3-5 j)
**Priorité** : 🔴 CRITICAL (dedup no-op en pratique → double-scellement possible sur crash)

**Origine** : `AUDIT_2026-08-18_full.md#Bus-C2`
**Framing précis (vérifié)** : `IdempotencyGuard.withIdempotencyGuard` (ligne 121) exécute bien `if (eventId) { ... isDuplicate ... }`. Le guard **n'est PAS un no-op absolu** — il est fonctionnel dès qu'un `eventId` est passé. En pratique, aucun schéma dans `src/shared/eventBus/events/*.ts` ne déclare `eventId`, donc la branche `if (eventId)` est toujours fausse → **no-op effectif**. Le fix reste identique : rendre `eventId` obligatoire (auto-injecté).

**Fichiers** :
- `src/shared/eventBus/NexusEventBus.ts` (`emit`, `emitDurable`)
- `src/shared/eventBus/IdempotencyGuard.ts:113-136` (garde déjà correcte, à laisser)
- Tous les schémas events `src/shared/eventBus/events/*.ts` (~170 events) — à étendre avec `BaseEventPayloadSchema`

**Actions** :
1. **Ajouter injection auto** :
```typescript
async emit<T extends EventName>(event: T, payload: EventPayload<T>) {
  const enrichedPayload = {
    ...payload,
    eventId: payload.eventId ?? crypto.randomUUID(),
    emittedAt: payload.emittedAt ?? Date.now(),
  };
  // reste du flow
}
```

2. **Étendre tous les schémas Zod** :
```typescript
// src/shared/eventBus/events/_base.ts
export const BaseEventPayloadSchema = z.object({
  eventId: z.string().uuid(),
  emittedAt: z.number().int(),
});

// pour chaque event : extend(BaseEventPayloadSchema)
```

3. **Refuser en runtime** toute émission sans `eventId` (après période de warn 1 semaine).

**Tests** :
```typescript
it('emit auto-injects eventId if missing', async () => {
  const spy = vi.fn();
  bus.on('order.paid', spy);
  await bus.emit('order.paid', { orderId: 'x' });
  expect(spy.mock.calls[0][0].eventId).toMatch(/^[0-9a-f-]{36}$/);
});

it('IdempotencyGuard blocks duplicate eventId', async () => {
  const spy = vi.fn();
  bus.on('order.paid', spy, { idempotent: true });
  const eventId = crypto.randomUUID();
  await bus.emit('order.paid', { orderId: 'x', eventId });
  await bus.emit('order.paid', { orderId: 'x', eventId });  // duplicate
  expect(spy).toHaveBeenCalledTimes(1);
});
```

**Conséquence** :
- ✅ Idempotence effective sur les 32 handlers déjà marqués `idempotent: true`
- ✅ Base pour marquer les 6 handlers CRITICAL NF525/HACCP/IoT `idempotent: true` (cf. V3-BUS-06)
- ⚠️ Handlers qui reçoivent `payload.eventId` inattendu doivent tolérer (backward compat)

**Migration** : période de warn 1 semaine avec `logger.warn('[Bus] event without eventId', ...)` avant enforcement strict.

**Rollback** : injection auto = backward compat ; strict enforce facultatif via flag.

---

### [V3-BUS-06] Outbox atomique + dedup replay + idempotence CRITICAL

**Effort** : L (5-7 j)
**Priorité** : 🔴 CRITICAL (dépend V3-BUS-05)

**Origine** : `AUDIT_2026-08-18_full.md#Bus-C3`
**Fichiers** :
- `src/shared/eventBus/NexusEventBus.ts:82-115` (`emitDurable`)
- `src/lib/sync/outboxReplayer.ts:12-43` (`replayPendingEvents`)

**Actions** :

1. **Dexie transaction atomique** :
```typescript
async emitDurable<T>(event: T, payload) {
  const eventId = payload.eventId ?? crypto.randomUUID();
  await db.transaction('rw', db.busOutbox, db.busIdempotency, async () => {
    // outbox insert + idempotency check dans MÊME tx
    await db.busOutbox.add({ id: eventId, event, payload, status: 'pending' });
  });
  try {
    await this._dispatch(event, payload);
    await db.busOutbox.update(eventId, { status: 'done', doneAt: Date.now() });
  } catch (err) {
    await db.busOutbox.update(eventId, { status: 'failed', error: String(err) });
    throw err;
  }
}
```

2. **Replay dedup** :
```typescript
async replayPendingEvents() {
  const pending = await db.busOutbox.where('status').equals('pending').toArray();
  for (const entry of pending) {
    // Vérifier idempotency AVANT re-dispatch
    if (await IdempotencyGuard.hasBeenProcessed(entry.id)) {
      await db.busOutbox.update(entry.id, { status: 'done', doneAt: Date.now() });
      continue;
    }
    await this._dispatch(entry.event, entry.payload);
  }
}
```

3. **Marquer handlers CRITICAL `idempotent: true`** :
   - `OrderSealedNF525Handler`
   - `HaccpCorrectiveActionHandler`
   - `IotOfflineAlertHandler`
   - `TicketZHandler`
   - `PeriodLockGuardHandler`
   - `FiscalSealerHandler`

**Tests** :
- Crash simulé entre outbox insert et dispatch → replay ne double-scelle pas
- 2 emitDurable concurrents avec même eventId → 1 seul scellement

**Conséquence** :
- ✅ NF525 crash-safe
- ✅ Handlers CRITICAL idempotents effectivement
- ⚠️ Performance : transaction Dexie légèrement plus lourde (mesure requise)

**Anticipation** : côté serveur, `dispatchServerEvent` court-circuite outbox (finding Bus-H2) — le fix serveur est un sous-projet à part (voir V3-BUS-07).

---

### [V3-BUS-07] `dispatchServerEvent` outbox + DLQ serveur

**Effort** : L (5 j)
**Priorité** : 🟠 High (Bus-H2)

**Fichiers** : `src/shared/eventBus/*` + `src/lib/server/*`

**Contexte** : côté serveur (routes API, cron), les events critiques CRITICAL émis lors d'un crash sont perdus car outbox/DLQ sont gardés `if (typeof window !== 'undefined')`.

**Actions** :
1. Créer un `ServerOutboxAdapter` (Firestore-backed) analogue au Dexie côté client
2. Adapter `IdempotencyGuard` côté serveur pour utiliser Redis / Firestore de dedup
3. Publier `dispatchServerEvent` avec la même sémantique atomique

**Tests** : E2E via emulator Firestore + kill process.

**Rollback** : garde le `typeof window` en fallback si le serveur devient instable.

---

### [V3-SEC-08] `/api/v1/menu` — auth + rate-limit

**Effort** : S (4 h)
**Priorité** : 🟠 High (exfiltration catalogues)

**Origine** : `AUDIT_2026-08-18_full.md#Sec-H3`
**Fichier** : `src/app/api/v1/menu/route.ts:7-30`

**Action** — 2 modes :
- **Mode A (tenant privé, par défaut)** : `requireTenantUser` + `tenantId === caller.tenantId`
- **Mode B (vitrine publique opt-in)** : si `tenantConfig.publicMenuEnabled === true`, retourner un sous-ensemble `showcaseVisible=true` + rate-limit IP (10 req/min)

**Test** :
- Sans token, tenantId arbitraire → 401
- Sans token, tenantId avec `publicMenuEnabled=false` → 401
- Sans token, tenantId avec `publicMenuEnabled=true` → 200 sous-ensemble showcase

**Conséquence** : catalogues protégés par défaut, opt-in vitrine explicite.

---

### [V3-A11Y-09] Modal ARIA + focus trap (ADR-005)

**Effort** : S (4-6 h)
**Priorité** : 🟠 High (corrige 15+ écrans dont les 12 God-Files fragmentés cette semaine)

**Origine** : `AUDIT_2026-08-18_full.md#A11y-C1`
**Fichier** : `src/shared/components/ui/Modal.tsx`

**Actions** :
1. Ajouter `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
2. Wrap contenu dans `FocusTrap` (installer `focus-trap-react` ou impl minimal)
3. Ajouter `aria-label="Fermer"` sur bouton X
4. Restaurer focus à l'élément d'origine au close
5. Ajouter dans root layout : `<MotionConfig reducedMotion="user">` (framer-motion)

**Test** :
```typescript
it('Modal exposes dialog role and focus trap', () => {
  render(<Modal open><h2 id="title">Test</h2></Modal>);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAttribute('aria-labelledby', 'title');
});
```

**Conséquence** : 15+ dialogues métier deviennent WCAG-conformes en 1 patch.

---

### 📊 Sortie Vague 3

**Métriques attendues** :
- ✅ 13 critical → **0** (tous traités)
- ✅ Chaîne NF525 immuable même en écriture
- ✅ Ticket POS conforme
- ✅ Multi-caisse OK
- ✅ MCC accessible en prod
- ✅ Idempotence effective + crash-safe
- ✅ Modales accessibles

**Score audit estimé après Vague 3** : 62 → 72/100 (+10)

---

## 5. Vague 4 — Gouvernance & ADRs (parallèle continu)

**Objectif** : institutionnaliser les décisions pour éviter la re-régression.

### [V4-ADR-01] Rédiger et publier 5 ADRs

Créer `docs/adrs/` avec 5 documents :
- **ADR-001** : `eventId` obligatoire (préreq V3-BUS-05)
- **ADR-002** : Fusion des 5 sources RBAC
- **ADR-003** : Stratégie "écritures sensibles client"
- **ADR-004** : Canonicalisation 4 sources verticales
- **ADR-005** : Contrat clavier + ARIA global

**Format** : template minimal : Contexte / Décision / Conséquences / Alternatives rejetées.

**Effort** : S (4-6 h chacune ; 5 × S ≈ M total, faisable pendant Vagues 2-3).

### [V4-GATE-02] Renforcer `preflight.sh`

**Ajouts** :
- `npx madge --circular src/modules --exit-code 1`
- `npx eslint --max-warnings 0 --plugin jsx-a11y src/`
- Compteur `eslint-disable` avec seuil (baseline actuelle : 116, seuil : 116, décrément trimestriel)

### [V4-HOOK-03] Rendre `check-session-collision.sh` bloquant

**Fichier** : `.claude/hooks/check-session-collision.sh`
**Action** : `exit 0` → `exit 2` sur collision `active`.

### [V4-CI-04] Script `npm run preflight` + `.husky/pre-push`

**Actions** :
- Ajouter `"preflight": "./scripts/preflight.sh"` dans `package.json`
- Créer `.husky/pre-push` :
```bash
#!/usr/bin/env sh
npx tsc --noEmit && npx vitest run && sentrux check .
```

### [V4-DOC-05] Mettre à jour `ARCHITECTURE.md` et CLAUDE.md

**Actions** :
- `ARCHITECTURE.md` : passer date à 2026-08-18, ajouter pilier `facility`, retirer référence à `kds` comme pilier autonome
- CLAUDE.md : documenter `franchise/` (post V1-ARCH-09), `menu-builder/`, `catalog/`, `forecasting/`, `simulation/`, `fleet/`, `conventions/` — ou les rattacher
- README.md racine : documenter 8 piliers, Nexus, preflight, tests

---

## 5-bis. Vague 5 — Corrections métier issues d'anglemort.md (J+15 → J+45)

**Objectif** : combler les angles morts business identifiés par le référentiel `anglemort.md` (45 blind spots) que l'audit technique ne pouvait pas voir.
**Dépendance** : rapport `anglemort × code` (livré par PREREQ-08 en J+1).
**Structure** : cette Vague n'est **détaillée qu'à posteriori**, après lecture du rapport. La section ci-dessous cadre les 8 clusters attendus et le format de traitement — chaque cluster deviendra un ensemble d'actions `[V5-<zone>-<seq>]` avec la même granularité que les Vagues 1-4.

### 5-bis.1 Cadrage des 8 zones anglemort

| Zone | Angles concernés | Preuves techniques attendues |
|------|------------------|------------------------------|
| **FOH** — Salle/Service/Encaissement | Note provisoire, rendu monnaie, note volée, split par item glitch, table transférée sans traçabilité | POS split logic + audit log transfers |
| **BOH** — Cuisine/KDS/Coup de feu | KDS multi-poste conflict, plat renvoyé sans traçabilité, ticket 86, chrono d'attente | KDS conflict resolution + 86 event bus |
| **SRM** — Approvisionnement/Réception | Livraison 05h30 non contrôlée, factures perdues, ruptures cachées, produits périmés à réception | Reception workflow + WORM archive factures |
| **NF525** — Fiscalité/TVA/Clôture Z | Ticket fantôme, modification post-scellement, TVA appliquée hors-service, Z manuel non signé | V3-NF525-01 + V3-NF525-02 déjà couverts + audit ligne à ligne |
| **HCR** — Ressources humaines / Droit travail | Pointeuse contournée, coupures illégales, HS non payées, ruptures conventionnelles | Pointeuse + payroll + heures hebdomadaires |
| **HACCP** — Hygiène/Fraîcheur/PMS | DLC dépassée non alertée, chaîne du froid rompue, PMS non tenu, TIAC | IoT temp + HACCP logs + PMS auto |
| **Hardware** — Périphériques physiques | Imprimante ticket morte silencieuse, TPE hors ligne, tiroir caisse forcé, backup absent | Hardware health probe + failover + POS offline mode |
| **RBAC** — Sécurité/Ingénierie sociale | PIN faible, session partagée, ex-employé actif, phishing manager, backdoor code | RBAC + rotation PIN + session revoke + SSO |

### 5-bis.2 Format d'action attendu (template)

Chaque angle mort → 1 action au format :

```markdown
### [V5-<ZONE>-<seq>] <Titre angle mort>

**Angle mort source** : anglemort.md #<numéro> — "<titre exact>"
**Statut audit** : COUVERT / PARTIEL / ABSENT
**Preuve technique actuelle** : <fichier:ligne> OU "aucune"
**Effort** : XS / S / M / L / XL
**Priorité** : 🔴 / 🟠 / 🟡 / 🔵
**Impact business** : € estimés / mois si non traité (cf. Loop 5 anglemort §5)

**Actions** : ...
**Tests** : ...
**Conséquence** : ...
**Régression possible** : ...
**Rollback** : ...
```

### 5-bis.3 Anticipation — 3 angles morts déjà connus par l'équipe

Sans attendre le rapport, 3 chantiers sont **quasi-certains** d'apparaître :

- **[V5-FOH-01 candidat] — Table transférée sans traçabilité** — commit `679e371f0` a purgé SOS button, mais aucun audit log sur transfer table. Effort S.
- **[V5-HACCP-01 candidat] — Chaîne du froid : alerte IoT partielle** — cf. finding audit `HaccpCorrectiveActionHandler` non idempotent (traité en V3-BUS-06). Compléter avec alerte SMS < 5 min sur seuil critique.
- **[V5-RBAC-01 candidat] — Ex-employé actif** — aucune revocation session automatique sur suppression compte. Effort M.

### 5-bis.4 Critère d'entrée Vague 5

- ✅ Rapport `anglemort × code` reçu (livré par PREREQ-08)
- ✅ Vague 3 terminée (les critiques techniques sont fixés, base saine)
- ✅ Équipe métier disponible pour valider chaque V5-* (chaque angle mort nécessite validation "acceptabilité risque")

### 5-bis.5 Budget prévisionnel Vague 5

- **Volume attendu** : 15-25 actions issues du rapport
- **Effort total** : L à XL (2-4 semaines)
- **Score audit métier estimé** : 0 → 60/100 (score business, à définir avec équipe)

---

## 6. Matrice des dépendances

```
PREREQ (30 min)
  └── Vague 1 (J+0 → J+1)
        ├── V1-WT-01 (working tree)
        ├── V1-SESSIONS-02 (fantômes)
        ├── V1-RBAC-03 (owner role)  ────┐
        │   └── V1-RBAC-04 (Assistant IA) ┘
        ├── V1-MCC-05 (PIN email)
        ├── V1-VERT-06 (custom DNA)  ────┐
        ├── V1-BUS-07 (catch silent)      │
        ├── V1-SEC-08 (dev bypass guard)  │
        └── V1-ARCH-09 (franchise canon)  │
                                          │
  Vague 2 (J+2 → J+6)                    │
        ├── V2-VERT-01 (aligner 4 sources) ◄─ dépend V1-VERT-06
        │   └── V2-VERT-02 (script migration)
        │       └── V2-VERT-03 (adapters 4 verticales)
        ├── V2-DETTE-04 (accountant portal)
        ├── V2-INFRA-05 (DB-agnostic test)
        ├── V2-IA-06 (RBAC IA test)
        ├── V2-E2E-07 (Playwright durcir)
        └── V2-FAC-08 (tests GMAO)
              │
  Vague 3 (J+7 → J+15)
        ├── V3-NF525-01 (SET/UPDATE bloqué) ◄─ indépendant
        ├── V3-NF525-02 (usePrintReceipt) ◄─ dépend V3-BUS-04 (multi-caisse)
        ├── V3-SEC-03 (middleware admin JWT)
        ├── V3-BUS-04 (inFlight emissionId) ◄─ prérequis V3-BUS-05, V3-BUS-06
        ├── V3-BUS-05 (eventId obligatoire) ◄─ prérequis V3-BUS-06
        │   └── V3-BUS-06 (outbox atomique + idempotence CRITICAL)
        │       └── V3-BUS-07 (dispatchServerEvent outbox)
        ├── V3-SEC-08 (menu auth)
        └── V3-A11Y-09 (Modal ARIA)
              │
  Vague 4 (parallèle continu)
        ├── V4-ADR-01 → 05
        ├── V4-GATE-02
        ├── V4-HOOK-03
        ├── V4-CI-04
        └── V4-DOC-05

  Vague 5 (J+15 → J+45) — alimentée par PREREQ-08 (audit anglemort)
        ├── Attend rapport anglemort × code (livré J+1)
        ├── Attend Vague 3 close (base saine)
        └── 15-25 actions V5-<zone>-<seq> à détailler post-rapport
```

**Chemin critique** : PREREQ → V1-RBAC-03 → V2-VERT-01 → V3-BUS-04 → V3-BUS-05 → V3-BUS-06 → V3-NF525-02 → V5-* (métier)

### 6-bis. Timeline visuelle (Gantt ASCII)

Jours en abscisse (J+0 = aujourd'hui 2026-08-18). Barres = fenêtre d'exécution recommandée.

```
                   J+0    J+2    J+4    J+6    J+8    J+10   J+12   J+14   J+16   J+30   J+45
                   │      │      │      │      │      │      │      │      │      │      │
PREREQ 01-09       █▌
V1-WT-01           █▌
V1-SESSIONS-02     ▌
V1-RBAC-03         ██
V1-RBAC-04           ▌
V1-MCC-05          ▌
V1-VERT-06         ▌
V1-BUS-07          ▌
V1-SEC-08          ▌
V1-ARCH-09          █
                   │      │      │      │      │      │      │      │      │      │      │
V2-VERT-01                ████
V2-VERT-02                    ██
V2-VERT-03                      ████████
V2-DETTE-04               ████
V2-INFRA-05                            ████ (différable)
V2-IA-06                       ██
V2-E2E-07                      ██
V2-FAC-08                           ████
                   │      │      │      │      │      │      │      │      │      │      │
V3-NF525-01                                    ████
V3-NF525-02                                       ████    (dépend V3-BUS-04)
V3-SEC-03                                      ████
V3-BUS-04                                     ████
V3-BUS-05                                         ██████
V3-BUS-06                                              ██████████ (dépend V3-BUS-05)
V3-BUS-07                                                        ██████
V3-SEC-08                                                ██
V3-A11Y-09                                                 ██
                   │      │      │      │      │      │      │      │      │      │      │
V4-ADR-01→05                     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (parallèle continu)
V4-GATE-02→05                          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                   │      │      │      │      │      │      │      │      │      │      │
V5 (métier)                                                              ████████████████████
                   │      │      │      │      │      │      │      │      │      │      │
Audit anglemort    ═══════▶ (background, rapport J+1)
```

**Légende** : █ = travail principal · ▓ = continu/parallèle · ═ = agent background · ▌ = < 4h

**Jalons clés** :
- **J+1 soir** : Vague 1 close → tenant provisionné utilisable
- **J+6** : Vague 2 close → verticales usables + accountant refactored
- **J+15** : Vague 3 close → NF525 crash-safe + MCC prod-safe
- **J+45** : Vague 5 close → risques métier anglemort mitigés

---

## 7. Anticipation des conséquences et régressions

### 7.1 Périmètres à haut risque de régression

| Périmètre | Actions concernées | Risque | Mitigation |
|-----------|-------------------|:-----:|-----------|
| **Provisioning tenants** | V1-RBAC-03, V1-MCC-05, V2-VERT-01, V2-VERT-02 | 🔴 | Test manuel sur tenant demo AVANT prod. Snapshot Firestore avant V2-VERT-02. |
| **POS impression tickets** | V3-NF525-02 | 🔴 | Feature flag `printReceipt.strictNF525` avec possibilité d'off 24h. |
| **Bus événementiel** | V3-BUS-04, V3-BUS-05, V3-BUS-06 | 🔴 | Période warn 1 semaine avant enforce strict eventId. Snapshot des outbox pending avant migration atomique. |
| **Middleware admin** | V3-SEC-03 | 🔴 | Tests E2E manuels sur staging avec vrai MFA + Trusted Device avant prod. |
| **Verticales enum Zod** | V2-VERT-01 | 🟠 | Runtime fallback `variant='restaurant'` + log warn pendant 1 sprint. |
| **Modal 15+ écrans** | V3-A11Y-09 | 🟡 | Test visuel : capture avant/après sur les 15 modales pour QA. |

### 7.2 Effets de bord attendus

- **V3-BUS-05 + V3-BUS-06** : les logs Sentry vont augmenter le temps que l'idempotence effective identifie les emissions dupliquées historiques.
- **V3-NF525-01** : possible que des jobs de maintenance interne (rejeu, réparation) qui faisaient `.set()` sur seals soient cassés — cartographie obligatoire avant.
- **V2-VERT-01** : les tenants système `_demo_*` de la SystemTenantRegistry (24 tenants) doivent tous avoir un variant valide — sinon échec de bootstrap.
- **V3-SEC-03** : si `MCC_ADMIN_SECRET` était utilisé pour cron server-to-server, un canal séparé (webhook signature HMAC) doit être créé.
- **V1-VERT-06** : anciens tenants créés avec `variant='custom'` héritaient de restaurant DNA implicitement — leurs capabilities peuvent CHANGER après le fix. Test manuel sur tenant custom existant.

### 7.3 Effets sur perf & bundle

- **V3-A11Y-09** : `focus-trap-react` ajoute ~2 KB gzipped, négligeable.
- **V3-BUS-06** : transactions Dexie plus longues → mesurer perceived latency POS (attendu +10-30 ms par emit durable, acceptable).
- **V3-NF525-02** : impression ticket +200-500 ms (attente sceau) — UX à valider avec loader.

### 7.4 Sessions collision anticipées

- **V1-RBAC-03** touche `provisioningSteps.ts` — collision avec périmètre `db-agnostic-plugplay` (session terminée mais fichiers récents).
- **V3-BUS-05** touche 170 event schemas — collision avec toute session future sur events. Fenêtre serrée conseillée.
- **V2-VERT-01** touche 4 domaines et `PlatformVariant` — collision avec toute nouvelle vertical ou seed.

---

## 8. Stratégie de rollback par vague

### 8.1 Rollback Vague 1

- Aucune migration DB. Chaque action = 1 commit atomique.
- `git revert <commit>` sur chaque action isolable.
- Session `plan-correction-semaine` marque chaque action comme `[V1-XXX-YY] REVERTED (motif)` dans journal.

### 8.2 Rollback Vague 2

- **V2-VERT-02** (script migration) : dump JSON avant/après → restore possible.
- **V2-VERT-01** : `PLATFORM_VARIANTS` peut redevenir liste statique (revert commit) mais **NE PAS** revert si de nouveaux tenants créés entre-temps avec variant hors ancienne liste.
- **V2-DETTE-04** : page.tsx peut être reconstitué depuis les commits d'extraction (garder les commits atomiques).

### 8.3 Rollback Vague 3

- **V3-NF525-01, V3-NF525-02** : feature-flaggés → off runtime possible sans revert code.
- **V3-BUS-04** : revert commit safe (inFlight = variable en mémoire, pas d'état persisté).
- **V3-BUS-05, V3-BUS-06** : revert **partiel** possible :
  - Enforce strict eventId → warn-only via flag
  - Transaction Dexie → non-transactional via flag
- **V3-SEC-03** : revert simple, MCC redevient inaccessible temporairement (mais on savait ça).

### 8.4 Rollback Vague 4

- Purement documentaire + config → revert simple.

---

## 9. Métriques de sortie & critères d'acceptation

### 9.1 Métriques quantitatives

| Métrique | T+0 | Vague 1 | Vague 2 | Vague 3 | Vague 4 | Vague 5 |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|
| Score audit global | 52 | 56 | 62 | **72** | 75 | 75 |
| Score audit métier (anglemort) | 0 | 0 | 0 | 0 | 0 | **60** |
| 🔴 Critical | 13 | 7 | 5 | **0** | 0 | 0 |
| 🟠 High | 39 | 34 | 26 | 16 | ≤ 10 | ≤ 10 |
| God files | 10 | 10 | 9 | 9 | 8 | 8 |
| Cycles Madge | 0 | 0 | 0 | 0 | 0 | 0 |
| Tests unitaires | 176 | 178 | 190 | 205 | 210 | 230+ |
| Sessions active fantômes | 2 | 0 | 0 | 0 | 0 | 0 |
| Angles morts anglemort résolus | 0 | 0 | 0 | 3 (via V3) | 3 | 15-25 |

### 9.2 Critères d'acceptation métier

- ✅ Un nouveau tenant provisionné peut se connecter au premier login avec son PIN
- ✅ Un tenant `variant='gym'` peut être provisionné et voit ses capabilities correctes
- ✅ 2 paiements POS simultanés sur 2 caisses ne bloquent pas et ne double-scellent pas
- ✅ Un ticket POS imprimé porte SIRET + hash NF525 + numéro séquentiel
- ✅ MCC super_admin accède à `/api/admin/fleet/tenants` en prod avec MFA
- ✅ 15+ dialogues métier accessibles au clavier + lecteur d'écran

### 9.3 Critères techniques

- ✅ `npx tsc --noEmit` : 0 erreur
- ✅ `npx vitest run` : 100 % tests passent
- ✅ `sentrux check .` : baseline v2.0 respectée
- ✅ `npx madge --circular src/modules` : 0 cycle
- ✅ `git status --short` : working tree propre (ou explicitement stashé)
- ✅ `.claude/sessions.md` : aucune session `active` orpheline > 3 j

---

## 9-bis. Assignation par session (coordination sessions.md)

Chaque vague se déclare comme session distincte dans `.claude/sessions.md` pour éviter les collisions. Périmètres et fenêtres :

| Session | Périmètre déclaré | Fenêtre | Collisions possibles |
|---------|-------------------|---------|----------------------|
| `prereq-runtime-gate` | `.claude/sessions.md` + working tree consolidation + PREREQ 01→09 | J+0 (30 min) | Bloquant : toutes sessions futures attendent |
| `vague-1-hygiene` | `src/lib/mcc/provisioning/`, `src/lib/server/adminAuthGuard.ts`, `src/modules/finance/comptabilite/FinancialNexusEvents.ts`, `src/shared/seeds/`, `src/modules/commerce/franchise/` (mv) | J+0 → J+1 | Aucune si Vague 1 exclusive |
| `vague-2A-verticals` | `src/modules/system/domain/schemas/tenant.ts`, `src/verticals/`, `src/shared/seeds/`, `src/modules/{commerce/relation/appointments, facility/spaces/{rooms,bays}, ops/service/consultation}/` | J+2 → J+6 | ⚠️ collision seeds/tenant.ts avec `vague-1` — séquentiel obligatoire |
| `vague-2B-dette` | `src/app/(client)/(ops)/accounting-portal/`, `src/modules/finance/comptabilite/services/` | J+2 → J+4 | Indépendante de 2A |
| `vague-2C-infra-tests` | `docker-compose.yml`, `docs/BIBLE_TECHNIQUE.html`, `src/__tests__/**` | J+4 → J+8 | Indépendante |
| `vague-2D-e2e-facility` | `playwright.config.ts`, `tests/e2e/`, `src/__tests__/facility/` | J+3 → J+6 | Indépendante |
| `vague-3-nf525-mcc` | `src/lib/nexus/NexusInterceptor.ts`, `src/app/(client)/(ops)/pos/_hooks/`, `src/middleware.ts`, `src/shared/eventBus/**`, `src/shared/components/ui/Modal.tsx` | J+7 → J+15 | ⚠️ Bus/eventBus zone chaude — session exclusive |
| `vague-4-adr` | `docs/adrs/`, `scripts/preflight.sh`, `.claude/hooks/`, `.husky/`, `ARCHITECTURE.md`, `README.md` | Parallèle continu | Aucune si limité aux fichiers docs/tooling |
| `vague-5-metier` | À définir après rapport anglemort | J+15 → J+45 | À évaluer après réception rapport |

**Règle absolue** : deux sessions ne peuvent pas être `active` simultanément sur le même **fichier**. Le hook `check-session-collision.sh` doit devenir bloquant (V4-HOOK-03) avant Vague 3 pour éviter des collisions Bus événementiel.

**Séquentiel obligatoire** : `vague-1-hygiene` → `vague-2A-verticals` (touchent DNA_REGISTRY). Autres vagues 2 en parallèle possible.

---

## 10. Journal d'exécution — template

À tenir à jour dans `.claude/sessions.md` sous la session `plan-correction-semaine`.

```markdown
### Journal d'exécution PLAN_CORRECTION_2026-08-18.md

| ID | Action | Statut | Commit | Notes |
|----|--------|:------:|--------|-------|
| PREREQ-01 | Vérifier TSC 0 | ⬜ | — | — |
| PREREQ-02 | Vitest passant | ⬜ | — | — |
| PREREQ-03 | Cycles Madge | ⬜ | — | — |
| PREREQ-04 | Sentrux check | ⬜ | — | — |
| PREREQ-05 | Working tree explicité | ⬜ | — | — |
| PREREQ-06 | Fermer sessions fantômes | ⬜ | — | — |
| V1-WT-01 | Committer working tree | ⬜ | — | 4 commits atomiques prévus |
| V1-SESSIONS-02 | Sessions fantômes | ⬜ | — | — |
| V1-RBAC-03 | Fix role owner | ⬜ | — | Option A/B ? |
| V1-RBAC-04 | Assistant IA rôles | ⬜ | — | Post V1-RBAC-03 |
| V1-MCC-05 | PIN email | ⬜ | — | — |
| V1-VERT-06 | CUSTOM_FULL_DNA | ⬜ | — | — |
| V1-BUS-07 | catch silent | ⬜ | — | — |
| V1-SEC-08 | dev bypass guard | ⬜ | — | — |
| V1-ARCH-09 | franchise canon | ⬜ | — | Option A/B/C ? |
| V2-VERT-01 | 4 sources aligned | ⬜ | — | — |
| ... | ... | ... | ... | ... |
```

**Légende** : ⬜ à faire · 🟨 en cours · ✅ fait · ❌ bloqué · ↩️ reverted

---

## 📎 Annexes

### A. Correspondance findings audit → actions plan

| Finding audit | Action plan |
|---------------|-------------|
| Sec-C1 | V3-SEC-03 |
| Sec-H1 | V1-SEC-08 |
| Sec-H3 | V3-SEC-08 |
| NF525-C1 | V3-NF525-01 |
| NF525-C2 | V3-NF525-02 |
| NF525-H1 | V3-NF525-01 (inclus) |
| RBAC-C1 | V1-RBAC-03 |
| RBAC-L1 | V1-RBAC-04 |
| Dette-M2 (593L) | V2-DETTE-04 |
| Tests-H4 | V2-E2E-07 |
| Tests-H5 (webServer) | V2-E2E-07 |
| Vert-C1 | V2-VERT-01 |
| Vert-C2 | V2-VERT-01 (modules vides) |
| Vert-H1 | V1-VERT-06 |
| Vert-H2 | V2-VERT-03 |
| Vert-M4 (luxury_vault) | V2-VERT-01 |
| MCC-H1 | V1-MCC-05 |
| Bus-C1 | V3-BUS-04 |
| Bus-C2 | V3-BUS-05 |
| Bus-C3 | V3-BUS-06 |
| Bus-H2 | V3-BUS-07 |
| Bus-H4 | V1-BUS-07 |
| A11y-C1 | V3-A11Y-09 |
| Arch-H1 | V4-GATE-02 (long terme) |
| Arch-M1 (domaines non canoniques) | V1-ARCH-09 |
| Doc-M5 (sessions fantômes) | V1-SESSIONS-02 |

### B. Commits de la semaine — statut de couverture

Chaque commit livré 15-17/08 est-il stabilisé par une action du plan ?

| Commit | Zone | Couverture plan |
|--------|------|-----------------|
| `9054d08c1` refactor arch 8 piliers | Architecture | V1-ARCH-09 (franchise) + V4-DOC-05 |
| `b092f6142` franchise | Commerce | V1-ARCH-09 |
| `7298d59ff` DB-agnostic | Infra | V2-INFRA-05 |
| `7eff50071` AI tool registry | Intelligence | V2-IA-06 |
| `cae20d351` global assistant | Intelligence | V2-IA-06 (indirect) + V1-WT-01 |
| `8e362a334` accountant portal | Finance | V2-DETTE-04 |
| `b41779ffa` 12 verticals blueprints | Verticals | V2-VERT-01 |
| `cabf1f436` universal 8 pillars | Verticals | V2-VERT-01 |
| `92e5d2e16`, `6feb31458` E2E | Tests | V2-E2E-07 |
| `81487715b`, `cff3479fe`, `f9e4aca26`, `b5300bc56`, `cd7bc6d99` GMAO | Facility | V2-FAC-08 |
| `1a993be26`, `e581d2b72` ML | Intelligence | ✅ pas d'action requise (fonctionnel autonome) |
| `a6711035a` DeliveryWebhookBridge | Commerce | ✅ pas d'action (bien fait) |
| `d54cd78c8` acompte groupes | Commerce | ✅ pas d'action (backlog H1 fait) |
| `97c526112` invariant #2 stock | Logistics | ✅ pas d'action (bien fait) |
| `c7e4523e7` OpenAPI 3.0 | API | ✅ pas d'action (mais V3-SEC-08 sécurise `/api/v1/menu`) |
| `ab1942dda` legal e-sign | Compliance | ✅ pas d'action (autonome) |
| `dacab4c22`, `c07a4d853` RBAC | RBAC | V1-RBAC-03, V1-RBAC-04 (finition) |
| `5bb19de57`, `a0a08cbaf`, `9260dad5e` God files | Refacto | ✅ pas d'action (dette réduite) |
| `1335f9785` isolation multi-tenant | Sécurité | V1-SEC-08 (complément) |
| `3d6a1826d` PII logger | Sécurité | ✅ pas d'action (bien fait) |

**Verdict** : 100 % des livraisons semaine sont soit stabilisées, soit autonomes. Aucune ne reste "à moitié faite" post-Vague 3.

### C. Audits parallèles intégrés au plan

- **Anglemort × code** : ~~lancement d'un agent séparé~~ **intégré** via PREREQ-08 (lancement T+30 min), rapport livré J+1 → alimente Vague 5 (section 5-bis).
- **DB-agnostic validation** : intégré via V2-INFRA-05 (différable post-Vague 3).
- **Invariants #5, #6, #7** : intégré via PREREQ-07 (vérification runtime obligatoire).

### C-bis. Audits hors périmètre (à programmer séparément)

- **Pentest offensif** : à programmer trimestre 2 (hors périmètre code).
- **Audit LNE/AFNOR NF525** : dossier d'homologation tiers (hors périmètre code).
- **Refonte i18n active** : infra présente mais inactive volontairement (cf. CLAUDE.md).
- **Migration cloud provider ≠ GCP** : pas de signal métier.
- **Refonte design system** : audit UI global de 07/08 déjà couvert.

---

**Fin du plan.**

**Prochaine action** : lancer PREREQ (30 min) → si vert, commencer V1-WT-01.
