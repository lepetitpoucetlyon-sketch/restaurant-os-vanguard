# Design System Architecture & Guidelines — Restaurant OS

Ce document définit les règles de design, tokens, typographies, hiérarchies et composants pour l'application Restaurant OS Core (Universal Metaplatform).

## 1. Identité Visuelle & Thématique

- **Archétype** : Empire Luxury Intelligence (Élégance, Sobriété Sombre, Rigueur Industrielle).
- **Couleur Primaire / Accent** : Or Imperial `#C5A059` (alias `--color-action-primary`, `--color-brand`, `--color-focus`).
- **Surfaces** :
  - Background sombre : `#0B0B0C` (Mode Dark / Opérations)
  - Surface Card : `#121316` / `rgba(255, 255, 255, 0.03)` avec bordure `border-white/10`
  - Mode Light (Optionnel / Back-office) : `#F8F7F2` (fond), `#FFFFFF` (cartes)
- **Glassmorphism** : Subtil, configurable par tenant (`--glass-blur: 16px`, `--glass-opacity: 0.7`). Désactivé en borne kiosk et cliniques.

## 2. Typographie

- **Titres & Identité (H1-H3, Brand)** : `Playfair Display`, `Cormorant Garamond`, Georgia, serif (Italic / Black / Bold selon contexte).
- **Corps d'application (UI Body, Labels, Inputs)** : `Inter`, system-ui, -apple-system, sans-serif.
- **Code, Horodatages, Données Monétaires & Fiscales (Mono)** : `JetBrains Mono`, monospace.

## 3. Rayons de Courbure (Radius)

- `--radius-sm`: `6px` (badges, micro-boutons, tags)
- `--radius-md`: `10px` (boutons standards, inputs)
- `--radius-lg`: `12px` (cartes légères, popovers)
- `--radius-xl`: `16px` (cartes principales, conteneurs)
- `--radius-2xl`: `20px` (modales, drawers, sheets)
- `--radius-3xl`: `24px` (splash card, bannières héro)

## 4. Breakpoints Sémantiques (CSS & JS Sync)

**Source unique de vérité** : tokens `--breakpoint-*` dans `src/app/globals.css` (`@theme`).
Tailwind v4 les lit pour émettre `sm:`/`md:`/`lg:`/`xl:`/`2xl:`, et `src/shared/hooks/useBreakpoint.ts` (constante `BREAKPOINTS`) lit les mêmes bornes — **toute modif doit être répercutée aux deux endroits**.

- `--breakpoint-sm`: `640px` (Smartphones portrait, PDA Serveurs & Plongeurs)
- `--breakpoint-md`: `768px` (Smartphones paysage / Tablettes compactes)
- `--breakpoint-lg`: `1024px` (iPads Serveurs, Tablettes Accueil & KDS Chef)
- `--breakpoint-xl`: `1440px` (Postes Caisses Fixes, Écrans Muraux, Postes Comptables)
- `--breakpoint-2xl`: `1600px` (Bornes interactives tactiles, Drive-thru grand format)

Mapping vers les 4 tiers métier JS (`useBreakpoint`) : `mobile` ≤ 640 · `tablet` ≤ 1024 · `desktop` ≤ 1440 · `kiosk` > 1440.

## 5. Motion Dynamics & Transitions

- `--ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)` (Entrées de modals, transitions de pages)
- `--ease-out-back`: `cubic-bezier(0.34, 1.56, 0.64, 1)` (Popovers, badges rebondissants)
- `--ease-in-out-quint`: `cubic-bezier(0.83, 0, 0.17, 1)` (Glissements latéraux)
- `--ease-spring`: `cubic-bezier(0.4, 0.5, 0.3, 1.4)` (Boutons tactiles POS, feedback bump)
- `--ease-bounce`: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (Alertes critiques)
- **Durations** : Instant (100ms), Fast (200ms), Normal (350ms), Slow (500ms), Dramatic (700ms).
- Respect impératif de `@media (prefers-reduced-motion: reduce)`.

## 6. Densité & Contrastes

- **Densité Compacte** : POS, KDS, Floor Plan, Inventaire (cibles tactiles min 44x44px mais espacement optimisé pour haute cadence).
- **Densité Confort** : Dashboards Finance, Analytics, CRM, RH / Planning.
- **Contrastes** : Minimum AA (4.5:1), préférence AAA (7:1) sur les écrans tactiles opérationnels POS et KDS.
