# Plan — Flexibilité UI par Verticale

> **Objectif** : permettre des refontes UI complètes ou partielles sur n'importe quelle verticale actuelle ou future, sans toucher aux autres, sans casser le système commun.
> **Cohérence** : ce plan s'appuie sur `DESIGN_SYSTEM_PLAN.md` (theming) et l'étend avec la couche structurelle.

---

## Ce qui existe déjà et qu'on ne refait pas

| Existant | Rôle |
|----------|------|
| `LayoutResolver.tsx` | Lit `tenantConfig.status.layoutType` → switche entre `sidebar / topbar / kiosk / default` |
| `TenantConfigSchema` | `layoutType: z.enum(['default', 'kiosk', 'hud', 'admin', 'sidebar', 'topbar'])` |
| DNA seeds | `status.layoutType: 'sidebar'` — déjà par tenant |
| `VerticalRegistry` | Registre singleton pour la logique métier par variant |
| `IVerticalPlugin` | Interface avec `defaultTheme`, `verticalTokens`, `routes`, `initialize()` |
| `BrandingProvider` | Theming complet per-variant (DESIGN_SYSTEM_PLAN phases 1-4) |
| `TenantOverridePanel` | MCC UI qui applique des overrides UI/layout par tenant via `/api/admin/fleet/tenant-override` |
| `capabilities` | `z.record(z.string(), z.boolean())` dans `TenantConfigSchema` — system de feature flags par tenant |
| `filterByCapabilities()` | Filtre nav items selon les capabilities du tenant |

**Le layout switcher est déjà fonctionnel.** Ce plan ne le refait pas — il ajoute la couche composants, scoping, et gating MCC.

---

## Le problème précis

```
Aujourd'hui :
  Salon → StatCard défaut (icône, valeur, label)
  Garage → StatCard défaut (icône, valeur, label)   ← même structure, juste couleur différente

Besoin :
  Salon → StatCard "rendez-vous" (nom client, stylist, heure, statut)
  Garage → StatCard "véhicule" (immat, marque, étape réparation, technicien)

Aujourd'hui :
  /pos du restaurant → tokens globaux sur :root
  /agenda du salon  → même tokens globaux (contamination)

Besoin :
  /pos        → tokens POS isolés (ne polluent pas /agenda)
  /agenda     → tokens agenda isolés (ne polluent pas /pos)
```

---

## Architecture cible

```
VerticalUIRegistry (nouveau singleton)
    │
    ├── register(variant, IVerticalUIPlugin)
    └── resolve(variant) → IVerticalUIPlugin
              │
              ├── layoutType?        → préférence layout (alimente LayoutResolver via DNA)
              ├── components?        → overrides de composants partagés
              ├── scopedTokens?      → CSS vars par route (isolés, pas sur :root global)
              └── pageTemplates?     → templates de pages entières par route

VerticalUIProvider (nouveau, monté après AuthGate)
    │
    ├── lit tenantVariantAtom
    ├── résout VerticalUIRegistry.resolve(variant)
    ├── injecte scopedTokens sur le wrapper DOM (pas sur :root)
    └── expose VerticalUIContext

useVerticalUI() hook
    ├── resolveComponent(name) → composant vertical ou défaut partagé
    └── currentLayout, scopedTokens, pageTemplate(route)

withVerticalOverride(name, DefaultComponent) HOC
    └── wrap transparent : utilise le composant vertical s'il existe, sinon le défaut
```

---

## Contrats TypeScript

### `IVerticalUIPlugin`
```ts
// src/shared/plugins/IVerticalUIPlugin.ts

import type { PlatformVariant } from '@/domain/schemas/tenant';

/** Noms de composants surchargeables par un vertical. */
export type OverrideableComponent =
  | 'StatCard'
  | 'PageHeader'
  | 'EmptyState'
  | 'FilterBar'
  | 'ActionToolbar'
  | 'ContentSection'
  | 'SectionHeader'
  | 'LoadingState'
  | 'StatusBadge';

export type ComponentOverrides = Record<
  OverrideableComponent,
  React.ComponentType<Record<string, unknown>>
>;

export interface IVerticalUIPlugin {
  readonly variant: PlatformVariant;

  /**
   * Layout préféré de ce vertical.
   * Alimente le DNA status.layoutType si non déjà défini par le tenant.
   * LayoutResolver l'applique automatiquement.
   */
  readonly preferredLayout?: 'sidebar' | 'topbar' | 'kiosk' | 'fullscreen' | 'default';

  /**
   * Surcharges de composants partagés.
   * Partiel : seuls les composants listés sont remplacés, les autres restent les defaults.
   * Ex : { StatCard: GarageStatCard, PageHeader: GaragePageHeader }
   */
  readonly components?: Partial<ComponentOverrides>;

  /**
   * Tokens CSS scoped par route (injectés sur le wrapper DOM, pas sur :root).
   * Ne contaminent pas les autres routes.
   * Ex : { '/pos': { '--radius-card': '0.25rem', '--table-occupied': '#6366f1' } }
   */
  readonly scopedTokens?: Record<string, Record<string, string>>;

  /**
   * Templates de pages entières par route.
   * Remplace la page Next.js entière par une version verticale.
   * Ex : { '/dashboard': GarageDashboard }
   */
  readonly pageTemplates?: Record<string, React.ComponentType<unknown>>;
}
```

---

## Plan d'exécution

### Phase A — Contrats et registre
**Fichiers nouveaux** :
- `src/shared/plugins/IVerticalUIPlugin.ts`
- `src/shared/plugins/VerticalUIRegistry.ts`

`VerticalUIRegistry` est un singleton calqué sur `VerticalRegistry` :

```ts
// src/shared/plugins/VerticalUIRegistry.ts
import type { PlatformVariant } from '@/domain/schemas/tenant';
import type { IVerticalUIPlugin } from './IVerticalUIPlugin';

const registry = new Map<PlatformVariant, IVerticalUIPlugin>();

export const VerticalUIRegistry = {
  register(variant: PlatformVariant, plugin: IVerticalUIPlugin): void {
    registry.set(variant, plugin);
  },

  resolve(variant: PlatformVariant): IVerticalUIPlugin | null {
    return registry.get(variant) ?? registry.get('custom') ?? null;
  },

  list(): PlatformVariant[] {
    return Array.from(registry.keys());
  },
};

// Auto-registration lazy — chaque vertical déclare son UI plugin
// Les imports sont identiques au VerticalRegistry pour la cohérence
import('@/verticals/restaurant/ui').then(m => VerticalUIRegistry.register('restaurant', m.RestaurantUIPlugin));
import('@/verticals/salon/ui').then(m => VerticalUIRegistry.register('salon', m.SalonUIPlugin));
// … idem pour les 6 autres
```

---

### Phase B — `VerticalUIPlugin` par vertical
**Fichiers nouveaux** : `src/verticals/<variant>/ui.ts` (×8)

Structure minimale (vertical sans override = fichier vide mais présent) :

```ts
// src/verticals/restaurant/ui.ts
import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

export const RestaurantUIPlugin: IVerticalUIPlugin = {
  variant: 'restaurant',
  preferredLayout: 'sidebar',
  // Pas d'overrides pour l'instant — le restaurant utilise tous les composants partagés
};
```

```ts
// src/verticals/garage/ui.ts
import { GarageStatCard } from './ui/GarageStatCard';
import { GaragePageHeader } from './ui/GaragePageHeader';

export const GarageUIPlugin: IVerticalUIPlugin = {
  variant:         'garage',
  preferredLayout: 'sidebar',
  components: {
    StatCard:   GarageStatCard,
    PageHeader: GaragePageHeader,
  },
  scopedTokens: {
    '/pos':     { '--radius-card': '0.25rem', '--radius-btn': '0.25rem' },
    '/repairs': { '--radius-card': '0.25rem' },
  },
};
```

```ts
// src/verticals/salon/ui.ts
import { SalonStatCard } from './ui/SalonStatCard';

export const SalonUIPlugin: IVerticalUIPlugin = {
  variant:         'salon',
  preferredLayout: 'sidebar',
  components: {
    StatCard: SalonStatCard,   // Affiche : client, styliste, heure, statut RDV
  },
  scopedTokens: {
    '/agenda':  { '--radius-card': '9999px' },  // Cards très arrondies dans l'agenda
    '/clients': { '--radius-card': '1.5rem' },
  },
};
```

**Structure des fichiers UI vertical** :
```
src/verticals/<variant>/
├── ui.ts                  ← IVerticalUIPlugin déclaration (OBLIGATOIRE)
└── ui/                    ← Composants spécifiques (optionnel, seulement si override)
    ├── GarageStatCard.tsx
    ├── GaragePageHeader.tsx
    └── index.ts
```

---

### Phase C — `VerticalUIProvider` + `VerticalUIContext`
**Fichier nouveau** : `src/shared/providers/VerticalUIProvider.tsx`

```ts
'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { usePathname } from 'next/navigation';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { VerticalUIRegistry } from '@/shared/plugins/VerticalUIRegistry';
import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

const VerticalUIContext = createContext<IVerticalUIPlugin | null>(null);

export function VerticalUIProvider({ children }: { children: React.ReactNode }) {
  const variant  = useAtomValue(tenantVariantAtom);
  const pathname = usePathname();
  const plugin   = VerticalUIRegistry.resolve(variant);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Injecter les scopedTokens de la route courante sur le wrapper DOM (pas sur :root)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !plugin?.scopedTokens) return;

    // Trouver la route la plus précise qui correspond au pathname
    const matchedRoute = Object.keys(plugin.scopedTokens)
      .filter(route => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0]; // la plus précise gagne

    // Nettoyer les tokens de l'ancienne route
    el.removeAttribute('style');

    if (matchedRoute) {
      const tokens = plugin.scopedTokens[matchedRoute];
      Object.entries(tokens).forEach(([key, val]) => el.style.setProperty(key, val));
    }
  }, [pathname, plugin]);

  return (
    <VerticalUIContext.Provider value={plugin}>
      <div ref={wrapperRef} data-vertical-scope={variant} className="contents">
        {children}
      </div>
    </VerticalUIContext.Provider>
  );
}

export function useVerticalUI(): IVerticalUIPlugin | null {
  return useContext(VerticalUIContext);
}
```

**Montage** : dans `NexusProviderStack.tsx`, après `AuthGate` (les composants UI verticaux nécessitent le variant résolu) :
```tsx
<AuthGate>
  <VerticalUIProvider>          {/* ← nouveau */}
    <SaaSBillingGate>
      …
    </SaaSBillingGate>
  </VerticalUIProvider>
</AuthGate>
```

---

### Phase D — `resolveComponent` + `withVerticalOverride`
**Fichier nouveau** : `src/shared/hooks/useVerticalComponent.ts`

```ts
import { useVerticalUI } from '@/shared/providers/VerticalUIProvider';
import type { OverrideableComponent } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * Résout le composant à utiliser pour un nom donné.
 * Si le vertical courant a un override → retourne l'override.
 * Sinon → retourne le composant partagé par défaut.
 *
 * Usage :
 *   const StatCard = useVerticalComponent('StatCard', DefaultStatCard);
 *   return <StatCard ... />;
 */
export function useVerticalComponent<P extends Record<string, unknown>>(
  name: OverrideableComponent,
  defaultComponent: React.ComponentType<P>
): React.ComponentType<P> {
  const plugin = useVerticalUI();
  return (plugin?.components?.[name] as React.ComponentType<P>) ?? defaultComponent;
}
```

```ts
/**
 * HOC — wrap un composant partagé pour qu'il soit automatiquement remplacé
 * par la version verticale si elle existe.
 *
 * Usage dans un composant partagé :
 *   export const StatCard = withVerticalOverride('StatCard', StatCardBase);
 */
export function withVerticalOverride<P extends Record<string, unknown>>(
  name: OverrideableComponent,
  DefaultComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function VerticalAwareComponent(props: P) {
    const plugin = useVerticalUI();
    const Override = plugin?.components?.[name] as React.ComponentType<P> | undefined;
    return Override ? <Override {...props} /> : <DefaultComponent {...props} />;
  };
}
```

**Application dans les composants partagés** (modification minimale, rétrocompatible) :

```ts
// src/shared/components/ui/StatCard.tsx — fin du fichier
export const StatCard = withVerticalOverride('StatCard', StatCardBase);
//                      ↑ si le vertical a un override → l'utilise
//                        sinon → StatCardBase (comportement actuel)
```

---

### Phase E — Layout par vertical via DNA
**Aucun nouveau fichier** — le `LayoutResolver` lit déjà `tenantConfig.status.layoutType`.

Ce qui manque : que le `VerticalUIPlugin.preferredLayout` soit utilisé comme valeur par défaut si le tenant n'a pas de `layoutType` explicite dans son DNA.

```ts
// src/shared/components/layout/LayoutResolver.tsx — modification mineure
const plugin = VerticalUIRegistry.resolve(variant);
const layout = config?.status?.layoutType          // tenant explicite → priorité
            ?? plugin?.preferredLayout             // ← nouveau : défaut vertical
            ?? 'default';
```

---

### Phase F — Catalogue `data-vertical` CSS (Gap C du DESIGN_SYSTEM_PLAN)
**Fichier** : `src/app/globals.css`

Ajouter une section dédiée aux overrides CSS par vertical :

```css
/* ── VERTICAL SCOPES — overrides visuels par [data-vertical] ── */

/* Garage : géométrie industrielle, curseur précision */
[data-vertical="garage"] {
  --radius-card:   0.25rem;
  --radius-btn:    0.25rem;
}

/* Salon : rondeur maximale, glow doux */
[data-vertical="salon"] {
  --shadow-glow-accent: 0 0 30px 8px rgba(212, 165, 199, 0.2);
}

/* Clinic : densité compacte, pas de glassmorphism */
[data-vertical="clinic"] {
  --glass-blur:    0px;
  --glass-opacity: 0;
  --radius-btn:    0.25rem;
}

/* Kiosk — fullscreen, typographie large */
[data-vertical][data-layout="kiosk"] {
  font-size: 1.125rem;
}
```

---

### Phase G — Guide : ajouter une nouvelle verticale ou faire une refonte

#### Ajouter une nouvelle verticale (future)

```
1. src/domain/schemas/tenant.ts
   → ajouter le variant dans PLATFORM_VARIANTS

2. src/shared/seeds/<variant>-full-dna.ts
   → créer le DNA seed (theme, capabilities, status.layoutType)

3. src/shared/nexus/tokens/verticals/<variant>.ts
   → déclarer defaultTokens + verticalTokens + defaultAppearance

4. src/verticals/<variant>/
   ├── <Variant>Vertical.ts   ← logique métier (IVerticalPlugin)
   ├── adapters/              ← adapters piliers
   ├── ui.ts                  ← IVerticalUIPlugin (layout, components, scopedTokens)
   └── ui/                    ← composants spécifiques si besoin

5. src/shared/plugins/VerticalRegistry.ts
   → import('@/verticals/<variant>').then(m => VerticalRegistry.register(...))

6. src/shared/plugins/VerticalUIRegistry.ts
   → import('@/verticals/<variant>/ui').then(m => VerticalUIRegistry.register(...))

7. src/shared/nexus/tokens/verticals/index.ts
   → ajouter dans VERTICAL_DEFAULT_TOKENS, VERTICAL_EXTRA_TOKENS, VERTICAL_APPEARANCE
```

#### Faire une refonte UI partielle sur un vertical existant

```
Refonte theming uniquement (couleurs, fonts, radius) :
→ Modifier src/shared/nexus/tokens/verticals/<variant>.ts
→ Zéro impact sur les autres verticales

Refonte d'un composant pour un vertical :
→ Créer src/verticals/<variant>/ui/<ComponentName>.tsx
→ L'ajouter dans src/verticals/<variant>/ui.ts → components: { StatCard: ... }
→ Zéro impact sur les autres verticales

Refonte d'une route pour un vertical :
→ Ajouter dans scopedTokens: { '/ma-route': { '--var': 'val' } }
→ Tokens injectés uniquement quand la route est active (VerticalUIProvider)
→ Zéro impact sur les autres routes et verticales

Refonte du layout d'un vertical :
→ Changer preferredLayout dans src/verticals/<variant>/ui.ts
→ OU changer status.layoutType dans le DNA seed
→ LayoutResolver s'en charge automatiquement

Refonte complète d'une page (template) :
→ Créer src/verticals/<variant>/ui/pages/MaDashboardPage.tsx
→ L'enregistrer dans pageTemplates: { '/dashboard': MaDashboardPage }
→ (Phase future : VerticalUIProvider résout le template et l'injecte)
```

---

## Récapitulatif des fichiers

### Nouveaux fichiers
```
src/shared/plugins/IVerticalUIPlugin.ts              ← contrat IVerticalUIPlugin
src/shared/plugins/VerticalUIRegistry.ts             ← registre singleton
src/shared/providers/VerticalUIProvider.tsx          ← Provider + scoped tokens
src/shared/hooks/useVerticalComponent.ts             ← resolveComponent + withVerticalOverride

src/verticals/restaurant/ui.ts                       ← RestaurantUIPlugin (minimal)
src/verticals/hotel/ui.ts                            ← HotelUIPlugin
src/verticals/bakery/ui.ts                           ← BakeryUIPlugin
src/verticals/salon/ui.ts                            ← SalonUIPlugin
src/verticals/clinic/ui.ts                           ← ClinicUIPlugin
src/verticals/garage/ui.ts                           ← GarageUIPlugin
src/verticals/retail/ui.ts                           ← RetailUIPlugin
src/verticals/custom/ui.ts                           ← CustomUIPlugin
```

### Fichiers modifiés
```
src/shared/components/layout/NexusProviderStack.tsx  ← +VerticalUIProvider après AuthGate
src/shared/components/layout/LayoutResolver.tsx      ← +fallback preferredLayout
src/shared/components/ui/StatCard.tsx                ← +withVerticalOverride
src/shared/components/ui/PageHeader.tsx              ← +withVerticalOverride
src/shared/components/ui/EmptyState.tsx              ← +withVerticalOverride
src/app/globals.css                                  ← +[data-vertical] rules
```

---

## Phase H — Configurateur Tenant + Gating MCC (`mod_brand_plus`)

### Principe

Depuis le **MCC**, toi (super admin) tu décides si un client a accès au configurateur avancé.
Le client ne voit dans ses settings que ce que tu lui as autorisé.

```
Toi (MCC)
  → toggle "Brand Custom Plus" sur un tenant
  → capabilities['mod_brand_plus'] = true  (persisté Firestore)

Client (son panneau settings)
  → voit le configurateur avancé SI mod_brand_plus = true
  → voit seulement logo + couleur de base SI mod_brand_plus = false / absent
```

---

### H1 — Deux nouvelles capabilities

Ajoutées dans le DNA seed de chaque vertical (désactivées par défaut) et contrôlables depuis le MCC :

```ts
// Convention cohérente avec les autres mod_*
'mod_brand_basic': true,   // Logo, couleur primaire, favicon — activé par défaut pour tous
'mod_brand_plus':  false,  // Configurateur avancé — désactivé par défaut, activé par toi depuis MCC
```

**`mod_brand_basic`** → ce que le client peut faire dans `/settings → Identité` :
- Upload logo, favicon, bannière
- Couleur primaire (color picker)
- Mode light/dark
- Activation du splash screen

**`mod_brand_plus`** → ce que le client voit EN PLUS si tu l'actives :
- Choix du layout (sidebar / topbar) — si son vertical supporte plusieurs layouts
- Densité UI (compact / premium / spacieux)
- Presets de style (minimal, luxe, dynamique, artisan…) — palettes prédéfinies selon le vertical
- Épinglage de modules sur le dashboard (drag & drop)
- Import AI depuis URL (BrandingService extraction)
- Polices Google Fonts custom

---

### H2 — Gating dans le panneau settings client

```ts
// src/shared/hooks/useBrandCapabilities.ts — nouveau hook
import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';

export function useBrandCapabilities() {
  const config = useAtomValue(tenantConfigAtom);
  const caps   = config?.capabilities ?? {};
  return {
    hasBasic: caps['mod_brand_basic'] !== false,   // true par défaut
    hasPlus:  caps['mod_brand_plus']  === true,    // false par défaut
  };
}
```

```tsx
// src/shared/components/settings/panels/StyleTab.tsx — gating appliqué
export function StyleTab() {
  const { hasBasic, hasPlus } = useBrandCapabilities();

  return (
    <>
      {/* Toujours visible */}
      {hasBasic && <BasicBrandSection />}    {/* logo, couleur, favicon, mode */}

      {/* Visible seulement si mod_brand_plus activé par le MCC */}
      {hasPlus  && <PlusBrandSection />}     {/* layout, density, presets, AI import */}
    </>
  );
}
```

---

### H3 — Configurateur avancé (`PlusBrandSection`)

Composant `src/shared/components/settings/PlusBrandSection.tsx` :

```
┌─────────────────────────────────────────────────────────────────┐
│  ✦ CUSTOM PLUS                                                  │
│                                                                 │
│  IMPORT CHARTE                                                  │
│  [🌐 Depuis mon site web]   [✏️ Couleurs manuelles]            │
│                                                                 │
│  LAYOUT                                                         │
│  [Sidebar ✓]  [Topbar]                                          │
│  (options selon ce que le vertical supporte)                    │
│                                                                 │
│  DENSITÉ                                                        │
│  [Compact]  [Premium ✓]  [Spacieux]                            │
│                                                                 │
│  PRESET DE STYLE                                                │
│  [Minimal]  [Luxe]  [Dynamique]  [Artisan]  [Sur mesure ✓]    │
│  (presets filtrés selon le variant du tenant)                   │
│                                                                 │
│  MODULES ÉPINGLÉS SUR LE DASHBOARD                              │
│  [drag & drop des modules actifs]                               │
│                                                                 │
│  [Aperçu live]                    [Appliquer]                   │
└─────────────────────────────────────────────────────────────────┘
```

**Presets par vertical** — palettes prédéfinies cohérentes avec l'identité du vertical :

```ts
// src/shared/nexus/tokens/verticals/presets.ts
export const VERTICAL_STYLE_PRESETS: Record<PlatformVariant, StylePreset[]> = {
  restaurant: [
    { id: 'luxe',     label: 'Luxe',     primaryColor: '#C5A059', appearance: 'dark'  },
    { id: 'bistro',   label: 'Bistro',   primaryColor: '#8B4513', appearance: 'light' },
    { id: 'moderne',  label: 'Moderne',  primaryColor: '#1a1a2e', appearance: 'dark'  },
    { id: 'brasserie',label: 'Brasserie',primaryColor: '#B8860B', appearance: 'dark'  },
  ],
  salon: [
    { id: 'zen',      label: 'Zen',      primaryColor: '#D4A5C7', appearance: 'light' },
    { id: 'bold',     label: 'Bold',     primaryColor: '#9B59B6', appearance: 'dark'  },
    { id: 'pastel',   label: 'Pastel',   primaryColor: '#F8BBD0', appearance: 'light' },
    { id: 'noir',     label: 'Noir',     primaryColor: '#2C2C2C', appearance: 'dark'  },
  ],
  clinic: [
    { id: 'medical',  label: 'Médical',  primaryColor: '#3498DB', appearance: 'light' },
    { id: 'nature',   label: 'Nature',   primaryColor: '#27AE60', appearance: 'light' },
    { id: 'premium',  label: 'Premium',  primaryColor: '#1E3A5F', appearance: 'dark'  },
  ],
  garage: [
    { id: 'industrie',label: 'Industrie',primaryColor: '#2C3E50', appearance: 'dark'  },
    { id: 'racing',   label: 'Racing',   primaryColor: '#E74C3C', appearance: 'dark'  },
    { id: 'moderne',  label: 'Moderne',  primaryColor: '#34495E', appearance: 'dark'  },
  ],
  // … hotel, bakery, retail, custom
};
```

---

### H4 — Contrôle MCC : toggle `mod_brand_plus` par tenant

Intégrer dans le `TenantOverridePanel` existant (`src/app/(admin)/admin/mcc/components/TenantOverridePanel.tsx`) une nouvelle section **"Accès Branding"** :

```
┌─────────────────────────────────────────────────────────────┐
│  ACCÈS BRANDING                              [tenant sélectionné] │
│                                                             │
│  mod_brand_basic   Logo · couleurs · favicon · splash       │
│  ●──────────────────────────────────── ON                   │
│                                                             │
│  mod_brand_plus    Configurateur avancé · AI · presets      │
│  ○──────────────────────────────────── OFF                  │
│                                                             │
│  [Appliquer]                                                │
└─────────────────────────────────────────────────────────────┘
```

**Implémentation** : la section envoie un patch de `capabilities` via l'API existante `/api/admin/fleet/tenant-override` — aucun nouveau endpoint nécessaire.

```ts
// Dans TenantOverridePanel — ajout dans updateUI :
const updateBrandCap = (cap: 'mod_brand_basic' | 'mod_brand_plus', value: boolean) => {
  setForm(f => ({
    ...f,
    capabilities: { ...f.capabilities, [cap]: value }
  }));
};
```

---

### H5 — `BrandImportWizard` (gated derrière `mod_brand_plus`)

Composant déjà prévu en Phase 7 du `DESIGN_SYSTEM_PLAN.md` — visible uniquement si `hasPlus`.

```tsx
{hasPlus && <BrandImportWizard />}
```

---

### Récapitulatif Phase H — fichiers

```
src/shared/hooks/useBrandCapabilities.ts                  ← nouveau hook gating
src/shared/nexus/tokens/verticals/presets.ts              ← presets par vertical
src/shared/components/settings/PlusBrandSection.tsx       ← configurateur avancé
src/shared/components/settings/BrandImportWizard.tsx      ← import AI (mod_brand_plus)
src/app/(admin)/admin/mcc/components/TenantOverridePanel.tsx ← +section Accès Branding
src/shared/seeds/*.ts                                     ← +mod_brand_basic: true, mod_brand_plus: false
```

---

## Relation avec `DESIGN_SYSTEM_PLAN.md`

| DESIGN_SYSTEM_PLAN | Ce plan |
|--------------------|---------|
| **Theming** : couleurs, fonts, dark/light, tokens métier | **Structure** : layout, composants alternatifs, route scoping |
| Injecte sur `:root` (global) | Injecte sur `[data-vertical-scope]` wrapper (isolé) |
| `BrandingProvider` applique | `VerticalUIProvider` applique |
| `IVerticalPlugin.defaultTheme` | `IVerticalUIPlugin.components` |
| `VERTICAL_DEFAULT_TOKENS` | `VerticalUIRegistry` |
| Configurable par le tenant (Firestore) | Configurable par le développeur (code vertical) |
| `BrandImportWizard` — gated `mod_brand_plus` | `PlusBrandSection` — gated `mod_brand_plus` |

Les trois couches sont **complémentaires et indépendantes** — chacune peut être déployée sans l'autre.

---

## Ordre d'exécution recommandé

```
Phase A  — Contrats + VerticalUIRegistry
    ↓
Phase B  — ui.ts par vertical (×8, tous minimaux d'abord)
    ↓
Phase C  — VerticalUIProvider + scoped tokens
    ↓
Phase D  — withVerticalOverride + useVerticalComponent
    ↓
Phase E  — LayoutResolver fallback preferredLayout
    ↓
Phase F  — globals.css [data-vertical] rules
    ↓
Phase G  — composants spécifiques au fur et à mesure des refontes
           (GarageStatCard, SalonStatCard…)
    ↓
Phase H  — Configurateur Tenant + Gating MCC
  H1 → capabilities mod_brand_basic + mod_brand_plus dans DNA seeds
  H2 → useBrandCapabilities hook + gating StyleTab
  H3 → PlusBrandSection + presets par vertical
  H4 → TenantOverridePanel : section "Accès Branding" (toggle MCC)
  H5 → BrandImportWizard gated mod_brand_plus
```

**Ordre de priorité** :
- Phases A–F : infrastructure — zéro régression, transparent pour les clients
- Phase G : refontes visuelles, vertical par vertical, à la demande
- Phase H : fonctionnalités client custom + contrôle MCC — indépendant de A–G, peut démarrer en parallèle
