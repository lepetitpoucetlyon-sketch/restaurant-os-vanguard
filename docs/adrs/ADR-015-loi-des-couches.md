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

### Décision — quatre sorties, dans cet ordre de préférence

Pour chaque import `lib/ → modules/`, appliquer la première sortie applicable :

1. **`import type`** — si seul le type est utilisé. Aucun couplage à l'exécution,
   aucune arête dans le graphe de dépendances. Couvre les 11 déjà convertis et
   une part du reste. **C'est la sortie par défaut, à tenter en premier.**
2. **Contrat neutre dans `kernel/contracts/`** — si `lib/` a besoin d'un
   *comportement* du module. Le module s'enregistre (`StockOracleRegistry`,
   `IStockOracle`…), `lib/` consomme l'interface. Sortie des registres :
   `pillarSyncRegistry` doit recevoir ses `*.sync` par inscription, pas les
   importer nommément.
3. **NexusEventBus** — si la relation est un effet de bord et non une requête
   avec retour. `ThemisCollectorJob`, les étapes de provisioning : émettre, ne pas appeler.
4. **Descendre le service dans `modules/`** — si le fichier de `lib/` est en réalité
   du métier déguisé. Dernier recours : il déplace le problème plutôt que de le
   supprimer, et se heurte au hook de collision de session.

**Jamais retenu** : exempter `lib/` de la règle, ou élargir `COMPOSITION_ROOT_PATTERNS`.
Ce serait desserrer une gate — interdit par le §2 ci-dessus.

### Enforcement à poser

Avant de faire descendre le compteur, **réparer l'instrument** — sinon on corrige
à l'aveugle et rien ne garde l'acquis :

1. Ajouter au plugin un **vecteur 3** : fichier sous `/src/lib/` important
   `@/modules/…` (hors `importKind === "type"`) → `error`.
2. Poser le ratchet à la valeur **mesurée le jour où le vecteur 3 est activé**
   (attendue autour de 36 = 47 − 11 type-only), puis le faire descendre.
3. Quand le compteur atteint 0 : rendre la règle bloquante dans `preflight.sh` et
   re-figer `scripts/verify-gate-integrity.mjs`.

Le vecteur 3 et la correction sont **deux commits séparés** : le premier fait
rougir la gate en révélant la dette, le second la résorbe. Poser le ratchet à la
valeur mesurée entre les deux est la seule manière honnête de ne pas mentir sur
l'état de départ.
