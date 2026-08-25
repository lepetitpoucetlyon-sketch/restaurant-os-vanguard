# Plan — Documentation Vérifiable (Zero-Claim Policy)

> Rédigé le **2026-08-25** · ground truth mesuré sur `main@4faace4cd`
> Objectif : rendre impossible qu'une affirmation fausse survive dans la doc du projet.
> Plan connexe : `docs/plans/PLAN-DETTE-TECHNIQUE-2026-08-25.md`

---

## 1. Le problème, avec les preuves du jour

À 326 000 lignes maintenues majoritairement par des agents, **une doc fausse coûte plus cher qu'un bug**.
Un bug, les gates l'attrapent. Une affirmation fausse, rien ne l'attrape — et elle se propage : chaque agent qui la lit prend une décision confiante et erronée, vite, en parallèle.

**Cinq croyances fausses trouvées en une seule journée d'investigation :**

| Source | Ce qui était écrit / cru | Réalité mesurée |
|---|---|---|
| `CLAUDE.md` | « i18n — **0 composant UI ne l'utilise**, inactive » | 33 fichiers `.tsx`, 120 appels `t()`, infra câblée |
| Plan d'audit | « ~496 occurrences `InCents` » | **821** |
| `.sentrux/baseline.json` + plan | « 2 cycles d'import à corriger » | Probables faux positifs (madge/tsc/build = 0) |
| Plan d'audit | « modules `appointments`/`consultation` vides à remplir » | La logique existait déjà dans `verticals/` |
| Oral (2026-08-25) | « le projet est entièrement DB **et** LLM agnostique » | Vrai pour DB et LLM — **faux pour l'auth** (17 fichiers couplés Firebase, aucune interface `IAuthProvider`) |

**Le mécanisme est toujours le même :** quelqu'un mesure une fois, écrit le chiffre en prose, le code évolue, la prose reste.

Le cas i18n est le plus instructif — c'était une **prophétie auto-réalisatrice** :
`CLAUDE.md` disait « inactive, ne pas câbler sans décision » → chaque agent évitait de câbler → ça restait inactif.

---

## 2. Le principe : trois destins possibles pour toute affirmation

> **Toute phrase de la documentation projet contenant un chiffre, un « 0 / aucun / tous / jamais », ou un état système doit être : GÉNÉRÉE, TESTÉE, ou SUPPRIMÉE.**

| Destin | Pour quoi | Mécanisme | Exemple |
|---|---|---|---|
| **GÉNÉRÉE** | Faits qui **dérivent** dans le temps | `health-snapshot.sh` → `docs/HEALTH.md` | « couverture i18n : 33/902 » |
| **TESTÉE** | **Invariants** qui ne doivent jamais casser | test Vitest qui échoue si l'affirmation devient fausse | « 0 SDK LLM hardcodé » |
| **SUPPRIMÉE** | Ni l'un ni l'autre → c'est une opinion, pas un fait | retrait pur | « le code est propre » |

**Corollaire :** `CLAUDE.md` ne doit plus contenir aucun chiffre en dur. Il contient des **règles** (invariants, conventions, interdits) et **pointe** vers les faits générés.

---

## 3. CHANTIER A — Passer `CLAUDE.md` au crible

### A.1 Inventaire des affirmations chiffrées à traiter

Relevé exhaustif des claims factuels actuellement présents dans `CLAUDE.md` :

| # | Affirmation actuelle | Destin | Action |
|---|---|---|---|
| 1 | « i18n : 33 fichiers `.tsx` sur 902 (3,6 %), 120 appels `t()` » | **GÉNÉRÉE** | Remplacer par un renvoi vers `HEALTH.md` |
| 2 | « `fr.ts` (482 clés) et `en.ts` (500 clés) complètes, `es/pt/ja` partielles (~25 %) » | **GÉNÉRÉE** | Idem |
| 3 | « Tests (175 suites, 1120+ tests) » — **déjà périmé** (réel : 2 319) | **GÉNÉRÉE** | Idem |
| 4 | « Système multi-tenant en 8 piliers » | **TESTÉE** | Test : `src/modules/` contient exactement les 8 piliers listés |
| 5 | Tableau piliers → domaines → modules | **TESTÉE** | Test : chaque `<pilier>/<domaine>/` du tableau existe sur disque |
| 6 | « 1 microunit = 0,000 001 € » | **TESTÉE** | Test sur `toMicrounits()` (probablement déjà couvert) |
| 7 | « `journalEntries`, `fiscalSeals`, `fiscalLedger` : jamais delete/update » | **TESTÉE** | ✅ existe déjà — `WormImmutableCollections.test.ts` |
| 8 | « Toute écriture Nexus : path `tenants/{tenantId}/...` » | **TESTÉE** | ✅ existe déjà — `SovereignGuard.test.ts` + `multi-tenant-isolation.test.ts` |
| 9 | « Variants supportés : restaurant \| hotel \| ... \| custom » (8 listés) | **TESTÉE** | Test : `src/verticals/` contient exactement les variants du schéma — ⚠️ le doc en liste **8**, le disque en a **12** |
| 10 | « ADR-001 … ADR-017 » (17 ADRs) | **TESTÉE** | Test : chaque ADR listé existe dans `docs/adrs/` |
| 11 | Liste « Fichiers clés » (7 chemins) | **TESTÉE** | Test : chaque chemin existe |
| 12 | Routes ICM-lite (`/pos`, `/kds`, `/finance`…) → modules chargés | **TESTÉE** | Test : chaque route du tableau a une entrée dans `TASK_MAPS` |

> ⚠️ **Divergence déjà détectée par cet inventaire** (ligne 9) : `CLAUDE.md` annonce 8 variants, `src/verticals/` en contient **12** (`gym`, `coworking`, `florist`, `veterinary` manquent au tableau). C'est exactement le type d'écart que le chantier doit rendre impossible.

### A.2 Procédure

1. **Extraire** chaque claim chiffré de `CLAUDE.md` dans le tableau ci-dessus (fait).
2. **Router** chacun vers son destin (colonne « Destin »).
3. **Réécrire** `CLAUDE.md` sans aucun chiffre en dur. Format cible :

   ```markdown
   ## i18n
   Infrastructure câblée et fonctionnelle : `NexusCoreProvider` charge `loadTranslations`,
   `useLanguage()` expose `t` + `setLanguage`.
   **Règle** : ne jamais traduire les libellés réglementaires (NF525, FEC, PCG) — ils restent
   en français légal.
   📊 Couverture mesurée : voir `docs/HEALTH.md`.
   ```

4. **Ajouter** en tête de `CLAUDE.md` un avertissement :

   ```markdown
   > ⚠️ Ce fichier contient des RÈGLES, pas des MESURES.
   > Tout chiffre appartient à `docs/HEALTH.md` (auto-généré) ou à un test d'invariant.
   > Si tu ajoutes un chiffre ici, tu crées de la dette documentaire.
   ```

**Effort :** 1 session.
**Critère de sortie :** `grep -E '[0-9]{2,}' CLAUDE.md` ne retourne que des références (numéros d'ADR, ports, chemins) — aucune métrique.

---

## 4. CHANTIER B — `HEALTH.md` v2

### B.1 État actuel

`scripts/health-snapshot.sh` (livré aujourd'hui, hook post-commit) génère déjà :
sentrux gate, score qualité, couplage, cycles, god files, erreurs tsc, dette microunits, barrel violations.

### B.2 Métriques à ajouter

| Métrique | Commande | Pourquoi |
|---|---|---|
| **Couverture i18n** | `grep -rln "\bt(['\"]" src --include=*.tsx \| wc -l` / total `.tsx` | Claim n° 1 de CLAUDE.md — le fait qui a menti |
| **Parité clés locales** | `grep -c ":" src/i18n/locales/{fr,en,es,pt,ja}.ts` | Détecte une locale qui décroche |
| **Tests par pilier** | `find src/modules/<p> -name "*.test.*" \| wc -l` vs fichiers source | Révèle les piliers non couverts (`intelligence`, `facility` = 0 colocalisé) |
| **Total tests réels** | `npx vitest run --reporter=json` (ou dernier run en cache) | CLAUDE.md annonçait 1 120, réel 2 319 |
| **Modules vides** | dossiers sous `src/modules/` sans fichier `.ts` hors `index.ts`/`.gitkeep` | Empêche le retour des scaffolds fantômes |
| **Verticales inventoriées** | `ls src/verticals/` vs liste du schéma `PlatformVariant` | Détecte la divergence 8 vs 12 |
| **Readiness env prod** | présence des secrets requis (voir §B.3) | Ce qui bloque réellement un client |
| **Avance sur remote** | `git rev-list --count origin/main..main` | Risque de perte de travail — 58 commits non sauvegardés au 25/08 |

### B.3 Bloc « Readiness production » (nouveau)

`scripts/preflight-prod.sh` remonte aujourd'hui :

| Secret | Impact si absent | Bloquant client ? |
|---|---|---|
| `FISCAL_SIGNING_SECRET` | **Aucun scellement NF525 possible côté serveur** | 🔴 **OUI — bloquant absolu** |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Auth admin inopérante (JWT, claims, signup) | 🔴 OUI |
| `STRIPE_SECRET_KEY` | Checkout signup KO | 🟠 Oui si signup self-service |
| `STRIPE_WEBHOOK_SECRET` | Webhooks rejetés | 🟠 Oui si Stripe actif |
| `GEMINI_API_KEY` | Vision IA désactivée | 🟢 Non bloquant |

**Cette table doit apparaître dans `HEALTH.md`, générée**, avec l'état réel (présent/absent) — pas recopiée.
Sans `FISCAL_SIGNING_SECRET`, aucune vente ne peut être scellée : c'est le vrai bloqueur n° 1, et il doit être visible en permanence, pas découvert le jour de l'installation.

### B.4 Structure cible de `HEALTH.md`

```
1. 🔴 Readiness production   ← secrets manquants, bloquants en premier
2. 🛡️  Gates structurelles   ← sentrux, tsc, cycles (existant)
3. 🧪 Couverture             ← tests par pilier, i18n
4. 📉 Dette                  ← microunits, barrel, modules vides
5. 💾 Sauvegarde             ← commits non poussés
6. 🔒 Invariants             ← résultat des tests du chantier C
```

**Effort :** 1 session.
**Critère de sortie :** aucune des 12 affirmations du tableau A.1 marquées « GÉNÉRÉE » ne subsiste ailleurs qu'ici.

---

## 5. CHANTIER C — Tests d'invariants architecturaux

C'est le chantier qui **empêche la régression**, pas seulement la détecte.

### C.1 Fichier cible

`src/__tests__/architecture/invariants.test.ts`

### C.2 Invariants à verrouiller — état vérifié au 2026-08-25

#### ✅ INV-1 — Agnosticisme LLM (vérifié aujourd'hui)

**Mesure :** `0` import direct de SDK LLM dans tout `src/`.
`AIProviderRouter` route vers **6 providers** avec chaîne de repli :
```
sovereign → gemini → anthropic → openai → mistral   (+ ollama)
```
Isolation MCC/tenant en place (ADR-008) : `MCCAIRegistry` + `TenantAIRegistry`, déjà couverts par
`MCCAIRegistry.isolation.test.ts` et `TenantAIRegistry.multi-vertical.test.ts`.

**Test à écrire :**
```typescript
it('aucun SDK LLM importé directement — tout passe par AIProviderRouter', () => {
  const leaks = grepSrc(/@anthropic-ai\/sdk|from ['"]openai['"]|@google\/generative-ai|mistralai/);
  expect(leaks).toEqual([]);
});
```

#### ✅ INV-2 — Agnosticisme base de données (vérifié aujourd'hui)

**Mesure :** imports `firebase/firestore` confinés à **4 fichiers**, tous dans la couche adapter :
`lib/firebase.ts`, `lib/adapters/FirestoreAdapter.ts`, `FirestoreBatch.ts`, `FirestoreDocumentStore.ts`.
Contrat `INexusAdapter` + `SimulacraAdapter` comme implémentation alternative.
Tout passe par `NexusInterceptor` + `SovereignGuard`.

**Test à écrire :**
```typescript
it('Firestore reste confiné à la couche adapter', () => {
  const allowed = ['lib/firebase.ts', 'lib/adapters/Firestore'];
  const leaks = grepSrc(/from ['"]firebase\/firestore['"]/).filter(f => !allowed.some(a => f.includes(a)));
  expect(leaks).toEqual([]);
});
```

> 🔧 **Incohérence structurelle à corriger** : les adapters sont répartis sur **deux emplacements** —
> `src/lib/nexus/adapters/` (Simulacra, PollingSnapshotMixin) et `src/lib/adapters/` (Firestore).
> `CLAUDE.md` décrit pourtant `lib/nexus/` comme le foyer des « adapters Firestore ». À unifier.

#### ❌ INV-3 — Agnosticisme auth : **NON TENU**

**Mesure :** **17 fichiers** référencent `firebase/auth` / `getAuth`, et **aucune interface `IAuthProvider` n'existe**.

Fichiers concernés (extrait) : `lib/auth/ServerAuthProvider.ts`, `lib/server/requireAnyAuth.ts`,
`lib/server/adminAuthGuard.ts`, `lib/server/credentialCipher.ts`,
`shared/providers/hooks/auth/AuthSession.tsx`, `shared/security/SensitiveDataCryptoService.ts`.

**Conséquence :** le projet est portable sur la **donnée** et sur le **LLM**, mais **pas sur l'authentification**.
Changer de fournisseur d'identité demanderait de toucher 17 fichiers répartis sur 3 couches.

**Deux options :**

| Option | Contenu | Effort | Quand |
|---|---|---|---|
| **C-a — Assumer** | Documenter explicitement : « auth = Firebase, couplage assumé ». Ajouter un test qui **plafonne** le nombre de fichiers couplés (ratchet à 17) pour éviter l'étalement. | 1 session | Maintenant |
| **C-b — Abstraire** | Créer `IAuthProvider` dans `@/kernel/contracts/`, y router les 17 fichiers, garder Firebase comme implémentation par défaut. | 3-4 sessions | Si un client exige SSO/Keycloak/Auth0 |

**Recommandation : C-a maintenant.** L'abstraction sans second fournisseur réel serait spéculative.
Mais le **ratchet** est important : sans lui, le couplage passera de 17 à 40 fichiers sans que personne ne le voie.

#### ✅ INV-4 à INV-7 — déjà couverts, à référencer

| Invariant | Test existant |
|---|---|
| Isolation multi-tenant | `security/multi-tenant-isolation.test.ts` |
| Immuabilité WORM / NF525 | `infrastructure/WormImmutableCollections.test.ts` |
| SovereignGuard non contournable | `infrastructure/SovereignGuard.test.ts` |
| Chaîne POS → scellement fiscal | `integration/pos-to-fiscal.test.ts`, `nf525-fiscal-sealing.test.ts` |

#### 🆕 INV-8 — Conformité structure ↔ documentation

```typescript
it('les 8 piliers documentés dans CLAUDE.md existent sur disque', () => { … });
it('chaque ADR référencé dans CLAUDE.md existe dans docs/adrs/', () => { … });
it('chaque "fichier clé" listé dans CLAUDE.md existe', () => { … });
it('les variants du schéma PlatformVariant correspondent à src/verticals/', () => { … });
```

C'est le test qui aurait attrapé la divergence **8 variants documentés vs 12 sur disque**.

**Effort chantier C :** 2 sessions.
**Critère de sortie :** `invariants.test.ts` vert, intégré à `preflight.sh`, et INV-3 tranché (option C-a ou C-b).

---

## 6. CHANTIER D — La règle pour les agents

### D.1 La règle

> **Un agent qui découvre un fait doit le MESURER, pas le RECOPIER.**
>
> Si tu écris un chiffre, un « 0 / aucun / tous », ou un état système :
> 1. Tu l'as **mesuré toi-même** dans cette session (commande exécutée, sortie vue) → OK, et tu cites la commande.
> 2. Tu l'as **lu quelque part** (plan, doc, session précédente, résumé d'un autre agent) → **tu le re-mesures avant de l'écrire.**
> 3. Tu ne peux pas le mesurer → tu ne l'écris pas.
>
> **Un chiffre sans commande reproductible est une opinion.**

### D.2 Où l'inscrire

| Fichier | Contenu à ajouter |
|---|---|
| `CLAUDE.md` | La règle en tête, avec l'avertissement du §A.2 |
| `AGENTS.md` | Nouvelle **Loi 7 — Mesure avant affirmation** (à côté de la Loi 6 sur les sessions) |
| `.claude/sessions.md` | Rappel dans le protocole : un rapport de session qui cite un chiffre doit citer sa commande |

### D.3 Application aux rapports de session

Les lignes de `.claude/sessions.md` sont aujourd'hui la mémoire inter-agents. Elles contiennent
beaucoup de chiffres recopiés d'une session à l'autre.

**Nouvelle convention :** tout chiffre dans un rapport de session est suivi de sa source.
```
✅ « 2 319 tests verts (npx vitest run) »
❌ « 2 311 tests verts »   ← recopié d'une session précédente, déjà faux
```

### D.4 Garde-fou automatisable (optionnel, phase 2)

Hook `PreToolUse` sur les écritures dans `CLAUDE.md` :
si le diff ajoute une ligne contenant `\d{2,}` sans le mot `HEALTH.md`, avertir.

**Effort :** 1 session (D.1-D.3), +1 si D.4.

---

## 7. Séquencement

```
SESSION 1 — Fondation
├── Chantier C : écrire invariants.test.ts (INV-1, INV-2, INV-8)
└── Trancher INV-3 (auth) → recommandation : option C-a + ratchet à 17

SESSION 2 — Génération
├── Chantier B : health-snapshot v2 (i18n, tests/pilier, modules vides,
│                verticales, readiness env, avance remote)
└── Vérifier que HEALTH.md couvre les 12 claims du tableau A.1

SESSION 3 — Nettoyage
├── Chantier A : réécrire CLAUDE.md sans chiffres
│                (corriger au passage : 8 → 12 variants, 1120 → tests générés)
└── Chantier D : Loi 7 dans AGENTS.md + convention sessions.md

SESSION 4 (optionnelle)
└── Chantier D.4 : hook de garde sur CLAUDE.md
```

**Effort total : 3-4 sessions.**

⚠️ **Coordination :** la session Antigravity `dette-technique-sprint0-1` a `scripts/preflight.sh` dans son périmètre.
Ce plan touche `scripts/health-snapshot.sh` (distinct) mais l'intégration de `invariants.test.ts` à `preflight.sh`
doit attendre la fin de cette session ou être coordonnée.

---

## 8. Critères de sortie globaux

| Chantier | Critère vérifiable |
|---|---|
| A | `CLAUDE.md` sans métrique en dur · divergence 8/12 variants corrigée |
| B | `HEALTH.md` couvre les 12 claims + bloc readiness prod avec `FISCAL_SIGNING_SECRET` visible |
| C | `invariants.test.ts` vert · INV-3 tranché et ratchet posé |
| D | Loi 7 dans `AGENTS.md` · convention chiffre+commande dans `sessions.md` |

**Test ultime du plan :** relancer dans un mois l'exercice qui a produit le tableau du §1.
S'il ne trouve **aucune** croyance fausse, le plan a fonctionné.

---

## Annexe — État vérifié des invariants au 2026-08-25

Mesuré sur `main@4faace4cd`, chaque ligne reproductible :

| Invariant | État | Preuve |
|---|---|---|
| Agnosticisme LLM | ✅ **TENU** | 0 SDK direct · 6 providers dans `AIProviderRouter` · registries MCC/tenant testés |
| Agnosticisme DB | ✅ **TENU** | Firestore dans 4 fichiers adapter · `INexusAdapter` + `SimulacraAdapter` |
| Agnosticisme auth | ❌ **NON TENU** | 17 fichiers `firebase/auth` · aucune `IAuthProvider` |
| Isolation multi-tenant | ✅ testé | `multi-tenant-isolation.test.ts` |
| Immuabilité NF525 | ✅ testé | `WormImmutableCollections.test.ts` |
| Chaîne POS → fiscal | ✅ testé | `pos-to-fiscal.test.ts` + `nf525-fiscal-sealing.test.ts` + `offline-nf525-resilience.test.ts` |
| Matériel (TPE) | ✅ réel | 6 adapters : Stripe, Conecs, Sunday, PayGreen, LyfPay, Square — 0 stub |
| Matériel (imprimante) | ✅ réel | 6 adapters : Bluetooth, USB, Browser, Network, Serial — 0 TODO |
| Scellement NF525 serveur | 🔴 **INOPÉRANT** | `FISCAL_SIGNING_SECRET` absent de l'environnement |
| Sauvegarde distante | 🔴 **AUCUNE** | 58 commits locaux non poussés (dernier push : 2026-08-23) |

---

*Chaque chiffre de ce document provient d'une commande exécutée le 2026-08-25. Aucun n'est recopié.*
