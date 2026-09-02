# 🗂️ workflows/ — Espace ICM (Interpretable Context Methodology)

> Orchestration d'agents IA par **structure de dossiers + markdown + scripts**, et non par code.
> Inspiré de *Interpretable Context Methodology: Folder Structure as Agent Architecture*
> (Van Clief & McDermott, arXiv:2603.16021). Adapté ici au cycle **audit → refactor** du repo.

## ⚠️ À ne pas confondre

L'« ICM » de ce dossier (méthodologie de workflow d'agents) n'a **aucun rapport** avec
l'« **ICM-lite** » du code (`src/lib/icm/`, chargement sélectif des modules par route).
Même acronyme, concepts différents.

## Principe

Un **seul agent** orchestrateur lit, dans l'ordre, les dossiers numérotés. Chaque dossier
est une **étape**. Le `ROLE.md` de l'étape dit à l'agent quel rôle jouer, ce qu'il lit en
entrée et ce qu'il doit produire en sortie. Les `*.sh` font le travail mécanique
(tsc, vitest, sentrux) — pas besoin d'IA pour ça. Entre chaque étape : **relecture humaine**.

ICM convient ici parce que la maintenance de code est **séquentielle**, **relue à chaque
étape** et **répétable**. Ce n'est PAS adapté au runtime de l'app (temps réel, multi-tenant) —
voir §5.2 du papier.

## Arborescence

```
workflows/refactor-cycle/
  00_context/CONTEXT.md      ← invariants du repo (lecture obligatoire avant tout)
  01_audit/    ROLE.md  run.sh   output/   ← cartographie + mesures (sentrux, tsc)
  02_plan/     ROLE.md           output/   ← priorisation + plan, RIEN n'est encore édité
  03_refactor/ ROLE.md  check.sh output/   ← édition du code, une cible à la fois
  04_verify/   ROLE.md  verify.sh output/  ← tsc + vitest + sentrux + diff, gate final
```

## Comment lancer un cycle

1. Ouvre une session agent dans le repo.
2. Donne-lui : « Lis `workflows/refactor-cycle/00_context/CONTEXT.md`, puis exécute l'étape
   `01_audit` en suivant son `ROLE.md`. »
3. À la fin de chaque étape, **lis le `output/` de l'étape** et décide : continuer, relancer,
   ou arrêter (c'est le *review gate*).
4. Passe à l'étape suivante en pointant son `ROLE.md`.

## Contrats d'étape (handoffs)

| Étape | Lit | Produit dans `output/` | Gate humain |
|-------|-----|------------------------|-------------|
| 01_audit | CONTEXT.md, code | `findings.md` (dette priorisée + mesures) | Les findings sont-ils justes ? |
| 02_plan | `01_audit/output/findings.md` | `plan.md` (1 cible, étapes, critères de succès) | Le plan est-il sûr ? |
| 03_refactor | `02_plan/output/plan.md` | `changes.md` (diff résumé + risques) | tsc vert ? comportement préservé ? |
| 04_verify | tout le code | `report.md` (tsc/vitest/sentrux + verdict) | Merger ou non ? |

## Pourquoi c'est utile

Tout artefact intermédiaire est un **fichier en clair** : observabilité gratuite, pas de
dashboard. Tu peux modifier un prompt (`ROLE.md`) sans toucher au code. Tu peux copier le
dossier `refactor-cycle/` pour en faire d'autres pipelines (ex. `migration-cycle/`).
