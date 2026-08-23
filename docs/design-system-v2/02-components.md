# 02 — Catalogue des Primitives UI (`src/shared/components/ui/`)

Guide d'utilisation, props et bonnes pratiques des composants du kit unifié.

## 1. `PageShell`
Conteneur de page standardisé avec en-tête unifié, fil d'Ariane, badges de statut, actions et onglets contextuels.

```tsx
import { PageShell } from "@/shared/components/ui";

<PageShell
  title="Point de Vente"
  subtitle="Service du soir • 18 tables occupées"
  icon={ShoppingBag}
  breadcrumbs={[{ label: "Opérations", href: "/operations" }, { label: "Caisse" }]}
  actions={<Button variant="default">Nouveau Ticket</Button>}
  tabs={<ToolbarTabs tabs={tabs} activeTab={tab} onTabChange={setTab} />}
>
  {/* Contenu principal */}
</PageShell>
```

## 2. `SectionCard`
Conteneur modulaire pour organiser les blocs de données et formulaires.

- **Variantes** : `default` (standard), `glass` (surface translucide), `premium` (lueur dorée), `ghost` (sans bordure).
- **Slots** : `title`, `subtitle`, `icon`, `emoji`, `badge`, `headerActions`, `footer`.

## 3. `StatGrid` & `StatCard`
Disposition des indicateurs clés de performance avec responsive automatique (2 cols mobile, 3 cols tablet, 4 cols desktop).

```tsx
<StatGrid columns={4}>
  <StatCard label="Chiffre d'Affaires" value="2 450 €" intent="brand" trend={{ value: 14, direction: "up" }} />
  <StatCard label="Commandes" value="48" intent="success" />
  <StatCard label="En Attente" value="3" intent="warning" />
  <StatCard label="Rejets" value="0" intent="neutral" />
</StatGrid>
```

## 4. `ActionBar`
Barre d'actions contextuelle avec support des positions `default`, `floating`, `sticky-bottom` et `inline`.

## 5. `EmptyState` v2
État vide standardisé avec icône Lucide, titre en typographie de marque, description explicative et bouton d'action (CTA).

## 6. `SkeletonList`
Squelettes de chargement fluides pour listes, cartes, tableaux et cartes statistiques (`variant="list" | "card" | "table" | "stat"`).

## 7. `ResponsiveShell`
Enveloppe commutant automatiquement entre `MobileView`, `TabletView`, `DesktopView` et `KioskView`.

## 8. `RoleAwareView`
Composant de rendu conditionnel basé sur la matrice RBAC (`allowedRoles` et `minLevel`).
