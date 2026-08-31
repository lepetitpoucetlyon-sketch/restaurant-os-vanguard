# ADR-015 — La loi des couches (kernel / lib / shared / modules)

- **Statut** : Accepté — 2026-08-22
- **Contexte source** : `AUDIT-HOLISTIQUE-2026-08-22.md` + `PLAN-RECOLLAGE-2026-08-22.md`

## Problème
Trois couches transversales — `src/kernel/`, `src/lib/`, `src/shared/` — hébergent les **mêmes** concepts (`contracts`, `schemas`, `events`, `hooks`, `providers`, `nexus`). Conséquence : « où va X ? » est indécidable → les imports fuient. Mesuré à l'audit : **323 violations de frontière** en production. `src/shared/` a atteint ~640 fichiers alors qu'un chantier (branche `agent/antigravity-exec`) l'avait vidé à 3 — vidage **jamais mergé** sur `main`, écrasé par la « REBIRTH ».

## Décision — on passe de TROIS cœurs à DEUX

| Couche | Responsabilité UNIQUE | Peut importer | Ne contient JAMAIS |
|---|---|---|---|
| `kernel/` | Machine Nexus : adapter, guards, contrats runtime, primitives, types d'events, hooks & providers **core** | (rien de `modules/`, `lib/`, `shared/`) | logique métier |
| `lib/` | Services transversaux non-métier (cron, sync, seeds, mcc, adapters, services outils) | `kernel/`, autres `lib/` | UI, atomes de pilier, contrats |
| `modules/<pilier>/` | Métier, exposé via le barrel racine `@/modules/<pilier>` | `@/modules/<autre>` (barrel), `kernel/`, `lib/` | import profond d'un autre pilier |
| `shared/` | **EN EXTINCTION** — à terme : `schemas/` (primitives gelées) + `components/` (design system) uniquement | — | `nexus`, `hooks`, `providers`, `eventBus` (→ à migrer) |

### Sort de `src/shared/` (dérivé de la move-map de la branche + audit)
- `shared/nexus/` (127) → `kernel/nexus/` — **règle prouvée compilable** par la branche.
- `shared/eventBus/` (212) → `src/orchestration/` (couche assumée et **nommée**), sinon figée.
- `shared/components/` (163) → `src/design/` (design system assumé), sinon figée.
- `shared/hooks/` (46) · `shared/providers/` (27) → trier core→`kernel/`, métier→`modules/`.
- `shared/schemas/` (3) → **reste** (primitives gelées).

## Enforcement (non négociable)
1. `no-restricted-imports` (Barrel) et `vanguard/no-inter-module-imports` = **`error`**. Ratchet à **0**, ne peut que **descendre**.
2. **Interdit de faire passer une gate en la desserrant.** Ajouter un chemin à une exemption `no-restricted-imports: "off"`, relever un ratchet, poser `@ts-ignore`/`eslint-disable`/`as any` pour masquer une erreur, `skip`/supprimer un test, ou éditer à la main un tableau de résultats → **violation**, détectée par `scripts/verify-gate-integrity.mjs`. Voir `AGENTS.md`.
3. Les exemptions barrel **actuelles** (`src/kernel/ai/**`, `src/shared/eventBus/**`, `src/shared/hooks/**`, `NexusTelemetryService`, `MaintenanceAgent`) sont de la **DETTE à supprimer** — pas un acquis. Le baseline `.gate-baseline.json` ne peut que diminuer.

## Conséquences
- **+** « où va X ? » a une seule réponse ; les fuites deviennent impossibles (gate) ; une IA qui code repart d'une carte vraie.
- **−** chantier de rapatriement étalé (voir `PLAN-RECOLLAGE`), gate verte entre chaque étape.

---

## Amendement 2026-08-31 — `lib/ → modules/` : la décision, et pourquoi la gate ne la mesure pas

- **Statut** : Accepté — 2026-08-31
- **Contexte** : Plan de merge 2026-08-31, Vague 0. Prérequis de la Vague 2 (Track 1.1).

### La question posée

« `lib/` a-t-il le droit d'importer `modules/` ? »

### La réponse était déjà écrite — elle est confirmée

Le tableau des couches ci-dessus dit **non** : `lib/` peut importer `kernel/` et
d'autres `lib/`. Rien d'autre. Cet amendement ne change pas la règle ; il
documente **comment** on y arrive et **ce qui a été découvert en la mesurant**.

### Découverte 1 — la règle ESLint ne voit pas `lib/`

`vanguard/no-inter-module-imports` est bien en `error` dans `eslint.config.mjs`.
Mais son implémentation (`eslint-plugins/mur-de-chine.mjs`) n'a que deux vecteurs :

- **Vecteur 1** — ne se déclenche que si le fichier courant est sous `/src/modules/` ;
- **Vecteur 2** — ne se déclenche que si le fichier courant est sous `/src/shared/hooks/`.

Un fichier de `src/lib/` ne matche ni l'un ni l'autre : **il n'est jamais examiné**.
`/\/src\/lib\//` figure bien dans `COMPOSITION_ROOT_PATTERNS`, mais cette liste
n'est consultée que par le vecteur 2 — elle n'exempte donc rien, elle n'a
simplement aucun effet.

Mesure du 2026-08-31 (`rtk proxy npx eslint src | grep -c no-inter-module-imports`) :
**0 violation**. Ce zéro ne dit pas « c'est propre », il dit « ce n'est pas mesuré ».

> **Le chiffre de 169 est périmé.** Il vient du backlog du 2026-08-22 et n'est
> reproductible par aucune commande aujourd'hui. Ne pas le recopier (Loi 7).

### Découverte 2 — l'état réel, mesuré

`grep -rn "from '@/modules/" src/lib/ --include='*.ts' --include='*.tsx' | grep -v '\.test\.'`

| Mesure | Valeur 2026-08-31 |
|---|---|
| imports `src/lib/` → `@/modules/` | **47** |
| dont `import type` (sans coût runtime) | 11 |
| dont imports **profonds** (`@/modules/X/Y/…`) | 10 |

Principaux fichiers : `sync/pillarSyncRegistry.ts` (6) · `sovereign/firestoreHydrator.ts` (6) ·
`slm-data-generator.ts` (3) · `mcc/provisioning/steps/provisioningSteps.ts` (3) ·
`mcc/provisioning/TenantProvisioningService.ts` (3) · `TenantSeeder.ts` (3) ·
`ProvisioningEngine.ts` (3) · `nexus/NexusBridge.ts` (2) · `mcc/SystemTenantRegistry.ts` (2) ·
`cron/ThemisCollectorJob.ts` (2) · `BrandingService.ts` (2).

### Correction 2026-09-01 — la sortie « barrel » n'existe pas

L'amendement de la veille laissait entendre qu'une part de la dette se réglerait en
routant les imports profonds vers le barrel racine du pilier. **Mesuré, c'est faux, et
spectaculairement :**

| Arbre | Cycles madge |
|---|---|
| baseline (imports profonds actuels) | **2** |
| les 15 imports profonds routés vers les barrels | **100** (73 cross-piliers, 98 via barrels) |
| en ne gardant que les réécritures **dynamiques** (`await import(...)`) | **5** |
| en ne gardant que l'ajout d'un export au barrel | **2** |

Les piliers importent `lib/`. Un fichier de `lib/` qui importe le barrel d'un pilier
ferme la boucle — **en statique (95 cycles) comme en dynamique (3 cycles)**.

Conséquence directe : le commentaire
`/* eslint-disable no-restricted-imports -- aggregator: must use deep paths for cycle prevention */`
en tête de `src/lib/sync/pillarSyncRegistry.ts` **n'est pas de la négligence, c'est de
l'ingénierie correcte**. Les chemins profonds sont porteurs précisément parce qu'ils
contournent le barrel. Les « corriger » en surface casse le dépôt.

La règle du vecteur 3 est donc **stricte** : `lib/` n'importe `@/modules/…` à aucune
profondeur, barrel compris.

### Décision — quatre sorties, dans cet ordre de préférence

Aucune n'est une réécriture de chemin d'import. Toutes déplacent une responsabilité :

1. **`import type`** — si seul le type est utilisé. Aucune arête à l'exécution, aucun
   cycle. Déjà appliqué sur 11 imports.
2. **Contrat neutre dans `kernel/contracts/`** — si `lib/` a besoin d'un *comportement*.
   Le module s'enregistre, `lib/` consomme l'interface.
3. **NexusEventBus** — si la relation est un effet de bord sans valeur de retour.
4. **Relocaliser le composition root** — quand le fichier de `lib/` est un assembleur
   qui doit légitimement connaître les piliers. C'est le cas de la chaîne
   `NexusSyncService` → `NexusSyncBootstrap` → `pillarSyncRegistry`, **entièrement logée
   dans `lib/`** : elle n'a pas sa place sous la loi des couches et doit remonter dans un
   composition root assumé. C'est un chantier de déplacement, pas une passe de correction.

**Jamais retenu** : exempter `lib/` de la règle, élargir `COMPOSITION_ROOT_PATTERNS`, ou
router vers les barrels (cf. la mesure ci-dessus).

### Enforcement — posé le 2026-09-01

L'instrument est réparé et la dette est instrumentée, sans qu'aucun cliquet existant ne
bouge :

1. **Vecteur 3 ajouté** au plugin (`eslint-plugins/mur-de-chine.mjs`) : un fichier sous
   `/src/lib/` important `@/modules/…` (hors `import type`, et hors import dont *tous*
   les specifiers sont `type`) est une erreur.
2. **`messageId` distinct** (`libToModules`) : cette dette a son **propre compteur**.
   `INTER_MODULE_MAX` continue de ne compter que les violations module↔module et **reste
   à 0**. Instrumenter une dette jamais mesurée n'est pas relever un cliquet — c'est
   l'inverse, c'est cesser de la cacher.
3. **`LIB_TO_MODULES_MAX=46`** dans `preflight.sh`, baseline = la valeur mesurée le jour
   de l'activation. Elle ne peut que descendre ; le script signale explicitement quand il
   faut l'abaisser.

Quand ce compteur atteint 0, les deux compteurs fusionnent et la règle redevient unique.
