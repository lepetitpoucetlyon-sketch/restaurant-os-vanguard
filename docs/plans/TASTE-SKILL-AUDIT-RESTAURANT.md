# Audit UI & Plan Taste-Skill — Verticale Restaurant + Custom

> Référentiel : [taste-skill](https://github.com/leonxlnx/taste-skill) (v2 + redesign-skill + soft-skill + mobile-skill)
> Date : 2026-08-31
> Scope : verticale `restaurant` (référence produit) + verticale `custom` (canevas vierge)
> Cibles : mobile (PWA), tablette (POS/KDS), desktop (back-office), kiosk

## 🟢 Statut exécution (session 2026-08-31)

**Phases livrées** — commits `d41bded56` (43 fichiers, 321+/224-) + `56c1b624a` (17 fichiers, 49+/38-).

| Phase | Statut | Détail |
|---|---|---|
| **1. Typographie** | ✅ | Inter → Outfit (next/font/google, aucun `npm install`) ; Cormorant Garamond → Instrument Serif ; propagé aux 9 verticales + settings.defaults ; alias `--font-inter` conservé pour compat |
| **2. Palette AI-purple purge** | ✅ | `#000000` → `#1a1a1a` ; `#6366f1` status-info → `#0ea5e9` ; `#818cf8` dark → `#38bdf8` ; tables/orders/desks/checkin AI-purple purgés dans blueprints restaurant, custom, coworking, hotel ; ombres teintées or |
| **3. `h-screen` → `min-h-[100dvh]`** | ✅ | 33 fichiers migrés (sidebar sticky légitime conservée) |
| **4a. Emojis marketing/legal** | ✅ | HomeContent, signup success, legal/nf525, legal/security purgés (0 emoji) — pages MCC internes intactes |
| **4b. Icônes Phosphor** | ⏸ Différée | Lucide gardé (87 fichiers) — migration Phosphor = chantier séparé, refusé sans install |
| **4c. Spinner** | ⏸ Différée | Skeleton.tsx (192 l.) déjà existant, non-remplacement pour éviter régressions |
| **5. Layout marketing** | ✅ | HomeContent réécrite : hero split asymétrique + kicker + device mockup doppelrand + KPI tabular ; features bento asymétrique 5-7/4-4-4/12 ; verticales grille sobre numérotée ; pricing plat off-black ; final CTA italique |
| **6. Motion** | ✅ partiel | `ease-in-out` purgé de shared/components + app/(admin) (0 résiduel) ; cubic-bezier(0.16,1,0.3,1) systématisé sur Card/StatCard/PremiumCard/GoldSwitch |

**Ground truth Loi 7 (mesuré en session)** :

```
npx tsc --noEmit                    → 0 erreur
h-screen restants                   → 1 (DesktopSidebar sticky top-0)
Inter en tokens (code)              → 0
Cormorant Garamond en tokens (code) → 3 (presets optionnels gastronomique/palace/zen — non défauts)
#6366f1 / #6366F1 en code           → 0
#8B5CF6 en code                     → 2 (presets.ts optionnels premium/indigo — non défauts)
#000000 en code                     → 0
Emojis dans 4 pages marketing/legal → 0
ease-in-out dans src/app + src/shared → 0
```

**Verticale custom** : palette neutre zinc/graphite `#18181B` / `#27272A` / `#3F3F46` — le canevas vierge démarre sobre premium, prêt à recevoir la charte tenant via Branding Plus sans imposer aucune couleur "générique SaaS". Fonts alignées sur restaurant pour cohérence inter-verticales.

**Reste à faire (hors périmètre de cette session)** :
- Phase 4b : migration Lucide → Phosphor (87 fichiers, requiert install `@phosphor-icons/react`)
- Phase 4c : purge Spinner circulaire → skeleton dans LoadingState/AdaptiveActionHub
- Phase 5.6 : POS 7 modals → slide-over panels (chantier UX dédié, non-trivial)
- Grain/noise overlay optionnel (`layout.tsx` composant `GrainOverlay`)
- `tabular-nums` systématique sur composants numériques
- `text-wrap: balance` sur PageShell (le style inline est fait sur HomeContent)

---

## 1. Diagnostic — État actuel vs critères taste-skill

### 1.1 Points forts (à conserver absolument)

| Critère taste-skill | Implémentation actuelle | Verdict |
|---|---|---|
| Palette non-générique | Or/doré `#C5A059` — identité forte, pas "AI purple" | **OK** |
| Dark mode dual-track | `data-theme` + `prefers-color-scheme`, tokens complets | **OK** |
| Custom cubic-bezier | `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` | **OK** |
| Spring physics (framer) | POS mobile dock `stiffness: 380, damping: 30` | **OK** |
| Safe area iOS | `pb-safe`, `pt-safe`, `px-safe` utilities | **OK** |
| Touch targets 44px | `touch-target` utility WCAG 2.5.5 | **OK** |
| Skeleton loaders | `Skeleton.tsx` (192 lignes) + `SkeletonList.tsx` (106 lignes) | **OK** |
| EmptyState composé | `EmptyState.tsx` (105 lignes), utilisé dans réservations groups | **OK** |
| ResponsiveShell | 4 breakpoints (mobile/tablet/desktop/kiosk), utilisé dans POS + floor-plan | **OK** |
| PWA manifest | Shortcuts POS + Kitchen, standalone, portrait-primary | **OK** |
| Viewport correct | `viewportFit: "cover"`, pas de `maximumScale: 1` (WCAG) | **OK** |
| Active/pressed feedback | `active:scale-[0.98]`, `active:scale-[0.99]` sur boutons POS | **OK** |
| Framer Motion | 65 imports dans `shared/components`, AnimatePresence + layout | **OK** |
| Scroll entry | Keyframes `fade-in-up`, `scale-in-bounce` définis | **OK** |
| Glass surfaces | Tokens `surface-glass` / `surface-glass-hover` / `surface-glass-active` | **OK** |
| Premium shadows | `--shadow-premium`, `--shadow-glow-accent` (teinté or) | **OK** |
| Breakpoints métier | 5 niveaux (sm→2xl) alignés mobile/tablet/desktop/kiosk | **OK** |

### 1.2 Violations taste-skill détectées

#### P0 — Critiques (identité "AI-generated" immédiate)

| # | Violation | Fichier(s) | Impact |
|---|---|---|---|
| **V1** | **Font UI = Inter** (banni par taste-skill) | `layout.tsx:14`, `globals.css:88`, `restaurant.ts` tokens | Police la plus générique IA — tout le body/UI en Inter |
| **V2** | **Font brand `Cormorant Garamond`** — serif générique sur dashboards | `layout.tsx:15`, `globals.css:91` | Taste-skill bannit les serif sur dashboards/software UI |
| **V3** | **`#000000` pur noir** en action-primary-hover + keyframe | `globals.css:23,643` | Interdit — utiliser off-black |
| **V4** | **Emojis dans le code** (landing, pages légales, features) | `HomeContent.tsx:10-16`, `legal/*.tsx` | ANTI-EMOJI POLICY violée |
| **V5** | **Custom blueprint indigo `#6366F1` / violet `#8B5CF6`** | `custom.blueprint.ts:40-42`, `restaurant.blueprint.ts:33-35` | "AI Purple" dans les blueprints — le pattern le plus banni |
| **V6** | **`h-screen` au lieu de `min-h-[100dvh]`** | 34 fichiers dont `layout.tsx:80`, sidebar, modals | Catastrophe iOS Safari — layout jumping |
| **V7** | **Lucide exclusif** (87 imports shared, 0 Phosphor) | Tous les composants UI | "Default AI icon choice" — aucune différenciation |

#### P1 — Élevées (qualité perçue dégradée)

| # | Violation | Fichier(s) | Impact |
|---|---|---|---|
| **V8** | `shadow-md/lg/xl` génériques | `Card.tsx`, `GlassCard.tsx`, `StatCard.tsx`, `PremiumCard.tsx` | Ombres non teintées |
| **V9** | `ease-in-out` résiduel | `GoldSwitch.tsx:40` | Banned — utiliser custom cubic-bezier |
| **V10** | `Spinner.tsx` = cercle rotatif générique | `Spinner.tsx`, `LoadingState.tsx`, `AdaptiveActionHub.tsx` | Taste-skill exige skeleton loaders uniquement |
| **V11** | Hero marketing centré symétrique | `HomeContent.tsx` | Banned quand DESIGN_VARIANCE > 4 — forcer asymétrie |
| **V12** | Gradient text sur hero H1 | `HomeContent.tsx:56-59` — `bg-clip-text bg-gradient-to-r` | "NO Excessive Gradient Text" |
| **V13** | CTA `rounded-full` avec gradient | `HomeContent.tsx:67-72` | Soft-skill bannit gradient buttons |
| **V14** | 3-column equal card grid (features) | `HomeContent.tsx` features grid, groups grid dans réservations | Pattern le plus générique |
| **V15** | Landing self-provisioning `h1` copywriting IA | "Augmenté par l'IA", "système d'exploitation" | Clichés — plain, specific language |

#### P2 — Moyennes (polish manquant)

| # | Violation | Fichier(s) | Impact |
|---|---|---|---|
| **V16** | Sidebar collapsible classique left-side | `DesktopSidebar.tsx` | "Dashboard always has left sidebar" — taste-skill suggest alternatives |
| **V17** | Status info `#6366f1` = indigo/violet | `globals.css:39`, `restaurantVerticalTokens` | AI purple résiduel dans les tokens sémantiques |
| **V18** | Pas de noise/grain texture | Aucun fond texturé | Flat digital feel |
| **V19** | `text-wrap: balance` absent | Titres et headlines | Orphaned words possibles |
| **V20** | Aucune indication page active dans mobile nav | `MobileNavBar.tsx` | "No indication of current page in navigation" — vérifier |
| **V21** | Modal pour tout (POS: Payment, Split, Void, Pin, Cash, Sos, Course) | `pos/page.tsx` 7 modals empilés | "Modals for everything" — préférer slide-over panels |
| **V22** | Tabular-nums non systématique | Données financières, KPI, planning | Taste-skill exige monospace pour tous les chiffres |

---

## 2. Plan d'action — 6 phases

### Phase 1 — Typographie (impact maximal, risque minimal)

**Objectif** : remplacer Inter par une police premium à caractère, corriger le serif dashboard.

| Action | Détail | Fichier(s) |
|---|---|---|
| 1.1 Remplacer Inter → **Geist** (UI) | `next/font/google` → `next/font/local` ou Google | `layout.tsx`, `globals.css:88` |
| 1.2 Remplacer Cormorant Garamond → **Instrument Serif** ou garder pour kicker only | Brand font uniquement sur kickers/KPI éditoriaux, jamais en dashboard body | `layout.tsx:15`, `globals.css:91` |
| 1.3 Ajouter `font-variant-numeric: tabular-nums` | Sur tous les éléments numériques (prix, KPI, planning, POS) | Composants `StatCard`, `Cart`, formatters |
| 1.4 `text-wrap: balance` / `pretty` | Headlines et titres dans `PageShell`, hero sections | `PageShell.tsx`, `HomeContent.tsx` |
| 1.5 Tracking serré headlines | `tracking-tighter leading-none` sur H1/H2/H3 | Design tokens + PageShell |
| 1.6 Propager fontUI dans tous les blueprints | Restaurant: `Geist`, Custom: `Geist` (au lieu d'Inter) | `restaurant.blueprint.ts`, `custom.blueprint.ts`, `settings.defaults.ts` |

### Phase 2 — Palette & surfaces (AI purple purge)

| Action | Détail | Fichier(s) |
|---|---|---|
| 2.1 `--action-primary-hover` : `#000000` → `#1a1a1a` (off-black) | Jamais de pur noir | `globals.css:23` |
| 2.2 `--status-info` : `#6366f1` → `#3b82f6` (blue-500) ou `#0ea5e9` (sky-500) | Purger l'indigo AI purple | `globals.css:39`, dark mode |
| 2.3 `--table-occupied` : `#6366f1` → `#C5A059` (brand gold) ou bleu calibré | Aligner sur la palette dorée | `restaurantVerticalTokens`, `globals.css:42` |
| 2.4 Custom blueprint : `#6366F1/#8B5CF6` → palette neutre (`#18181B`/`#27272A`) | Le custom ne doit pas démarrer en AI purple | `custom.blueprint.ts:40-42` |
| 2.5 Restaurant blueprint : aligner sur les vrais tokens (`#C5A059`) | Le blueprint contredit `restaurant.ts` | `restaurant.blueprint.ts:33-35` |
| 2.6 Remplacer `shadow-md/lg/xl` → ombres teintées | `shadow-[0_20px_40px_-15px_rgba(197,160,89,0.08)]` | `Card.tsx`, `GlassCard.tsx`, `StatCard.tsx`, `PremiumCard.tsx` |
| 2.7 Ajouter grain/noise overlay | `fixed inset-0 z-50 pointer-events-none opacity-[0.015]` SVG noise | `layout.tsx` ou nouveau composant `GrainOverlay.tsx` |
| 2.8 `#000000` dans keyframe → `#0a0a0a` | `globals.css:643` | `globals.css` |

### Phase 3 — `h-screen` → `min-h-[100dvh]` (sécurité iOS)

| Action | Détail | Fichier(s) |
|---|---|---|
| 3.1 Migration bulk | Remplacer les 34 occurrences `h-screen` par `min-h-[100dvh]` ou `h-dvh` | Tous les fichiers identifiés |
| 3.2 Exception : sidebar `h-screen` | La sidebar desktop peut garder `h-screen` si `sticky top-0` — sinon `h-dvh` | `DesktopSidebar.tsx:49` |
| 3.3 Vérifier le fallback `h-screen` | Ajouter `@supports` fallback pour navigateurs sans `dvh` | `globals.css` |

### Phase 4 — Iconographie & anti-emoji

| Action | Détail | Fichier(s) |
|---|---|---|
| 4.1 Installer `@phosphor-icons/react` | `npm install @phosphor-icons/react` | `package.json` |
| 4.2 Migration progressive Lucide → Phosphor (Light weight) | Commencer par `shared/components/ui/`, puis pages principales | 87 fichiers |
| 4.3 Standardiser strokeWidth à `1.5` | Cohérence globale | Tous les composants |
| 4.4 Purger emojis landing + legal | Remplacer par icônes Phosphor ou SVG inline | `HomeContent.tsx`, `legal/*.tsx` |
| 4.5 Purger Spinner circulaire | Remplacer par skeleton shimmer dans `LoadingState`, `AdaptiveActionHub` | `Spinner.tsx`, consommateurs |

### Phase 5 — Layout & responsive premium

| Action | Détail | Fichier(s) |
|---|---|---|
| 5.1 Hero marketing → asymétrique | Split screen 50/50, texte à gauche, visuel/device mockup à droite | `HomeContent.tsx` |
| 5.2 Feature grid → 2-col zig-zag ou bento | Remplacer le 3-col equal cards | `HomeContent.tsx` |
| 5.3 Purger gradient text hero | `text-transparent bg-clip-text` → accent color solide ou weight-driven | `HomeContent.tsx:56-59` |
| 5.4 CTA → bouton solide flat, pas gradient rounded-full | `bg-[#C5A059] text-[#0B0B0C] rounded-xl` | `HomeContent.tsx:67-72` |
| 5.5 Copywriting non-IA | "Augmenté par l'IA" → verbes concrets, pas de "next-gen" | `HomeContent.tsx`, `data/verticals.ts` |
| 5.6 POS : 7 modals → slide-over panels / bottom sheets | Réduire la pile modale du POS | `pos/page.tsx` |
| 5.7 Mobile nav : indicateur page active | Ajouter underline/dot/highlight sur lien actif | `MobileNavBar.tsx` |
| 5.8 `ease-in-out` résiduel → custom bezier | `GoldSwitch.tsx` et grep global | Tous |
| 5.9 Groups grid → bento asymétrique | Réservations groups view | `reservations/page.tsx:110` |

### Phase 6 — Motion & micro-interactions premium

| Action | Détail | Fichier(s) |
|---|---|---|
| 6.1 Staggered entry sur listes/grids | `staggerChildren` framer ou CSS `animation-delay: calc(var(--index) * 80ms)` | ProductGrid, réservations, inventory |
| 6.2 Scroll-triggered reveals (`whileInView`) | Landing marketing sections + dashboard KPI cards | `HomeContent.tsx`, `OperationsDashboard` |
| 6.3 Layout transitions | `layout` / `layoutId` sur Cart items, table status changes | POS Cart, FloorPlan tables |
| 6.4 Hover card lift subtil | `hover:shadow-[0_2px_8px_rgba(197,160,89,0.06)]` + `hover:-translate-y-[1px]` | `Card.tsx`, `StatCard.tsx`, `PremiumCard.tsx` |
| 6.5 Active pressed tactile | Systématiser `active:scale-[0.98]` sur TOUS les boutons interactifs | `Button.tsx`, `Chip.tsx` |
| 6.6 Magnetic button (POS CTA) | `useMotionValue` + `useTransform` — optionnel, desktop only | Bouton checkout POS desktop |

---

## 3. Focus Custom — Verticale canevas vierge

La verticale `custom` hérite des mêmes corrections (elle partage le design system) mais nécessite des ajustements spécifiques :

| Action | Détail |
|---|---|
| Purger AI purple tokens | `#6366F1`/`#8B5CF6` → palette neutre zinc (`#18181B`/`#3f3f46`) ou laisser le branding tenant piloter |
| Font Inter → Geist | Même migration que restaurant |
| Wizard 7 axes | Le wizard de qualification doit refléter le nouveau design system (pas de gradient, pas d'emojis) |
| Branding Plus override | Vérifier que `BrandingService` propage correctement les tokens custom quand le tenant change couleur/font |
| Empty shell premium | Le dashboard vide Custom doit avoir un empty state composé (pas juste "Aucun module activé") |

---

## 4. Matrice responsive par écran

| Page | Mobile (<640) | Tablette (640-1024) | Desktop (1024-1440) | Kiosk (>1440) |
|---|---|---|---|---|
| **POS** | ProductGrid full + FAB cart dock | Split product/cart 60/40 | Split product/cart + course sidebar | Grand format touch |
| **KDS** | Stack vertical tickets | 2-col stations | 3-4 col stations | Plein écran mural |
| **Floor Plan** | Liste tables + bottom sheet | Canvas interactif plein | Canvas + panneau latéral | Canvas grand format |
| **Réservations** | Daily list + FAB new | Split sidebar/list | Split sidebar/list/table grid | N/A |
| **Operations** | Dashboard KPI stack | 2-col bento | 3-col bento asymétrique | N/A |
| **Marketing Landing** | Single col, CTA sticky bottom | Split hero, 2-col features | Asymmetric hero, bento features | N/A |

---

## 5. PWA & performance checklist

- [ ] Manifest `theme_color` aligné avec tokens (actuellement `#C5A059` — OK)
- [ ] `background_color` : `#1A2350` → `#0B0B0C` (aligner avec le vrai dark bg)
- [ ] Shortcuts : ajouter `/reservations`, `/operations`, `/inventory`
- [ ] Icons : vérifier existence `/icons/icon-192.png` et `/icons/icon-512.png`
- [ ] Splash screen : remplacer le `h-screen` par `min-h-dvh`
- [ ] Grain/noise overlay : `pointer-events-none`, `position: fixed`, jamais sur scrolling container
- [ ] Animations : uniquement `transform` + `opacity` (jamais `top/left/width/height`)
- [ ] `will-change: transform` : sparingly, uniquement sur éléments activement animés
- [ ] `backdrop-blur` : uniquement sur fixed/sticky (navbar, overlay) — jamais sur scrolling content
- [ ] Performances POS mobile : isoler les animations perpétuelles dans des Client Components memoizés

---

## 6. Pre-flight checklist (taste-skill §10)

Avant chaque PR UI :

- [ ] Aucun `Inter` dans les imports/tokens
- [ ] Aucun `#000000` dans le CSS
- [ ] Aucun `h-screen` (sauf sidebar sticky)
- [ ] Aucun emoji dans le code
- [ ] Aucun `shadow-md/lg/xl` non teinté
- [ ] Aucun `ease-in-out` ou `linear` sur transitions
- [ ] Aucun `#6366f1` / `#8B5CF6` (AI purple)
- [ ] Mobile collapse `w-full px-4` garanti pour haute variance
- [ ] `min-h-[100dvh]` partout au lieu de `h-screen`
- [ ] `active:scale-[0.98]` sur tous les boutons interactifs
- [ ] States: loading (skeleton), empty (composé), error (inline) fournis
- [ ] Animations isolées en Client Components (pas de re-render parent)
- [ ] `tabular-nums` sur tout affichage numérique

---

## 7. Ordre d'exécution recommandé

```
Phase 1 (typo)     ████████████████████ — 1 session, impact visuel maximal
Phase 2 (palette)  ████████████████     — 1 session, purge AI purple
Phase 3 (h-screen) ████████             — 30min, bulk replace
Phase 4 (icônes)   ████████████████████ — 2-3 sessions, migration progressive
Phase 5 (layout)   ████████████████████ — 2 sessions, landing + POS modals
Phase 6 (motion)   ████████████         — 1 session, polish final
```

**Total estimé : 7-9 sessions de travail**

Phases 1-3 sont indépendantes et peuvent être parallélisées.
Phase 4 (icônes) est la plus longue (87 fichiers) mais peut être découpée par pilier.
