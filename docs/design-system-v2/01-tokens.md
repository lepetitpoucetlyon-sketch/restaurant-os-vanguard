# 01 — Cartographie Exhaustive des Tokens de Design (Tailwind v4)

Tous les styles sont pilotés par des variables CSS définies dans le bloc `@theme` de `src/app/globals.css`.

## 1. Couleurs d'Action & Brand

| Token CSS | Variable Source | Rôle / Utilisation | Valeur par défaut |
|---|---|---|---|
| `--color-action-primary` | `--action-primary` | Couleur d'accent principale du tenant (CTA, onglet actif) | `#C5A059` |
| `--color-action-primary-hover` | `--action-primary-hover` | État de survol des actions primaires | `#000000` / `#B08D46` |
| `--color-action-primary-fg` | `--text-on-primary` | Texte contrasté sur fond primaire (calculé par luminance) | `#FFFFFF` ou `#000000` |
| `--color-action-danger` | `--action-danger` | Actions destructives (annulations, suppressions) | `#EF4444` |
| `--color-brand` | `--action-primary` | Alias sémantique Tailwind pour text/bg/border | `#C5A059` |
| `--color-focus` | `--border-focus` | Bordure d'éléments actifs ou sélectionnés | `#C5A059` |

## 2. Surfaces & Arrière-plans

| Token CSS | Variable Source | Mode Sombre (Ops) | Mode Clair (Back-office) |
|---|---|---|---|
| `--color-surface-bg` | `--surface-bg` | `#0B0B0C` | `#F8F7F2` |
| `--color-surface-card` | `--surface-card` | `#121316` / `rgba(255,255,255,0.03)` | `#FFFFFF` |
| `--color-surface-modal` | `--surface-modal` | `#15161A` | `#FFFFFF` |
| `--color-surface-sidebar` | `--surface-sidebar` | `#0E0F12` | `#111827` |

## 3. Statuts Opérationnels & Tables

- `--color-status-success` : `#059669` (Vert émeraude - Paiement validé, commande servie)
- `--color-status-warning` : `#F59E0B` (Ambre - En préparation, stock bas)
- `--color-status-danger` : `#DC2626` (Rouge vif - Alerte HACCP, rejet TPE)
- `--color-status-info` : `#6366F1` (Indigo - Information, synchronisation)
- `--color-table-available` : `#E5E7EB` (Table libre)
- `--color-table-occupied` : `#6366F1` (Table occupée)
- `--color-table-reserved` : `#FBBF24` (Table réservée)

## 4. Typographie

- `--font-brand` : `Playfair Display, Georgia, serif` (Titres H1/H2/H3, KPI)
- `--font-ui` : `Inter, system-ui, sans-serif` (Navigation, formulaires, tableaux)
- `--font-mono` : `JetBrains Mono, monospace` (Tickets, montants, logs)

## 5. Rayons de Courbure (Radii)

- `--radius-sm` : `6px`
- `--radius-md` : `10px`
- `--radius-lg` : `12px`
- `--radius-xl` : `16px`
- `--radius-2xl` : `20px`
- `--radius-3xl` : `24px`

## 6. Breakpoints Matériels

- `--bp-mobile` : `640px`
- `--bp-tablet` : `1024px`
- `--bp-desktop` : `1439px`
- `--bp-kiosk` : `1440px`

## 7. Motion & Easings

- `--ease-out-expo` : `cubic-bezier(0.16, 1, 0.3, 1)`
- `--ease-out-back` : `cubic-bezier(0.34, 1.56, 0.64, 1)`
- `--ease-in-out-quint` : `cubic-bezier(0.83, 0, 0.17, 1)`
- `--ease-spring` : `cubic-bezier(0.4, 0.5, 0.3, 1.4)`
- `--ease-bounce` : `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- `--duration-fast` : `200ms`
- `--duration-normal` : `350ms`
