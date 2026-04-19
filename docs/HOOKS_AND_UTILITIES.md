# Restaurant OS - Hooks & Utilities

Guide complet des hooks personnalisés et utilitaires.

---

## 🪝 Hooks Personnalisés

### useAsync

Gestion des opérations asynchrones avec états.

```tsx
import { useAsync } from "@/hooks";

const { execute, data, isLoading, isError, error } = useAsync(
    async (id: string) => await fetchReservation(id),
    {
        onSuccess: (data) => toast.success('Chargé !'),
        onError: (error) => toast.error(error.message),
    }
);

// Utilisation
<Button onClick={() => execute('123')} disabled={isLoading}>
    {isLoading ? 'Chargement...' : 'Charger'}
</Button>
```

**Retour :**
- `execute(...args)` - Exécute la fonction async
- `data` - Données retournées
- `error` - Erreur si échec
- `status` - "idle" | "loading" | "success" | "error"
- `isLoading`, `isSuccess`, `isError` - Booleans
- `reset()` - Réinitialise l'état

---

### useDisclosure

Gestion de l'état ouvert/fermé de modals, drawers, etc.

```tsx
import { useDisclosure } from "@/hooks";

const { isOpen, onOpen, onClose, onToggle } = useDisclosure({
    defaultIsOpen: false,
    onOpen: () => console.log('Ouvert'),
    onClose: () => console.log('Fermé'),
});

<Button onClick={onOpen}>Ouvrir Modal</Button>
<Modal isOpen={isOpen} onClose={onClose}>
    Contenu
</Modal>
```

---

### useList

Hook combiné pour gérer une liste avec recherche, tri et pagination.

```tsx
import { useList } from "@/hooks";

const {
    items,          // Items paginés actuels
    totalItems,     // Total après filtrage
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Filters
    activeFilters,
    setFilter,
    clearAllFilters,
    hasActiveFilters,
    
    // Sorting
    sortBy,
    getSortIndicator,
    
    // Pagination
    page,
    totalPages,
    nextPage,
    prevPage,
} = useList(reservations, {
    searchKeys: ['name', 'email', 'phone'],
    initialSortKey: 'date',
    initialPageSize: 20,
});

// Barre de recherche
<SearchInput value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

// En-têtes de tableau triables
<th onClick={() => sortBy('date')}>
    Date {getSortIndicator('date') === 'asc' ? '↑' : '↓'}
</th>

// Pagination
<Button onClick={prevPage} disabled={page === 1}>Précédent</Button>
<span>Page {page} / {totalPages}</span>
<Button onClick={nextPage} disabled={page === totalPages}>Suivant</Button>
```

---

### usePagination

Gestion de la pagination.

```tsx
import { usePagination } from "@/hooks";

const {
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    paginateItems,
} = usePagination({
    totalItems: items.length,
    initialPageSize: 10,
});

const visibleItems = paginateItems(items);
```

---

### useSorting

Gestion du tri de listes.

```tsx
import { useSorting } from "@/hooks";

const { sortedItems, sortBy, sortDirection, getSortIndicator } = useSorting(items, {
    initialSortKey: 'date',
    initialDirection: 'desc',
});
```

---

### useFiltering

Recherche et filtrage avec debounce.

```tsx
import { useFiltering } from "@/hooks";

const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setFilter,
    clearAllFilters,
    filteredItems,
    hasActiveFilters,
} = useFiltering(items, {
    searchKeys: ['name', 'email'],
    debounceMs: 300,
});
```

---

### useDebounce / useDebouncedCallback

Debounce de valeurs et fonctions.

```tsx
import { useDebounce, useDebouncedCallback } from "@/hooks";

// Debounce une valeur
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
    fetchResults(debouncedSearch);
}, [debouncedSearch]);

// Debounce une fonction
const debouncedFetch = useDebouncedCallback(
    (query: string) => fetchAPI(query),
    300
);
```

---

### useClickOutside / useEscapeKey

Interactions UI communes.

```tsx
import { useClickOutside, useEscapeKey } from "@/hooks";

const dropdownRef = useRef<HTMLDivElement>(null);

useClickOutside(dropdownRef, () => setIsOpen(false));
useEscapeKey(() => setIsOpen(false));

<div ref={dropdownRef}>
    Dropdown content
</div>
```

---

### useLocalStorage / useSessionStorage

Persistance des données.

```tsx
import { useLocalStorage, useSessionStorage } from "@/hooks";

// LocalStorage (persiste après fermeture)
const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

// SessionStorage (persiste pendant la session)
const [cart, setCart] = useSessionStorage('cart', []);
```

---

## 🔧 Utilitaires de Formatage

### Formatters (`@/lib/formatters`)

```tsx
import { 
    formatSmartDate,
    formatRelativeTime,
    formatCurrency,
    formatNumber,
    formatPercent,
    formatPhone,
    truncate,
    capitalize,
    getInitials,
    formatDuration,
} from "@/lib/formatters";

// Dates
formatSmartDate(new Date())      // "Aujourd'hui, 14:30"
formatRelativeTime(date)         // "il y a 5 minutes"

// Monnaie
formatCurrency(1234.56)          // "1 234,56 €"
formatCurrency(1500000, { compact: true })  // "1,5M €"

// Nombres
formatNumber(1234567)            // "1 234 567"
formatPercent(0.1234)            // "12,34 %"

// Texte
formatPhone("0612345678")        // "06 12 34 56 78"
truncate("Lorem ipsum...", 20)   // "Lorem ipsum dolor..."
capitalize("hello")              // "Hello"
getInitials("Jean Dupont")       // "JD"

// Durée
formatDuration(125)              // "2h 05min"
```

---

## 🛠️ Utilitaires Généraux

### Helpers (`@/lib/helpers`)

```tsx
import {
    generateId,
    sleep,
    groupBy,
    unique,
    sortBy,
    deepClone,
    isEmpty,
    omit,
    pick,
    clamp,
    randomInt,
    randomElement,
    shuffle,
} from "@/lib/helpers";

// ID
generateId('res')                // "res_abc123xyz"

// Async
await sleep(1000);               // Attend 1 seconde

// Collections
groupBy(items, 'category');      // { food: [...], drinks: [...] }
unique(items, 'id');             // Items uniques par id
sortBy(items, [{ key: 'date', direction: 'desc' }]);

// Objets
deepClone(obj);
isEmpty({});                     // true
omit(obj, ['password']);         // Exclut 'password'
pick(obj, ['name', 'email']);    // Garde seulement ces clés

// Maths
clamp(150, 0, 100);              // 100
randomInt(1, 10);                // Entre 1 et 10

// Arrays
randomElement(items);            // Élément aléatoire
shuffle(items);                  // Mélange le tableau
```

---

## 📁 Structure des Fichiers

```
src/
├── hooks/
│   ├── useAsync.ts              # Opérations async
│   ├── useDisclosure.ts         # État ouvert/fermé
│   ├── usePagination.ts         # Pagination
│   ├── useSorting.ts            # Tri
│   ├── useFiltering.ts          # Recherche & filtres
│   ├── useDebounce.ts           # Debounce
│   ├── useInteractions.ts       # Click outside, escape key
│   ├── useStorage.ts            # LocalStorage, SessionStorage
│   ├── useList.ts               # Combo: filter + sort + pagination
│   ├── useMediaQuery.ts         # Responsive
│   ├── useIsMobile.ts           # Device detection
│   └── index.ts                 # Barrel export
│
└── lib/
    ├── formatters.ts            # Formatage (dates, monnaie, etc.)
    ├── helpers.ts               # Utilitaires généraux
    ├── utils.ts                 # cn() et autres
    └── motion.ts                # Variants Framer Motion
```

---

## 🎯 Exemple d'Usage Complet

```tsx
"use client";

import { useList, useDisclosure, useAsync } from "@/hooks";
import { formatCurrency, formatSmartDate } from "@/lib/formatters";
import { SearchInput, EmptyState, Skeleton } from "@/components/ui";

export function ReservationsPage() {
    const newModal = useDisclosure();
    
    const { execute: loadData, isLoading } = useAsync(
        async () => await fetchReservations()
    );
    
    const {
        items,
        searchQuery,
        setSearchQuery,
        sortBy,
        page,
        totalPages,
        nextPage,
        prevPage,
    } = useList(reservations, {
        searchKeys: ['name', 'email'],
        initialSortKey: 'date',
    });
    
    if (isLoading) return <Skeleton variant="list" />;
    
    return (
        <div>
            <SearchInput 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {items.length === 0 ? (
                <EmptyState title="Aucune réservation" />
            ) : (
                items.map(res => (
                    <div key={res.id}>
                        <span>{res.name}</span>
                        <span>{formatSmartDate(res.date)}</span>
                        <span>{formatCurrency(res.total)}</span>
                    </div>
                ))
            )}
            
            <div>
                <button onClick={prevPage}>Précédent</button>
                <span>{page} / {totalPages}</span>
                <button onClick={nextPage}>Suivant</button>
            </div>
        </div>
    );
}
```
