# Design System Plan — Restaurant OS

> **Périmètre** : unifier l'UI des 8 verticales tout en préservant l'identité propre de chaque tenant (mode `default` ou `custom`).
> Document vivant — les phases terminées sont marquées ✅ DONE.

---

## État des lieux — Ce qui existe déjà

### Couche tokens ✅
```
src/shared/nexus/tokens/
├── colors.ts         ← Palette brute (indigo, emerald, amber, red, neutral, gold…)
├── semantic.ts       ← Tokens sémantiques + generateCSSVariables()
├── brand.ts          ← BrandTokensSchema (Zod) + defaultBrandTokens
├── themeAtoms.ts     ← Jotai atoms (mode, accentColor, density, borderRadius, glassmorphism)
└── verticals/        ← ✅ DONE — tokens par variant (Phase 1)
    ├── restaurant.ts · hotel.ts · bakery.ts · salon.ts
    ├── clinic.ts · garage.ts · retail.ts · custom.ts
    └── index.ts      ← VERTICAL_DEFAULT_TOKENS + VERTICAL_EXTRA_TOKENS
```

### Couche injection CSS ✅
| Fichier | Rôle |
|---------|------|
| `src/lib/BrandingProvider.tsx` | ✅ DONE — merge vertical < custom, injecte CSS vars + `data-vertical` |
| `src/shared/components/ThemeApplicator.tsx` | Pose `data-theme="light\|dark"` sur `<html>` depuis atom |
| `src/shared/hooks/useFirestoreBrand.ts` | Sync Firestore temps réel → atom → DOM |
| `src/shared/providers/SplashGate.tsx` | Splash branded si `brandingMode=custom && splashEnabled=true` |
| `src/app/globals.css` | `@theme` Tailwind v4 — tokens sémantiques avec fallbacks |

### Couche branding CRUD ✅
| Fichier | Rôle |
|---------|------|
| `src/shared/hooks/useBrandEditor.ts` | Save tokens Firestore + upload Firebase Storage |
| `src/shared/components/settings/BrandUploader.tsx` | Drag & drop logo/favicon/banner |
| `src/shared/components/settings/panels/StyleTab.tsx` | UI settings (mode, accent, density, radius, glass) |
| `src/app/api/admin/brand/extract/route.ts` | POST → Playwright screenshot + Gemini Vision → BrandInput |

### Couche verticales ✅
```
src/verticals/                     ← ✅ DONE — tous déclarent defaultTheme + verticalTokens (Phase 2b)
├── restaurant/ · salon/ · hotel/ · bakery/
├── clinic/ · garage/ · retail/ · custom/

src/shared/seeds/                  ← DNA seeds avec theme.appearance par variant
├── restaurant  → dark  · hotel  → dark  · garage → dark
├── bakery      → light · salon  → light · clinic → light · retail → light
└── custom      → auto
```

### Couche store ✅
| Atom | Description |
|------|-------------|
| `tenantVariantAtom` | ✅ DONE — dérivé de `tenantConfigAtom`, jamais hardcodé |
| `themeModeAtom` | `atomWithStorage` tenant-scopé — persiste le choix utilisateur par tenant |
| `tenantBrandTokensAtom` | Tokens Firestore du tenant courant |

### Couche composants — état partiel
| Composant | CVA | État |
|-----------|-----|------|
| `button.tsx` | ✅ | variants: default/destructive/outline/secondary/ghost/link/success |
| `badge.tsx` | ✅ | variants: default/secondary/destructive/success/warning/outline |
| `input.tsx` | ✅ | — |
| `card.tsx` | ❌ | forwardRef basique, pas de variants |
| `Modal.tsx` | ✅ | size déjà présent — manque variant `premium` avec backdrop CSS var |
| `GlassCard.tsx` | ❌ | glassmorphism hardcodé, ne lit pas `--glass-blur` / `--glass-opacity` |
| `StatCard.tsx` | ❌ | accentColor hardcodé, pas de lien avec les tokens verticaux |
| `StatusBadge.tsx` | ❌ | couleurs status hardcodées, pas de CVA |

---

## Architecture cible

```
Mode "default"
  tenantVariantAtom → VERTICAL_DEFAULT_TOKENS[variant]
                    → BrandingProvider → CSS vars

Mode "custom"
  VERTICAL_DEFAULT_TOKENS[variant]   (base)
          ↑ merge (custom wins)
  Firestore BrandConfig du tenant
          → BrandingProvider → CSS vars
```

**Règle de priorité (la plus haute gagne) :**
```
1. Firestore custom tokens     (brandingMode=custom uniquement)
2. verticalDefaultTokens       (toujours appliqués comme base)
3. semanticTokens globaux      (fallback ultime, jamais restaurant-only)
```

---

## Gaps identifiés et non couverts dans la v1 du plan

### Gap A — `appearance` par vertical non câblé ⚠️
Les DNA seeds définissent `theme.appearance: 'dark' | 'light'` mais `BrandingProvider` n'en tient pas compte.
`themeModeAtom` est initialisé à `'dark'` globalement — un salon ou une clinique devrait démarrer en `light`.

**Solution** : ajouter `defaultAppearance` dans chaque fichier de tokens vertical et dans `BrandingProvider`, si le tenant n'a jamais explicitement changé son mode (= valeur dans storage = valeur par défaut globale `'dark'`), initialiser `themeModeAtom` avec `defaultAppearance` du variant.

Clé de détection : `tenantScopedJSONStorage` — si la clé `nexus_theme_mode:{tenantId}` n'existe pas encore, le tenant est "vierge" → appliquer le default vertical.

**Fichiers** :
- `src/shared/nexus/tokens/verticals/*.ts` ← ajouter `defaultAppearance: 'light' | 'dark'`
- `src/shared/nexus/tokens/verticals/index.ts` ← `VERTICAL_APPEARANCE: Record<PlatformVariant, 'light' | 'dark' | 'auto'>`
- `src/lib/BrandingProvider.tsx` ← initialiser `themeModeAtom` si vierge

### Gap B — Reset des tokens verticaux lors d'un changement de variant ⚠️
Si un tenant passe de `restaurant` à `salon` (migration MCC), les CSS vars `--table-occupied`, `--order-pending`… restent sur `:root` jusqu'au rechargement.

**Solution** : dans `BrandingProvider`, avant d'injecter les nouveaux tokens verticaux, supprimer les anciens via un `data-vertical-prev` attribute. Stocker la liste des vars injectées par vertical pour pouvoir les retirer proprement.

**Fichier** : `src/lib/BrandingProvider.tsx` ← cleanup des extra tokens de l'ancien variant

### Gap C — `data-vertical` en CSS — pas de règles ⚠️
On pose `data-vertical="salon"` sur `<html>` mais aucune règle CSS ne l'exploite.

**Usage prévu** : surcharges CSS ultra-spécifiques impossibles via tokens (ex: icônes métier différentes, curseur spécifique pour garage).

**Fichier** : `src/app/globals.css` ← section `[data-vertical="garage"] { cursor: crosshair; }` etc.

### Gap D — `BrandingService` ignore le variant ⚠️
`POST /api/admin/brand/extract` appelle `BrandingService.extractFromUrl(url)` puis mappe vers un `BrandConfig` générique. Les tokens verticaux (fonts, radius, couleurs métier) ne sont pas utilisés comme base — un salon extrait `atmosphere: 'luxury'` peut se retrouver avec les surfaces d'un restaurant.

**Solution** : passer `variant` au `generateThemeFromBrand` et merger avec `VERTICAL_DEFAULT_TOKENS[variant]` en priorité basse.

### Gap E — `BrandImportWizard` non détaillé ⚠️
La phase 5b du plan ne spécifie pas assez l'implémentation pour être actionnable.

### Gap F — Catalogue `/design-system` trop vague ⚠️
Phase 6 ne précise pas la structure de route, le switcher de variant, ni les sections exactes.

---

## Charte couleurs + appearance par verticale

| Verticale | Primaire | Secondaire | Appearance | Radius card | Font marque |
|-----------|----------|------------|------------|-------------|-------------|
| **restaurant** | `#C5A059` | `#B08D48` | `dark` | `lg` (1.5rem) | Playfair Display |
| **hotel** | `#1E3A5F` | `#2D5F8A` | `dark` | `sm` (0.5rem) | Cormorant Garamond |
| **bakery** | `#C68642` | `#8B4513` | `light` | `lg` (1.5rem) | Lora |
| **salon** | `#D4A5C7` | `#9B59B6` | `light` | `lg` (1.5rem) | Cormorant Garamond |
| **clinic** | `#3498DB` | `#1ABC9C` | `light` | `sm` (0.5rem) | Inter |
| **garage** | `#2C3E50` | `#E74C3C` | `dark` | `sm` (0.5rem) | Rajdhani |
| **retail** | `#27AE60` | `#2ECC71` | `light` | `md` (1rem) | Poppins |
| **custom** | `#6366f1` | `#8B5CF6` | `auto` | `lg` (1.5rem) | Inter |

### Tokens métier par verticale (CSS vars injectées sur `:root`)
```
restaurant : --table-available · --table-occupied · --table-reserved · --table-cleaning
             --order-pending · --order-in-kitchen · --order-ready · --order-served · --order-cancelled
salon      : --appointment-booked · --appointment-in-progress · --appointment-completed
             --appointment-cancelled · --appointment-no-show · --chair-available · --chair-occupied
clinic     : --appointment-urgent · --appointment-routine · --appointment-followup
             --appointment-completed · --appointment-cancelled · --patient-waiting · --patient-in-consultation
hotel      : --room-available · --room-occupied · --room-cleaning · --room-maintenance · --room-reserved
             --checkin-pending · --checkin-active
bakery     : --batch-planned · --batch-in-progress · --batch-ready · --batch-expiring · --batch-sold
             --ingredient-ok · --ingredient-low · --ingredient-out
garage     : --repair-pending · --repair-diagnosis · --repair-in-progress · --repair-waiting-parts
             --repair-ready · --repair-delivered · --vehicle-in · --vehicle-active · --vehicle-out
retail     : --stock-normal · --stock-low · --stock-critical · --stock-out
             --promo-active · --promo-expiring · --sale-in-progress · --sale-completed
```

---

## Plan d'exécution complet

### ✅ Phase 1 — `verticalDefaultTokens` + `verticalExtraTokens` (DONE)
`src/shared/nexus/tokens/verticals/` — 8 fichiers + index créés.

### ✅ Phase 2 — `IVerticalPlugin` + Verticals + BrandingProvider (DONE)
- `IVerticalPlugin.ts` : +`defaultTheme`, +`verticalTokens`
- 8 classes Vertical : déclarent `defaultTheme` + `verticalTokens`
- `BrandingProvider.tsx` : merge vertical < custom, `data-vertical` posé

### ✅ Phase 3 — `tenantVariantAtom` (DONE)
`src/store/pillars/sovereign.ts` — atom dérivé de `tenantConfigAtom`.

---

### Phase 4 — `defaultAppearance` par vertical + init ThemeMode (Gap A)
**Fichiers** : `src/shared/nexus/tokens/verticals/*.ts`, `src/lib/BrandingProvider.tsx`

#### 4a. Ajouter `defaultAppearance` dans chaque fichier vertical
```ts
// src/shared/nexus/tokens/verticals/salon.ts
export const salonDefaultAppearance = 'light' as const;

// src/shared/nexus/tokens/verticals/index.ts
export const VERTICAL_APPEARANCE: Record<PlatformVariant, 'light' | 'dark' | 'auto'> = {
  restaurant: 'dark',
  hotel:      'dark',
  garage:     'dark',
  bakery:     'light',
  salon:      'light',
  clinic:     'light',
  retail:     'light',
  custom:     'auto',
};
```

#### 4b. Init `themeModeAtom` au premier chargement d'un tenant vierge
Dans `BrandingProvider`, après résolution du variant :
```ts
// Si le tenant n'a jamais défini de préférence → appliquer l'appearance du vertical
const storedKey = `nexus_theme_mode:${tenantId}`;
const hasUserPref = localStorage.getItem(storedKey) !== null;
if (!hasUserPref && verticalAppearance !== 'auto') {
  setThemeMode(verticalAppearance);  // via useSetAtom(themeModeAtom)
}
```

#### 4c. Cleanup des tokens verticaux précédents (Gap B)
```ts
// Avant d'injecter les nouveaux tokens verticaux :
const prevVertical = root.getAttribute('data-vertical') as PlatformVariant | null;
if (prevVertical && prevVertical !== variant) {
  const prevTokens = VERTICAL_EXTRA_TOKENS[prevVertical] ?? {};
  Object.keys(prevTokens).forEach(key => root.style.removeProperty(key));
}
```

---

### Phase 5 — CVA-fication des composants manquants
**Fichier** : `src/shared/components/ui/`

#### 5a. `card.tsx`
```ts
const cardVariants = cva('border transition-all', {
  variants: {
    intent: {
      default:  'bg-surface-card border-border-default shadow-sm',
      elevated: 'bg-surface-card border-border-default shadow-premium',
      glass:    'bg-surface-card/40 backdrop-blur-xl border-white/10',
      ghost:    'bg-transparent border-transparent',
    },
    size: { sm: 'p-3 rounded-xl', md: 'p-6 rounded-2xl', lg: 'p-8 rounded-3xl' },
  },
  defaultVariants: { intent: 'default', size: 'md' },
});
```
Rétrocompatibilité : `intent` et `size` sont optionnels, les valeurs par défaut reproduisent l'ancien comportement.

#### 5b. `GlassCard.tsx`
Lire les CSS vars injectées par `BrandingProvider` :
```ts
// backdrop-blur utilise var(--glass-blur, 16px)
// opacity utilise var(--glass-opacity, 0.7)
// → style={{ backdropFilter: 'blur(var(--glass-blur, 16px))' }}
```
Remplacer les valeurs hardcodées `backdrop-blur-xl` par `backdrop-blur-[var(--glass-blur,16px)]` (Tailwind v4 supporte l'interpolation arbitraire).

#### 5c. `StatCard.tsx`
Remplacer `accentColor` (prop custom ad hoc) par `intent` standard :
```ts
intent: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
```
`brand` → utilise `--action-primary` (couleur primaire du vertical courant) au lieu du gold hardcodé.

#### 5d. `StatusBadge.tsx`
Déjà bien structuré (tables `statusColors` + `sizeClasses`) — extraire en CVA pour homogénéité mais comportement identique.

---

### Phase 6 — `BrandingService` + variant (Gap D)
**Fichier** : `src/lib/BrandingService.ts`, `src/lib/BrandingUI.ts`

```ts
// generateThemeFromBrand reçoit maintenant le variant
generateThemeFromBrand(input: BrandInput, variant: PlatformVariant): Partial<BrandConfig> {
  const base = VERTICAL_DEFAULT_TOKENS[variant];
  return {
    ...base,
    primaryColor: input.primaryColor ?? base.primaryColor,
    // Atmosphere → overrides surfaces + fonts
    ...(input.atmosphere === 'luxury' && {
      surfaceBg:   '#0A0A0A', surfaceCard: '#111111',
      fontBrand:   variant === 'hotel' ? 'Cormorant Garamond' : 'Playfair Display',
      fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&display=swap',
    }),
    ...(input.atmosphere === 'zen' && {
      surfaceBg:   '#F9F7F5', surfaceCard: '#FFFFFF',
      fontBrand:   'Cormorant Garamond',
      fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital@0;1&display=swap',
    }),
    ...(input.atmosphere === 'bistro' && {
      surfaceBg:   '#FAF7F2', surfaceCard: '#F0EBE1',
      fontBrand:   'Lora',
      fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital@0;1&display=swap',
    }),
  };
}
```

**Route extract** : passer le `variant` du tenant dans le body de la réponse pour que le front puisse l'utiliser dans `BrandImportWizard`.

---

### Phase 7 — `BrandImportWizard` (Gap E)
**Fichier** : `src/shared/components/settings/BrandImportWizard.tsx`

Wizard 3 étapes, state machine locale (pas de Firestore avant confirmation) :

```
État interne : { step: 1|2|3, mode: 'url'|'manual', extractedTokens: Partial<BrandConfig>|null }

Étape 1 — Source
  [🌐 Import depuis URL]          [✏️ Saisie manuelle]
  └ input URL → POST /api/admin/brand/extract
                └ retourne { tokens: Partial<BrandConfig>, variant }
  └ OU : color picker + file upload logo direct

Étape 2 — Prévisualisation (aperçu live sans toucher Firestore)
  Injecter extractedTokens directement sur :root via style.setProperty (ephémère)
  Afficher : boutons, cards, badge, statCard dans les couleurs extraites
  Rollback : stocker les CSS vars initiales avant preview, les restaurer si annulation

Étape 3 — Confirmation
  [ Appliquer ] → useBrandEditor.saveTokens({ ...extractedTokens, brandingMode: 'custom' })
  [ Annuler ]  → restaurer les CSS vars initiales
```

**Props** :
```ts
interface BrandImportWizardProps {
  onSuccess?: (tokens: Partial<BrandConfig>) => void;
  onCancel?: () => void;
}
```

---

### Phase 8 — Catalogue `/design-system` (Gap F)
**Route** : `src/app/(public)/design-system/page.tsx` + layout minimal (pas de NexusOpsProvider)

#### Structure de la page

```
/design-system
│
├── Header — "Design System · Restaurant OS"
│   └── Switcher variant : [Restaurant] [Hotel] [Bakery] [Salon] [Clinic] [Garage] [Retail] [Custom]
│   └── Toggle mode : [Light] [Dark]
│
├── Section "Tokens"
│   ├── Couleurs (primary, secondary, surfaces, status)
│   ├── Typographie (font-brand, font-ui, scale)
│   ├── Radius (sm, md, lg, full)
│   └── Tokens métier du variant sélectionné (table-*, appointment-*, repair-*…)
│
├── Section "Atomiques"
│   └── Button (toutes variantes) · Badge · Input · Select · Chip · Avatar · Spinner
│
├── Section "Composés"
│   └── Card (intent: default/elevated/glass/ghost) · StatCard · StatusBadge · GlassCard
│
├── Section "Patterns"
│   └── EmptyState · LoadingState · PageHeader · ActionToolbar · FilterBar
│
└── Section "Vertical Live"
    └── Preview rendu depuis VERTICAL_DEFAULT_TOKENS[variant] injectés via style.setProperty
        Pas de Firestore, pas de tenant — preview purement frontend
```

#### Mécanisme switcher de variant
```ts
// Dans le composant page, state local :
const [previewVariant, setPreviewVariant] = useState<PlatformVariant>('restaurant');

useEffect(() => {
  const root = document.documentElement;
  // Nettoyer l'ancien vertical
  if (prev) Object.keys(VERTICAL_EXTRA_TOKENS[prev]).forEach(k => root.style.removeProperty(k));
  // Appliquer le nouveau
  const tokens = VERTICAL_DEFAULT_TOKENS[previewVariant];
  if (tokens.primaryColor) root.style.setProperty('--action-primary', tokens.primaryColor);
  // … autres tokens brand
  Object.entries(VERTICAL_EXTRA_TOKENS[previewVariant]).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-vertical', previewVariant);
}, [previewVariant]);
```

#### `data-vertical` en CSS (Gap C)
Ajouter dans `globals.css` après la section `@theme` :
```css
/* ── Curseurs et overrides visuels par vertical ── */
[data-vertical="garage"] { cursor: default; }
[data-vertical="clinic"] { --radius-btn: 0.25rem; } /* boutons très carrés en clinique */
[data-vertical="salon"]  { --shadow-glow-accent: 0 0 30px 8px rgba(212, 165, 199, 0.25); }
```

---

## Récapitulatif des fichiers — état final

### ✅ Déjà créés / modifiés
```
src/shared/nexus/tokens/verticals/   ← 8 fichiers variant + index
src/shared/plugins/IVerticalPlugin.ts ← +defaultTheme, +verticalTokens
src/verticals/*/XxxVertical.ts       ← +defaultTheme, +verticalTokens (×8)
src/store/pillars/sovereign.ts       ← +tenantVariantAtom
src/lib/BrandingProvider.tsx         ← merge vertical < custom + data-vertical
```

### À créer / modifier (phases 4–8)
```
src/shared/nexus/tokens/verticals/index.ts    ← +VERTICAL_APPEARANCE (Phase 4a)
src/shared/nexus/tokens/verticals/*.ts        ← +defaultAppearance (Phase 4a)
src/lib/BrandingProvider.tsx                  ← +init ThemeMode + cleanup prev (Phase 4b/4c)
src/shared/components/ui/card.tsx             ← +CVA (Phase 5a)
src/shared/components/ui/GlassCard.tsx        ← +CSS vars glass (Phase 5b)
src/shared/components/ui/StatCard.tsx         ← +intent brand (Phase 5c)
src/shared/components/ui/StatusBadge.tsx      ← +CVA (Phase 5d)
src/lib/BrandingService.ts                    ← +variant param (Phase 6)
src/lib/BrandingUI.ts                         ← +variant param (Phase 6)
src/shared/components/settings/BrandImportWizard.tsx  ← nouveau (Phase 7)
src/app/(public)/design-system/page.tsx       ← nouveau (Phase 8)
src/app/globals.css                           ← +data-vertical rules (Phase 8)
```

---

## Règles de non-régression

1. `brandingMode: 'default'` → jamais de CSS custom tenant, seulement les tokens du vertical
2. `brandingMode: 'custom'` → tokens Firestore mergent **par-dessus** les tokens vertical
3. `BrandTokensSchema` est le seul contrat pour les tokens brand — les tokens métier restent dans `IVerticalPlugin.verticalTokens`
4. Logo/favicon/bannière → toujours via `StorageManager` path `brands/{tenantId}/{slot}.{ext}`
5. `SovereignGuard` — `brands/{tenantId}/` isolé par tenant, aucune lecture cross-tenant
6. Nettoyage des extra tokens obligatoire avant changement de variant (Gap B)
7. `defaultAppearance` n'écrase le `themeModeAtom` que si aucune préférence utilisateur n'est stockée pour ce tenant

---

## Ordre d'exécution

```
✅ Phase 1 → ✅ Phase 2 → ✅ Phase 3
                ↓
Phase 4   (appearance + cleanup — modifie BrandingProvider)
                ↓
Phase 5   (CVA composants — indépendant)
Phase 6   (BrandingService variant — indépendant)
                ↓
Phase 7   (BrandImportWizard — dépend de Phase 6)
                ↓
Phase 8   (Catalogue — dépend de tout)
```
