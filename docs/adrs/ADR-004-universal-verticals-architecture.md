# ADR-004 : Architecture Multi-Verticales Universelle & Vertical Forge

- **Statut** : ACCEPTÉ
- **Date** : 2026-08-18
- **Auteurs** : Fleet Vanguard & Architecture Core

## 1. Contexte & Problématique
La plateforme Restaurant OS s'étend à 12 verticales sectorielles (restaurant, salon, bakery, hotel, garage, clinic, retail, gym, coworking, veterinary, florist, custom) tout en conservant un noyau financier et fiscal commun ultra-robuste.

Le risque était la prolifération de code conditionnel « spaghetti » et la fragmentation du socle en silos divergents.

## 2. Décision Architecturale
1. **Les 4 Sources de Vérité Alignées** :
   - `PLATFORM_VARIANTS` dans `@nexus/contracts/platform.types` (12 variantes).
   - `VERTICAL_META` dans `src/verticals/types.ts`.
   - `DNA_REGISTRY` & seeds par défaut dans `src/shared/seeds/index.ts`.
   - Presets de style & tokens dans `src/shared/nexus/tokens/verticals/presets.ts`.
2. **Architecture Plugin Déclarative (`src/verticals/*`)** :
   - Chaque verticale implémente une classe de plugin dédiée (`IVerticalPlugin`) et des adaptateurs modulaires d'événements (`VerticalAdapters`).
   - Les modules centraux (`src/modules/*`) n'importent jamais directement les verticales ; la communication s'opère via les contrats d'interface `@nexus/contracts` et le bus d'événements `VERTICALEvents`.
3. **Forge Industrielle (`vertical-forge`)** :
   - L'ajout d'une nouvelle verticale métier s'effectue par scaffolding déclaratif sans modifier le noyau fiscal NF525 ni les tables de scellement.

## 3. Conséquences
- Déploiement instantané d'une nouvelle verticale en moins de 24h avec cohérence typée à 100%.
- Préservation absolue du noyau fiscal et isolation complète du code métier spécialisé.
