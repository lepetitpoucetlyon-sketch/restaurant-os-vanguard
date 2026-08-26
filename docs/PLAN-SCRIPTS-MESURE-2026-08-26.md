# Plan — suite de scripts de mesure

> Établi le 2026-08-26. Tous les chiffres sont **mesurés en session** (Loi 7).
> Objectif : transformer l'exploration coûteuse en **mesure permanente et rapide**.

---

## Constat

`scripts/` contient **71 fichiers**. Répartition mesurée :

| Catégorie | Nombre |
|---|---:|
| **Jetable** — migration one-shot déjà passée (`apply_*`, `migrate-*`, `split_*`, `backfill-*`) | **19** |
| Recherche / Python (scrapling, benchmarks, KI) | 11 |
| **Gate permanente** | 8 |
| Audit ponctuel | 8 |
| Générateur | 7 |
| Données de démo | 6 |
| Opérations (deploy, hooks) | 5 |
| Autre | 7 |

### Le vrai problème

Ce n'est pas le manque de scripts — c'est que :

1. **27 % du dossier est du jetable déjà consommé**, mêlé aux gates permanentes.
   Rien dans le nom ne les distingue : `apply_l3_safe.ts` et `verify-gate-integrity.mjs`
   se ressemblent dans un `ls`.
2. **Il n'existe pas de point d'entrée unique de mesure.** `health-snapshot.sh`
   génère `HEALTH.md`, `preflight.sh` exécute les gates, `check-last-mile.mjs`
   compte les orphelins — trois mécaniques séparées, trois formats de sortie.
3. **Les mesures ne sont pas capitalisées.** Tout ce que j'ai exploré aujourd'hui
   — atteignabilité, réglages morts, débordements responsive, parité des locales —
   vit dans un transcript, pas dans le dépôt. Le prochain agent le refera.
4. **Les chiffres des documents ne sont reliés à aucune commande.** La Loi 7 exige
   une mesure reproductible ; aujourd'hui elle repose sur la discipline.

---

## Principes

1. **Pur et rapide.** Aucun effet de bord, aucun réseau, cible < 2 s. Un script de
   mesure qui écrit quelque part n'est plus une mesure, c'est une migration.
2. **Deux sorties, une source.** Chaque script émet un résumé lisible ET un JSON.
   Les cliquets, `HEALTH.md` et les rapports consomment **le même** JSON — on ne
   peut plus avoir deux chiffres contradictoires pour la même chose.
3. **Mesure ≠ verdict.** Le script mesure ; c'est `preflight.sh` qui décide si le
   seuil est franchi. Un même script sert donc l'exploration et la gate.
4. **Un script naît d'une exploration réelle.** On ne script pas par anticipation :
   chaque entrée du catalogue ci-dessous remplace une exploration effectivement
   faite, dont le coût est connu.
5. **Le nom dit le cycle de vie.** Un `ls scripts/` doit suffire à savoir ce qui
   est permanent.

---

## Taxonomie et nommage

| Préfixe | Cycle de vie | Sortie | Exemple |
|---|---|---|---|
| `measure-` | **Permanent**, pur, rapide | JSON + résumé | `measure-reachability.mjs` |
| `gate-` | **Permanent**, décide (exit ≠ 0) | verdict | `gate-last-mile.mjs` |
| `generate-` | **Permanent**, écrit un artefact | fichier | `generate-architecture-map.mjs` |
| `ops-` | **Permanent**, effets de bord assumés | — | `ops-deploy-prod.sh` |
| `oneshot-` | **Jetable**, à supprimer après exécution | — | `oneshot-migrate-brand-colors.ts` |

**Règle** : un `oneshot-` de plus de 3 mois est supprimé, pas archivé. Git garde
l'historique.

---

## Catalogue des mesures

Huit scripts. Chacun remplace une exploration réellement conduite le 2026-08-26.

### M1 — `measure-reachability` ✅ *existe (dans `check-last-mile.mjs`)*

Composants exportés sans consommateur, en ignorant les ré-exports de barrel.

- **Remplace** : ~15 greps + un script Python jeté, dont une première version
  fausse (elle traversait les barrels, d'où 58 au lieu de 88).
- **Mesuré** : 88 composants / 10 280 lignes.
- **Coût** : inclus dans les 0,9 s de la Gate 6.
- **À faire** : extraire de `check-last-mile.mjs` vers un `measure-` autonome, pour
  que l'exploration soit possible sans déclencher la gate.

### M2 — `measure-settings-coverage` ✅ *existe (dans `check-last-mile.mjs`)*

Réglages déclarés dans `config-registry.ts` vs réellement lus.

- **Mesuré** : **184 déclarés, 7 lus. 177 ne pilotent rien** — 96 % de l'écran
  Paramètres. C'est la mesure qui a justifié la Loi 8.
- **À faire** : même extraction que M1.

### M3 — `measure-i18n-parity` 🔴 *à écrire*

Pour chaque locale : clés définies, clés manquantes vs référence, et clés appelées
par `t()` sans exister nulle part.

- **Remplace** : trois scripts Python jetés dans la session.
- **Mesuré** :

  | locale | clés | manquantes vs `fr` |
  |---|---:|---:|
  | `fr` | 468 | — (référence) |
  | `en` | 472 | 13 |
  | `es` | 148 | **337** |
  | `pt` | 131 | **337** |
  | `ja` | 131 | **337** |

  `es`, `pt` et `ja` sont à **~30 % de couverture**. Chaque clé manquante s'affiche
  en clair à l'écran, exactement comme les 31 libellés de navigation corrigés ce matin.
- **Cliquet proposé** : `I18N_MISSING_MAX` par locale, gelé aux valeurs ci-dessus.
- **Coût estimé** : < 0,5 s.

### M4 — `measure-responsive` 🔴 *à écrire*

Débordements potentiels et densité typographique, par module.

- **Remplace** : la dizaine de greps de la session responsive (largeurs px figées,
  grilles sans variante, micro-typo, `h-screen` strict vs `min-h-screen`,
  `<table>` sans `overflow-x`, distribution des breakpoints).
- **Piège à encoder** : distinguer `h-screen` (hauteur imposée, dangereuse) de
  `min-h-screen` (plancher, bénin). J'ai confondu les deux et surestimé le problème
  de 69 à 9. Le script doit porter cette distinction.
- **Cliquets proposés** : `FIXED_GRIDS_MAX`, `MICRO_TYPO_MAX`, `TABLES_NO_OVERFLOW_MAX`.

### M5 — `measure-runtime-layout` 🔴 *à écrire — le plus précieux*

Sonde **navigateur** (Playwright, déjà en dépendance) : pour chaque route et chaque
palier (375 / 768 / 1024 px), mesure le débordement horizontal, les éléments hors
cadre **à gauche comme à droite**, les textes rendus sous 12 px, et les conteneurs
défilables inatteignables.

- **Pourquoi c'est le plus précieux** : l'analyse statique **n'a pas vu** les
  450 px d'en-tête KDS hors cadre. Seul le runtime les a révélés. C'est la seule
  mesure de cette liste qui trouve ce que la lecture du code ne peut pas trouver.
- **Piège à encoder** : ma première sonde ne testait que le **bord droit** et a
  raté le rognage à gauche. Tester les deux.
- **Coût** : lent (démarrage navigateur). **Ne va pas dans `pre-commit`** — CI ou
  exécution manuelle.
- **Prérequis** : un jeu de données de démo et une session authentifiée
  reproductibles (le PIN dev `9999` est une constante en dur).

### M6 — `measure-duplicates` 🔴 *à écrire*

Composants exportés sous le même nom depuis deux fichiers, et chaînes de code mort
(un fichier mort qui en importe un autre).

- **Remplace** : la découverte manuelle de `NexusFleetProvider` ×2, de
  `CategoryList` supplanté par `PosHeader`, et de `StaffPortal → PaySlipViewer`.
- **Valeur** : un doublon est plus dangereux qu'un orphelin — on corrige le mauvais
  fichier sans s'en apercevoir.

### M7 — `measure-swallowed-errors` 🔴 *à écrire*

`catch {}` vides, `catch` à commentaire seul, promesses flottantes
(`.then()` sans `.catch()`), et `async` passé à un handler synchrone.

- **Remplace** : le repérage manuel de la promesse flottante de
  `NexusInterceptor` — la cause racine du gel de ta machine.
- **Mesuré** : 7 `catch {}` stricts, 22 à commentaire seul (non triés).
- **Nuance à encoder** : certains sont légitimes (quota de stockage dépassé). Le
  script mesure, il ne juge pas ; le tri reste humain.

### M8 — `measure-footprint` 🟠 *partiel (`BUNDLE_MAX_KB` existe)*

Poids du bundle client par chunk, taille de `.next`, empreinte disque du dépôt.

- **Remplace** : l'enquête sur le gel machine (7,1 Go de cache Turbopack,
  disque à 94 %).
- **Ajout utile** : alerte quand `.next/dev/cache` dépasse un seuil — c'est ce qui
  a rendu ton disque critique.

---

## Point d'entrée unique

```bash
npm run measure          # tout : JSON daté dans .measures/ + résumé lisible
npm run measure -- --json    # JSON seul (consommation machine)
npm run measure -- m3 m4     # sous-ensemble
```

Un seul artefact : `.measures/latest.json` (gitignoré) + `.measures/history.jsonl`
(versionné, une ligne par exécution).

Trois consommateurs, **une seule source de vérité** :

- `docs/HEALTH.md` — généré depuis le JSON, plus jamais rédigé à la main
- `preflight.sh` — compare le JSON aux cliquets
- les documents d'audit — citent la mesure et sa date

**L'historique est le vrai gain** : `history.jsonl` rend la dette *visible dans le
temps*. « 88 orphelins » ne dit rien ; « 88 le 26 août, 71 le 15 septembre » dit
que ça descend.

---

## Séquencement

| Étape | Contenu | Effort | Gain |
|---|---|---|---|
| **1** | Nommage + suppression des 19 `oneshot-` consommés | faible | Lisibilité immédiate de `scripts/` |
| **2** | Extraire M1 et M2 de `check-last-mile.mjs` ; créer `npm run measure` | faible | Fondation, sans nouveau code de mesure |
| **3** | M3 (i18n) et M6 (doublons) | faible | Deux mesures rapides, cliquets immédiats |
| **4** | M4 (responsive) et M7 (erreurs avalées) | moyen | Couvre les deux classes de bugs de la journée |
| **5** | `HEALTH.md` régénéré depuis le JSON | moyen | Ferme la boucle Zero-Claim |
| **6** | M5 (sonde runtime) | élevé | Trouve ce que le statique ne peut pas trouver |

M5 en dernier **délibérément** : c'est le plus coûteux et il dépend d'un jeu de
données de démo reproductible, qui n'existe pas encore de façon fiable (les
collections remontent `permission-denied` en local).

---

## Ce que ça change concrètement pour un agent

Aujourd'hui, produire les chiffres de l'audit m'a demandé une trentaine d'appels
d'outils, plusieurs scripts jetés, et **deux erreurs de méthode** — la traversée
des barrels (58 au lieu de 88) et la sonde qui ne testait qu'un bord.

Avec le catalogue : `npm run measure` en quelques secondes, des chiffres
comparables d'une session à l'autre, et **les pièges encodés dans le script plutôt
que redécouverts à chaque fois**.

C'est le point important. Un script de mesure n'est pas qu'un raccourci : c'est
**de la connaissance figée**. La distinction `h-screen` / `min-h-screen`, le fait
qu'un ré-export de barrel n'est pas un usage, la nécessité de tester les deux
bords — ce sont des choses que j'ai apprises en me trompant aujourd'hui. Écrites
dans un script, elles ne se réapprennent plus.

---

## Nettoyage associé

- [ ] Supprimer les **19 scripts jetables** déjà consommés (git garde l'historique).
- [ ] Renommer les 8 gates en `gate-*`, les 7 générateurs en `generate-*`.
- [ ] Trancher les **8 audits ponctuels** : soit ils deviennent des `measure-`,
      soit ils partent.
- [ ] Documenter la convention dans `AGENTS.md`, à la suite de la Loi 8.
