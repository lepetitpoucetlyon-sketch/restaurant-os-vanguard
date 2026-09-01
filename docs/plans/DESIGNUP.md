# DESIGNUP — Refonte visuelle par le design system

> **Prémisse corrigée (mesurée le 2026-09-01)** : **26 pages sur 87** consomment une
> primitive du design system. Les deux tiers du produit ne remonteront pas
> mécaniquement. Monter le DS reste le meilleur levier, mais il n'est pas suffisant :
> il faut aussi **élargir sa couverture**.
>
> Version 2 — réécrite après mesure. La v1 (2026-08-31) ordonnait ses lots sur des
> estimations en `~` : deux d'entre elles étaient fausses d'un facteur 7.
> Post-audit : `docs/plans/TASTE-SKILL-AUDIT-RESTAURANT.md`

---

## 0. Point de départ — mesuré, pas estimé

Toutes les valeurs de cette section sont reproductibles. Aucune n'est recopiée.

### Ce qui est déjà propre

| Actif | État |
|---|---|
| Tokens sémantiques CSS (`--color-action-*`, `--color-surface-*`, `--color-status-*`) | Bien structuré, dual-track `data-theme` + `prefers-color-scheme` |
| Tokens de marque runtime (`--brand-*`, `--font-brand`, `--font-ui`, `--font-mono`) | Injectés par `BrandingProvider` par tenant |
| Breakpoints métier | 4 tiers alignés JS + CSS (640 / 1024 / 1440 / kiosk) |
| Safe area iOS · touch targets 44 px · motion tokens | En place |
| `PageShell` | 728 l., 4 variants, kicker + tabs + alerts + status |
| `Modal` (262 l.) · `BottomSheet` (155 l.) | Focus trap présent |
| `EmptyState` (105 l.) · `Skeleton` (192 l.) | Vraies primitives, pas des placeholders |
| `BentoGrid` (93 l.) | Partagé |
| `/design-system` | Existe, 15,5 Ko, partiel |
| Fonts | Outfit + Instrument Serif + JetBrains Mono, propagées aux 9 verticales |
| PWA | Manifest + shortcuts, service worker, standalone |

### Ce qui cloche — avec les chiffres réels

| Défaut | Mesure | Commande |
|---|---|---|
| **Couverture DS faible** | **26 / 87 pages** utilisent une primitive | `find src/app -name page.tsx \| xargs grep -l "<PageShell\|<Card\|<Modal\|..."` |
| **Contrôles bruts massifs** | **1 111 `<button>`** contre 279 `<Button>` · **433 `<input>`** contre 54 | `.measures/latest.json` → `dsAdoption.extra` |
| … répartis sur | **429 fichiers** : 241 dans `modules/`, 100 dans `shared/`, 88 dans `app/` | `grep -rlc "<button" src/<zone>` |
| **6 composants Card** (pas 5) | `Card`, `PremiumCard`, `GlassCard`, `StatCard`, `SectionCard`, **`RoleCard`** | `find src/shared/components -name "*Card*.tsx"` |
| **2 conventions de nommage** | **1 569** `bg-bg-*` contre **2 041** `bg-surface-*` | `grep -rho 'bg-bg-[a-z]*' src` |
| **Or codé en dur** | **206 occurrences** de `rgba(197,160,89)` / `#C5A059` dans `src/` | voir §1 — c'est le défaut le plus grave |
| **Pages hors PageShell** | `pos/page.tsx` **278 l. et 7 modals empilés** | `awk 'END{print NR}'` |
| **Aucun invariant anti-hex** | 0 règle lint | `grep no-hardcoded-hex eslint.config.mjs` |
| **Charte typo implicite** | Tokens `--text-*` définis, usage non guidé | — |

### Une mesure morte, à ne plus utiliser

La v1 pilotait sur *« dsAdoption 474/478 écrans hors DS »* et visait *« ≤ 400/478 »*.

**Ce compteur est à 0 depuis le 2026-08-30.** Une campagne l'a effondré en une journée
(485 → 471 → 87 → 37 → 19 → 6 → 1 → 0, cf. `.measures/history.jsonl`). La cible de la
v1 était donc *moins bonne* que la réalité déjà atteinte.

Mais le diagnostic de la v1 restait juste — **c'est la mesure qui a cessé de le voir** :

```js
// scripts/measure/measures.mjs — analyzeDsFile
const fabrique = /<button\b|<input\b|rounded-(?:xl|2xl)/.test(src);
if (fabrique && !adopteVraimentDs(src)) state.detail.push(c.rel(f));
```

Elle demande *« ce fichier touche-t-il le DS quelque part ? »*, pas *« l'utilise-t-il
partout ? »*. Un fichier avec un `<Button>` et quinze `<button>` compte comme adoptant.

**→ Le pilotage passe sur `boutonsBruts` / `champsBruts`, qui bougent encore.**

---

## 1. La contrainte qui prime — personnalisation tenant depuis le MCC

**À lire avant tout lot.** Cette section n'existait pas en v1, et son absence rendait le
Lot 2 dangereux.

### Le mécanisme est en place

| Brique | Rôle |
|---|---|
| `brandingMode: 'default' \| 'custom'` | Un tenant peut porter sa propre charte |
| `MccBrandingOverridePanel` (`admin/mcc/_tabs/branding-override/`) | Le MCC force ou réinitialise les tokens d'un tenant : nom, logo, couleurs |
| `BrandingAccessSection` | Le MCC ouvre la personnalisation par capability : `mod_brand_basic`, `mod_brand_plus` |
| `BrandingProvider` | Injecte `--brand-*`, `--font-brand`, `--font-ui`, `--font-mono` sur `:root` au runtime |
| Verticale `custom` | Démarre volontairement en **zinc neutre** (`#18181B` / `#27272A` / `#3F3F46`) pour recevoir la charte du client |

Autrement dit : **la couleur n'appartient pas au design system, elle appartient au
tenant.** L'or `#C5A059` est la valeur *par défaut*, pas une constante.

### La fuite, mesurée

**206 occurrences** de l'or en dur dans `src/` — dont **dans les primitives du DS
elles-mêmes** :

```
src/shared/components/ui/Card.tsx:14
  shadow-[0_1px_2px_rgba(197,160,89,0.04)]
src/shared/components/ui/PremiumCard.tsx:67
  hover:shadow-[0_20px_40px_-16px_rgba(197,160,89,0.22)]
```

Répartition : `shared/components` 21 · `modules/commerce` 10 · `app/(marketing)` 10 ·
`shared/nexus` 8 · `modules/ops` 6 · `modules/facility` 5 · `app/(client)` 5 …

**Conséquence produit** : un tenant qui passe en `brandingMode: 'custom'` avec une charte
bleue reçoit quand même des **ombres dorées**. La personnalisation MCC est contournée par
le design system.

### Ce que la v1 aurait fait

Sa spécification CVA du Lot 2 écrivait, mot pour mot :

```
default:  'bg-surface-card border-border-default shadow-[0_1px_2px_rgba(197,160,89,0.04)]'
elevated: 'shadow-[0_8px_24px_-12px_rgba(197,160,89,0.15)] hover:shadow-[...rgba(197,160,89,0.22)]'
```

Elle aurait **cimenté la fuite dans le composant unifié**, donc dans les 37 fichiers qui
en dépendent.

### Règle non négociable pour toute la refonte

> **Aucune primitive du DS ne contient de valeur chromatique littérale.**
> Toute couleur passe par un token. Les ombres teintées utilisent les tokens existants
> `--shadow-glow-accent` et `--shadow-premium`, eux-mêmes dérivés de `--brand-accent-color`.

Corollaires :

- Le **Lot 0** (nouveau, ci-dessous) purge l'or des primitives **avant** tout restylage.
- Le lint `no-hardcoded-hex` (§4.2) n'est pas une finition : c'est le garde-fou de la
  personnalisation MCC. Il monte en priorité.
- **Test de recette de chaque lot** : basculer un tenant de démo en `brandingMode: 'custom'`
  avec une charte franchement non-dorée (bleu, vert) et vérifier qu'aucun or ne subsiste
  à l'écran.

---

## 2. Stratégie — lever le DS **et** élargir sa couverture

La v1 posait : *« toucher 10 composants partagés > refaire 84 pages »*. Vrai, mais
incomplet : **61 pages sur 87 ne consomment aucune primitive**, donc ne reçoivent rien.

La stratégie corrigée a deux jambes :

1. **Lever** ce qui est partagé — c'est le levier, il reste le meilleur rapport.
2. **Élargir** — convertir les contrôles bruts en primitives, par lots, sous cliquet.
   C'est du travail de volume, mais c'est le seul chiffre qui bouge encore.

### Rentabilité — mesurée, et donc réordonnée

| Levier | Consommateurs **mesurés** | v1 annonçait | Fichiers à toucher |
|---|---|---|---|
| **Modal + BottomSheet** | **39** | ~40 (×20) | 2 |
| **Famille Card** (6 composants) | **37** | ~60 (×60) | 6 → 1 |
| **PageShell** | **21** | ~50 (×50) | 1 |
| **BentoGrid** | **4** | ~15 (×15) | 1 |
| **EmptyState** | **4** | ~30 (×30) | 1 |

Deux lots de la v1 s'effondrent :

- **EmptyState** — 2 h de code **et 8 illustrations SVG à dessiner**, pour **4 fichiers**.
  Le plus gros effort du plan pour son plus petit levier.
- **BentoGrid** — la v1 dit « déjà utilisé sur 6 pages », c'est **4**. Et elle propose
  d'en refactorer 9 autres à la main : ce n'est pas du levier, c'est du page-par-page
  déguisé en travail de DS.

**Les deux descendent en fin de parcours et fusionnent** (§3, Lot 5).

---

## 3. Les lots, réordonnés

### Lot 0 — Purger l'or des primitives (prérequis, ~1 h 30)

Rien ne commence avant. C'est ce qui protège la personnalisation MCC.

- [ ] Remplacer les **21 occurrences** de `shared/components` par les tokens
      `--shadow-glow-accent` / `--shadow-premium`, ou par une ombre neutre
      `rgba(0,0,0,α)` quand la teinte n'apporte rien.
- [ ] Étendre aux 8 de `shared/nexus`.
- [ ] Poser le lint `no-hardcoded-hex` (§4.2) **dans le même lot**, avec cliquet
      `HARDCODED_HEX_MAX` baseliné sur la valeur mesurée après purge.
- **Recette** : tenant de démo en `brandingMode: 'custom'`, charte bleue → zéro or à l'écran.
- **DoD** : `grep -c "197,\s*160,\s*89\|#C5A059" src/shared` = 0.

### Lot 1 — PageShell éditorial (21 consommateurs, 1 fichier)

Meilleur rapport une fois l'or purgé.

**Avant de modifier** : capturer `PageShell.test.tsx` en snapshot sur les 4 variants.
La v1 plaçait ce test *après* la refonte — un snapshot pris après verrouille le nouveau
rendu et ne détecte aucune régression.

| Élément | Après |
|---|---|
| Title | `font-serif italic text-3xl md:text-5xl leading-[1.02] tracking-tight`, `text-wrap: balance` |
| Kicker | `font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted` |
| Tabs | Underline animé (`layoutId` + spring) + pulse dot actif |
| Actions | Group avec trailing arrow (`ArrowUpRight` en cercle interne) |
| Alert ribbon | Gradient + shimmer 4 s **conditionné à `prefers-reduced-motion`** |
| Status pulse | Halo 2 couches (breathe outer + solid inner) |
| Hero variant | Kicker mono + title Instrument Serif + subtitle 65ch + hairline accent **tokenisé** |
| Compact | `tabular-nums` forcé sur la ligne d'actions |

**Migration** : aucune. Les 21 pages reçoivent la mise à jour.

### Lot 2 — Card unifié — **en deux commits séparés** (37 consommateurs, 6 → 1)

La v1 fusionnait ET restylait dans le même lot. Si le résultat déplaît, on ne sait pas si
c'est la fusion ou le style. On sépare.

**Commit A — fusion à rendu strictement identique.** `Card`, `PremiumCard`, `GlassCard`,
`StatCard`, `SectionCard`, **`RoleCard`** (oublié par la v1) deviennent des alias qui
forwardent vers un `Card` unique. Aucun pixel ne bouge — prouvable par snapshot.

**Commit B — restylage**, une fois la structure validée.

```tsx
<Card
  intent="default | elevated | glass | premium | ghost | stat | section | role"
  size="sm | md | lg"
  interactive={boolean}
  bezel={boolean}
  tint="none | accent | success | warning | danger"   // ← 'accent', pas 'gold'
/>
```

`tint="accent"` et non `tint="gold"` : le nom du token ne présume pas de sa valeur, qui
appartient au tenant (§1).

### Lot 3 — Modal + BottomSheet (39 consommateurs, 2 fichiers)

Remonté en 3ᵉ position — la v1 le plaçait 4ᵉ alors que c'est le plus gros levier mesuré.

- **Modal morphing** via `layoutId` — **opt-in** (`variant="morph"`), pas par défaut.
  La v1 recommandait le morphing partout : 27 modals dont 7 sur le seul POS, chacune
  exigeant que son déclencheur porte le même `layoutId`. Trop de transitions non testées
  d'un coup.
- **Garde `prefers-reduced-motion` obligatoire** — ce dépôt respecte WCAG 2.3.3 depuis le
  lot taste-skill (`MotionProvider`). Un spring non gardé est une régression d'accessibilité.
- **`variant="side"`** — panneau latéral 480 px pour formulaires longs. C'est lui qui
  résout le POS-modal-hell (§5.2).
- **BottomSheet drag-to-dismiss** — `useDragControls`, snap points 33 / 60 / 90 %.
- **Backdrop** uniforme : `backdrop-blur-[6px] bg-black/50` mobile, `bg-black/70 backdrop-blur-sm` desktop.

### Lot 4 — Résorber les contrôles bruts (**nouveau — le vrai chantier**)

Absent de la v1, alors que c'est là que vit l'incohérence visuelle.

**1 111 `<button>` bruts contre 279 `<Button>`. 433 `<input>` contre 54.** Sur 429 fichiers.

- [ ] Poser le cliquet **`RAW_CONTROLS_MAX`** dans `preflight.sh`, baseliné sur la mesure
      du jour (`dsAdoption.extra.boutonsBruts + champsBruts`).
- [ ] Résorber **par lots de ~50 contrôles**, en commençant par `modules/` (241 fichiers,
      la plus grosse poche) puis `app/`.
- [ ] Faire descendre le cliquet à chaque lot.

Ce n'est pas glorieux, c'est du volume — mais c'est mesurable, pilotable, et c'est le seul
compteur qui bouge encore maintenant que `dsAdoption` est saturé à 0.

### Lot 5 — BentoGrid + EmptyState (fusionnés, 8 consommateurs au total)

Les deux lots les moins rentables du plan, réunis et placés en fin de parcours — pas
supprimés, mais nommés pour ce qu'ils sont : **du travail page par page**.

- **BentoGrid** : presets `masonry`, `dashboard` (12-col + span, collapse < md),
  `hero-split`, `stagger` CSS pur. Puis refactor des dashboards analytiques, ~15 min/page.
- **EmptyState** : titre serif italique, description 42ch, CTA plat.
  **Les 8 illustrations SVG passent en option** — c'est une tâche de design, pas 2 h de
  code, pour 4 fichiers. À arbitrer (§10).

---

## 4. Hygiène du DS

### 4.1 Guide visible (`/design-system`)

Sections : Fondations (palette **avec le nom du token, pas le hex**) · Composants en 3 états
+ snippet + variantes CVA · Patterns · Do/Don't · Guide de migration.

**Ajout v2** : une section « Personnalisation tenant » montrant le même écran sous 3
chartes (défaut or, custom bleu, custom neutre). C'est la preuve visuelle que §1 tient.

### 4.2 Lint `no-hardcoded-hex` — **remonté en Lot 0**

Bloque `#[0-9a-fA-F]{3,8}` et `rgba(` littéral dans className/style. Whitelist :
`globals.css`, `tokens/*`, `blueprints/*`, `verticals/*/ui.ts`, `app/(marketing)/*`.
Cliquet `HARDCODED_HEX_MAX` baseliné après la purge du Lot 0.

### 4.3 Invariant `PageShell` obligatoire

Toute page sous `src/app/(client)/(ops)/*/page.tsx` importe `PageShell` ou `AutoSafeLayout`.
Allowlist explicite : POS, KDS, Floor Plan, marketing.
Cliquet `PAGES_WITHOUT_SHELL_MAX` baseliné à la mesure.

### 4.4 Charte typographique — **par script, pas seulement latine**

La v1 déclarait la charte « loi » en ne prévoyant que le latin. Ce produit a **5 locales
à parité 0**, sous gate. `Instrument Serif italique` avec `tracking: 0.24em` est illisible
en japonais — **et le japonais n'a pas d'italique.**

| Usage | Latin (fr/en/es/pt) | CJK (ja) |
|---|---|---|
| Hero H1 | Instrument Serif italic, 5xl→7xl, -0.02em, lh 1.02 | sans-serif, poids 600, tracking **0**, lh **1.4** |
| Page title | Instrument Serif italic, 3xl→5xl | idem, poids 600 |
| Kicker | JetBrains Mono, 10-11px, tracking 0.24em uppercase | Mono, tracking **0.05em**, pas d'uppercase |
| Body | Outfit 14px, lh 1.6 | lh **1.8** |
| KPI value | Instrument Serif, tabular-nums | Mono tabular-nums |
| Data table | JetBrains Mono 12-13px, tabular-nums | idem |

Implémentation : `:root:lang(ja)` surcharge les tokens `--font-*` et `--tracking-*`.
Pas de branche JS.

### 4.5 Pas de Storybook

Enrichir `/design-system` avec un player de props. Plus léger, vit dans l'app, sert
aussi de vitrine commerciale. (Inchangé v1 — bonne décision.)

---

## 5. Ce qui nécessite de toucher les pages

### 5.1 Pages hors PageShell (~10)

`pos/page.tsx` (278 l., layout tactile — garder le shell custom, adopter les tokens et le
Card unifié) · `kds/page.tsx` (refondre `KDSDashboard`) · `floor-plan/page.tsx` (canvas,
layout custom) · `operations/page.tsx` (refondre `OperationsDashboard`) · landings
`verticales/[slug]` (unifier via un `<VerticalHero>` partagé).

### 5.2 POS modal hell

**7 modals confirmés** sur `pos/page.tsx` : `PaymentDialog`, `SplitBillDialog`,
`VoidModal`, `PinModal`, `CashDrawerModal`, `SosCaisseModal`, `BottomSheet`.

Après Lot 3 : `variant="side"` pour Payment / Split / Sos, `variant="center"` pour Pin,
BottomSheet conservé pour le panier mobile.

### 5.3 Landings marketing (~5)

`HomeContent.tsx` fait. Reste `pricing/*`, `verticales/[slug]`, `roi-calculator`,
`vs-lightspeed`, `vs-zelty`. Même grammaire : hero split + bento asymétrique + CTA plat.

---

## 6. Métriques de succès — pilotage corrigé

| Mesure | Baseline 2026-09-01 | Cible | Commande |
|---|---|---|---|
| **Or en dur dans `src/shared`** | **21** | **0** | `grep -c "197,\s*160,\s*89\|#C5A059" src/shared` |
| **Or en dur dans tout `src/`** | **206** | ≤ 30 (marketing + tokens) | idem sur `src/` |
| **Boutons bruts** | **1 111** | ≤ 800 (1ʳᵉ passe) | `.measures/latest.json` |
| **Champs bruts** | **433** | ≤ 300 | idem |
| **Pages avec ≥ 1 primitive** | **26 / 87** | ≥ 45 / 87 | `find src/app -name page.tsx \| xargs grep -l ...` |
| **Composants Card** | **6** | 1 (+ 5 alias) | `find src/shared/components -name "*Card*.tsx"` |
| **`#hex` hors whitelist** | à mesurer | 0 | nouveau lint |
| **Pages sans shell** | à mesurer | ≤ 10 (allowlist) | nouvel invariant |
| `tsc` | 0 | 0 | `npx tsc --noEmit` |
| Tests | **2 467** | ≥ 2 467 | `npx vitest run` |
| **Cycles madge** | **0** | **0** | `node scripts/cycles-inspector.mjs --threshold=0` |

⚠️ **`dsAdoption` n'est plus une cible** — saturé à 0 depuis le 2026-08-30, il ne mesure
plus rien d'actionnable.

⚠️ **Les cycles sont à 0 depuis le 2026-09-01** et le cliquet madge est à 0. La fusion Card
touche 6 fichiers très importés : le moindre cycle fera rougir le preflight. C'est voulu —
la gate mord enfin.

---

## 7. Ordre d'exécution

```
Session 1 — Protéger la personnalisation
├─ Lot 0 : purge de l'or dans les primitives        1 h 30
└─ Lint no-hardcoded-hex + cliquet                    30 min

Session 2 — Fondations
├─ Snapshot PageShell AVANT modification              15 min
├─ Lot 1 : PageShell éditorial                          2 h
└─ Charte typo par script dans /design-system         45 min

Session 3 — Dédup structurelle
├─ Lot 2 commit A : fusion Card, rendu identique      2 h 30
└─ Lot 2 commit B : restylage                           1 h

Session 4 — Interactions
├─ Lot 3 : Modal + BottomSheet (opt-in + reduced-motion) 2 h
└─ Invariant PageShell + allowlist                    30 min

Sessions 5-N — Volume (le vrai chantier)
└─ Lot 4 : contrôles bruts, lots de ~50, cliquet décroissant

Session finale (optionnelle)
├─ Lot 5 : BentoGrid + EmptyState                       3 h
├─ POS modals → variant="side"                          2 h
└─ /design-system enrichie + section personnalisation   2 h
```

**Cœur : 4 sessions (~11 h).** Lot 4 est un chantier de volume, pas une session.
L'estimation « ~18 h pour tout » de la v1 était optimiste : elle comptait 8 illustrations
SVG comme 2 h de code.

---

## 8. Checklist avant chaque PR

- [ ] Baseline `.measures/history.jsonl` capturée **avant** et après
- [ ] `npx tsc --noEmit` → 0
- [ ] `npx vitest run` → tous verts
- [ ] `node scripts/cycles-inspector.mjs --threshold=0` → **0 cycle**
- [ ] `boutonsBruts` / `champsBruts` ne montent pas
- [ ] **Recette personnalisation** : tenant démo `brandingMode: 'custom'` en charte bleue → zéro or
- [ ] Snapshot ajouté **avant** modification, pas après
- [ ] Screenshot avant/après pour PageShell / Card / Modal
- [ ] Aucun `npm install` sans demande explicite
- [ ] **Aucun cliquet relevé** (Loi 2) — on corrige à la source
- [ ] **Inscription dans `.claude/sessions.md`** avec les chemins touchés

---

## 9. Ce qu'on ne fait PAS

- ❌ Réécrire les 87 pages une par une
- ❌ Installer Storybook
- ❌ Migrer Lucide → Phosphor (87 fichiers, refusé sans install)
- ❌ Toucher aux blueprints non-restaurant
- ❌ Refaire les modales MCC internes
- ❌ Ajouter des dépendances
- ❌ Un design system parallèle
- ❌ **Écrire une couleur littérale dans une primitive** (§1)
- ❌ **Piloter sur `dsAdoption`** — mesure saturée

---

## 10. Décisions à valider avant de lancer

| Question | Options | Reco |
|---|---|---|
| **Ombres teintées** | (a) tokens `--shadow-glow-accent` dérivés de la marque tenant · (b) ombres neutres partout · (c) teinte or figée | **(a)** — respecte §1 sans perdre la signature |
| **Sidebar vs Topbar** | (a) sidebar left double-bezel · (b) topbar glass · (c) hybride | (a) — inchangé, déjà intégrée aux workflows tactiles |
| **Dédup Card** | (a) alias forward · (b) deprecation 3 mois · (c) breaking | (a) — mais **en 2 commits** (fusion puis style) |
| **Modal morphing** | (a) opt-in `variant="morph"` · (b) défaut partout | **(a)** — la v1 disait (b) ; 27 modals non testées + risque reduced-motion |
| **Illustrations EmptyState** | (a) 8 SVG maison · (b) Lucide agrandi · (c) rien | **(b) ou (c)** — 8 SVG pour 4 fichiers ne se justifie pas |
| **Lot 4 (contrôles bruts)** | (a) chantier continu sous cliquet · (b) une grosse passe · (c) ignorer | **(a)** — 1 544 contrôles, personne ne fera (b) |

---

## 11. Prochaine action

**Lot 0**, sur branche `designup-lot-0-purge-or`.

C'est le prérequis de tout le reste : tant que les primitives portent l'or en dur, chaque
lot suivant propage la fuite un peu plus loin, et la personnalisation MCC reste
contournée.

Recette de sortie : un tenant de démo en `brandingMode: 'custom'`, charte bleue, zéro or
à l'écran.

---

> **Avertissement de coordination** — Antigravity travaille sur le dépôt et **ne s'est pas
> inscrit** dans `.claude/sessions.md`. Ce plan touche `shared/components/ui/`, le
> périmètre le plus partagé du dépôt. S'inscrire avant de commencer, et vérifier qu'aucune
> autre session n'y est.
