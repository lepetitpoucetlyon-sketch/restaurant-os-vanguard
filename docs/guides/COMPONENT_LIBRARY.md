# Restaurant OS - Component Library

Guide complet des composants UI réutilisables.

## 📦 Installation

```tsx
// Import depuis @/components/ui
import { 
  PremiumCard, 
  SearchInput, 
  StatCard,
  EmptyState,
  Skeleton 
} from "@/components/ui";

// Import depuis @/components/layout
import { 
  PageLayout, 
  DashboardLayout, 
  SplitLayout,
  GridLayout 
} from "@/components/layout";
```

---

## 🎨 Composants UI

### PremiumCard

Carte premium avec effets de survol et variants multiples.

```tsx
<PremiumCard 
  variant="elevated"        // "default" | "glass" | "elevated" | "minimal"
  glowColor="accent"        // "accent" | "success" | "warning" | "error" | "none"
  hoverEffect={true}        // Animation au survol
  padding="lg"              // "none" | "sm" | "md" | "lg" | "xl"
  rounded="2xl"             // "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
>
  <h3>Contenu de la carte</h3>
</PremiumCard>
```

---

### SearchInput

Input de recherche avec icône intégrée.

```tsx
<SearchInput 
  variant="pill"            // "default" | "minimal" | "pill"
  iconPosition="left"       // "left" | "right"
  placeholder="Rechercher..."
  onChange={(e) => setQuery(e.target.value)}
/>
```

---

### DateNavigator

Navigation entre dates avec flèches.

```tsx
<DateNavigator 
  displayDate="Jeudi 16 Janvier"
  onPrev={() => setDate(prev => subDays(prev, 1))}
  onNext={() => setDate(prev => addDays(prev, 1))}
  onToday={() => setDate(new Date())}
  showTodayButton={true}
  variant="pill"            // "default" | "minimal" | "pill"
/>
```

---

### ToolbarTabs

Système de tabs avec variants.

```tsx
const tabs = [
  { id: 'all', label: 'Tous', badge: 24 },
  { id: 'pending', label: 'En attente', icon: <Clock /> },
  { id: 'done', label: 'Terminé' }
];

<ToolbarTabs 
  tabs={tabs}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="pill"            // "pill" | "underline" | "boxed"
  size="md"                 // "sm" | "md" | "lg"
/>
```

---

### StatCard & StatsGrid

Cartes de statistiques avec tendances.

```tsx
<StatsGrid columns={4} gap="md">
  <StatCard 
    label="Réservations"
    value="142"
    icon={Calendar}
    accentColor="accent"    // "accent" | "success" | "warning" | "error" | "info"
    trend={{ value: 12, direction: "up" }}
    variant="default"       // "default" | "compact" | "large" | "minimal"
  />
  <StatCard 
    label="Revenus"
    value="€12,450"
    emoji="💰"
    accentColor="success"
  />
</StatsGrid>
```

---

### EmptyState

État vide avec personnalisation.

```tsx
<EmptyState 
  icon={Calendar}           // ou emoji="📅"
  title="Aucune réservation"
  description="Il n'y a pas de réservations pour cette date."
  variant="default"         // "compact" | "default" | "large"
  action={
    <Button>Créer une réservation</Button>
  }
/>
```

---

### StatusBadge

Badge de statut avec animations.

```tsx
<StatusBadge 
  status="success"          // "success" | "warning" | "error" | "info" | "neutral" | "accent"
  label="Confirmé"
  size="md"                 // "sm" | "md" | "lg"
  variant="soft"            // "solid" | "outline" | "soft"
  pulse={true}              // Animation pulsante
/>
```

---

### PageHeader

En-tête de page complet.

```tsx
<PageHeader 
  title="Reservations"
  subtitle="Gestion des tables"
  icon={Calendar}
  variant="default"         // "minimal" | "default" | "hero"
  breadcrumb={[
    { label: 'Dashboard', href: '/' },
    { label: 'Reservations' }
  ]}
  actions={
    <Button>Nouvelle réservation</Button>
  }
  tabs={<ToolbarTabs tabs={tabs} ... />}
/>
```

---

### FilterBar

Barre de filtres avec dropdowns.

```tsx
<FilterBar 
  filters={[
    {
      id: 'status',
      label: 'Statut',
      options: [
        { id: 'pending', label: 'En attente' },
        { id: 'confirmed', label: 'Confirmé' }
      ]
    }
  ]}
  activeFilters={activeFilters}
  onChange={(filterId, value) => ...}
  onClear={() => setActiveFilters({})}
  onSearch={(query) => setSearchQuery(query)}
  variant="default"         // "default" | "compact" | "pill"
/>
```

---

## 📐 Composants Layout

### DashboardLayout

Layout optimisé pour les dashboards.

```tsx
<DashboardLayout 
  sidebar={<MySidebar />}
  toolbar={<MyToolbar />}
  sidebarPosition="left"    // "left" | "right"
  sidebarWidth="md"         // "sm" | "md" | "lg"
  scrollable={true}
  padding="md"              // "none" | "sm" | "md" | "lg"
>
  {/* Contenu principal */}
</DashboardLayout>
```

---

### SplitLayout

Layout avec panneaux ajustables.

```tsx
<SplitLayout 
  left={<LeftPanel />}
  right={<RightPanel />}
  leftWidth="1/3"           // "1/4" | "1/3" | "2/5" | "1/2" | "3/5" | "2/3" | "3/4"
  gap="md"                  // "none" | "sm" | "md" | "lg"
  collapsible="left"        // "left" | "right" | "none"
  divider={true}
/>
```

---

### GridLayout & GridItem

Grille responsive flexible.

```tsx
<GridLayout 
  columns={{ default: 1, md: 2, lg: 3, xl: 4 }}
  gap="md"                  // "none" | "xs" | "sm" | "md" | "lg" | "xl"
>
  <GridItem colSpan={2}>
    <PremiumCard>Large card</PremiumCard>
  </GridItem>
  <GridItem>
    <PremiumCard>Small card</PremiumCard>
  </GridItem>
</GridLayout>
```

---

## ⏳ Composants Loading

### Skeleton

Squelettes de chargement.

```tsx
// Basique
<Skeleton variant="text" width="200px" />
<Skeleton variant="circular" width={48} height={48} />
<Skeleton variant="rounded" height={120} />

// Présets
<CardSkeleton variant="stat" />
<CardSkeleton variant="list-item" />
<TableSkeleton rows={5} columns={4} />
<PageSkeleton variant="dashboard" />
```

---

### LoadingState

Wrapper avec états loading/success/error.

```tsx
<LoadingState 
  status={status}           // "idle" | "loading" | "success" | "error"
  loadingText="Chargement..."
  successText="Terminé !"
  errorText="Une erreur est survenue"
  onRetry={() => refetch()}
  overlay={true}
  blur={true}
>
  {/* Contenu */}
</LoadingState>
```

---

### LoadingOverlay

Overlay de chargement.

```tsx
<LoadingOverlay 
  isVisible={isLoading}
  text="Traitement en cours..."
  fullScreen={false}
/>
```

---

## 💬 Composants Feedback

### FeedbackBanner

Bannière de notification.

```tsx
<FeedbackBanner 
  type="success"            // "success" | "error" | "warning" | "info"
  title="Réservation confirmée"
  message="La réservation a été enregistrée avec succès."
  dismissible={true}
  onDismiss={() => setBannerVisible(false)}
  action={<Button size="sm">Voir</Button>}
/>
```

---

### ConfirmationDialog

Dialogue de confirmation.

```tsx
<ConfirmationDialog 
  isOpen={showDialog}
  title="Supprimer la réservation ?"
  message="Cette action est irréversible."
  confirmText="Supprimer"
  cancelText="Annuler"
  variant="danger"          // "danger" | "warning" | "default"
  loading={isDeleting}
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>
```

---

## 🎨 Tokens de Design

### Couleurs Sémantiques

```css
/* Backgrounds */
bg-bg-primary        /* Fond principal */
bg-bg-secondary      /* Fond secondaire */
bg-bg-tertiary       /* Fond tertiaire */

/* Text */
text-text-primary    /* Texte principal */
text-text-secondary  /* Texte secondaire */
text-text-muted      /* Texte atténué */

/* Accent */
text-accent          /* Couleur d'accent (Or) */
bg-accent            /* Fond accent */
border-accent        /* Bordure accent */

/* Borders */
border-border        /* Bordure par défaut */
```

### Espacements

```css
/* Padding */
p-4   /* 1rem - Compact */
p-6   /* 1.5rem - Standard */
p-8   /* 2rem - Spacieux */
p-10  /* 2.5rem - Large */

/* Rounded */
rounded-xl      /* 0.75rem */
rounded-2xl     /* 1rem */
rounded-[2rem]  /* 2rem - Premium */
rounded-[2.5rem]/* 2.5rem - Extra Premium */
rounded-full    /* Pill */
```

---

## 📁 Structure des Fichiers

```
src/components/
├── ui/                     # Composants UI atomiques
│   ├── PremiumCard.tsx
│   ├── SearchInput.tsx
│   ├── StatCard.tsx
│   ├── Skeleton.tsx
│   ├── Feedback.tsx
│   └── index.ts            # Barrel export
├── layout/                 # Composants de layout
│   ├── PageLayout.tsx
│   ├── DashboardLayout.tsx
│   ├── SplitLayout.tsx
│   └── index.ts
├── reservations/           # Composants domaine
├── leaves/
├── planning/
└── ...
```
