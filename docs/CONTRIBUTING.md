# 🤝 Restaurant OS - Guide de Contribution

> Guide pour les développeurs contribuant au projet Restaurant OS

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Git

### Setup

```bash
# Cloner le repo
git clone <repo-url>
cd restaurant-os-app

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

---

## 📋 Workflow Git

### Branches

| Branche | Usage |
|---------|-------|
| `main` | Production stable |
| `develop` | Intégration des features |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections de bugs |
| `refactor/*` | Refactorisation |

### Convention de Commits

Utiliser le format [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[body optionnel]
```

**Types:**
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `refactor` - Refactorisation sans changement fonctionnel
- `style` - Changements CSS/UI
- `docs` - Documentation
- `chore` - Maintenance (deps, config)
- `perf` - Optimisation performance

**Exemples:**
```bash
feat(pos): ajouter le paiement par QR code
fix(kds): corriger le tri des tickets urgents
refactor(inventory): extraire les types dans un fichier séparé
style(dashboard): améliorer les cartes statistiques
docs: mettre à jour le README
```

---

## 📁 Structure des Fichiers

### Créer une nouvelle page

1. Créer le dossier dans `src/app/<nom-page>/`
2. Ajouter `page.tsx` (composant principal)
3. Ajouter `loading.tsx` (skeleton loader)
4. Mettre à jour la navigation dans `src/config/navigation.ts`

### Créer un nouveau composant

```tsx
// src/components/<domain>/<NomComposant>.tsx

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NomComposantProps {
    // Props typées
}

export function NomComposant({ ...props }: NomComposantProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("base-classes")}
        >
            {/* Contenu */}
        </motion.div>
    );
}
```

### Créer un nouveau Context

Voir `src/context/OrdersContext.tsx` comme exemple. Points clés:
1. Définir l'interface du state
2. Utiliser `useMemo` pour le value du Provider
3. Exporter un hook `useNomContext()`
4. Ajouter le Provider dans `src/app/layout.tsx`

---

## 🎨 Standards de Code

### TypeScript

```tsx
// ✅ Bon - Types explicites
interface UserProps {
    name: string;
    role: 'patron' | 'manager' | 'chef' | 'server';
}

// ❌ Mauvais - any
function handleData(data: any) { ... }

// ✅ Bon - Union type
function handleData(data: Order | Reservation) { ... }
```

### CSS / Tailwind

```tsx
// ✅ Utiliser les tokens sémantiques
<div className="bg-bg-primary text-text-primary border-border">

// ❌ Éviter les valeurs hardcodées en light/dark
<div className="bg-white dark:bg-black">

// ✅ Utiliser cn() pour les classes conditionnelles
import { cn } from "@/lib/utils";
<button className={cn(
    "base-classes",
    isActive && "active-classes"
)}>
```

### Composants

```tsx
// ✅ Composants fonctionnels avec hooks
export function MyComponent({ prop }: Props) {
    const [state, setState] = useState();
    return <div />;
}

// ❌ Pas de class components
class MyComponent extends Component { }

// ✅ Utiliser Framer Motion pour les animations
<motion.div animate={{ opacity: 1 }}>

// ❌ Pas de CSS animations inline
<div style={{ animation: '...' }}>
```

---

## 🧪 Tests (À implémenter)

### Structure recommandée

```
src/
├── components/
│   └── pos/
│       ├── Cart.tsx
│       └── Cart.test.tsx    # Test unitaire
├── context/
│   └── OrdersContext.test.tsx
└── e2e/
    └── pos-flow.spec.ts     # Tests E2E
```

### Exécution

```bash
npm run test          # Tests unitaires
npm run test:e2e      # Tests end-to-end
npm run test:coverage # Couverture
```

---

## 🔍 Vérifications avant PR

### Checklist

- [ ] Code TypeScript sans erreurs (`npm run typecheck`)
- [ ] Pas de warnings ESLint (`npm run lint`)
- [ ] L'app compile (`npm run build`)
- [ ] Tests passent (si disponibles)
- [ ] Documentation mise à jour si nécessaire
- [ ] Responsive testé (mobile, tablet, desktop)
- [ ] Dark mode vérifié

### Commandes

```bash
# Vérification complète
npm run lint
npm run typecheck
npm run build

# Format du code
npm run format
```

---

## 📖 Documentation Existante

| Fichier | Contenu |
|---------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Structure technique |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Standards de code |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Composants UI |
| [HOOKS_AND_UTILITIES.md](./HOOKS_AND_UTILITIES.md) | Hooks et utilitaires |
| [CHANGELOG.md](./CHANGELOG.md) | Historique des versions |

---

## 🆘 Besoin d'aide ?

1. Consulter la documentation dans `/docs`
2. Rechercher dans le code existant des patterns similaires
3. Ouvrir une issue pour discussion

---

## 📝 License

Propriétaire - Tous droits réservés
