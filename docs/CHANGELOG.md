# Restaurant OS - Changelog

Journal des modifications du projet.

---

## [2026-01-16] - Refactoring Phase 1-4

### Phase 1.1 - Modularisation des Types

#### Ajouté
- `src/types/auth.types.ts` - Types d'authentification
- `src/types/tables.types.ts` - Types tables et zones
- `src/types/orders.types.ts` - Types commandes
- `src/types/reservations.types.ts` - Types réservations
- `src/types/inventory.types.ts` - Types inventaire
- `src/types/accounting.types.ts` - Types comptabilité
- `src/types/staff.types.ts` - Types RH et congés
- `src/types/haccp.types.ts` - Types qualité
- `src/types/common.types.ts` - Types communs
- `src/types/quotes.types.ts` - Types devis
- `src/types/groups.types.ts` - Types événements
- `src/types/seo.types.ts` - Types SEO

#### Modifié
- `src/types/index.ts` - Restructuré en barrel export

---

### Phase 1.2 - Composants UI Réutilisables

#### Ajouté
- `PremiumCard` - Carte premium avec variants
- `SearchInput` - Input de recherche avec icône
- `DateNavigator` - Navigation entre dates
- `ToolbarTabs` - Système de tabs
- `StatCard` / `StatsGrid` - Cartes statistiques
- `EmptyState` - État vide
- `SectionHeader` - En-tête de section
- `StatusBadge` - Badge de statut

---

### Phase 1.3 - Migration des Couleurs

#### Modifié
- Migration de `#C5A059` vers `text-accent`, `bg-accent`, `border-accent`
- Migration de `#0A0A0A` vers `bg-bg-primary`, `text-bg-primary`
- ~100+ occurrences migrées vers tokens sémantiques

---

### Phase 2.1 - Composants Page

#### Ajouté
- `PageHeader` - En-tête de page avec breadcrumb
- `ActionToolbar` - Barre d'actions
- `FilterBar` - Barre de filtres avec dropdowns
- `ContentSection` / `ContentGrid` - Sections de contenu

---

### Phase 2.2 - Composants Layout

#### Ajouté
- `PageLayout` - Layout de page complet
- `SplitLayout` - Layout split avec panels collapsibles
- `GridLayout` / `GridItem` - Grille responsive
- `DashboardLayout` - Layout optimisé dashboards

---

### Phase 3 - Loading & Feedback

#### Ajouté
- `Skeleton` - Squelettes de chargement
- `CardSkeleton` - Présets pour cartes
- `TableSkeleton` - Présets pour tables
- `PageSkeleton` - Présets pour pages
- `LoadingState` - Wrapper avec états
- `Spinner` - Indicateur simple
- `LoadingOverlay` - Overlay plein écran
- `FeedbackBanner` - Bannières de notification
- `InlineMessage` - Messages inline
- `ConfirmationDialog` - Dialogue de confirmation

---

### Phase 4 - Documentation

#### Ajouté
- `docs/COMPONENT_LIBRARY.md` - Documentation des composants
- `docs/CODING_STANDARDS.md` - Standards de code
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/CHANGELOG.md` - Ce fichier

---

### Phase 5 - Hooks & Utilitaires

#### Ajouté - Hooks
- `useAsync` - Gestion opérations asynchrones
- `useDisclosure` - État ouvert/fermé
- `usePagination` - Pagination
- `useSorting` - Tri de listes
- `useFiltering` - Recherche et filtres
- `useDebounce` / `useDebouncedCallback` - Debounce
- `useClickOutside` / `useEscapeKey` - Interactions UI
- `useLocalStorage` / `useSessionStorage` - Persistance
- `useList` - Combo filtrage+tri+pagination

#### Ajouté - Utilitaires
- `lib/formatters.ts` - formatSmartDate, formatCurrency, formatPhone, etc.
- `lib/helpers.ts` - groupBy, unique, sortBy, omit, pick, etc.

---

### Phase 6 - Accessibilité & Performance

#### Ajouté - Composants A11y
- `FormField` / `AccessibleInput` - Formulaires accessibles
- `VisuallyHidden` - Contenu caché visuellement
- `SkipLink` - Navigation au clavier
- `LiveRegion` - Annonces lecteurs d'écran
- `AccessibleButton` / `IconButton` - Boutons ARIA
- `AccessibleTable` / `SortableHeader` - Tables accessibles
- `AccessibleList` / `DescriptionList` - Listes accessibles

#### Ajouté - Hooks Performance
- `useIntersectionObserver` - Détection viewport
- `useLazyImage` - Chargement différé images
- `useEventCallback` - Callbacks stables
- `useDeepMemo` - Mémorisation profonde
- `useVirtualizedList` - Listes virtualisées
- `useInfiniteScroll` - Scroll infini

---

## Statistiques Finales

| Catégorie | Avant | Après |
|-----------|-------|-------|
| Fichiers types | 1 (1900 lignes) | 14 fichiers modulaires |
| Composants UI | ~15 | 29 composants |
| Composants Layout | ~4 | 11 composants |
| Composants A11y | 0 | 12 composants |
| Hooks personnalisés | 2 | 15 hooks |
| Utilitaires | ~3 | 22+ fonctions |
| Couleurs hardcodées | ~150 | ~50 (intentionnelles) |
| Documentation | 0 | 5 fichiers |

---

## Migration Guide

### Imports de Types

```tsx
// Avant
import { Reservation, Customer, Order } from "@/types";

// Après (toujours compatible)
import { Reservation, Customer, Order } from "@/types";

// Nouveau (import direct)
import { Reservation } from "@/types/reservations.types";
import { Order } from "@/types/orders.types";
```

### Imports de Composants UI

```tsx
// Nouveau
import { 
  PremiumCard, 
  SearchInput, 
  StatCard,
  Skeleton,
  FeedbackBanner 
} from "@/components/ui";
```

### Imports de Layout

```tsx
// Nouveau
import { 
  PageLayout, 
  DashboardLayout, 
  SplitLayout 
} from "@/components/layout";
```
