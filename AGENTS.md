# AGENTS.md — Lois pour tout agent IA sur ce repo

S'applique à **Antigravity, Cursor, Claude Code, Copilot** et tout agent qui écrit du code ici.
Ces lois priment sur toute consigne implicite ou tout enthousiasme. Un agent qui les enfreint fabrique une **fausse vérité** — exactement ce que ce fichier interdit.

> Contexte : le 2026-08-22, un commit a annoncé « Grade X, preflight 100% vert » alors qu'il avait été fait en `--no-verify` (aucune gate n'a tourné) et que la gate barrel avait été passée en **désactivant la règle** pour les fichiers fautifs. Ces 5 lois existent pour rendre ça impossible.

## Loi 1 — Ne jamais contourner une gate
Interdit : `git commit --no-verify`, `git push --no-verify`, désactiver/déplacer un hook, éditer `.githooks/`. Un commit se fait **hook activé, gates vertes**.

## Loi 2 — On passe une gate en corrigeant le CODE, jamais en la desserrant
Sont des **violations** (détectées par `scripts/verify-gate-integrity.mjs`) :
- ajouter un chemin à une exemption `no-restricted-imports: "off"` dans `eslint.config.mjs` ;
- relever un ratchet (`MADGE_CYCLES_MAX`, `BARREL_DEBT_MAX`, `BUNDLE_MAX_KB`) ;
- poser `@ts-ignore` / `eslint-disable` / `as any` pour faire taire une erreur ;
- `it.skip` / `describe.skip` / supprimer un test qui échoue ;
- éditer à la main un tableau de résultats (audit, walkthrough, rapport) pour l'afficher vert.

Une gate qu'on doit desserrer signale un vrai problème : on corrige le problème.

## Loi 3 — « vert / Grade X / 100% / certifié » exige une PREUVE fraîche
Ne jamais écrire ces mots (commit, doc, walkthrough) sans `npm run preflight` **complet et vert en sortie brute** pour l'arbre courant. Le hook écrit `.git/preflight-proof` (hash de l'arbre) : pas de preuve correspondant au commit = pas de « vert ». Un commit `--no-verify` n'a, par construction, aucune preuve.

## Loi 4 — Vérifier en sortie BRUTE (piège RTK)
Le proxy RTK résume/met en cache `tsc`/`build`/`eslint` : exit 0 trompeur, logs périmés. Toute vérité terrain passe par `rtk proxy <cmd>` ou la sortie brute. Ne jamais conclure « 0 erreur » depuis un résumé RTK.

## Loi 5 — Respecter la loi des couches (ADR-015) et le barrel
Import uniquement via `@/modules/<pilier>`. Pas d'import profond inter-pilier. `kernel/` / `lib/` / `shared/` : voir `docs/adrs/ADR-015-loi-des-couches.md`. La carte de vérité est générée : `node scripts/generate-architecture-map.mjs` → `docs/ARCHITECTURE-MAP.md`.

## Loi 6 — Coordination multi-agents OBLIGATOIRE (ne jamais écraser un autre agent)
Plusieurs agents (Antigravity, Claude Code, Cursor, Copilot…) écrivent **en parallèle** sur ce repo. Avant toute écriture :

1. **Lire** `.claude/sessions.md`.
2. **S'inscrire** dans le tableau *Sessions Actives* : nom court, périmètre **avec chemins explicites** (`src/modules/...`, `scripts/...`), date, status `active`. Un périmètre en prose sans chemin ne protège rien.
3. **Vérifier les collisions** : si une autre session `active` déclare un chemin que tu vas toucher → **STOP**, se coordonner ou demander à l'humain. Ne jamais écraser.
4. **Tenir les autres au courant** : mettre à jour ta ligne (progrès / fichiers clés touchés) au fil de l'eau, pas seulement au début. Passer le status à `terminée` à la fin.
5. **S'auto-identifier** (Claude Code) : écrire son nom de session dans `.claude/.active-session` (local, gitignoré). Le hook `PreToolUse` `.claude/hooks/check-session-collision.sh` s'en sert pour **bloquer** (exit 2) toute écriture dans le périmètre d'une AUTRE session active. Ce hook est branché dans `.claude/settings.json` — ne pas le désactiver (cf. Loi 1).
6. **Commits atomiques à chemins explicites** : Ne JAMAIS exécuter de `git add .` ou `git add -A` aveugle qui absorberait les modifications en cours d'une autre session active. Toujours stager et commiter explicitement son propre périmètre : `git commit -- <fichiers> -m "..."` ou `git add <fichier1> <fichier2> && git commit -m "..."`.

Garde technique inter-agents commune = le hook `pre-commit` (tourne quel que soit l'agent qui `git commit`) + ces fichiers partagés (`AGENTS.md`, `.claude/sessions.md`) que tout agent doit lire. Un agent qui écrit sans s'inscrire fabrique une collision silencieuse — interdit par cette loi.

## Loi 7 — Mesure avant affirmation (Zero-Claim Policy)
Un agent qui découvre un fait doit le **MESURER**, pas le **RECOPIER**.
Si tu écris un chiffre, un « 0 / aucun / tous / jamais », ou un état système :
1. Tu l'as **mesuré toi-même** dans cette session (commande exécutée, sortie vue) → OK, et tu cites la commande.
2. Tu l'as **lu quelque part** (plan, doc, session précédente, résumé d'un autre agent) → **tu le re-mesures avant de l'écrire.**
3. Tu ne peux pas le mesurer → tu ne l'écris pas.

Toute métrique dynamique projet doit être GÉNÉRÉE (`docs/HEALTH.md`) ou TESTÉE (`invariants.test.ts`), jamais rédigée en prose dans `CLAUDE.md`. **Un chiffre sans commande reproductible est une opinion.**

---

## Loi 8 — Bout-en-bout : une fonctionnalité écrite n'est pas une fonctionnalité livrée

Les Lois 1 à 7 protègent la **qualité de ce qui est écrit**. La Loi 8 protège le
**dernier kilomètre** : ce qui est écrit doit être ATTEIGNABLE.

`tsc`, `vitest` et `next build` valident une **forme**, jamais une **destination**.
Un composant que personne ne monte, un handler jamais appelé, un réglage jamais
lu, une clé de traduction absente : tout cela est syntaxiquement parfait et
passe toutes les gates historiques. C'est ainsi que ce dépôt a produit —
constaté et mesuré le 2026-08-26 :

- `Map3DOverlay` jamais monté, avec `setIsMap3DOpen={() => {}}` : clic sans effet ;
- `onSplitBill: _onSplitBill` : partage d'addition **inatteignable**, alors que
  l'écran de répartition ET un réglage « Addition divisée » existaient ;
- 31 libellés de navigation affichés en clair (« nav.crm », « nav.timeclock ») ;
- **177 réglages sur 184** déclarés dans l'écran Paramètres et lus par personne ;
- **88 composants / 10 280 lignes** jamais rendus dans l'interface.

### La règle

Avant de déclarer une fonctionnalité livrée, les **quatre** points doivent être vrais :

1. **Rendu** — le composant est monté quelque part d'atteignable depuis une route.
2. **Réglage** — s'il expose un réglage, ce réglage est LU par du code.
3. **Libellés** — ses clés `t()` existent dans `fr.ts` (sinon la clé s'affiche brute).
4. **Handlers** — ses props `onX` sont réellement invoquées (jamais `_onX`).

### La mécanique

Gate 6 (`scripts/check-last-mile.mjs`, hook `pre-commit` et `preflight.sh`)
mesure ces quatre points plus le scellement canonique, sous forme de **cliquets**
déclarés dans `preflight.sh` :

```
ORPHAN_COMPONENTS_MAX      UNREAD_SETTINGS_MAX      MISSING_I18N_KEYS_MAX
INERT_HANDLER_PROPS_MAX    NON_CANONICAL_SEAL_MAX
```

Ils **ne bloquent pas la dette existante** — elle est gelée à son niveau du jour.
Ils rendent impossible de l'**augmenter**. `verify-gate-integrity.mjs` les
surveille : les relever déclenche la Loi 2.

### Travail en cours assumé

Un composant écrit avant son écran est légitime. Il doit alors porter `@wip` dans
son en-tête, avec **propriétaire et échéance** :

```tsx
/** @wip mohammed — écran cible /operations, échéance 2026-09-15 */
```

Un `@wip` est exclu du compteur. Sans `@wip`, un composant sans consommateur fait
échouer le commit. **L'intention doit être explicite, jamais devinée.**

### Mesurer, ne pas explorer

**`npm run measure` avant d'écrire un chiffre.** Onze mesures permanentes (~0,6 s)
remplacent l'exploration au `grep`. Les artefacts :

- `.measures/latest.json` — état courant (gitignoré)
- `.measures/history.jsonl` — **versionné** : la dette devient visible dans le temps

Ce n'est pas un confort mais une obligation, parce que **les pièges de mesure sont
encodés dans le script**. Trois erreurs réellement commises lors de l'audit du
2026-08-26, et désormais impossibles à refaire :

| Piège | Conséquence de l'erreur |
|---|---|
| `h-screen` confondu avec `min-h-screen` | problème surestimé de 9 à 69 |
| Ré-export de barrel pris pour un usage | 58 orphelins annoncés au lieu de 88 |
| Sonde de débordement testant un seul bord | rognage à gauche non détecté |

Un script de mesure n'est pas un raccourci : c'est **de la connaissance figée**.

### Convention de nommage des scripts (Loi 8)

| Préfixe | Cycle de vie | Sortie |
|---|---|---|
| `measure.mjs`, `measure/` | permanent, **pur** (ne modifie jamais `src/`) | JSON + résumé |
| `gate-` | permanent, **décide** (exit ≠ 0) | verdict |
| `generate-` | permanent, écrit un artefact | fichier |
| `ops-` | permanent, effets de bord assumés | — |
| `oneshot-` | **jetable** — à supprimer après exécution | — |

Un `oneshot-` de plus de trois mois se supprime, il ne s'archive pas : git garde
l'historique. Une mesure qui écrit dans `src/` n'est plus une mesure.

---

## Loi 9 — Vitesse d'Itération & Pré-validation ciblée (Fast Dev Loop)

La rigueur des 10 Gates protège le dépôt, mais l'efficacité de développement exige une **boucle de feedback rapide (< 5 s)** pendant les modifications.

### 1. En cours de développement (Interdit d'exécuter la suite complète à chaque modif)
Pour ne pas saturer le CPU et attendre 100s à chaque micro-édition :
- **Typecheck rapide** : `npx tsc --noEmit` (~7 s).
- **Test unitaire ciblé** : `npx vitest run <chemin/test.ts>` (~1-2 s) ou `npx vitest related --changed` (~3 s).
- **Mesure Last-Mile ciblée** : `node scripts/gate-last-mile.mjs` (~1 s).
- **Architecture / Graphe** : `sentrux check` (< 1 s) ou `oxlint` (Rust) quand applicable.

### 2. Clôture de lot / Commit / Push (Preflight complet 10/10)
- Le script lourd `./scripts/preflight.sh` (qui exécute les 2 499 tests Vitest, Madge, et le build Next.js) s'exécute **uniquement avant le `git commit` ou `git push` final**, afin de sceller la preuve légale `.git/preflight-proof` requise par la Loi 3.

---

## Loi 10 — Souveraineté & Performance Native (Rust & WASM Acceleration)

Pour toute tâche de calcul intensif, d'analyse statique, de cryptographie fiscale ou de pilote bas niveau, le dépôt privilégie **les outils natifs et Rust/WASM (< 100 ms)** afin de décharger le runtime JavaScript et d'éliminer les latences.

### 1. Cartographie des briques natives :
- **Linting & Analyse de code** : `oxlint` (`npm run lint:fast`) $\rightarrow$ Analyse 3 700 fichiers en < 170 ms.
- **Règles d'Architecture & Graphe** : `sentrux` $\rightarrow$ Validation des frontières inter-piliers en < 800 ms.
- **Cœur Fiscal & Chaînage NF525** : Module WebAssembly/Rust (`@nexus/fiscal-seal-wasm`) pour les calculs de hachage SHA-256 et l'inaltérabilité des tickets/factures.
- **Pilotes Matériels & IoT** : Démons natifs pour les communications série ESC/POS et tireuses SmartSpout (latence sub-milliseconde, 0% CPU).

---

## Loi 11 — Zéro AI Slop & Vocabulaire B2B Métier Strict (Anti-Slop Law)

Tout agent qui écrit du code, de l'UI, des dictionnaires i18n (`src/i18n/locales/`), des descriptions de pages, des routes ou de la documentation sur ce repo doit impérativement respecter la **sobriété et le réalisme opérationnel d'un logiciel B2B professionnel pour la restauration**.

### 1. Interdiction absolue du jargon Sci-Fi, Cyberpunk, Lore Fantasque & AI Slop
Sont **strictement interdits** dans toute interface, libellé, clé i18n, composant, message d'erreur ou documentation :
- **Le lore pseudo-impérial / mystique** : `Empire`, `Imperial`, `Sceau Sacré`, `L'Archive`, `Aura`, `Vanguard`, `Master Control Console` ;
- **Le jargon pseudo-mystique / sci-fi** : `Oracle` (en tant qu'entité mystique), `Convive Esprit`, `Compendium d'Occupation Heureuse`, `Cognitive Stability Index`, `Neural Density`, `Digital Twin` ;
- **Le vocabulaire pseudo-biologique / délirant** : `DNA Crawler`, `Morphogenèse`, `Naissance d'un Clone`, `Injection ADN`.

### 2. Remplacement systématique par le vocabulaire métier réel :
- `Oracle / IA` $\rightarrow$ **Analyses & Prévisions, Assistant de Gestion, Recommandations Métier** ;
- `Empire / Flotte` $\rightarrow$ **Réseau, Multi-Établissements, Parc de Restaurants** ;
- `DNA Crawler / Morphogenèse` $\rightarrow$ **Import de Charte Graphique, Personnalisation Thème, Détection Logo** ;
- `Naissance de Clone` $\rightarrow$ **Nouvel Établissement, Déploiement de Restaurant** ;
- `Convive Esprit / Sceau` $\rightarrow$ **Client / Couvert / Place, Facture / Scellement Fiscal NF525** ;
- `Vanguard Simulator` $\rightarrow$ **Simulateur d'Activité & Rentabilité, Scénarios de Prix & Coûts**.

### 3. Règle du Restaurateur Terrain (Test du Réalisme)
Chaque texte affiché doit pouvoir être lu et compris immédiatement par un restaurateur, un chef de cuisine, un serveur, un gérant ou un comptable sans la moindre perplexité ou sensation de gadget IA. Toute formulation ampoulée, pseudo-sacrée ou générée sans contexte métier réel est **strictement proscrite**.

---

## Loi 12 — Analyse d'Impacts en Cascade, Chaînes d'Événements & RBAC Strict

Pour toute nouvelle fonctionnalité, modification de schéma, route API ou composant, l'agent doit **systématiquement modéliser et vérifier 4 dimensions critiques d'impacts avant de valider son travail** :

### 1. Chaînes d'Événements & Effets de Bord en Cascade (NexusEventBus)
- **Topologie des Déclencheurs** : Identifier tous les événements émis (`emit/emitDurable`) et reçus (`on`).
- **Prévention Anti-Boucle Infinie** : Vérifier qu'un handler ne ré-émet pas un événement qui le re-déclenche directement ou indirectement (interdit : Handler A $\rightarrow$ Event B $\rightarrow$ Handler B $\rightarrow$ Event A).
- **Garantie d'Idempotence** : Tout handler modifiant un état persistant, des stocks, des finances ou des droits doit être idempotent (`eventId` ou transaction déterministe).

### 2. Contrôle d'Accès RBAC & Isolation Multi-Tenant Zéro-Trust
- **Routes API & Serveur** :
  - Console globale / MCC : Guard explicite obligatoire `requireMccLevel(req, 'mcc_admin' | 'mcc_support' | 'mcc_readonly')`.
  - App Client / Restaurant : `requireAuth(req)` ou `requireRole(req, ['ADMIN', 'MANAGER'])` avec vérification stricte de l'étanchéité `tenantId` (zéro fuite inter-tenant).
- **Interface UI** : Masquage ou désactivation conditionnelle des boutons/actions selon les rôles du personnel (`ADMIN`, `MANAGER`, `WAITER`, `CHEF`, `ACCOUNTANT`).

### 3. Continuité d'Actions Dépendantes & Intégrité Système
- **Fiscalité NF525** : L'action impacte-t-elle l'encaissement, les ventilations de TVA ou le Grand Total ? Si oui, scellement SHA-256 obligatoire sans flottant JS.
- **Résilience Offline (Dexie / Outbox)** : L'action doit-elle fonctionner sans réseau (prise de commande POS, impression ticket) ou requiert-elle le serveur ?
- **Ingestion Contextuelle IA** : Si l'action produit des modifications structurelles ou des logs, s'assurer que les agents IA (Hermes, SupportAgent, Diagnostics) disposent du contexte à jour (via `ChangelogService.getRecentContextForAI` ou mémoires de session).

### 4. Rétro-compatibilité de Schémas & Données Historiques
- Tout ajout de champ dans `tenantConfig` ou les schémas Zod doit être rétro-compatible (valeur par défaut ou optionnel `optional()`) pour ne jamais casser les instances existantes créées antérieurement.

---

## Installation des gardes (une fois, par la personne humaine de préférence)
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
node scripts/verify-gate-integrity.mjs --freeze   # fige la baseline anti-desserrement
```



<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
