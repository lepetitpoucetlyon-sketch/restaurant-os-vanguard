# Documentation des Composants UI

## Core UI Components
Une bibliothèque de composants premium conçus pour "Restaurant OS".

### `Header.tsx`
Le composant de navigation principal.
- **Desktop**: Affiche le logo, la navigation principale, la barre de recherche et le "Status Hub".
- **Mobile**: Version simplifiée avec menu hamburger (masqué par défaut si non nécessaire) et intégration du `LaunchpadStatusHub`.
- **Props**: Aucune (utilise `context` pour l'état).

### `LaunchpadStatusHub.tsx`
Le centre de contrôle flottant pour les actions rapides.
- **Fonctionnalités**:
  - Sélecteur de langue (avec drapeaux)
  - Toggle Thème (Soleil/Lune avec animation)
  - Notifications (Cloche avec badge)
  - Palette de Commandes (IA/Sparkles)
  - Paramètres contextuels
- **Layouts**:
  - **Desktop**: Colonne verticale flottante ou ligne horizontale selon le scroll.
  - **Mobile**: "Pill" horizontal centré contenant les 5 icônes d'action.

### `CommandModal.tsx` (`Cmd+K`)
La palette de commande centrale ("Spotlight" pour le restaurant).
- **Catégories**:
  - **Création Rapide**: Commandes, Réservations, Clients (Prioritaire).
  - **Opérations**: Ouvrir/Fermer service, Inventaire.
  - **Finance**: Rapports, Analytics.
  - ~~Navigation~~: Masqué pour privilégier les actions directes.
- **Tech**: Utilise `framer-motion` pour les transitions d'entrée/sortie.

### `NotificationPanel.tsx`
Le centre de notifications latéral ("Off-canvas").
- **Design**: Style "Museum Archive" avec flou d'arrière-plan.
- **Fonctionnalités**:
  - Regroupement par module (Cuisine, Stock, Staff).
  - Actions rapides directement depuis la notification (ex: "Voir Stock").
  - Indicateurs visuels de sévérité (Rouge/Orange/Vert).
- **Responsive**: S'adapte aux écrans mobiles avec un padding optimisé et une typographie ajustée.

### `ContextualSettings.tsx`
Le moteur de configuration global.
- **Architecture**:
  - Fournit un contexte global `useContextualSettings`.
  - Gère les paramètres persistants par page (stockés en `localStorage`).
  - Vérifie les permissions utilisateur (RBAC) pour chaque réglage.
- **UI**: Panneau latéral avec onglets "Logique" (fonctionnel) et "Style" (visuel).

## Conventions de Design
- **Typographie**: `font-serif` pour les titres (élégance), `font-sans` pour les données (lisibilité), `font-mono` pour les chiffres techniques.
- **Couleurs**: Utilisation de `accent-gold` pour les éléments premium.
- **Animations**: `framer-motion` avec des courbes `ease-out` pour une sensation de fluidité "luxe".
