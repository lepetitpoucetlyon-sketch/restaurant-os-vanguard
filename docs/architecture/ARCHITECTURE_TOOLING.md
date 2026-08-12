# Architecture Tooling

Le produit `restaurant-os-app` reste le repo SaaS principal.

L'outillage d'analyse est maintenu à côté, dans le workspace voisin:

- `../restaurant-os-graph`

Ce workspace contient:
- Graphify
- le vault Obsidian
- les scripts Atlas
- les snapshots d'architecture générés localement

## Commandes
- `npm run setup:atlas` : vérifie le runtime Graphify et le workspace `restaurant-os-graph`
- `npm run atlas` : lance le pipeline Atlas standard sur `src/`
- `npm run atlas -- app` : lance le pipeline Atlas sur tout le repo produit

## Sorties
- graphe et rapports : `../restaurant-os-graph/graphify-out`
- vault Obsidian : `../restaurant-os-graph/graphify-out/obsidian-vault`
- notes complémentaires : `../restaurant-os-graph/graphify-out/obsidian-vault/manual-scan`
- snapshot blueprint : `../restaurant-os-graph/graphify-out/blueprint`

Le repo produit ne doit plus générer ni versionner les artefacts Graphify/Obsidian.
