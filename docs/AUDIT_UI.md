# Audit UI Global — Restaurant OS
> Date : 2026-08-07 · Lecture seule · Session : ui-audit-global

---

## 1. Inventaire des composants

| Zone | Fichiers .tsx |
|------|--------------|
| `src/shared/components/` | **144** |
| `src/modules/` (total) | **275** |
| → dont UI explicites (Panel/Modal/Dialog/Card/Dashboard…) | 91 |
| **Total projet** | **419** |

### Répartition shared/components/

| Répertoire | Fichiers .tsx |
|------------|--------------|
| settings/ (+ sous-dossiers) | 46 |
| layout/ (+ sidebar/) | 34 |
| ui/ | 32 |
| voice/ | 5 |
| blueprint/ | 5 |
| integrations/ | 4 |
| rbac/ | 3 |
| atomic/ | 2 |
| sovereign/ | 2 |
| wrappers/ | 1 |
| dev/ | 1 |
| Racine | 9 |

### Répartition modules/

| Module | Total .tsx |
|--------|-----------|
| commerce/ | 69 |
| ops/ | 63 |
| compliance/ | 40 |
| human/ | 20 |
| onboarding/ | 18 |
| finance/ | 18 |
| facility/ | 17 |
| intelligence/ | 15 |
| logistics/ | 13 |

---

## 2. Doublons détectés

### Copies exactes (suppression sans risque)

| Composant | Copie 1 | Copie 2 |
|-----------|---------|---------|
| `MobilierConfig.tsx` | `shared/components/settings/tables/` | `modules/facility/spaces/settings/` |
| `TablesToolbar.tsx` | `shared/components/settings/tables/` | `modules/facility/spaces/settings/` |

### Versions divergentes (arbitrage nécessaire)

| Composant | Chemin A | Chemin B | Note |
|-----------|----------|----------|------|
| `ZoneService.tsx` | `shared/components/settings/tables/` | `modules/facility/spaces/settings/` | Contenu légèrement différent |
| `FloorArchitecture.tsx` | `shared/components/settings/tables/` | `modules/facility/spaces/settings/` | Contenu légèrement différent |
| `PremiumSelect.tsx` | `shared/components/settings/ui/` (re-export 1 ligne) | `shared/components/ui/` (168 lignes) | Re-export inutile |
| `NexusSphere.tsx` | `shared/components/layout/` (re-export) | `shared/components/voice/ui/` (implémentation) | Re-export inutile |
| `StatCard.tsx` | `shared/components/ui/` | `app/(admin)/admin/mcc/components/` | + `modules/commerce/acquisition/marketing/` (3 copies) |
| `StatusBadge.tsx` | `shared/components/ui/` | `app/(client)/(public)/groups/components/` | 2 copies |
| `PerformanceMonitor.tsx` | `shared/components/dev/` | `app/(admin)/admin/mcc/components/` | 2 copies |
| `BrandingProvider.tsx` | `src/infrastructure/components/` | `src/lib/` | 2 copies |
| `CameraCapture.tsx` | `shared/components/ui/` | `modules/compliance/qualite/haccp/components/haccp/` | 2 copies |
| `ElevationPrompt.tsx` | `modules/compliance/securite/audit/` | `shared/nexus/vault/audits/audit/` | 2 copies |
| `OverrideLogView.tsx` | `modules/compliance/securite/audit/` | `shared/nexus/vault/audits/audit/` | 2 copies |
| `MindMap.tsx` | `shared/nexus/components/` | `modules/commerce/` + `modules/intelligence/` | **3 copies** |
| Sections registre (7 fichiers) | `modules/facility/maintenance/registre/` | `modules/ops/workflow/engine/components/registre/` | 7 doublons |

**Total doublons identifiés : ~25 fichiers concernés**

---

## 3. Tokens CSS — état des lieux

### Design system défini

Le design system est entièrement porté par `src/app/globals.css` via Tailwind v4 `@theme`.
**54 variables CSS définies** :

```
--color-action-primary       #C5A059 (Vanguard Gold)
--color-action-primary-hover
--color-action-danger
--color-action-accent
--color-surface-bg
--color-surface-card
--color-surface-modal
--color-surface-sidebar
--color-status-success / warning / danger / info
--color-table-available / occupied / reserved
--color-text-primary / secondary / muted / brand
--color-border-default
--font-sans / serif / mono / brand
--radius-sm / md / lg / full
```

### Couleurs hardcodées (violations)

| Zone | Fichiers concernés | Occurrences hex |
|------|--------------------|-----------------|
| `src/shared/components/` | 27 fichiers | **106 occurrences** |
| `src/modules/` | 53 fichiers | ~180 occurrences |

### Top 10 pires fichiers (hex hardcodés)

| Occurrences | Fichier |
|-------------|---------|
| 27 | `shared/components/settings/SettingsDashboard.tsx` |
| 18 | `modules/ops/production/kitchen/components/RecipeDetailDialog.tsx` |
| 15 | `modules/ops/production/kitchen/components/tabs/AllergensTab.tsx` |
| 11 | `modules/facility/spaces/floor-plan/FloorPlanEditor.tsx` |
| 10 | `shared/components/settings/GoalsSettings.tsx` |
| 10 | `shared/components/layout/Map3DOverlay.tsx` |
| 10 | `modules/onboarding/wizard/SimpleFloorPlanEditor.tsx` |
| 10 | `modules/logistics/approvisionnement/reception/components/InventoryReceptionDashboard.tsx` |
| 10 | `modules/commerce/relation/crm/components/ProspectingDashboard.tsx` |
| 8 | `shared/components/settings/MenuSettings.tsx` |

**rgba() hardcodés** : 30 fichiers dans `shared/components/`, 36 dans `modules/`.

### Bonne pratique observée
La majorité des composants utilise des classes Tailwind sémantiques (`bg-surface-card`, `text-text-muted`) qui correspondent aux tokens `@theme` — c'est la bonne pratique Tailwind v4. Les violations hardcodées sont des exceptions à corriger, pas la norme.

---

## 4. Couverture des routes

**57 routes** trouvées dans `src/app/**/page.tsx` — toutes ont un fichier `page.tsx`.

### Zone Admin `/(admin)/`
`/account-settings` · `/admin/agent` · `/admin/dashboard` · `/admin/inventory/reception` · `/admin/mcc` · `/admin/prospecting` · `/admin/simulation` · `/audit-portal` · `/blueprint` · `/settings` · `/simulator` · `/system-map`

### Zone Ops client `/(client)/(ops)/`
`/analytics` · `/bar` · `/crm` · `/finance` · `/floor-plan` · `/haccp` · `/integrations` · `/intelligence` · `/inventory` · `/kds` · `/kitchen` · `/leaves` · `/marketing` · `/marketing/seo` · `/menu-builder` · `/migration` · `/mon-espace` · `/onboarding` · `/operations` · `/planning` · `/pos` · `/pos-mobile` · `/recruitment` · `/registre` · `/reservations` · `/staff` · `/timeclock` · `/vanguard-simulator` · `/welcome-staff`

### Zone Publique
`/` · `/auth/logout` · `/docs/[category]` · `/groups` · `/landing` · `/login` · `/menu/[tenantId]/[tableId]` · `/showcase` · `/signup` · `/welcome` · `/demo` · `/legal/cgu` · `/legal/cgv` · `/legal/mentions` · `/legal/rgpd` · `/status` · `/[slug]` · `/[slug]/reservations`

---

## 5. Dark mode

### Situation

- **Tailwind dark mode** (stratégie classe) : utilisé dans 153 fichiers avec classes `dark:`
- **`src/app/globals.css`** : aucune media query `@media (prefers-color-scheme: dark)` — pas de variante dark des variables CSS racines `:root`
- **Conséquence** : l'UI est visuellement sombre par défaut (fond `#0A0B10`), mais les 80+ fichiers avec couleurs hex hardcodées ignoreront tout changement de thème

### Fichiers critiques sans dark mode
Tous les fichiers listés en section 3 (hex hardcodés) représentent un risque direct si un vrai système dark/light est implémenté.

---

## 6. Responsive / Mobile

### POS (`/pos`) — ✅ Partiellement responsive
- 75 classes responsive (`sm:`, `md:`, `lg:`) dans les composants
- `Cart.tsx` : `w-[400px]` fixe — **problème sur tablettes étroites**
- `CategoryList` : `w-16 md:w-[160px]` — bon

### KDS (`/kds`) — ✅ Responsive
- 4 composants tous responsive, padding et hauteurs adaptatifs
- `KDSTicket` adapte les espacements selon `gridColumns`

### Floor Plan (`/floor-plan`) — ⚠️ Non responsive
- `FloorPlanEditor.tsx` : **0 classe responsive** — canvas HTML5 à coordonnées absolues
- `TableInsightPanel.tsx` : `fixed top-24 right-8 w-[420px]` — déborde sur tablettes
- `EditPanel.tsx` : largeurs fixes
- **Seule la page d'entrée** a quelques classes `lg:` — pas le cœur du module

---

## 7. Design system

### `src/theme/`
Réduit à un seul fichier : `PerformanceEngine.tsx`.
**Aucun token file, aucun index.** Le design system vit dans `globals.css`.

### Couche atomique (`src/shared/components/atomic/`) — ⚠️ Anémique
- Seulement **2 composants** : `GlassInput.tsx` et `GoldSwitch.tsx`
- Tous deux consommés par 1 seul fichier (`StandardSettingsEngine.tsx`)
- Aucune couche atomique réelle (Button, Input, Select, Badge, etc.)

### Composants UI (`src/shared/components/ui/`) — ✅ Bon état général
32 composants présents, export via `index.ts`.

**7 composants non exportés depuis index.ts** :
- `BottomSheet.tsx`
- `CameraCapture.tsx`
- `GlassCard.tsx`
- `OptimizationDialog.tsx`
- `PageHeaderWithDocs.tsx`
- `TimePicker.tsx`
- `TutorialOverlay.tsx`

---

## 8. Composants orphelins

| Composant | Chemin | Statut |
|-----------|--------|--------|
| `MDMPanel.tsx` | `shared/components/integrations/` | 0 import trouvé |
| `ReserveWithGoogle.tsx` | `shared/components/integrations/` | 0 import trouvé |
| `NexusServiceInitializer.tsx` | `shared/components/` | 0 import trouvé |
| `SovereignShield.tsx` | `shared/components/` | Commentaires seulement |
| `BrandWrapper.tsx` | `shared/components/wrappers/` | 0 import trouvé |
| `SovereignModuleGate.tsx` | `shared/components/sovereign/` | Commentaires seulement |
| `ForensicButton.tsx` | `shared/components/sovereign/` | Re-export sans consommateur |
| `GlassInput.tsx` / `GoldSwitch.tsx` | `shared/components/atomic/` | 1 seul consommateur |

---

## Synthèse — Priorités

| Priorité | Problème | Impact | Fichiers |
|----------|----------|--------|---------|
| 🔴 P0 | Couleurs hex hardcodées dans SettingsDashboard + RecipeDetail + AllergensTab | Impossible de faire une refonte UI propre | 27+53 fichiers |
| 🔴 P0 | 25 composants en doublon | Toute modif doit être faite 2 fois → dette garantie | ~25 fichiers |
| 🟠 P1 | Floor-plan non responsive | Inutilisable sur tablette | 5-6 fichiers |
| 🟠 P1 | Couche atomique anémique (2 composants) | Impossible de standardiser les UI de base | atomic/ |
| 🟠 P1 | 7 composants non exportés depuis ui/index.ts | Imports directs qui contournent le barrel | 7 fichiers |
| 🟡 P2 | Cart.tsx w-[400px] fixe | Serrée sur tablettes 768px | 1 fichier |
| 🟡 P2 | 8 composants orphelins | Dead code, confusion lors de la refonte | 8 fichiers |
| 🟡 P2 | rgba() hardcodés (66 fichiers) | Résistants à tout futur thème | 66 fichiers |
| ⚪ P3 | `src/theme/` vide (1 seul fichier) | Design system sans home officielle | — |

---

*Généré automatiquement — session ui-audit-global · 2026-08-07*
