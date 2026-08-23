# ADR-016 — Profondeur des verticales : build-time (L0–L3) ≠ runtime (essential / manager / enterprise)

**Status** : Accepted — 2026-08-23
**Contexte** : MEGA-PLAN Forge Stack §2.4 & §5.3 (P4bis + P6)
**Décideurs** : équipe socle RESTAURANT-OS-CORE
**Consultés** : sessions `forge-stack-p0-p1`, `forge-stack-p2-p6`, `forge-stack-p4-p6`

---

## 1. Contexte

Deux notions distinctes de « profondeur » cohabitent dans la Forge Verticale et
étaient historiquement confondues sous le terme générique « profondeur ». Cette
ambiguïté a produit au moins deux angles morts :

1. Un commit intitulé « qualification wizard + depth switchboard » livrait en
   réalité un toggle d'affichage runtime — pas de sélecteur de tier à la
   création. Les reviewers pensaient avoir un wizard L0–L3, ils avaient un
   sélecteur `essential | manager | enterprise`.
2. Le générateur `generateVertical(bp, {tier})` acceptait un `tier` L0–L3 sans
   distinguer clairement des overrides UI runtime pilotés par `displayDepth`.

Il est temps de trancher.

## 2. Décision

Nous distinguons formellement **deux axes orthogonaux** :

| Axe | Nom canonique | Quand | Quoi | Portée | Fichier de vérité |
|---|---|---|---|---|---|
| **A** | `PrecisionTier` (L0, L1, L2, L3) | **build-time** — au moment où la Forge produit la verticale | Volume de code émis : squelette (L0) → tests + guards + addendum légal (L3) | Fichiers du repo | `src/verticals/_shared/blueprint/VerticalBlueprint.ts` |
| **B** | `DisplayDepth` (`essential`, `manager`, `enterprise`) | **runtime** — chaque gérant côté client, réversible | Densité d'affichage : nombre de tuiles KPI visibles, sections repliées par défaut, options avancées cachées | Un tenant en cours d'exécution | `src/kernel/settings/displayDepth.ts` |

**Un tenant généré en L3 peut être affiché en `essential`** — le code est
présent, les modules sont montés, mais l'UI n'expose que la surface essentielle.
Inversement, un tenant généré en L0 ne peut pas être affiché en `enterprise`
avec des dashboards riches — les fichiers n'existent pas. **Le tier est un
plafond, le displayDepth est une projection.**

## 3. Conséquences

### Positives

- **Vocabulaire non ambigu** : PRs, ADRs, commits, code utilisent l'un ou l'autre terme, jamais « profondeur » seul.
- **Génération scalable** : la Forge peut proposer L2 par défaut à un onboarding pro et laisser le gérant descendre son UI à `essential` — sans perdre la substance générée.
- **Migration progressive** : un tenant peut être re-généré en L3 sans perdre son choix `displayDepth` (persistance runtime distincte).

### Négatives

- **Deux paramètres à comprendre** au lieu d'un — mais l'ambiguïté valait plus cher.
- **Documentation à maintenir** : chaque nouveau surface (wizard, MCC, skill vertical-forge) doit rappeler cette distinction.

### Neutre

- **PrecisionTier vit dans le blueprint** (persistant, dérivable des commits) ; **DisplayDepth vit dans les settings tenant** (persistant côté Nexus / storage local, changeable en un clic).

## 4. Contrat d'implémentation

### 4.1 Générateur (Forge)

- `generateVertical(bp, {tier: PrecisionTier})` — le tier est le seul discriminant du VOLUME émis. Défaut : `bp.precision` du blueprint.
- Aucun code émis ne doit lire `PrecisionTier` à l'exécution — c'est un choix de FORGE, invisible pour le tenant final.
- L2 et L3 émettent respectivement les templates `kpiDashboard`, `workflowService`, `regulationGuard`, `hardwareProvisioning`, `verticalTest` (cf. `src/verticals/_shared/forge/templates/`).

### 4.2 Runtime (composants)

- `useDisplayDepth()` (à créer si absent) lit l'atom `displayDepthAtom` de `src/kernel/settings/displayDepth.ts`.
- Un composant `<DisplayDepthGate depth="manager">` cache/déplie ses enfants selon la valeur courante.
- L'atom est réversible, persistant par tenant, valeur par défaut `manager` sauf indication du blueprint.

### 4.3 Interdictions

- ❌ Un blueprint NE doit PAS déclarer `displayDepth`. C'est un choix opérateur, pas verticale.
- ❌ Une décision UI runtime NE doit PAS dépendre de `PrecisionTier` — les composants ne connaissent pas leur origine de génération.
- ❌ La CLI `certify-vertical.ts` NE doit PAS certifier la « densité » d'un tenant : elle certifie la conformité build-time uniquement.

## 5. Migration

- Aucun changement de type ou d'API — les deux structures existent déjà. ADR-016 formalise le contrat.
- Skill `vertical-forge` : rappeler la distinction en tête de fichier (à faire dans une PR séparée — cf. handoff P6).
- Toute PR future qui parle de « profondeur » sans qualificatif doit être commentée en review avec le lien vers cette ADR.

## 6. Références

- MEGA-PLAN Forge Stack — `docs/plans/MEGA-PLAN-FORGE-STACK-2026-08-22.md` §2.4 et §5.3
- Handoff P2→P6 — `docs/plans/HANDOFF-FORGE-STACK-2026-08-23.md` §2 P6
- `src/verticals/_shared/blueprint/VerticalBlueprint.ts` — définition `PrecisionTier`
- `src/kernel/settings/displayDepth.ts` — atom `displayDepthAtom` + `<DisplayDepthGate>`
- `scripts/certify-vertical.ts` — smoke-test build-time
