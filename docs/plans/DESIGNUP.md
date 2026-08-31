# DESIGNUP — Refonte visuelle par le design system

> **Prémisse** : les 84 pages consomment un design system partagé.
> On monte le DS d'un cran, les 84 pages remontent avec — sans les toucher.
> Date : 2026-08-31
> Post-audit : `docs/plans/TASTE-SKILL-AUDIT-RESTAURANT.md`

---

## 0. Point de départ (mesuré, pas ressenti)

### Ce qui est déjà propre

| Actif | État |
|---|---|
| Tokens sémantiques CSS (`--color-action-*`, `--color-surface-*`, `--color-status-*`, glass surfaces) | Bien structuré, dark/light dual-track (`data-theme` + `prefers-color-scheme`) |
| Breakpoints métier | 4 tiers alignés JS + CSS : mobile ≤ 640, tablet ≤ 1024, desktop ≤ 1440, kiosk > 1440 |
| Safe area iOS | `pb-safe`, `pt-safe`, `px-safe` utilities |
| Touch targets | `touch-target` utility (44px WCAG 2.5.5) |
| Motion tokens | `ease-out-expo`, `ease-out-back`, `ease-in-out-quint` + 5 durations |
| Framer Motion | 65 imports dans `shared/components`, `layout`/`layoutId`/`AnimatePresence` utilisés |
| ResponsiveShell | 4 slots mobile/tablet/desktop/kiosk avec fallback |
| BentoGrid | Composant partagé, déjà utilisé sur POS/KDS/Timeclock/Inventory/Menu Engineering/Analytics |
| PageShell | Shell éditorial avec kicker + tabs + alerts + status |
| EmptyState | 105 lignes, composé (pas juste "Aucune donnée") |
| Skeleton | 192 lignes + SkeletonList 106 lignes — vraies primitives loading |
| PWA | Manifest + shortcuts POS/Kitchen, service worker, standalone |
| Fonts (post taste-skill) | Outfit + Instrument Serif + JetBrains Mono, propagées aux 9 verticales |
| Palette (post taste-skill) | Or `#C5A059` cohérent, plus d'AI purple `#6366f1` / `#8B5CF6` |

### Ce qui cloche

| Défaut | Impact | Cause racine |
|---|---|---|
| **5 composants Card** (Card, PremiumCard, GlassCard, StatCard, SectionCard) | Développeurs choisissent au hasard, look incohérent | Croissance organique, jamais dédupliquée |
| **2 conventions de nommage** (`bg-bg-primary` vs `bg-surface-bg`) | Grep hasardeux, refactor risqué | Migration inachevée |
| **Ratchets figés** (dsAdoption 474/478 écrans hors DS) | 78 % des écrans OK, 22 % legacy | Pages écrites avant le DS, jamais migrées |
| **Pages qui by-passent PageShell** (POS 275 l., KDS, Floor Plan…) | Le DS ne les protège pas | Layouts métier tactiles, PageShell pas adapté à leur contrainte |
| **Design system sans vitrine** | Impossible de "voir" ce qui existe | `/design-system` existe mais partiel |
| **Aucun invariant anti-hex-hardcodé** | `#hex` s'infiltre au fil de l'eau | Pas de garde-fou lint |
| **Charte typo implicite** | Chaque page invente son échelle | Tokens `--text-*` définis mais pas usage-guidés |

**Diagnostic : DS grade B+.** Fondations solides, discipline manquante, dette accumulée par absence de garde-fous.

---

## 1. Stratégie — Lever le DS, pas les 84 pages

### Principe

Toucher **10 composants partagés** > refaire 84 pages une par une.

**Effort réel : 3-4 sessions ciblées.**

Le piège est de vouloir "refaire toutes les pages" — c'est une erreur de scope. Chaque page qui vit dans le DS remonte automatiquement. Les pages qui ont fui le DS (POS, KDS, Floor Plan, landings marketing) sont un chantier séparé, plus petit, et **à faire APRÈS avoir remonté le DS** — sinon on remonte deux fois.

### Rentabilité mesurée

| Levier | Pages impactées | Effort | Ratio |
|---|---|---|---|
| **PageShell** | ~50 pages | 1 fichier | ×50 |
| **BentoGrid** | dashboards analytiques (~15 pages) | 1 fichier | ×15 |
| **Modal / BottomSheet** | ~40 pages (tous les dialogs) | 2 fichiers | ×20 |
| **Header / Sidebar** | 84 pages (shell global) | 3-5 fichiers | ×20 |
| **EmptyState** | ~30 pages | 1 fichier | ×30 |
| **Card dédup** | ~60 pages | Fusion 5→1 fichier | ×60 |
| **Tokens globals.css** | 84 pages | 1 fichier | ×84 |
| Refaire une page à la main | 1 page | 1 page | ×1 |

---

## 2. Plan par lots (ordre de rentabilité décroissant)

### Lot 1 — PageShell éditorial (impact max, risque min)

**Fichier** : `src/shared/components/ui/PageShell.tsx`

**Ce que fait déjà PageShell** : titre, kicker (petite majuscule serif italique), subtitle, icon/emoji, badges, breadcrumbs, actions, tabs, alertes (rush/critical/warning/info), status pulse, 4 variants (default/compact/flush/hero).

**Ce qu'on améliore**

| Élément | Avant | Après (taste-skill) |
|---|---|---|
| **Title** | `font-serif italic` variable selon usage | `font-serif italic text-3xl md:text-5xl leading-[1.02] tracking-tight`, `text-wrap: balance` systématique |
| **Kicker** | Italic serif petit | `font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted` — plus éditorial, aligné hero landing |
| **Tabs** | Underline statique | Underline animé (framer `layoutId` + spring) + active pulse dot |
| **Actions cluster** | Boutons standards | Group avec button-in-button trailing arrow (`ArrowUpRight` nested dans cercle interne) |
| **Alert ribbon** | Gradient statique | Gradient + shimmer subtil (loop 4s infini) pour rush critique |
| **Status pulse** | `bg-emerald-400 animate-pulse` | Halo 2 couches (breathe outer + solid inner) — signal live sans crier |
| **Hero variant** | H1 x4 | H1 masonry avec kicker mono + title Instrument Serif italique + subtitle 65ch + separator hairline or |
| **Compact variant** | Padding réduit | + tabular-nums forcé sur toute la ligne d'actions (compteurs de tickets/tables) |

**Migration** : aucune. Les 50 pages qui consomment PageShell reçoivent la mise à jour automatiquement.

**Sécurité** : ajouter un test snapshot Vitest sur les 4 variants pour verrouiller le rendu (`PageShell.test.tsx`).

### Lot 2 — Card unifié (dédup 5→1)

**Fichiers touchés** : `Card.tsx`, `PremiumCard.tsx`, `GlassCard.tsx`, `StatCard.tsx`, `SectionCard.tsx` → **un seul** `Card.tsx` avec variantes CVA.

**Nouvelle API** :

```tsx
<Card
  intent="default | elevated | glass | premium | ghost | stat | section"
  size="sm | md | lg"
  interactive={boolean}   // active hover lift + focus ring
  bezel={boolean}         // active la double-bezel (nested rounded)
  tint="none | gold | success | warning | danger"
>
  {children}
</Card>
```

**Variantes CVA** (extrait) :

| Intent | Rendu |
|---|---|
| `default` | `bg-surface-card border-border-default shadow-[0_1px_2px_rgba(197,160,89,0.04)]` |
| `elevated` | `shadow-[0_8px_24px_-12px_rgba(197,160,89,0.15)] hover:shadow-[0_20px_40px_-15px_rgba(197,160,89,0.22)] hover:-translate-y-[1px]` |
| `glass` | `bg-surface-card/40 backdrop-blur-xl border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]` |
| `premium` | Double-bezel : outer `bg-white/5 ring-1 ring-black/5 p-1.5 rounded-[2rem]` + inner `rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]` |
| `stat` | `p-6 rounded-[2rem]` + slot icon top + slot value serif tabular + slot delta hint |
| `section` | Titre serif italique + divider hairline + content padding |

**Migration** : les 5 anciens exports (`PremiumCard`, `GlassCard`, `StatCard`, `SectionCard`) deviennent des **alias mince** qui forwardent vers `Card` avec les bons props par défaut. Aucune page à modifier.

**Bénéfice** : un seul endroit pour toucher les ombres, radius, hover, focus.

### Lot 3 — BentoGrid généralisé aux dashboards analytiques

**Fichier** : `src/shared/components/ui/BentoGrid.tsx` (déjà partagé, déjà utilisé sur 6 pages).

**Pages cibles restantes** : Analytics, HACCP, Finance, CRM, Reservations groups, MCC dashboard, Audit portal, Blueprint, Design-system.

**Ce qu'on ajoute au composant**

- **Preset masonry** (`variant="masonry"`) — pour listes hétérogènes (feedbacks, alertes)
- **Preset dashboard** (`variant="dashboard"`) — 12-col grid avec span props par cell (`<BentoCell span={7}>`, `<BentoCell span={5}>`) qui collapse automatiquement en 1-col < md
- **Preset hero-split** (`variant="hero-split"`) — 2 cells 7/5 pour marketing/landing internes
- **Stagger auto** (`stagger={80}`) — `animation-delay: calc(var(--index) * 80ms)` sans dépendance React

**Migration** : refactor page-par-page des 9 pages cibles, mais chaque refactor est **local** (juste remplacer un `grid grid-cols-3` par `<BentoGrid variant="dashboard">`). ~15 min par page.

### Lot 4 — Modal + BottomSheet morphing

**Fichiers** : `Modal.tsx`, `BottomSheet.tsx`.

**Aujourd'hui** : Modal = overlay + card centrée statique. BottomSheet = slide-up mobile.

**Après**

- **Modal morphing** : entrée via `layoutId` framer — la modal *émerge* de son bouton déclencheur (spring `stiffness: 380, damping: 34`) au lieu de fade-in. Nécessite que le bouton déclencheur ait le même `layoutId`.
- **Modal slide-over variant** (`variant="side"`) — panneau latéral droit 480px pour formulaires longs (au lieu d'empiler des modals au centre). Ferme le POS-modal-hell.
- **BottomSheet drag-to-dismiss** — swipe down réel (framer `useDragControls`), snap points (peek 33% / half 60% / full 90%).
- **Focus trap** — déjà présent, garder.
- **Backdrop** : `backdrop-blur-[6px] bg-black/50` uniforme (mobile) + `bg-black/70 backdrop-blur-sm` (desktop).

**Impact** : ~40 pages qui ouvrent des dialogs héritent du morphing sans changement de code. La refonte POS-modals (V21 du plan taste-skill) devient triviale : `<Modal variant="side">` au lieu de `<Modal>`.

### Lot 5 — EmptyState éditorial

**Fichier** : `src/shared/components/ui/EmptyState.tsx`.

**Aujourd'hui** : icon Lucide dans cercle + titre + description + CTA.

**Après**

- **Illustration ligne** — SVG monochrome (line-art continu, style éditorial, `stroke="currentColor"` sur `text-text-muted/30`) au lieu d'icône générique. Bibliothèque de 6-8 illustrations sémantiques : `no-data`, `no-results`, `error`, `success`, `waiting`, `offline`, `permission`, `search`.
- **Titre serif italique** — `font-serif italic text-2xl tracking-tight` + `text-wrap: balance`
- **Description** — `text-sm text-text-muted leading-relaxed max-w-[42ch]`
- **CTA plat** — pas rounded-full gradient, `rounded-xl bg-action-primary text-text-on-primary active:scale-[0.98]`
- **Layout** — vertical center avec asymétrie légère (illustration -12px offset gauche du titre)

**Migration** : les 30 pages qui utilisent `<EmptyState>` héritent. Pour les autres, un codemod grep-based (`grep -l "Aucun\|Aucune"` → suggestion migration) accompagne le PR.

---

## 3. Hygiène du DS (parallèle aux 5 lots)

### 3.1 Guide visible (`/design-system`)

Enrichir la page `src/app/(admin)/design-system/page.tsx` pour qu'elle devienne **la source unique**. Sections :

1. **Fondations** : palette (chips avec hex + rôle), typo (spécimens), spacing, radius, shadows, motion
2. **Composants** : chaque composant en 3 états (repos/hover/active) + snippet code + variantes CVA
3. **Patterns** : combinaisons (Hero, Bento, Form, Table, Filter bar…)
4. **Do / Don't** : côté à côté, exemples concrets
5. **Migration guide** : `PremiumCard` → `Card intent="premium"`, checklist page-refactor

Cette page devient l'onboarding designer + le rappel dev + la garde qualité.

### 3.2 Lint anti-hex-hardcodé

Nouvelle règle ESLint custom : `no-hardcoded-hex` — bloque `#[0-9a-fA-F]{3,8}` dans les className/style, sauf whitelist (globals.css, tokens/*, blueprints/*).

Ratchet initial : `HARDCODED_HEX_MAX = <mesuré à la première run>`. Preflight bloque toute régression.

### 3.3 Invariant `PageShell` obligatoire

Invariant Vitest : toute page dans `src/app/(client)/(ops)/*/page.tsx` doit importer soit `PageShell`, soit `AutoSafeLayout`. Exceptions déclarées dans un allowlist (POS, KDS, Floor Plan, marketing).

Ratchet initial : `PAGES_WITHOUT_SHELL_MAX = <mesuré>`. Force les nouvelles pages dans le DS.

### 3.4 Charte typo écrite

Ajouter dans `/design-system` une matrice claire :

| Usage | Fonte | Taille | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| Hero H1 | Instrument Serif italique | 5xl → 7xl (clamp) | 400 | -0.02em | 1.02 |
| Page title | Instrument Serif italique | 3xl → 5xl | 400 | -0.02em | 1.05 |
| Section H2 | Instrument Serif italique | 2xl → 4xl | 400 | -0.02em | 1.1 |
| Card title | Outfit | lg → 2xl | 600 | -0.01em | 1.2 |
| Body | Outfit | base (14px) | 400 | 0 | 1.6 |
| Kicker | JetBrains Mono | 10-11px | 500 | 0.24em uppercase | 1 |
| KPI value | Instrument Serif | 4xl → 6xl | 400 | -0.02em, tabular-nums | 1 |
| Data table | JetBrains Mono | 12-13px | 400 | 0, tabular-nums | 1.4 |
| Button | Outfit | sm | 500 | -0.01em | 1 |
| Micro/badge | JetBrains Mono | 10-11px | 500 | 0.18em uppercase | 1 |

Cette matrice devient loi. Toute police ajoutée = revue design.

### 3.5 Storybook léger (optionnel)

Ne pas installer Storybook (dep lourde). À la place, **enrichir `/design-system`** avec un player interactif par composant (props toggleables). C'est plus léger, ça vit dans l'app, et ça sert de vitrine commerciale aussi (les prospects peuvent voir le socle).

---

## 4. Ce qui nécessite quand même de toucher les pages

Après avoir levé le DS via les 5 lots, il restera 3 chantiers ciblés :

### 4.1 Pages qui by-passent PageShell (~10 pages)

- `pos/page.tsx` (275 lignes) — layout tactile spécifique, garder le shell custom mais **utiliser les nouveaux tokens** et composants Card unifiés
- `kds/page.tsx` — délègue à `KDSDashboard`, refondre le composant lui-même
- `floor-plan/page.tsx` — canvas interactif, garder le layout custom
- `operations/page.tsx` — délègue à `OperationsDashboard`
- Landings verticales `verticales/[slug]/page.tsx` — chacune a son hero, unifier via un `<VerticalHero>` partagé

**Effort** : 1 session dédiée par famille (POS, KDS, Floor Plan).

### 4.2 POS modals hell (V21 du plan taste-skill)

Aujourd'hui : 7 modals empilés sur `pos/page.tsx` (Payment, Split, Void, Pin, CashDrawer, Sos, CourseView).

Après Lot 4 : `<Modal variant="side">` pour Payment/Split/Sos, `<Modal variant="center">` pour Pin (court), garder BottomSheet pour Cart mobile. Charge cognitive réduite, transitions cohérentes.

**Effort** : 1 session sur `pos/page.tsx` uniquement.

### 4.3 Landings marketing (~5 pages)

`HomeContent.tsx` déjà refait. Reste : `pricing/*`, `verticales/[slug]`, `pricing/roi-calculator`, `pricing/vs-lightspeed`, `pricing/vs-zelty`. Chacune reçoit la même grammaire (hero split + bento asymétrique + CTA plat).

**Effort** : 1 session (patterns déjà écrits dans HomeContent).

---

## 5. Métriques de succès (ground truth Loi 7)

Avant / après doivent être mesurés en session avec commandes reproductibles.

| Mesure | Baseline (2026-08-31) | Cible post-refonte | Commande |
|---|---|---|---|
| Écrans hors DS (dsAdoption ratchet) | 474/478 | ≤ 400/478 | `npm run measure` |
| Composants Card distincts | 5 | 1 (+ 4 alias) | `find src/shared/components/ui -name "*Card*.tsx" \| wc -l` |
| `#hex` hardcodés dans className (hors tokens) | ? | 0 sauf whitelist | Nouveau lint |
| Pages sans PageShell/AutoSafeLayout | ? | ≤ 10 (allowlist explicite) | Nouvel invariant Vitest |
| Fichiers importés depuis `Modal` | ~40 | inchangé | `grep -r "from.*Modal" \| wc -l` |
| Fichiers importés depuis `Card` (nouveau unifié) | 0 | > 60 | idem |
| tsc | 0 | 0 | `npx tsc --noEmit` |
| Tests | 2477/2477 | 2477+ | `npx vitest run` |

---

## 6. Ordre d'exécution recommandé

```
Session 1 — Fondations
├─ Lot 1 : PageShell éditorial (2h)
└─ Charte typo écrite dans /design-system (30 min)

Session 2 — Dédup structurelle
├─ Lot 2 : Card unifié + alias forward (3h)
└─ Lint no-hardcoded-hex + baseline ratchet (30 min)

Session 3 — Densité + interactions
├─ Lot 3 : BentoGrid généralisé (2h — refactor 9 dashboards)
└─ Lot 4 : Modal + BottomSheet morphing (2h)

Session 4 — Finitions + guide
├─ Lot 5 : EmptyState éditorial + 6 illustrations SVG (2h)
├─ Invariant PageShell obligatoire + allowlist (30 min)
└─ Page /design-system enrichie (2h)

Session 5 (optionnelle) — Pages qui by-passent le DS
├─ POS modals hell → Modal variant="side" (2h)
├─ Landings marketing restantes (2h)
└─ KDSDashboard / OperationsDashboard refactor (2h)
```

**Total : 4 sessions core + 1 optionnelle = ~18h de travail concentré.**

Les 84 pages remontent d'un cran visuel sans en toucher 74.

---

## 7. Pre-flight checklist (à cocher à chaque session)

Avant chaque PR :

- [ ] Baseline `.measures/history.jsonl` capturée avant + après
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] `npx vitest run` → tous verts
- [ ] `sentrux check .` → pas de nouveau cycle
- [ ] `.measures/latest.json` : dsAdoption ne monte pas
- [ ] Test snapshot ajouté si nouveau composant/variant
- [ ] Screenshot avant/après joint au commit pour les changements PageShell/Card/Modal
- [ ] Aucun `npm install` sans demande explicite utilisateur (préférer `next/font/google`, primitives existantes, CSS inline)
- [ ] Ratchets pas relevés (Loi 2) — un cliquet se corrige à la source

---

## 8. Ce qu'on ne fait PAS (scope discipline)

- ❌ Réécrire les 84 pages une par une
- ❌ Installer Storybook (trop lourd, `/design-system` interne suffit)
- ❌ Migrer Lucide → Phosphor (87 fichiers, chantier séparé — refusé sans install)
- ❌ Toucher aux blueprints non-restaurant (déjà harmonisés Phase 2)
- ❌ Refaire les modales MCC internes (visible seulement en interne)
- ❌ Ajouter des dépendances (règle mémoire projet)
- ❌ Un design system parallèle (`shadcn/ui`, `radix-primitives` déjà là si besoin — on capitalise sur l'existant)

---

## 9. Décision produit à valider avant de lancer

| Question | Options | Reco |
|---|---|---|
| **Sidebar vs Topbar** | (a) Garder sidebar left classique en double-bezel · (b) Topbar flottante glass macOS-dock · (c) Hybride sidebar collapsable + topbar contextuelle | (a) — moins de risque, sidebar déjà bien intégrée aux workflows tactiles |
| **Dédup Card** | (a) Alias forward (compat totale) · (b) Deprecation warning + migration 3 mois · (c) Breaking (rename) | (a) — zéro friction, alias supprimables à V2 |
| **BentoGrid dans 84 pages** | (a) Refactor Analytics/HACCP/Finance/CRM · (b) Aussi les pages moyennes (Reservations, Inventory) · (c) Toutes | (a) — commencer par les dashboards analytiques à forte densité KPI |
| **Modal morphing** | (a) Opt-in (`variant="morph"`) · (b) Défaut morphing partout | (b) — cohérence visuelle globale, opt-out possible si régression |
| **EmptyState illustrations** | (a) 8 SVG maison line-art · (b) Réutiliser Lucide grands · (c) Illustrations photo | (a) — signature éditoriale, taille légère, dark/light natif |

---

## 10. Prochaine action

Créer une branche `designup-lot-1-pageshell`, exécuter le **Lot 1 (PageShell éditorial)** en 2h, mesurer l'impact visuel sur 3 pages échantillon (Operations, Analytics, HACCP), ajuster, puis dérouler les lots 2 à 5 en séquence.

Une session par lot, un commit atomique par lot, ratchets vérifiés avant merge.
