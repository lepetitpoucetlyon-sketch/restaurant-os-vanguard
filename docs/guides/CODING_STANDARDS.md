# Restaurant OS - Coding Standards

Standards et conventions de code pour le projet Restaurant OS.

---

## 📁 Organisation des Fichiers

### Structure des Dossiers

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx            # Page d'accueil
│   ├── reservations/
│   │   └── page.tsx
│   └── ...
├── components/
│   ├── ui/                 # Composants UI réutilisables
│   ├── layout/             # Composants de layout
│   ├── [domain]/           # Composants par domaine
│   │   ├── ComponentName.tsx
│   │   └── index.ts        # Barrel export
│   └── ...
├── context/                # React Contexts
├── hooks/                  # Custom hooks
├── lib/                    # Utilitaires
├── types/                  # Types TypeScript
│   ├── auth.types.ts
│   ├── orders.types.ts
│   └── index.ts            # Barrel export
└── styles/                 # Styles globaux (si nécessaire)
```

---

## 🏷️ Conventions de Nommage

### Fichiers

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `PremiumCard.tsx` |
| Pages | kebab-case | `floor-plan/page.tsx` |
| Hooks | camelCase + use | `useReservations.ts` |
| Types | PascalCase + .types | `orders.types.ts` |
| Utils | camelCase | `formatDate.ts` |

### Composants

```tsx
// ✅ Bon
export function ReservationCard({ reservation }: ReservationCardProps) { ... }

// ❌ Éviter
export const reservationCard = ({ reservation }) => { ... }
```

### Types & Interfaces

```tsx
// Props de composant
interface ReservationCardProps {
    reservation: Reservation;
    onSelect?: (id: string) => void;
}

// Types d'état
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

// Types d'entité
interface Reservation {
    id: string;
    date: string;
    // ...
}
```

---

## 🎨 Standards CSS / Tailwind

### Ordre des Classes

1. **Layout** : `flex`, `grid`, `block`
2. **Position** : `relative`, `absolute`, `fixed`
3. **Dimension** : `w-`, `h-`, `p-`, `m-`
4. **Typographie** : `text-`, `font-`
5. **Couleurs** : `bg-`, `text-`, `border-`
6. **Effets** : `shadow-`, `opacity-`
7. **Transitions** : `transition-`, `duration-`

```tsx
// ✅ Bon
<div className="flex items-center gap-4 p-6 bg-bg-secondary border border-border rounded-2xl shadow-lg transition-all hover:shadow-xl">

// ❌ Éviter (désorganisé)
<div className="shadow-lg p-6 flex hover:shadow-xl border transition-all items-center bg-bg-secondary rounded-2xl border-border gap-4">
```

### Tokens Sémantiques

```tsx
// ✅ Utiliser les tokens sémantiques
<div className="bg-bg-secondary text-text-primary border-border" />

// ❌ Éviter les couleurs hardcodées
<div className="bg-[#1A1A1A] text-white border-[#333]" />
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* ... */}
  </div>
</div>
```

---

## ⚛️ Standards React

### Structure des Composants

```tsx
"use client";  // Si nécessaire

// 1. Imports
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

// 2. Types/Interfaces
interface MyComponentProps {
    title: string;
    onAction?: () => void;
}

// 3. Composant
export function MyComponent({ title, onAction }: MyComponentProps) {
    // a. Hooks
    const [state, setState] = useState(false);
    
    // b. Effets
    useEffect(() => {
        // ...
    }, []);
    
    // c. Handlers
    const handleClick = () => {
        onAction?.();
    };
    
    // d. Render
    return (
        <div>
            <h2>{title}</h2>
            <Button onClick={handleClick}>Action</Button>
        </div>
    );
}
```

### Props Destructuring

```tsx
// ✅ Bon - Destructuring avec defaults
function Card({ 
    title, 
    variant = "default",
    className,
    ...props 
}: CardProps) {
    // ...
}

// ❌ Éviter
function Card(props) {
    const title = props.title;
    // ...
}
```

### Conditional Rendering

```tsx
// ✅ Bon
{isVisible && <Component />}
{items.length > 0 ? <List items={items} /> : <EmptyState />}

// ❌ Éviter
{isVisible ? <Component /> : null}
{items.length > 0 && items.length !== 0 && <List />}
```

---

## 🔧 TypeScript

### Types Stricts

```tsx
// ✅ Types explicites
const items: Reservation[] = [];
const handleSelect = (id: string): void => { ... };

// ❌ Éviter any
const items: any[] = [];
const handleSelect = (id: any) => { ... };
```

### Union Types pour les Variants

```tsx
// ✅ Union types
type Variant = 'default' | 'compact' | 'large';
type Status = 'idle' | 'loading' | 'success' | 'error';

interface Props {
    variant?: Variant;
    status: Status;
}
```

### Generic Components

```tsx
// Composant générique
interface ListProps<T> {
    items: T[];
    renderItem: (item: T) => ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
    return <>{items.map(renderItem)}</>;
}
```

---

## 🎭 Animations (Framer Motion)

### Variants Réutilisables

```tsx
// lib/motion.ts
export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};
```

### Usage

```tsx
import { fadeInUp, staggerContainer } from "@/lib/motion";

<motion.div variants={staggerContainer} initial="hidden" animate="visible">
    {items.map(item => (
        <motion.div key={item.id} variants={fadeInUp}>
            {/* ... */}
        </motion.div>
    ))}
</motion.div>
```

---

## 📝 Commentaires

### Quand Commenter

```tsx
// ✅ Expliquer le "pourquoi", pas le "quoi"
// Timeout nécessaire pour attendre la fin de l'animation du drawer
setTimeout(closeDrawer, 300);

// ❌ Éviter les commentaires évidents
// Incrémente le compteur
count++;
```

### Documentation de Composants

```tsx
/**
 * Carte premium avec effets de survol et glow.
 * 
 * @example
 * <PremiumCard variant="elevated" glowColor="accent">
 *   <p>Contenu</p>
 * </PremiumCard>
 */
export function PremiumCard({ ... }: PremiumCardProps) { ... }
```

---

## ✅ Checklist PR

Avant de soumettre une PR, vérifier :

- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] Pas de `console.log` en production
- [ ] Pas de couleurs hardcodées (utiliser tokens)
- [ ] Composants exportés dans le barrel export
- [ ] Types explicites (pas de `any`)
- [ ] Responsive testé (mobile, tablet, desktop)
- [ ] Dark mode vérifié
- [ ] Accessibilité (labels, aria-*)
