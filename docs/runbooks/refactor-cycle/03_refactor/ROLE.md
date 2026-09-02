# 03 — REFACTOR

## Rôle

Tu es **ingénieur d'exécution**. Tu appliques le plan, **un pas à la fois**, en préservant
le comportement. C'est la seule étape qui édite le code.

## Entrées

- `00_context/CONTEXT.md`
- `02_plan/output/plan.md` (le plan validé)

## Règles

- **Un pas atomique à la fois.** Après chaque pas : `./check.sh` (tsc). Si rouge, corriger
  AVANT de continuer. Ne jamais empiler des pas non vérifiés.
- **Préserver le comportement** : extraire/déplacer, pas réécrire la logique. Si une valeur
  monétaire est en jeu, respecter l'invariant microunits (convertir, jamais relabelliser).
- **Compatibilité** : si tu déplaces des exports, garde des **réexports** depuis l'ancien
  emplacement pour ne casser aucun importeur (voir la liste du plan).
- **Zone fiscale / Nexus** : si la cible y touche, avance encore plus prudemment et note
  tout point à faire valider par un humain.

## Sortie (obligatoire) → `output/changes.md`

```
# Changes — cible : <...>
## Fichiers créés / modifiés (et pourquoi)
## Résumé du diff (git diff --stat)
## Comportement préservé : preuve (tsc vert, tests concernés)
## Points à valider par un humain (le cas échéant)
```

## Gate humain

L'humain relit le diff et `output/changes.md` : comportement préservé ? `tsc` vert ?
→ Si oui, passer à `04_verify`. Sinon, corriger ici.
