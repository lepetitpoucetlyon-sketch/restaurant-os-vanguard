# 🏗️ Restaurant OS - Architecture & Feature Registry

> Guide de développement pour implémenter de nouvelles features de manière cohérente.

---

## 📐 Patterns Établis

### 1. Permissions Granulaires
**Fichier**: `src/types/permissions.types.ts`

```typescript
// Pour ajouter une nouvelle action sur une page existante:
export type NewPageAction = 
    | 'view' | 'create' | 'edit' | 'delete' | 'export';
```

### 2. Paramètres Contextuels (⚙️)
**Fichier**: `src/components/settings/ContextualSettings.tsx`

```typescript
// Pour ajouter des paramètres à une nouvelle page:
new_page: {
    title: "Paramètres de Ma Page",
    settings: [
        { key: "option_key", label: "Mon Option", type: "toggle", roles: ["super_admin", "directeur"] },
    ],
},
```

### 3. Bouton Engrenage
```tsx
import { SettingsGearButton } from "@/components/settings/ContextualSettings";

// Dans le header de la page:
<SettingsGearButton pageKey="new_page" />
```

---

## 📋 Template: Ajouter une Nouvelle Page

### Étape 1: Définir les Permissions
Dans `src/types/permissions.types.ts`:
```typescript
// 1. Ajouter le PageKey
export type PageKey = 
    | 'dashboard' | ... | 'new_page';

// 2. Définir les actions possibles
export type NewPageAction = 
    | 'view' | 'create' | 'edit' | 'delete';
```

### Étape 2: Ajouter les Paramètres Contextuels
Dans `src/components/settings/ContextualSettings.tsx`:
```typescript
new_page: {
    title: "Paramètres de Ma Nouvelle Page",
    settings: [
        { 
            key: "setting_key", 
            label: "Nom du Paramètre", 
            type: "toggle" | "select" | "number" | "text",
            roles: ["super_admin", "directeur", "manager"],
            options: [...], // si type="select"
            min: 0, max: 100, // si type="number"
        },
    ],
},
```

### Étape 3: Créer la Page
Dans `src/app/new-page/page.tsx`:
```tsx
"use client";
import { SettingsGearButton } from "@/components/settings/ContextualSettings";

export default function NewPage() {
    return (
        <div>
            <header className="flex justify-between items-center">
                <h1>Ma Nouvelle Page</h1>
                <SettingsGearButton pageKey="new_page" />
            </header>
            {/* Contenu */}
        </div>
    );
}
```

---

## 🔮 Features à Implémenter (Roadmap)

### Phase 1: Fondations ✅
- [x] Système de permissions (types)
- [x] Composant ContextualSettings
- [x] Bouton engrenage + panneau slide-in
- [x] Intégration Dashboard

### Phase 2: Déploiement UI
- [ ] Ajouter ⚙️ sur Floor Plan
- [ ] Ajouter ⚙️ sur Reservations
- [ ] Ajouter ⚙️ sur POS
- [ ] Ajouter ⚙️ sur Kitchen
- [ ] Ajouter ⚙️ sur KDS
- [ ] Ajouter ⚙️ sur Inventory
- [ ] Ajouter ⚙️ sur CRM
- [ ] Ajouter ⚙️ sur Staff
- [ ] Ajouter ⚙️ sur Planning
- [ ] Ajouter ⚙️ sur Finance
- [ ] Ajouter ⚙️ sur Analytics
- [ ] Ajouter ⚙️ sur HACCP

### Phase 3: Gestion des Rôles
- [ ] Interface `/settings/roles` pour créer des rôles custom
- [ ] Drag & drop pour assigner permissions
- [ ] Export/Import config rôles

### Phase 4: Système de PIN
- [ ] Modal PIN pour actions sensibles
- [ ] Validation manager pour actions > limites
- [ ] Logs d'audit pour actions PIN

### Phase 5: Multi-établissements
- [ ] Sélecteur d'établissement global
- [ ] Droits par établissement
- [ ] Paramètres globaux vs locaux

---

## 🧩 Composants Réutilisables

| Composant | Import | Usage |
|-----------|--------|-------|
| `SettingsGearButton` | `@/components/settings/ContextualSettings` | Bouton ⚙️ pour ouvrir paramètres |
| `ContextualSettingsProvider` | `@/components/settings/ContextualSettings` | Wrapper dans layout (déjà intégré) |
| `useContextualSettings` | `@/components/settings/ContextualSettings` | Hook pour accès programmatique |

---

## 📝 Convention de Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| PageKey | snake_case | `floor_plan`, `storage_map` |
| Action | snake_case | `view`, `create_order`, `cancel_reservation` |
| Setting key | snake_case | `default_view`, `max_discount_percent` |
| Role | snake_case | `super_admin`, `chef_cuisinier` |

---

## 🔒 Rôles Hiérarchie

```
super_admin (100)
    └── directeur (90)
            └── manager (70)
                    ├── comptable (60)
                    ├── chef_rang (50)
                    ├── chef_cuisinier (45)
                    ├── serveur (40)
                    ├── cuisinier (35)
                    ├── barman (35)
                    ├── hotesse (30)
                    └── plongeur (10)
```

Les rôles avec niveau supérieur héritent automatiquement des permissions des niveaux inférieurs.
