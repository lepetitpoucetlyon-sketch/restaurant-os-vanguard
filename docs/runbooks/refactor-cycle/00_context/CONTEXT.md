# 00 — Contexte partagé (lecture obligatoire avant toute étape)

Cette étape ne produit rien. Elle ancre l'agent dans les invariants du repo. **Toute étape
suivante suppose que ce fichier a été lu.**

## Sources de vérité (à lire en premier)

- `CLAUDE.md` — conventions critiques (règles qui priment sur tout).
- `ARCHITECTURE.md` — vue d'ensemble, piliers, flux Nexus/NF525, **audit de dette priorisé (§9)**.
- `.sentrux/rules.toml` — règles architecturales (cycles, frontières piliers, layers).
- `MIGRATION-microunits.md` — plan de la migration fiscale (si la cible y touche).

## Invariants NON négociables

1. **Monnaie en microunits** : `*InMicrounits` (1 € = 1 000 000 µ). Jamais de nouveau champ
   `*InCents` hors frontière PSP. Convertir, ne pas relabelliser (1 cent = 10 000 µ).
2. **Immuabilité fiscale NF525** : `journalEntries`, `fiscalSeals`, `fiscalLedger` —
   jamais `update`, jamais `delete`. Ne jamais toucher un sceau émis.
3. **Barrière souveraine** : ne jamais contourner `SovereignGuard` ni `NexusInterceptor`.
   Tout chemin Nexus = `tenants/{tenantId}/...`, `tenantId` jamais hardcodé.
4. **Anti-cycles** : les types/helpers partagés passent par le module neutre `src/store/base.ts`.
   Importer depuis le fichier source, pas depuis un barrel, si ça crée un cycle.

## Outillage de vérification (utilisé par les étapes)

```bash
npx tsc --noEmit       # types — doit rester à 0 erreur
npx vitest run         # tests unitaires/intégration
sentrux check .        # gate architectural (cycles, god files, complexité)
./scripts/preflight.sh # enchaîne tsc + eslint + vitest + sentrux
```

## Règles de conduite de l'agent

- **Ne jamais refactorer à l'aveugle** la barrière fiscale ou la couche Nexus : mesurer,
  puis vérifier `tsc`/`vitest` après chaque pas.
- **Une cible à la fois.** Pas de refactor multi-fichiers tant que le précédent n'est pas vert.
- **Préserver le comportement** : un refactor ne change pas ce que fait le code, seulement
  sa forme. Si le comportement doit changer, c'est une autre tâche, signalée comme telle.
- **Honnêteté sur les limites** : si un test/outil ne peut pas tourner dans l'environnement,
  le dire explicitement plutôt que de prétendre.
