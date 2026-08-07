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

## Plan d'exécution — Refonte UI

> Ordre strict : chaque phase débloque la suivante.
> Validation après chaque phase : `npx tsc --noEmit` + `npx vitest run`

---

### PHASE 1 — Élimination des doublons (Jour 1)

> Prérequis : aucun. C'est le premier chantier car toute modification UI faite avant supprime des bugs dans une seule copie.

#### 1A — Copies exactes (suppression immédiate, 0 risque)

Les deux fichiers sont bit-à-bit identiques — conserver la version `modules/facility/` (source de vérité du pilier) et supprimer la copie `shared/components/settings/tables/`.

| Action | Fichier à supprimer | Garder |
|--------|--------------------|----|
| `rm` | `shared/components/settings/tables/MobilierConfig.tsx` | `modules/facility/spaces/settings/MobilierConfig.tsx` |
| `rm` | `shared/components/settings/tables/TablesToolbar.tsx` | `modules/facility/spaces/settings/TablesToolbar.tsx` |

Après suppression : grep tous les imports de ces deux fichiers dans `src/` et les rediriger vers `@/modules/facility/spaces/settings/`.

#### 1B — 7 sections registre (copies exactes)

Même situation : `modules/facility/maintenance/registre/` et `modules/ops/workflow/engine/components/registre/` contiennent les 7 mêmes fichiers.

Seul `modules/ops/workflow/engine/components/index.ts` importe la version `facility/` — preuve que la version `ops/workflow/engine/components/registre/` n'est référencée nulle part.

| Action | À supprimer |
|--------|------------|
| `rm -r` | `src/modules/ops/workflow/engine/components/registre/` (7 fichiers) |

Mettre à jour l'import dans `src/modules/ops/workflow/engine/components/index.ts` pour pointer vers `@/modules/facility/maintenance/registre/`.

#### 1C — Re-exports inutiles (2 fichiers)

Ces fichiers font juste `export { X } from '...'` — supprimer et remplacer les imports par la source directe.

| Fichier re-export à supprimer | Source directe |
|------------------------------|---------------|
| `shared/components/settings/ui/PremiumSelect.tsx` | `@/shared/components/ui/PremiumSelect` |
| `shared/components/layout/NexusSphere.tsx` | `@/shared/components/voice/ui/NexusSphere` |

#### 1D — Doublons divergents (arbitrage)

Pour chaque paire ci-dessous : lire les deux versions, choisir la meilleure, supprimer l'autre, rediriger les imports.

| Composant | Garder | Supprimer | Critère |
|-----------|--------|-----------|---------|
| `ZoneService.tsx` | `modules/facility/spaces/settings/` | `shared/components/settings/tables/` | Pilier facility est propriétaire |
| `FloorArchitecture.tsx` | `modules/facility/spaces/settings/` | `shared/components/settings/tables/` | Idem |
| `StatCard.tsx` | `shared/components/ui/StatCard` | `app/(admin)/admin/mcc/components/StatCard` + `modules/commerce/…/StatCard` | `shared/ui` est le barrel officiel |
| `StatusBadge.tsx` | `shared/components/ui/StatusBadge` | `app/(client)/(public)/groups/components/StatusBadge` | Idem |
| `PerformanceMonitor.tsx` | `shared/components/dev/PerformanceMonitor` | `app/(admin)/admin/mcc/components/PerformanceMonitor` | Idem |
| `BrandingProvider.tsx` | `src/lib/BrandingProvider` | `src/infrastructure/components/BrandingProvider` | `src/lib/` est la bonne home |
| `CameraCapture.tsx` | `shared/components/ui/CameraCapture` | `modules/compliance/qualite/haccp/components/haccp/CameraCapture` | `shared/ui` est le barrel |
| `ElevationPrompt.tsx` | `modules/compliance/securite/audit/` | `shared/nexus/vault/audits/audit/` | Le pilier compliance est propriétaire |
| `OverrideLogView.tsx` | `modules/compliance/securite/audit/` | `shared/nexus/vault/audits/audit/` | Idem |
| `MindMap.tsx` | `shared/nexus/components/MindMap` | Copies dans `commerce/` et `intelligence/` | `shared/nexus` est partageable entre piliers |

**Après chaque suppression** : `grep -r "NomComposant" src/ --include="*.tsx" --include="*.ts"` pour trouver et rediriger tous les imports.

---

### PHASE 2 — Suppression des orphelins (Jour 1, suite)

> Aucun consommateur confirmé → suppression sans risque.

| Fichier | Chemin | Action |
|---------|--------|--------|
| `MDMPanel.tsx` | `shared/components/integrations/` | `rm` |
| `ReserveWithGoogle.tsx` | `shared/components/integrations/` | `rm` |
| `NexusServiceInitializer.tsx` | `shared/components/` | `rm` |
| `BrandWrapper.tsx` | `shared/components/wrappers/` | `rm` |
| `OptimizationDialog.tsx` | `shared/components/ui/` | `rm` (0 consommateur confirmé) |

**À conserver** (consommateurs réels trouvés) :
- `SovereignModuleGate.tsx` → 1 consommateur
- `ForensicButton.tsx` → 1 consommateur
- `BottomSheet.tsx` → 11 consommateurs
- `GlassCard.tsx` → 12 consommateurs

---

### PHASE 3 — Compléter le barrel `ui/index.ts` (1h)

> 6 composants ont des consommateurs (5-12 chacun) mais ne sont pas exportés depuis `shared/components/ui/index.ts` — tous les imports sont directs, ce qui contourne le barrel.

**Fichier** : `src/shared/components/ui/index.ts`

Ajouter les exports manquants :

```typescript
export { BottomSheet }       from './BottomSheet'        // 11 consommateurs
export { CameraCapture }     from './CameraCapture'      // 5 consommateurs (après Phase 1C)
export { GlassCard }         from './GlassCard'          // 12 consommateurs
export { PageHeaderWithDocs} from './PageHeaderWithDocs' // 5 consommateurs
export { TimePicker }        from './TimePicker'         // 2 consommateurs
export { TutorialOverlay }   from './TutorialOverlay'    // 1 consommateur
```

Ensuite migrer les imports directs vers le barrel :
```bash
# Trouver tous les imports directs
grep -r "from.*shared/components/ui/BottomSheet\|from.*shared/components/ui/GlassCard" src/ --include="*.tsx"
```

---

### PHASE 4 — Migration tokens CSS (Jour 2-3)

> Objectif : zéro couleur hex hardcodée dans les composants. Toutes les couleurs passent par les variables CSS de `globals.css`.

#### 4A — Inventaire des variables disponibles

Variables déjà définies dans `globals.css` utilisables en remplacement :

| Variable CSS | Valeur | Remplace |
|-------------|--------|---------|
| `var(--color-action-primary)` | `#C5A059` | Tout gold hardcodé |
| `var(--color-surface-bg)` | fond principal | `#0A0B10`, `#111827`, `#0D1117` hardcodés |
| `var(--color-surface-card)` | fond carte | `#1a1a2e`, `#16213e` hardcodés |
| `var(--color-surface-modal)` | fond modal | `#1e2030` hardcodés |
| `var(--color-surface-sidebar)` | fond sidebar | `#111827` hardcodés |
| `var(--color-text-primary)` | texte principal | `#F9FAFB`, `#fff` hardcodés |
| `var(--color-text-muted)` | texte secondaire | `#6B7280`, `#9CA3AF` hardcodés |
| `var(--color-border-default)` | bordures | `#374151`, `#2D3748` hardcodés |
| `var(--color-status-success)` | vert | `#10B981`, `#22C55E` hardcodés |
| `var(--color-status-danger)` | rouge | `#EF4444`, `#F87171` hardcodés |

#### 4B — Ordre de migration par fichier (du pire au meilleur)

**Lot 1 — 27+ occurrences (traiter en premier)**

`shared/components/settings/SettingsDashboard.tsx`
- Stratégie : passer en revue les 27 hex, mapper sur les variables CSS, les couleurs sans équivalent → créer la variable manquante dans `globals.css`

**Lot 2 — 15-18 occurrences**

- `modules/ops/production/kitchen/components/RecipeDetailDialog.tsx` (18)
- `modules/ops/production/kitchen/components/tabs/AllergensTab.tsx` (15)

**Lot 3 — 10-11 occurrences**

- `modules/facility/spaces/floor-plan/FloorPlanEditor.tsx` (11)
- `shared/components/settings/GoalsSettings.tsx` (10)
- `shared/components/layout/Map3DOverlay.tsx` (10)
- `modules/onboarding/wizard/SimpleFloorPlanEditor.tsx` (10)
- `modules/logistics/approvisionnement/reception/components/InventoryReceptionDashboard.tsx` (10)
- `modules/commerce/relation/crm/components/ProspectingDashboard.tsx` (10)

**Lot 4 — 6-8 occurrences** (18 fichiers restants, traitement en batch)

**Lot 5 — rgba() hardcodés** (66 fichiers)

Les rgba sont souvent des overlays ou glassmorphism. Pattern de remplacement :
```css
/* Avant */
background: rgba(255, 255, 255, 0.04);

/* Après — ajouter dans globals.css */
--glass-surface: rgba(255, 255, 255, 0.04);
/* puis dans le composant */
background: var(--glass-surface);
```

Variables glass à standardiser dans `globals.css` :
```css
--glass-surface-low:    rgba(255,255,255,0.02);
--glass-surface-mid:    rgba(255,255,255,0.04);
--glass-surface-high:   rgba(255,255,255,0.08);
--glass-border:         rgba(255,255,255,0.08);
--glass-hover:          rgba(255,255,255,0.06);
--overlay-dark:         rgba(0,0,0,0.5);
--overlay-darker:       rgba(0,0,0,0.75);
```

#### 4C — Règle de validation

Après chaque lot :
```bash
# 0 hex hardcodé restant dans le fichier traité
grep -n "#[0-9a-fA-F]\{3,6\}" src/[chemin/fichier] | grep -v "// " | grep -v "globals.css"
```

---

### PHASE 5 — Couche atomique (Jour 3)

> `src/shared/components/atomic/` n'a que 2 composants. L'absence de Button, Input, Badge canoniques force chaque module à réinventer les siens.

#### 5A — Composants atomiques à créer

Ces composants existent déjà en plusieurs versions dans les modules — il s'agit d'extraire la meilleure version et de la canoniser dans `atomic/`.

| Composant | Source à extraire | Utilisations estimées |
|-----------|------------------|----------------------|
| `Button.tsx` | `shared/components/ui/` (pattern déjà partout) | Partout |
| `Badge.tsx` | Extraire depuis `StatusBadge.tsx` (généraliser) | 30+ endroits |
| `Input.tsx` | Généraliser `GlassInput.tsx` existant | 20+ endroits |
| `Select.tsx` | Canoniser `PremiumSelect.tsx` | 15+ endroits |
| `Spinner.tsx` | Extraire depuis `LoadingState.tsx` | 10+ endroits |
| `Avatar.tsx` | Aucun existant — à créer | Staff, CRM |
| `Chip.tsx` | Extraire depuis composants tags/labels | 10+ endroits |

#### 5B — Structure cible de `atomic/`

```
src/shared/components/atomic/
  Button.tsx          ← variantes : primary / secondary / ghost / danger
  Badge.tsx           ← variantes : success / warning / danger / info / neutral
  Input.tsx           ← text / number / password / search
  Select.tsx          ← single / multi
  Spinner.tsx         ← sizes : sm / md / lg
  Avatar.tsx          ← image + initiales fallback
  Chip.tsx            ← dismissable ou non
  GlassInput.tsx      ← déjà là, conserver
  GoldSwitch.tsx      ← déjà là, conserver
  index.ts            ← barrel export de tous
```

#### 5C — Règle d'adoption

Une fois les atomiques créés, chaque nouveau composant UI doit les utiliser. Les anciens composants sont migrés progressivement à chaque passage.

---

### PHASE 6 — Floor Plan responsive (Jour 4)

> `FloorPlanEditor.tsx` et ses 5 fichiers associés ont **0 classe responsive** et utilisent un canvas HTML5 avec coordonnées absolues.

#### 6A — Contrainte technique

Le canvas HTML5 est intrinsèquement non-responsive — les coordonnées sont en pixels absolus. La solution n'est pas d'ajouter des classes Tailwind mais d'adapter le rendu.

**Approche** :
```typescript
// Dans FloorPlanEditor.tsx — ajouter un hook de redimensionnement
const { width, height } = useContainerSize(containerRef) // ResizeObserver
const scale = Math.min(width / CANVAS_BASE_WIDTH, height / CANVAS_BASE_HEIGHT)

// Appliquer le scale via CSS transform sur le canvas
<canvas
  ref={canvasRef}
  width={CANVAS_BASE_WIDTH}
  height={CANVAS_BASE_HEIGHT}
  style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
/>
```

#### 6B — `TableInsightPanel.tsx`

Actuellement : `fixed top-24 right-8 w-[420px]` — déborde sur tablettes < 768px.

```typescript
// Avant
<div className="fixed top-24 right-8 w-[420px]">

// Après
<div className="fixed top-24 right-2 md:right-8 w-[calc(100vw-1rem)] md:w-[420px] max-w-[420px]">
```

#### 6C — `EditPanel.tsx`

Transformer le panneau latéral fixe en bottom sheet sur mobile :
```typescript
// Sur mobile (< md) → position bottom, width 100%
// Sur desktop (≥ md) → position right, width fixe
<div className="
  fixed bottom-0 left-0 right-0 md:bottom-auto md:top-24 md:right-8
  w-full md:w-[320px]
  rounded-t-2xl md:rounded-xl
">
```

---

### PHASE 7 — Système dark/light (Jour 5, optionnel)

> L'UI est dark-first par défaut. Aujourd'hui `globals.css` n'a pas de variante light — toutes les variables CSS ont une valeur unique. Ce chantier n'est à faire que si tu veux supporter un vrai toggle dark/light.

#### 7A — Structure cible dans `globals.css`

```css
/* Thème dark (défaut) */
:root {
  --color-surface-bg:      #0A0B10;
  --color-surface-card:    #111827;
  --color-text-primary:    #F9FAFB;
  /* ... 54 variables */
}

/* Thème light */
:root[data-theme="light"],
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --color-surface-bg:      #F8F9FA;
    --color-surface-card:    #FFFFFF;
    --color-text-primary:    #111827;
    /* ... remapper les 54 variables */
  }
}
```

#### 7B — Prérequis bloquant

La Phase 7 n'est réalisable qu'**après la Phase 4** (tokens hardcodés migrés). Tant qu'il reste des hex en dur, le toggle de thème n'affectera pas ces composants.

---

### Récapitulatif — Charge estimée

| Phase | Contenu | Durée | Prérequis |
|-------|---------|-------|-----------|
| 1 — Doublons | Supprimer 25 fichiers, rediriger imports | 4-5h | Aucun |
| 2 — Orphelins | Supprimer 5 fichiers | 30min | Aucun |
| 3 — Barrel ui/index.ts | Ajouter 6 exports, migrer imports directs | 1h | Phase 1 |
| 4 — Tokens CSS | Migrer ~80 fichiers hex→variables | 2-3 jours | Phase 1 |
| 5 — Couche atomique | Créer 7 composants canoniques | 1-2 jours | Phase 4 |
| 6 — Floor plan responsive | ResizeObserver canvas, panel responsive | 1 jour | Aucun |
| 7 — Dark/light toggle | Variante light dans globals.css | 1 jour | Phase 4 |

**Total estimé** : 6-8 jours de travail ciblé.

**Bénéfice** : après ces phases, toute modification d'une couleur dans `globals.css` se propage à **100% des composants** sans exception. La refonte UI devient alors un changement de 10 lignes dans `globals.css`.

---

*Complété le 2026-08-07 · Plan d'exécution ajouté post-audit*
