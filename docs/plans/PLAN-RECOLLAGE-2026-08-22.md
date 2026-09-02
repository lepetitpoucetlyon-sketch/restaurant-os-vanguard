# Plan de recollage carte ↔ territoire — RESTAURANT-OS-CORE

> **But** : que le code respecte le plan, et que le plan décrive le code. On ne redessine pas l'architecture (elle est bonne) — on **rend vrai** ce qui est déjà dessiné, et on verrouille pour que ça le reste.
> **Date** : 2026-08-22 · **Branche** : `main` · **HEAD** : `5dfa324cf`
> **Certitude** : 🎯 confirmé (mesuré) · 🔍 à vérifier avant d'agir.

---

## Diagnostic condensé (ce qu'on répare)

| # | Problème structurel | Preuve (mesurée) |
|---|---|---|
| A | **Trois couches-cores qui se chevauchent** : `kernel/`, `lib/`, `shared/` portent tous des `contracts/`, `schemas/`, `events/`. Personne ne peut répondre « où va X ? » | `kernel/{contracts,schemas,primitives,events}` **ET** `shared/{nexus/contracts, schemas, eventBus/events}` **ET** `lib/nexus/` coexistent |
| B | **`src/shared/` = 643 fichiers, 18 sous-dossiers** — vidé sur `agent/antigravity-exec` (→ 3 fichiers) puis **ré-empli sur `main`** par la « REBIRTH / Full Migration Phases 1-5 » | main **643** vs branche **3** ; branche = ancêtre de main, **145 commits de retard** |
| C | **Singleton Nexus dupliqué** 🎯 | `lib/nexus/NexusInstance.ts:104` **et** `lib/nexus/NexusAdapter.ts:126` exportent chacun `const Nexus = new NexusManager()` |
| D | **323 fuites de barrel en prod** (frontières piliers court-circuitées) | 182 `no-inter-module-imports` + 141 Barrel Contract |
| E | **MCC/fleet éclaté sur 4 maisons** | `app/(admin)/admin/mcc` 77 · `lib/mcc` 10 · `modules/fleet` 6 · `kernel/ai/mcc` 5 |
| F | **`common.events.ts` = 1064 lignes**, fourre-tout d'events multi-piliers | 25 hr, 23 compliance, 20 crm, 18 finance… alors que `finance.events.ts`/`ops.events.ts` existent déjà |
| G | **Taxonomie dérivée** : `modules/fleet`, `modules/stock` existent hors de la liste officielle des 8 piliers | chemins réels dans eslint.log |
| H | **Doc morte** : `domain-facts.yml`/`MEMORY` pointent `src/orchestration/` + `src/kernel/nexus/` inexistants | `find` : absents ; réel = `shared/eventBus`, `shared/nexus` |

**La clé, c'est A.** Tant que 3 couches se disputent les mêmes responsabilités, les imports fuiront toujours vers le mauvais endroit. On tranche A en premier ; D/E/F/H en découlent.

### 📜 Histoire de la migration `shared/` (résolue par archéologie git, 2026-08-22)

Le vidage de `shared/` **a bien été fait** — il n'a juste pas survécu :

- La branche **`agent/antigravity-exec`** a vidé **son** `src/shared/` (**124 → 3 fichiers**). ⚠️ Mais son shared/ ne faisait alors que **124 fichiers** — celui d'aujourd'hui sur main en fait **643** (×5, regonflé par la REBIRTH + 145 commits). ✅ L'état cible compile, **mais la branche ne couvre qu'une partie du problème** : sa carte = **107 déplacements**, dont l'écrasante majorité `shared/nexus/ → kernel/nexus/`. `shared/eventBus` (212) et `shared/components` (163) **n'existaient pas** sur la branche → aucune règle pour eux.
- Cette branche est un **ancêtre de `main`**, aujourd'hui **145 commits en retard** (dernier commit il y a 7 jours).
- Le vidage a été **écrasé** sur main par les commits **« SOVEREIGN SYSTEM REBIRTH — ZERO-DATA RESTORATION »** puis **« Grade X Monolith to Modular — Full Migration (Phases 1-5) »**, qui ont **ré-empli `src/shared/`**. Depuis, 145 commits de features (angles morts, verticales, MCC/fleet, tests de couverture) se sont empilés **dans le débarras ré-ouvert**.

> **Conséquence stratégique** : on ne **merge pas** et on ne **rejoue pas** la branche (déjà ancêtre, état vidé détruit, collisions garanties avec 145 commits récents). On l'utilise comme **RECETTE** : elle contient la carte exacte « ancien chemin → nouveau chemin ». → intégré dans C1 ci-dessous.

---

## Ordre des chantiers (dépendances)

```
C0 (débloquer preflight)  ──►  C1 (loi des couches)  ──┬─►  C2 (dédup Nexus)
                                                        ├─►  C3 (dissoudre common.events)
                                                        ├─►  C4 (tuer les fuites barrel)
                                                        └─►  C5 (consolider MCC/fleet)
                                                                        │
                                                                        ▼
                                                              C6 (réconcilier la doc + verrouiller)
```

**Règle d'or anti-régression** (vaut pour TOUS les chantiers) : chaque chantier se termine en **abaissant un ratchet de gate**. On ne merge pas un chantier « recollage » sans que la gate correspondante *bloque* désormais toute réapparition de la dette. Une gate qui ne bloque pas ne sert à rien.

---

## C0 — Débloquer le preflight (prérequis)

- **But** : avoir une gate FIABLE avant de mesurer quoi que ce soit. On ne travaille pas sur un preflight déjà rouge.
- **Actions** :
  1. Corriger les 4 erreurs `TS2554` (mocks vitest sans argument) :
     - `src/__tests__/facility/full-facility-coverage.test.ts:10`
     - `src/__tests__/mcc/full-mcc-fleet-coverage.test.ts:13,14`
     - `src/__tests__/verticals/full-vertical-coverage.test.ts:43`
     - → `.mockReturnValue()` devient `.mockReturnValue(undefined)` ; `.mockResolvedValue()` → `.mockResolvedValue(undefined)`.
- **Definition of Done** : `rtk proxy npx tsc --noEmit` sort en code 0.
- **Vérif** : `rtk proxy npx tsc --noEmit ; echo $?` → `0`
- **Effort** : 🟢 15 min · **Risque** : nul.

---

## C1 — Trancher la loi des couches (LE keystone)

- **But** : une règle d'UNE phrase par couche, sans chevauchement, écrite noir sur blanc. C'est la décision qui débloque tout le reste.
- **Pourquoi maintenant** : les couches A se marchent dessus (`contracts`/`schemas`/`events` en triple). Sans arbitrage, chaque nouveau fichier et chaque import est un pari.
- **Atout PARTIEL** (mesuré, ne pas surestimer) : la branche a rangé **une partie** du problème — surtout `shared/nexus/ → kernel/nexus/` (~83 fichiers, **règle prouvée compilable**). Mais son shared/ ne faisait que 124 fichiers : **549/643 (85 %) du shared/ d'aujourd'hui n'ont AUCUNE destination dans sa carte** (eventBus 212, components 163, hooks 45, providers 27…). → On récupère les **règles prouvées** (nexus→kernel + services/seeds→lib) ; le gros (eventBus, components) reste **des décisions neuves** à trancher dans ADR-015.
- **Reclassement recommandé du gros orphelin** : `eventBus` (212) et `components` (163) = **58 % du shared/** et sont des couches *légitimes* (orchestration + design system). Pour eux, la bonne réponse est probablement **« assumer / renommer »**, pas « redistribuer » → le vrai travail de tri se réduit alors à ~130 fichiers.
- **Actions détaillées** :
  0. **Extraire la carte de déplacement depuis la branche** (« ancien chemin → nouveau chemin ») :
     ```bash
     # état "shared plein" sur la branche, juste avant le vidage
     PLEIN=$(git log --diff-filter=D --format=%H agent/antigravity-exec -- src/shared | tail -1)^
     # renommages détectés (seuil 80%) → carte de déplacement
     git diff -M80% --name-status "$PLEIN" agent/antigravity-exec -- src \
       | grep -E '^R' | awk '{print $2" -> "$3}' > docs/move-map-shared.txt
     wc -l docs/move-map-shared.txt   # nombre de déplacements à rejouer
     ```
     → produit `docs/move-map-shared.txt`, la liste exacte des `shared/X → kernel|lib/Y`. (La session d'audit peut la générer et la vérifier pour toi.)
  1. **Écrire `docs/adrs/ADR-015-couches.md`** — définition exclusive :
     | Couche | Responsabilité UNIQUE | Peut importer | Ne contient JAMAIS |
     |---|---|---|---|
     | `kernel/` | Machine Nexus + primitives + contrats runtime | rien de `modules/`, `lib/`, `shared/` | logique métier |
     | `lib/` | Services transversaux non-métier (cron, sync, seeds, adapters, mcc) | `kernel/`, autres `lib/` | UI, atomes de pilier |
     | `shared/` | **À TRANCHER** (voir étape 2) | — | — |
     | `modules/<pilier>/` | Métier, via barrel racine | `@/modules/<autre>` (barrel), `kernel/`, `lib/` | — |
  2. **Décider le sort de chaque sous-dossier de `shared/`** (la vraie question). Table de décision proposée (à valider) :
     | Sous-dossier shared/ | Fichiers | Décision proposée | Destination |
     |---|---:|---|---|
     | `eventBus/` | 212 | **Assumer** comme couche orchestration | renommer `src/orchestration/` (aligne la doc) **ou** garder mais figer |
     | `nexus/` (guards, contracts, engines, vault) | 127 | **Fusionner dans `kernel/`** | `kernel/nexus/` (ce que la doc prétend déjà) |
     | `components/` | 163 | **Assumer** comme design-system partagé | `src/design/` ou garder `shared/components` figé |
     | `hooks/` | 46 | Trier : core→`kernel/hooks`, métier→`modules/` | selon usage |
     | `providers/` | 27 | core→`kernel/providers` | `kernel/` |
     | `schemas/` (3) | 3 | **Gelé par design** (primitives) | rester (déjà acté) |
     | `contexts/`, `plugins/`, `seeds/`, `utils/`, `types/`, `store/`, `atoms/`, … | ~70 | trier core vs lib | `kernel/` ou `lib/` |
  3. **Principe directeur recommandé** : réduire de 3 cores à **2** — `kernel/` (machine, y compris nexus+contracts+events-types) + `lib/` (services transversaux). `shared/` disparaît ou se réduit à `schemas/` (primitives gelées) + `components/` (design system). C'est exactement le plan `agent/antigravity-exec` — **le refaire sur `main`, en une seule décision assumée** cette fois.
- **Definition of Done** : ADR-015 mergé ; chaque sous-dossier de `shared/` a une destination écrite ; `sentrux`/ESLint ont une règle qui interdit les couches supprimées.
- **Effort** : 🟡 la décision = 1 session ; l'exécution des moves = étalée sur C2–C4 (ne pas tout bouger d'un coup). **Risque** : moyen (beaucoup de refs) — **fortement atténué** : la branche prouve que la cible compile + la move-map donne les destinations exactes. Rejouer via `git mv` + barrels verbatim, un sous-dossier à la fois, gate verte entre chaque.

---

## C2 — Dédupliquer le singleton Nexus (correctness)

- **But** : **un seul** `Nexus`. Aujourd'hui il y en a deux → risque de deux états d'adapter / deux contextes tenant divergents. 🎯
- **Actions** :
  1. Trancher lequel est canonique (`NexusInstance.ts` vs `NexusAdapter.ts`).
     - **Vérif requise** 🔍 : `grep -rn "from '@/lib/nexus/NexusInstance'" src | wc -l` vs `...NexusAdapter'` — compter les importeurs réels de chacun.
  2. Faire pointer tous les importeurs vers le canonique (barrel `@/lib/nexus`), supprimer le mort.
  3. Si les DEUX sont importés en prod → **incident** : les fusionner d'urgence (deux singletons = le `SovereignGuard`/`_tenantOverride` d'un ne protège pas l'autre).
- **Definition of Done** : `grep -rc "class NexusManager" src` = 1 ; `export const Nexus` défini une seule fois.
- **Effort** : 🟡 ½ session · **Risque** : élevé si les deux sont vivants (tester le flux POS→fiscal après).

---

## C3 — Dissoudre `common.events.ts` (gain rapide, isolé)

- **But** : supprimer le fourre-tout de 1064 lignes en suivant le pattern déjà existant (`finance.events.ts`, `ops.events.ts`…).
- **Actions** — table de migration (préfixe d'event → fichier cible) :
  | Préfixes (nb events) | Fichier cible |
  |---|---|
  | hr(25), staff(2) | `human.events.ts` (nouveau) |
  | compliance(23), haccp(5), security(7) | `compliance.events.ts` (nouveau) |
  | crm(20), commerce(10), reservation(7), review(2) | `commerce.events.ts` (nouveau) |
  | finance(18) | `finance.events.ts` (existe) |
  | stock(12), delivery(11), logistics(3) | `logistics.events.ts` (nouveau) |
  | ops(11), kds(10), pos(7), bar(4), table(3), production(2) | `ops.events.ts` (existe) |
  | facility(8) | `facility.events.ts` (nouveau) |
  | fleet(7) | `fleet.events.ts` (nouveau, cf. C5) |
  | analytics(3), system(2), store(2), notification(2) | `system.events.ts` (existe) |
  1. Déplacer chaque groupe, ré-exporter depuis `catalog.ts` (surface `NexusEvents` inchangée).
  2. Supprimer `common.events.ts` une fois vide.
- **Definition of Done** : `common.events.ts` supprimé ; `catalog.ts` compile ; tests bus verts.
- **Vérif** : `npx vitest run src/__tests__/bus` + `wc -l src/shared/eventBus/events/*.events.ts` (aucun > ~300).
- **Effort** : 🟢 1 session, mécanique · **Risque** : faible (déplacement de types, tsc attrape tout).

---

## C4 — Tuer les fuites de barrel (le gros volume : 323)

- **But** : rendre l'isolation des piliers RÉELLE. Aujourd'hui elle est dessinée, pas appliquée.
- **Carte des fuites (par zone source, à attaquer dans cet ordre)** :
  | Zone | Fuites | Pattern dominant | Tactique |
  |---|---:|---|---|
  | `lib/` | 71 | god-services qui importent les internes des piliers | **exposer via barrel** + importer `@/modules/<pilier>` |
  | `modules/ops` | 71 | imports profonds intra/inter-pilier | barrel racine ops + relatif en interne |
  | `modules/finance` | 42 | idem | idem |
  | `modules/commerce` | 34 | idem | idem |
  | `compliance` 25, `human` 23, `intelligence` 20, `shared` 24 | 92 | mixte | idem |
  | reste (logistics, app, kernel, fleet, stock, facility) | ~37 | dispersé | au fil de l'eau |
- **Exemple concret (à corriger)** — `src/lib/sync/pillarSyncRegistry.ts` :
  ```ts
  // ❌ aujourd'hui (fuite profonde)
  import { OpsSyncService } from '@/modules/ops/workflow/engine/ops.sync';
  import { HRSyncService }  from '@/modules/human/effectifs/hr/hr.sync';
  // ✅ cible : chaque pilier exporte son SyncService dans son barrel
  import { OpsSyncService } from '@/modules/ops';
  import { HRSyncService }  from '@/modules/human';
  ```
  → donc pour chaque pilier : **ajouter l'export manquant dans `src/modules/<pilier>/index.ts`**, puis remplacer l'import profond côté `lib/`.
- **Actions** :
  1. `npx eslint src --fix` d'abord → récupère **~194 corrections gratuites** (unused imports/vars) et réduit le bruit.
  2. Zone par zone (lib → ops → finance → …), pour chaque fuite : soit exposer via barrel, soit déplacer le fichier dans le bon pilier (cas `verticals/garage/.../RepairIntakeService` → `modules/ops/service/`).
  3. **Après chaque zone**, réinitialiser puis abaisser le ratchet ESLint : dans `preflight.sh`, `BARREL_DEBT_MAX` doit descendre à chaque passe et **ne jamais remonter**. Ajouter `no-inter-module-imports` au comptage bloquant (aujourd'hui seul `Barrel Contract` est compté).
- **Definition of Done** : `grep -c "error.*Barrel Contract"` = 0 ET `no-inter-module-imports` = 0 ; ratchet verrouillé à 0.
- **Effort** : 🔴 le plus gros — 3 à 5 sessions (par vagues de pilier) · **Risque** : faible par unité (tsc + tests attrapent), mais volumineux.

---

## C5 — Consolider MCC / fleet + trancher la taxonomie

- **But** : une maison par concept ; formaliser ce qui a poussé hors des 8 piliers.
- **Actions** :
  1. **MCC** (4 maisons → 2 assumées) : UI reste `app/(admin)/admin/mcc/` ; toute la LOGIQUE (provisioning, kill-switch, billing flotte, AI mcc) converge vers **un** module — proposer `src/modules/mcc/` (aujourd'hui vide) ou assumer `lib/mcc/`. Rapatrier `kernel/ai/mcc` (5) et `modules/fleet` (6) sous cette maison.
  2. **Taxonomie** 🔍 : `modules/fleet` et `modules/stock` existent hors de la liste des 8 piliers. Décider : `fleet` = sous-domaine de MCC (pas un pilier métier tenant) ; `stock` = doit vivre sous `modules/logistics/stock/` (le dédoubler avec `logistics` si les deux existent). **Vérif** : `ls -d src/modules/*/` pour lister la taxonomie réelle et la figer dans CLAUDE.md.
- **Definition of Done** : MCC logique dans ≤ 2 emplacements documentés ; liste des piliers dans CLAUDE.md = liste réelle du filesystem.
- **Effort** : 🟡 1–2 sessions · **Risque** : moyen (imports MCC nombreux).

---

## C6 — Réconcilier la doc et verrouiller (en dernier)

- **But** : une fois le territoire stable, refaire la carte pour qu'elle soit VRAIE, puis rendre les gates auto-protectrices.
- **Actions** :
  1. Mettre à jour, sur l'état réel post-C1→C5 :
     - `~/.nexuscoder/domain-facts.yml` (supprimer `orchestration/`, `kernel/nexus/` ; corriger l'emplacement du singleton, le vrai path eventBus).
     - `CLAUDE.md` (arborescence piliers réelle, emplacement Nexus unique, couches ADR-015).
     - `MEMORY.md` (déjà partiellement corrigé le 2026-08-22).
     - Commentaires périmés de `preflight.sh` : `MADGE_CYCLES_MAX=430` (réel 0), baseline barrel « 0 » (réel 141 avant C4).
  2. **Verrouiller** : chaque invariant du recollage devient une règle `sentrux`/ESLint bloquante (pas de nouvelle couche-core, pas d'import profond, un seul singleton, pas d'event hors fichier de pilier).
- **Definition of Done** : `npm run preflight` **vert en sortie brute** ; aucun chemin cité dans la doc n'est mort (`find` de contrôle).
- **Effort** : 🟢 1 session · **Risque** : nul.

---

## Récapitulatif effort & séquence

| Chantier | Effort | Bloque quoi | À faire |
|---|---|---|---|
| C0 Débloquer preflight | 🟢 15 min | Gate types | **Tout de suite** |
| C1 Loi des couches (ADR-015) | 🟡 1 session (décision) | Tout le reste | Juste après C0 |
| C2 Dédup Nexus | 🟡 ½ session | Correctness | Tôt (risque) |
| C3 Dissoudre common.events | 🟢 1 session | — | Parallélisable |
| C4 Fuites de barrel | 🔴 3–5 sessions | Frontières | Le gros œuvre |
| C5 Consolider MCC/fleet | 🟡 1–2 sessions | — | Après C1 |
| C6 Réconcilier doc + verrouiller | 🟢 1 session | Fiabilité gates | **En dernier** |

**Total réaliste : ~8–11 sessions de travail.** Ordre conseillé : **C0 → C1 → (C2, C3 en //) → C4 par vagues → C5 → C6.**

---

## Le principe à ne pas lâcher

> Ne bouge jamais du code sans que la gate correspondante **bloque désormais le retour de la dette**. Chaque chantier finit par un ratchet qui descend. Sinon, dans 3 mois, on réécrit ce même plan.
