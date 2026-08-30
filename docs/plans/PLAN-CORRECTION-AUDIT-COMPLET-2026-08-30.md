# Plan de correction complet — audit projet du 2026-08-30

> ## État après exécution — 2026-08-30 (arbre `main` @ `c8e97e6b1`)
>
> Ce plan a été exécuté partiellement dans la session `plan-correctif-reste`.
> **Deux commits** issus du nouveau plan ont été poussés sur `main` (sans push distant) :
>
> - `77c1ef601` — **Lot 5 (async_hooks isolé)** : cause racine `require()` lazy de `ServerTenantStorage` dans `NexusAdapter.activeTenant`, retiré au profit de `globalThis.__nexusServerTenant`. Le build Next passe désormais (290 pages générées).
> - `ba614cb91` — **Lot 2 partiel + Lot 3 partiel** : `POST /api/tenant/contracts/[contractId]/sign` fermé (fuite critique : signait un contrat au nom de n'importe quel tenant sans jeton), `POST /api/reservations/card-imprint` scelle sa pièce NF525 via `FiscalSealer.sealDataAtomically` au lieu d'un `set()` direct, `assertTenant` rendu polymorphe pour accepter aussi les `AdminCaller`.
>
> **Vérité terrain finale mesurée** (chaque commande relancée sur l'arbre `c8e97e6b1`) :
>
> | Vérification | Résultat |
> |---|---|
> | `rtk proxy npx tsc --noEmit` | 0 erreur |
> | `./node_modules/.bin/vitest run` | 2 477 passés / 0 échec / 307 fichiers |
> | `node scripts/gate-last-mile.mjs` | 12/12 verts |
> | `node scripts/verify-gate-integrity.mjs` | OK (hash `e3daa83b4036a186`) |
> | `npx next build` | OK — 290 pages générées |
> | `npm run preflight` complet | **bloqué** sur `MADGE_CYCLES_MAX=0` vs **11 cycles réels** (dette héritée hors périmètre) |
>
> **Restes précis à traiter** (baseline actualisée) :
>
> - Lot 1 : action humaine — rotation manuelle des secrets `.env.local` (Firebase, Gemini, VAPID, fiscal signing). Je ne peux pas régénérer des clés pour toi.
> - Lot 2 (reste) : les 5 chemins non-scopés restants signalés par `audit-grade-x-plus` ont été vérifiés et écartés comme faux positifs (gardés par `requireMccLevel`, `Bearer GOOGLE_RESERVE_SECRET`, `INTERNAL_API_SECRET`, ou publics par conception : `tenant/api-keys/validate`, `tenant/domain/check`). Reste : couvrir la surface par un test d'invariant élargi.
> - Lot 3 (reste) : le sceau GENESIS de `TenantProvisioningService` est légitime (aucun doc existant → garde B.3 laisse passer). `sync-manager.ts` et `ReconciliationEngineHandler.ts` : aucune mutation directe sur `journalEntries|fiscalSeals|fiscalLedger` détectée (faux positifs de l'audit).
> - Lot 4 : le bug shell `FOIS: command not found` **n'apparaît plus** sur cet arbre. Résolu par un commit antérieur non identifié.
> - Lot 6 : `--fix` global fait passer de 226 → 67 erreurs, mais fait **monter** les cliquets `orphans` (+1) et `dsAdoption` (+13) — probablement en retirant des imports « de face » qui satisfaisaient artificiellement les compteurs. Le `--fix` a été rejeté puis reverté. Les 67 erreurs restantes (64 `no-explicit-any`, 20 unused-vars, 3 `react/no-children-prop`) demandent une passe **chirurgicale par famille de fichiers**, avec vérification `node scripts/gate-last-mile.mjs` après chaque batch.
> - Lot 7 : les 144 tests d'adapters qui bypassaient l'isolation sont documentés comme dette dans `ec3ad9dd3`. Chantier plusieurs jours (`beforeEach(() => store.set(tenantIdAtom, TENANT_ID))` sur chaque fichier `useSovereign*` / `saga.*`).
> - Lots 8-9-10 : chantiers UX / architectural inchangés, cliquets stables sur `76 orphans · 147 réglages morts · 12 stubs verticales · 150 boutons a11y · 67 clavier · 472 hors DS · 943 chaînes FR en dur · 11 cycles hors src/`.
> - Lot 11 : preflight complet ne peut aboutir que quand les 11 cycles seront résolus. `sentrux gate` les tolère à 2, mais `MADGE_CYCLES_MAX=0` dans `preflight.sh:154` est plus strict — **ne surtout pas relever** (Loi 2).
>
> ---

## Verdict de départ

Le projet est en **pré-production avancée**, avec un socle fonctionnel large et ambitieux, mais il ne peut pas être déclaré production-ready tant que les gates runtime, conformité et build ne sont pas stabilisées sur l’arbre courant.

Ce plan part des mesures fraîches exécutées le 2026-08-30 :

- `npx tsc --noEmit` : 0 erreur TypeScript.
- `node scripts/verify-gate-integrity.mjs` : intégrité des gates OK.
- `node scripts/gate-last-mile.mjs` : aucun compteur en hausse sous les cliquets courants.
- `npm run measure` : 76 composants sans consommateur, 147 réglages déclarés non lus, 1 handler inerte, 150 boutons non nommés, 67 conteneurs cliquables sans clavier, 472 écrans hors design system, 12 stubs verticaux.
- `npm test -- --reporter=dot` : 51 fichiers de test en échec, 144 tests/assertions en échec, 1 erreur non gérée.
- `npx eslint src/ --format stylish --max-warnings 9999` : 226 erreurs, 889 warnings.
- `npm run build` : échec Next/Turbopack sur `/_not-found/page` lié à `node:async_hooks`.
- `npm run preflight` : interrompu à l’étape 3 par `./scripts/preflight.sh: line 98: FOIS: command not found`.
- `node scripts/audit-grade-x-plus.ts` : échec NF525, 6 requêtes non scopées tenant, 7 mutations ledger directes signalées.
- `node scripts/generate-architecture-map.mjs` : 3 689 fichiers, 346 231 LOC, 9 piliers, 13 verticales, overlaps `contracts`, `hooks`, `nexus`, et `system` hors canonique.
- `npm audit --omit=dev --audit-level=high` : 0 vulnérabilité high/critical remontée par npm audit.

Note importante : l’audit a été réalisé sur un worktree déjà modifié par d’autres sessions. Chaque lot doit donc remesurer son propre état avant correction et après correction, conformément à la Loi 7.

## Règles d’exécution

1. Ne jamais contourner les hooks ou les gates.
2. Ne jamais relever un cliquet pour faire passer une gate.
3. Ne jamais écrire `vert`, `Grade X`, `100%` ou `certifié` sans `npm run preflight` complet et vert sur l’arbre courant.
4. Lire `.claude/sessions.md` avant toute écriture et déclarer un périmètre explicite.
5. Corriger par lots atomiques, avec commits à chemins explicites uniquement.
6. Pour tout chiffre de suivi, relancer la commande de mesure dans la session qui écrit le chiffre.

## Ordre de correction recommandé

L’ordre est volontairement strict : d’abord les risques qui peuvent corrompre ou exposer les données, ensuite les gates qui empêchent de livrer, puis la dette produit/UX.

## Lot 0 — Stabilisation de coordination et baseline

> **✅ FAIT** — Session `plan-correctif-reste` enregistrée dans `.claude/sessions.md`, baseline mesurée en session.

Objectif : figer un point de départ reproductible sans toucher au comportement applicatif.

Actions :

- Lire `.claude/sessions.md` et éviter tout chevauchement avec la session active `plan-correctif-reste`.
- Relancer les mesures de baseline avant toute correction : `npm run measure`, `npx tsc --noEmit`, `node scripts/verify-gate-integrity.mjs`, `node scripts/gate-last-mile.mjs`.
- Vérifier l’état git avec `git status --short` et isoler les changements déjà présents.
- Ne pas modifier `scripts/preflight.sh`, `scripts/measure/`, `src/lib/nexus/`, `src/shared/eventBus/`, `src/verticals/` tant que la session `plan-correctif-reste` reste active, sauf coordination explicite.

Critère de sortie :

- Baseline locale documentée dans le journal de session.
- Aucun fichier d’un autre agent écrasé.

## Lot 1 — Secrets et configuration sensible

> **🟠 NON FAIT — action humaine requise.** Rotation manuelle des secrets (Firebase, Gemini, VAPID, fiscal signing) qui ne peut pas être automatisée depuis Claude Code.

Objectif : éliminer le risque opérationnel immédiat lié aux valeurs sensibles locales.

Constat :

- `.env.local` et `.env.production` contiennent des valeurs ressemblant à des secrets réels : Firebase, Gemini, fiscal signing secret, internal API secret, VAPID/private push secret.

Actions :

- Confirmer que ces fichiers ne sont pas trackés par Git.
- Déplacer les valeurs réelles vers le gestionnaire de secrets cible.
- Régénérer les secrets exposés ou copiés localement : Gemini, fiscal signing secret, internal API secret, VAPID/private push.
- Ajouter ou corriger `.env.example` avec uniquement des placeholders.
- Ajouter une vérification non destructive dans la documentation de release : aucun secret réel dans les fichiers versionnés.

Critère de sortie :

- `git ls-files '*env*' '.env*'` ne liste aucun fichier contenant des secrets réels.
- Les environnements locaux utilisent des valeurs régénérées hors Git.

## Lot 2 — Isolation tenant et violations Nexus

> **🟢 PARTIEL — 1 vraie fuite fermée, 5 faux positifs écartés** (commit `ba614cb91`). Détail : la vraie fuite était `POST /api/tenant/contracts/[contractId]/sign` (non signalée par l'audit). Les 5 chemins signalés étaient soit légitimement gardés, soit publics par conception. Restent les 144 tests d'adapters (voir Lot 7).

Objectif : supprimer les échecs dominants des tests et fermer les chemins de fuite multi-tenant.

Constat :

- Les tests échouent majoritairement sur des erreurs `CRITICAL_SECURITY_BREACH`, `Shadow Context Violation` et `ACCESS_DENIED`.
- `audit-grade-x-plus` signale 6 requêtes non scopées tenant.

Fichiers signalés par l’audit :

- `src/__tests__/commerce/subdomain-check.test.ts`
- `src/app/api/admin/mcc/reseller/commissions/route.ts`
- `src/app/api/google/reserve/merchants/route.ts`
- `src/app/api/status/route.ts`
- `src/lib/migrations/MigrationRunner.ts`
- `src/modules/compliance/legal/services/SovereignSignatureEngine.ts`

Actions :

- Pour chaque requête signalée, identifier le chemin tenant attendu : route auth, contexte MCC, service system, migration ou tâche interne.
- Remplacer les accès non scopés par l’API canonique Nexus ou par une exception explicite et testée si le contexte est réellement system-level.
- Ajouter des tests fail-closed : absence de tenant, tenant mismatch, accès cross-tenant, contexte system autorisé.
- Réparer les tests existants qui masquent un tenant manquant au lieu de tester l’isolation réelle.

Critère de sortie :

- `node scripts/audit-grade-x-plus.ts` ne signale plus de requêtes non scopées tenant applicatives.
- Le sous-ensemble de tests Nexus/isolation passe avant de relancer toute la suite.

## Lot 3 — NF525 et immutabilité ledger

> **🟢 PARTIEL — `card-imprint` scellé via `FiscalSealer.sealDataAtomically`** (commit `ba614cb91`). Le sceau GENESIS de `TenantProvisioningService` est légitime, `sync-manager` et `ReconciliationEngineHandler` sont des faux positifs de l'audit. Le vrai renforcement NF525 était fait dans le plan précédent (chaîne unifiée, `dataSnapshot` persisté, garde B.3 refusant overwrite — commits `3b0d7d8d4` et `1994d035b`).

Objectif : restaurer l’immutabilité fiscale et supprimer les écritures directes dangereuses.

Constat :

- Vitest remonte `NexusError [NF525_VIOLATION] Cannot overwrite existing sealed document via tx.set()` dans `src/lib/nexus/NexusInterceptor.ts`.
- `audit-grade-x-plus` signale 7 mutations directes ledger.

Fichiers signalés par l’audit :

- `src/__tests__/infrastructure/SnapshotService.test.ts`
- `src/__tests__/integration/pos-to-fiscal.test.ts`
- `src/app/api/reservations/card-imprint/route.ts`
- `src/lib/mcc/provisioning/TenantProvisioningService.ts`
- `src/lib/nexus/NexusInterceptor.ts`
- `src/lib/offline/sync-manager.ts`
- `src/shared/eventBus/handlers/ReconciliationEngineHandler.ts`

Actions :

- Interdire les `set`/overwrite sur documents scellés dans les chemins runtime.
- Remplacer les mutations directes par append-only event, correction event, reversal event ou API fiscale canonique.
- Séparer les besoins de tests fixtures des chemins runtime : les tests peuvent fabriquer un état, mais ne doivent pas enseigner au code production à écraser un scellement.
- Ajouter tests : double écriture interdite, correction append-only autorisée, hash chain inchangée, rejeu idempotent.

Critère de sortie :

- Plus de violation NF525 dans `audit-grade-x-plus`.
- Les tests POS/fiscal/Nexus passent sans désactiver de test.

## Lot 4 — Preflight bloqué

> **✅ RÉSOLU** — le bug `FOIS: command not found` n'apparaît plus sur `c8e97e6b1`. Résolu par un commit antérieur non identifié entre la baseline du plan et l'exécution.

Objectif : rendre `npm run preflight` exécutable de bout en bout.

Constat :

- `npm run preflight` passe TypeScript et auth admin/fetch, puis échoue à l’étape ESLint avec `FOIS: command not found`.

Actions :

- Inspecter `scripts/preflight.sh` autour de l’étape ESLint et rechercher une interpolation shell ou sortie parasite qui exécute `FOIS`.
- Corriger le script sans réduire les contrôles.
- Ajouter un test léger de parsing ou un dry-run si le repo possède déjà un pattern de test scripts.
- Relancer `node scripts/verify-gate-integrity.mjs` après modification.

Critère de sortie :

- `npm run preflight` atteint toutes les étapes.
- Si preflight échoue encore, il échoue sur une dette réelle mesurée, pas sur une erreur shell.

## Lot 5 — Build Next/Turbopack

> **✅ FAIT** (commit `77c1ef601`). Cause racine : `require()` lazy de `ServerTenantStorage` dans `NexusAdapter.activeTenant` (mon propre bug de C.1). Turbopack embarquait la dépendance transitive `node:async_hooks` dans les chunks client. Fix : `NexusAdapter` lit `globalThis.__nexusServerTenant` posé par `runWithServerTenant`. Aucun import de `node:async_hooks` dans le code exposé au bundle client. `npx next build` va au bout, 290 pages générées.

Objectif : obtenir un build applicatif exploitable.

Constat :

- `npm run build` échoue sur `Failed to write app endpoint /_not-found/page`.
- La cause affichée mentionne un module externe `node:async_hooks` non supporté par le contexte de chunking.

Actions :

- Tracer l’import de `node:async_hooks` dans l’arbre applicatif.
- Vérifier qu’aucun module server-only n’est importé par un composant client, une page client, ou un chemin partagé qui finit dans le bundle app.
- Isoler les dépendances Node dans des modules server-only avec garde claire.
- Si le problème vient d’une dépendance indirecte, déplacer l’appel derrière une route API, une action serveur ou un adapter chargé seulement côté serveur.

Critère de sortie :

- `npm run build` va au bout sur l’arbre courant.
- Aucune dépendance Node server-only ne fuit dans les bundles client.

## Lot 6 — ESLint et hygiène bloquante

> **🟠 NON FAIT — tentative rejetée par la gate Loi 8.** `--fix` global a fait passer 226 → 67 erreurs, mais a fait monter les cliquets `orphans` (76 → 77) et `dsAdoption` (472 → 485) en supprimant des imports « de face » qui satisfaisaient artificiellement les compteurs. Les changements ont été reverté. Passe chirurgicale requise, par famille de fichiers, avec check `gate-last-mile` après chaque batch.

Objectif : ramener ESLint à un niveau commit-safe sans desserrer la configuration.

Constat :

- `npx eslint src/ --format stylish --max-warnings 9999` remonte 226 erreurs et 889 warnings.
- `git diff --check` signale au moins un trailing whitespace dans `src/modules/ops/providers/ops-contract.ts`.

Actions :

- Corriger d’abord les erreurs ESLint, pas les warnings.
- Grouper les corrections mécaniques sûres : imports inutilisés, variables inutilisées, trailing whitespace.
- Traiter séparément les corrections comportementales : `react/no-children-prop`, `no-explicit-any`, promesses flottantes.
- Ne pas ajouter `eslint-disable`, `@ts-ignore` ou `as any` pour faire baisser les compteurs.

Critère de sortie :

- `npx eslint src/ --format stylish --max-warnings 9999` ne remonte plus d’erreurs.
- Les warnings restants sont classés par famille avec un plan de baisse.
- `git diff --check` passe.

## Lot 7 — Suite de tests Vitest

> **🟠 NON FAIT — chantier plusieurs jours.** Les 144 tests d'adapters cross-tenant sont documentés comme dette dans `ec3ad9dd3` : ils bypassent la garde `STRICT_ISOLATION_TEST` qui est restée en opt-in local. Correctif type : `beforeEach(() => store.set(tenantIdAtom, TENANT_ID))` par fichier de test `useSovereign*` / `saga.*`. Après quoi `STRICT_ISOLATION_TEST=1` pourra revenir en global dans `vitest.config.ts`.

Objectif : revenir à une suite de tests fiable.

Constat :

- 51 fichiers de test échouent, 144 tests/assertions échouent, 1 erreur non gérée.

Actions :

- Réparer dans cet ordre : erreur non gérée, tests d’isolation tenant, tests NF525, tests IA/multivertical config writes, puis tests UI ou edge cases.
- Éviter les corrections globales avant d’avoir isolé le premier groupe de failures.
- Pour chaque groupe, lancer un sous-ensemble ciblé avant la suite complète.
- Ne jamais utiliser `it.skip`, `describe.skip`, suppression de test, ou assouplissement d’assertion sans justification produit formelle.

Critère de sortie :

- Les groupes Nexus/NF525 passent isolément.
- `npm test -- --reporter=dot` passe ou laisse uniquement des failures classés, non critiques et documentés.

## Lot 8 — Dette d’atteignabilité Loi 8

> **🟠 NON FAIT — chantier UX**. Cliquets stables mesurés sur `c8e97e6b1` : 76 composants sans consommateur, 147 réglages morts, 1 handler inerte (exception documentée `onClearCart`), 12 stubs verticaux. La gate `verticalStubs` (baseline 12) et la mesure `frHardcoded` ont été ajoutées dans le plan précédent (commit `057bf58e6`).

Objectif : transformer le code écrit en fonctionnalités réellement atteignables.

Constat `npm run measure` :

- 76 composants sans consommateur.
- 147 réglages déclarés non lus.
- 1 handler inerte.
- 12 écrans `VerticalPageStub`.

Actions :

- Pour chaque composant orphelin : monter dans une route atteignable, marquer `@wip` avec propriétaire/échéance si légitime, ou supprimer si mort.
- Pour chaque réglage non lu : brancher le réglage dans le comportement, masquer le réglage si non disponible, ou supprimer la déclaration.
- Pour le handler inerte : connecter l’appel réel ou retirer la prop.
- Pour les 12 stubs verticaux : remplacer par une page minimale utile, ou déclarer explicitement un `@wip` daté.

Critère de sortie :

- Les compteurs Loi 8 diminuent sans relever les cliquets.
- `node scripts/gate-last-mile.mjs` reste vert.

## Lot 9 — Accessibilité et design system

> **🟠 NON FAIT — chantier UX**. Cliquets stables : 150 boutons muets, 67 clavier, 472 hors DS. Voir méthode et priorités inchangées ci-dessous.

Objectif : réduire les défauts qui bloquent une vraie exploitation terrain.

Constat `npm run measure` :

- 150 boutons non nommés.
- 67 conteneurs cliquables sans support clavier.
- 472 écrans hors design system.
- 111 risques responsive.

Actions :

- Corriger d’abord les boutons sans nom accessible sur les parcours critiques : POS, réservations, paiement, admin, fiscal.
- Remplacer les `div`/conteneurs cliquables par `button`/`a` ou ajouter rôle, tabIndex, clavier et nom accessible.
- Migrer progressivement les écrans hors DS vers `PageShell`, primitives shared et tokens existants.
- Remplacer les contraintes mobiles risquées : widths fixes, grids fixes, `h-screen` strict quand il casse mobile.

Critère de sortie :

- Les compteurs accessibilité diminuent à chaque lot.
- Les parcours critiques restent utilisables clavier et lecteur d’écran.

## Lot 10 — Architecture et frontières ADR-015

> **🟠 NON FAIT — bloquant Lot 11**. `sentrux check` : 2 cycles hors `src/` (sidecar/scripts), 1518 fonctions > cc12 (baseline 2026-08-30). `madge --circular` sur `src/` seul : 11 cycles inter-barrels. `MADGE_CYCLES_MAX=0` dans `preflight.sh` refuse de les tolérer. **Ne surtout pas relever le cliquet** (Loi 2, `verify-gate-integrity.mjs` le refuserait).

Objectif : éviter que la correction crée une dette de couches.

Constat :

- La carte d’architecture signale des overlaps `contracts`, `hooks`, `nexus`.
- `system` apparaît hors canonique.

Actions :

- Lire `docs/ARCHITECTURE-MAP.md` avant tout déplacement de fichier.
- Vérifier chaque import inter-pilier contre ADR-015.
- Ne pas corriger les overlaps par déplacement massif tant que les tests Nexus/NF525 ne sont pas stabilisés.
- Créer des adapters explicites quand un module partagé est légitime, au lieu d’imports profonds opportunistes.

Critère de sortie :

- `node scripts/generate-architecture-map.mjs` ne signale pas de nouvelle anomalie.
- Les corrections de bugs ne dégradent pas la carte d’architecture.

## Lot 11 — Validation finale

> **🟠 PARTIELLEMENT VALIDÉ** — voir tableau « Vérité terrain finale » en tête. Toutes les mesures individuelles passent SAUF `preflight` complet, bloqué à l'étape madge (11 cycles vs cliquet 0). Le preflight rapide (pre-commit hook) passe sur tous les commits de la session grâce à `MADGE_CYCLES_MAX=430` propre au hook.

Objectif : obtenir une preuve fraîche et complète.

Commandes à exécuter dans cet ordre :

```bash
npm run measure
npx tsc --noEmit
node scripts/verify-gate-integrity.mjs
node scripts/gate-last-mile.mjs
npx eslint src/ --format stylish --max-warnings 9999
git diff --check
npm test -- --reporter=dot
npm run build
npm audit --omit=dev --audit-level=high
node scripts/audit-grade-x-plus.ts
node scripts/generate-architecture-map.mjs
npm run preflight
```

Critère de sortie final :

- `npm run preflight` complet et vert sur l’arbre courant.
- `.git/preflight-proof` correspond au tree hash du commit.
- Aucun wording `vert`, `Grade X`, `100%`, `certifié` dans commit/doc sans preuve fraîche.

## Séquence de commits proposée

1. `docs: document correction baseline` — plan et baseline uniquement.
2. `security: rotate and document runtime secrets` — secrets/config.
3. `nexus: close tenant isolation gaps` — requêtes non scopées et tests.
4. `fiscal: enforce append-only ledger mutations` — NF525/ledger.
5. `tooling: restore preflight execution` — bug shell preflight.
6. `build: isolate server-only async hooks usage` — build Next.
7. `lint: clear blocking eslint errors` — hygiène bloquante.
8. `test: restore nexus and fiscal suites` — suite Vitest.
9. `product: reduce last-mile unreachable debt` — orphelins/réglages/stubs.
10. `a11y: name critical controls and keyboard actions` — accessibilité.
11. `architecture: normalize remaining module boundaries` — frontières ADR-015.
12. `release: attach fresh preflight proof` — preuve finale.

## Définition de terminé

Le projet pourra être requalifié de pré-production stable uniquement quand :

- la suite de tests ne contient plus d’échec critique ;
- le build Next passe ;
- les violations tenant/NF525 sont corrigées ;
- le preflight tourne de bout en bout ;
- les compteurs Loi 8 ne montent pas ;
- les secrets réels ne sont pas présents dans les fichiers versionnés ;
- la preuve finale est générée sur l’arbre réellement commité.
