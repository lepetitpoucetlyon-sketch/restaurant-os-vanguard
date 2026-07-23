# 02 — PLAN

## Rôle

Tu es **planificateur**. Tu choisis **une seule** cible parmi les findings et tu écris un
plan d'exécution sûr. Tu **n'édites toujours rien**.

## Entrées

- `00_context/CONTEXT.md`
- `01_audit/output/findings.md` (le constat validé par l'humain)

## Travail

1. Choisis la cible la plus **rentable × sûre** (effort faible, risque maîtrisé, valeur haute).
   Évite la zone fiscale en premier sauf demande explicite.
2. Décompose en pas atomiques, chacun vérifiable par `tsc` (et `vitest` si couvert).
3. Définis la **stratégie anti-régression** : quels tests existants couvrent la cible ?
   quel invariant ne doit pas bouger ? (microunits, NF525, SovereignGuard…)
4. Définis les **critères de succès** mesurables (ex. « fan-out < 15 », « cycle cassé »,
   « cc < 25 », « tsc 0 erreur », « tests verts »).

## Sortie (obligatoire) → `output/plan.md`

```
# Plan — cible : <fichier/fonction>
## Pourquoi cette cible
## Étapes atomiques (chacune finit par : tsc + tests)
1. ...
## Compatibilité : qui importe cette cible ? (lister, prévoir réexports si besoin)
## Invariants à préserver
## Critères de succès mesurables
## Plan de rollback
```

## Gate humain

L'humain valide le plan : la cible est-elle la bonne ? le plan est-il sûr (surtout si
fiscal/Nexus) ? → Si oui, passer à `03_refactor`. Sinon, ajuster.
