# 06 — Architecture PWA & Stratégie Offline-First

Restaurant OS fonctionne en mode déconnecté (Offline Outbox) avec un moteur de service worker piloté par Workbox (`@ducanh2912/next-pwa`).

## 1. Stratégies de Cache Nommées

| Ressource / Route | Stratégie Workbox | Durée / TTL | Objectif |
|---|---|---|---|
| App Shell (`/`, `/pos`, `/kds`) | **Precache** | Illimité (versionné) | Disponibilité instantanée au boot |
| Menus & Catalogues (`/api/v1/menu`) | **Stale-While-Revalidate** | 24 heures | Affichage immédiat + mise à jour silencieuse |
| Assets Graphiques (`/icons/*`, `/fonts/*`) | **Cache-First** | 30 jours | Zéro consommation réseau |
| Mutations & API (`/api/orders/*`) | **Network-First** | N/A | Sync immédiate avec fallback Outbox locale |

## 2. Dynamic Manifest (`src/app/manifest.ts`)
Le manifest est généré dynamiquement par Next.js à partir des tokens du restaurant :
- `name` & `short_name` : Nom de l'établissement.
- `theme_color` & `background_color` : Couleur primaire et fond de marque.
- `icons` : Multi-tailles (192, 512, maskable) générées à partir du logo uploadé.
- `share_target` : Permet de partager des photos (relevés d'huile HACCP, plans de table) directement dans l'application.

## 3. Apple Startup Images (iOS)
Script `scripts/generate-apple-splash.ts` qui génère 12 splash screens haute définition pour supprimer l'écran blanc au lancement sur iPad et iPhone.

## 4. Modal d'Installation PWA (`InstallPrompt`)
- Écoute de l'événement natif `beforeinstallprompt` sur Chrome, Edge et Android.
- Guide pas-à-pas interactif pour Safari iOS ("Partager" > "Sur l'écran d'accueil").
- Mémorisation du refus pendant 30 jours dans `localStorage`.
