# 🎨 AUDIT — §8.6 : les 19 modules « teintés » restaurant hors chemin critique

> **Contexte** — Le `PLAN_COMPLET.md` §7.8 (§8.6) note qu'après ouverture de garage 3 modules teintés ont été
> généralisés (`fiscalite/tax` via `vatResolver`, `ops/service/pos` via `ServiceTicket`, `logistics/stock/inventory`
> via `stockProfile`), et qu'il reste **19 modules teintés hors chemin critique** dont la liste indicative
> énumère 10 items (`printers, reservations, onboarding, marketing, widgets, documents, reports, ia/fleet,
> ia/ai, floor-plan…`) sans détailler.
>
> Cet audit **lecture seule** cartographie ce qui est réellement teinté, regroupe par pattern de teinture,
> et propose un ordre de traitement fondé sur ce que chaque verticale a réellement besoin.
>
> **Gate mesuré** : TSC=0 · cycles=2 (baseline) @ `dd1ed4813` — reprise de la ligne §0.8 du plan.
>
> ✍️ Ce document n'engage aucun code. Il oriente. La généralisation d'un module se fait sous une session
> dédiée avec preuve gate.

---

## 0. TL;DR

| Ligne | Chiffre |
|-------|---------|
| Modules candidats identifiés | **21** (10 « listés » plan + 11 remontés à l'audit) |
| **Dead stubs** (2-3 lignes, à supprimer) | **2** |
| **Barrel violation** (déjà notée §0.8) | **1** |
| **Culinaire fondationnel** (rester food-only, gate `usesCulinaryStock`) | **4** |
| **Neutres** (rien à faire — vérifié) | **2** |
| **Vraiment à généraliser** (chantiers) | **12** |
| Occurrences globales `restaurantName\|couverts\|Couverts` dans `src/modules/` | **95** (44 fichiers) |

**Recommandation** : traiter d'abord les **2 dead stubs** (`table-management`, `housekeeping`) et le
**barrel violation** (`tip-pooling`) — c'est 3 items × ~5 min, ça sort du décompte sans effort.
Ensuite bucketiser par **pattern de teinture** — pas par module — parce que 3 modules partagent le même
symptôme (« Couverts » hardcodé dans une UI) et se traitent d'un même geste.

---

## 1. Méthode

Pour chaque module candidat :
1. **Fichiers** — `find src/modules/<m> -type f -name "*.ts" -o -name "*.tsx" | wc -l`
2. **Teintures brutes** — `grep -niE "cuisine|plat|couvert|menu|table\b|serveur"` (sous-comptage neutralisé
   des faux positifs : composants React `<table>`, imports `MenuItem`, dropdowns, etc.)
3. **Gating variant** — `grep "PlatformVariant|variant ?==|'restaurant'|resolveDNA"` : combien de modules
   ont déjà un gate ? (Réponse mesurée : **1 sur 21** — `marketing/marketing-engine.ts` a un `slug`
   défaut `'restaurant'` mais rien qui gate le comportement.)

**Observation clé** — Aucun module de cette liste n'utilise `variant === 'restaurant'` pour se gater.
La teinture est **implicite** (libellés, catégories, schémas) et non **explicite** (branchement runtime).
Cela signifie que **quand le variant change, aucune erreur ne remonte** — le module continue de fonctionner
en affichant « Couverts » à un garagiste. C'est une teinture UX/sémantique, pas fonctionnelle.

---

## 2. Buckets par pattern de teinture

### Bucket A — Dead stubs (à supprimer, effort XS)

| Module | Fichier | LOC | Contenu |
|--------|---------|-----|---------|
| `ops/workflow/table-management` | `index.ts` | 2 | `// Variant: table-management\nexport {};` |
| `ops/workflow/housekeeping` | `index.ts` | 2 | `// Variant: housekeeping\nexport {};` |

**Action** — supprimer les 2 dossiers (0 importateur — c'est un stub laissé lors de la reclassification
Genesis-Variant). Renvoie 21→**19** candidats sans effort.

### Bucket B — Barrel violation (déjà notée §0.8, effort XS)

| Module | Ligne |
|--------|-------|
| `human/remuneration/tip-pooling/index.ts` | `export * from '../../effectifs/hr/services/tipDistribution';` |

**Action** — soit remplacer par un vrai module (déplacer `tipDistribution.ts` ici), soit supprimer le
dossier et rediriger les importateurs. Ligne 826 du plan v4.5 : *« pas une coquille — redresser »*.

### Bucket C — Culinaire fondationnel (garder food-only + gate)

Ces modules sont **conçus** pour la cuisine, pas juste teintés. Le geste juste est **de les gater par
`usesCulinaryStock(variant)`** (déjà défini dans `logistics/stock/stockProfile.ts` §8.6 12/08) — un
garage/salon/retail n'ouvre plus la surface UI ni les abonnements Nexus.

| Module | Fic | Nature | Verrou proposé |
|--------|-----|--------|----------------|
| `compliance/qualite/haccp/*` | 67 | Chaîne du froid, hygiène alimentaire | `usesCulinaryStock(v)` — pas d'onglet HACCP pour garage/salon |
| `compliance/qualite/donation/FoodDonationService.ts` | 64L | Don alimentaire loi Garot | `usesCulinaryStock(v)` |
| `commerce/catalog/menu-engineering/MenuEngineeringService.ts` | 119L | Boston Matrix (star/dog/plow-horse/puzzle) | `usesCulinaryStock(v)` |
| `ops/production/kitchen/*` + `kds/*` + `recipes/*` | 46 | Cuisine, KDS, fiches recettes | `usesCulinaryStock(v)` déjà partiel via `inventory.sync.ts` |

**Action** — pour chaque, ajouter la condition de mount UI + le gating d'abonnement Nexus dans le
`.sync.ts` correspondant (motif `inventory.sync.ts` §8.6 12/08). **Rien à réécrire dans le service.**

⚠️ **Retail alimentaire** (boulangerie, épicerie fine) doit voir HACCP. `usesCulinaryStock` couvre déjà
`restaurant | hotel | bakery` — étendre à `retail` conditionnel (`variant === 'retail' && capabilities.food`).

### Bucket D — Neutres (rien à faire — vérifié)

| Module | Vérification |
|--------|--------------|
| `intelligence/ia/ai/*` (12 fic) | LLM router pur, 0 teinture (`grep restaurant\|plat\|couvert` = 0) |
| `ops/service/bar/store/barAtoms.ts` (1 fic, 16L) | Atomes Nexus `wines/cocktails/wineRegions` — schéma spécifique bar/hotel/restaurant, sans teinture UX. À gater par `capabilities.bar` si un jour un salon/garage l'ouvre. |

### Bucket E — Libellés UX teintés (config-only, effort S chacun)

Le pattern est identique : un libellé français **« Couverts »**, **« Bon cuisine »**, **« Nom
restaurant »** en JSX / string constant. Traité par un même geste : `verticals/<v>/labels.ts` +
`resolveLabels(variant)`. C'est la voie **§8.3 roleLabels** appliquée aux libellés métier.

| Module | Fic | Teintures | Symptôme précis |
|--------|-----|-----------|-----------------|
| `ops/service/printers/hardware/types.ts` | 1 | `PrinterRole = receipt \| kitchen \| bar \| label` + `KitchenTicket.tableLabel/serverName` + `ReceiptTicket.restaurantName` + `ROLE_LABELS` en dur | 4 renommages : `PrinterRole → prep\|receipt\|label`, `KitchenTicket → PrepTicket`, `tableLabel → contextLabel?`, `restaurantName → merchantName` |
| `commerce/fidelite/widgets/*` | 11 | `« Couverts »`, `« votre table est réservée chez restaurantName »`, `TableSchema` importé | Widget de réservation restaurant. À dupliquer/adapter par verticale via `<v>/widgets/` OU laisser en `restaurant-only` |
| `intelligence/analytique/reports/{weeklyReport,DailyFlashReport}.ts` | 2 | Email HTML `« couverts »` en `<td>`, `couvertsDelta` dans schéma report | Report `covers` = restaurant. À dupliquer en `unitCount + unitLabel` (couverts / interventions / séances / consultations) |
| `intelligence/ia/fleet/{FleetBenchmark,FleetRollout,QuantumOrchestrator,MarketOracle}.ts` | 4 | `couverts` col. hardcodée, `type: 'menu' \| 'config' \| 'template'`, `MENU_PERFORMANCE` pulse | Rollout `type` = catégorie générique de contenu (`catalog\|config\|template` p.ex.) |

### Bucket F — Réservation multi-contexte (S–M)

| Module | Fic | Nature | Effort |
|--------|-----|--------|--------|
| `commerce/relation/reservations/*` | 48 | Schéma `Reservation.covers` OK · UI hardcode « Couverts », « Nombre de couverts », `Table[]` importé de ops · `SimpleFloorPlanEditor` (dans onboarding) = 3 profils restaurant |  M — remplacer libellés + rendre `Table` optionnel selon verticale |

**Note importante** — Ce module est déjà **quasi polyvalent** : un salon, une clinic, un garage prennent
tous des rendez-vous ; le schéma tient. Seuls les libellés UI sont teintés. Chantier idéal après §8.3
généralisation labels métier.

### Bucket G — Onboarding source-spécifique (M)

| Module | Fic | Symptôme |
|--------|-----|----------|
| `commerce/acquisition/onboarding/*` | 65 | `guides/exportGuides.ts` = 4 restaurants (Zelty/L'Addition/Lightspeed Restaurant/Tiller) · `SimpleFloorPlanEditor` = 3 profils restaurant hardcodés · `OnboardingWizard` catégories `menu` |

**Action** — extraire dans `verticals/<v>/onboarding/`:
- `sourceSystems.ts` — la liste des SI concurrents à importer (`Zelty/L'Addition/…` pour restaurant,
  `MISTER/Planity` pour salon, `Doctolib` pour clinic, `Winkler` pour garage, `Cegid` pour retail)
- `guides.ts` — exportGuides par SI
- `floorPlanProfiles.ts` — profils par défaut par verticale (`Bistrot 20 couverts`, `Salon 8 postes`)

Puis dans `commerce/acquisition/onboarding/` : garder le moteur, résoudre par verticale à runtime.

### Bucket H — Marketing (S)

| Module | Fic | Symptôme |
|--------|-----|----------|
| `commerce/acquisition/marketing/*` | 61 | `marketing-engine.ts` : `slug: '…' \|\| 'restaurant'` + `name \|\| 'Restaurant'` · `CampaignAttributionService.couverts` col. hardcodée · `VisitHistory` UI `« Couverts »` |

**Action** — remplacer `couverts` par `unitCount` (déjà présent au schéma `Reservation.covers` — c'est
le libellé qui teinte), défaut slug `'business'` puis `identityDefaults.slug`.

### Bucket I — Documents événementiels (S–M)

| Module | Fic | Symptôme |
|--------|-----|----------|
| `finance/comptabilite/documents/PrivatisationContract.ts` | 446L | Contrat privatisation événement (mariage, séminaire) · `restaurantNom/Adresse/Tel/Email/Siret` en dur · `PrivatisationFormule = 'menu' \| 'cocktail_dinatoire' \| 'buffet'` |

**Action** — renommer en `EventContract.ts` + `merchantName/…` + Formule variant-specific (hôtel :
`séminaire\|conférence`, salon : `journée VIP`, clinic : rien). Adapters par verticale.

### Bucket J — Floor-plan (L, schéma-gelé)

| Module | Fic | Symptôme |
|--------|-----|----------|
| `facility/spaces/floor-plan/*` | 9 | `Table[]` importé de `@nexus/contracts` · `TableInsightPanel` UI restaurant-only · `FloorPlanGeometry.nextTableNumber(tables)` |

**Action** — chantier **schéma-gelé, opening-gated** (identique à `inventory` §8.6 12/08). Contrat
`Table` → `Space { id, kind: 'table' \| 'room' \| 'bay' \| 'seat' \| 'station', capacity, position }` +
overlay. À réserver pour l'ouverture d'une verticale qui l'exige (hôtel `room` déjà mappé §8.5 partiel,
garage `bay` avec `repair-bay/`).

---

## 3. Scoring effort × impact × gate

Notation :
- **Effort** — XS < 1h · S 1-4h · M 1-2j · L > 2j
- **Impact** — verticales bloquées si non traité (`—` = purement cosmétique)
- **Gate** — dépendance amont

| # | Bucket | Module | Effort | Impact | Gate |
|---|--------|--------|--------|--------|------|
| 1 | A | `ops/workflow/table-management` (stub) | XS | — | aucun — hygiène |
| 2 | A | `ops/workflow/housekeeping` (stub) | XS | — | aucun — hygiène |
| 3 | B | `human/remuneration/tip-pooling` (barrel viol.) | XS | — | aucun — hygiène §0.8 |
| 4 | C | `haccp/*` gate variant | S | retail/salon/garage/clinic (UI parasite) | `stockProfile` étendu |
| 5 | C | `donation/*` gate variant | XS | idem | `stockProfile` |
| 6 | C | `menu-engineering/*` gate variant | XS | idem | `stockProfile` |
| 7 | C | `production/kitchen+kds+recipes` gate variant complet | S | idem | `stockProfile` (partiel déjà fait 12/08) |
| 8 | E | `printers/hardware/types.ts` — rename `Kitchen*`→`Prep*`, `restaurantName`→`merchantName` | S | garage/salon/clinic (bon cuisine imprimé chez garage) | §8.3 labels |
| 9 | E | `widgets/*` — dupliquer ou marquer restaurant-only | S | garage/salon/clinic (widget de résa restaurant) | §8.3 labels |
| 10 | E | `reports/{weekly,DailyFlash}.ts` — remplacer `couverts`→`unitCount+unitLabel` | S | toutes verticales (email direction) | §8.3 labels |
| 11 | E | `ia/fleet/{Benchmark,Rollout,Quantum,Oracle}.ts` — MCC benchmark cross-verticale | M | MCC (super-admin verra `couverts` chez garagiste) | §8.3 labels + `resolveMetricAdapter` |
| 12 | F | `reservations/*` — libellés | M | salon/clinic (déjà mappé par `appointments`) | §8.3 labels |
| 13 | G | `onboarding/*` — sourceSystems + guides par verticale | M | garage/salon/clinic (impossibilité d'importer historique) | §8.3 labels + adapters |
| 14 | H | `marketing/*` — slug + `couverts`→`unitCount` | S | garage/salon/clinic (CRM affiche « Couverts ») | §8.3 labels |
| 15 | I | `documents/PrivatisationContract.ts` — renommer `EventContract` + adapters | M | hôtel (séminaires), salon (journées VIP) | §8.3 labels + `IVerticalContractAdapter` |
| 16 | J | `floor-plan/*` — contrat `Space` + overlays | L | hôtel (room), garage (bay), toutes | schéma-gelé — attend une ouverture qui l'exige |
| — | D | `ia/ai/*` — NEUTRE | 0 | — | — |
| — | D | `bar/barAtoms.ts` — NEUTRE (gater capabilities.bar si un jour) | 0 | — | — |

**Total effort** : 3× XS + 5× S + 4× M + 1× L → ~**8 j-h** hors floor-plan (L, opening-gated).

---

## 4. Séquence recommandée

### Vague 0 — hygiène (30 min)
- Supprimer `ops/workflow/table-management` + `ops/workflow/housekeeping` (2 stubs)
- Redresser `tip-pooling` (déplacer service OU supprimer dossier)

### Vague 1 — culinaire gate (½ j)
- Étendre `usesCulinaryStock(variant)` à `haccp / donation / menu-engineering / kitchen / kds / recipes` (surface UI + `.sync.ts`)
- Motif identique à `inventory.sync.ts` §8.6 12/08 — copier/adapter

**Prérequis** — 0 (`stockProfile.ts` existe déjà)

### Vague 2 — labels métier partagés (1 j)
- Créer `verticals/<v>/labels.ts` — un `Record<LabelKey, string>` par verticale (motif §8.3 `roleLabels`)
- `LabelKey` = `unit` (couverts/interventions/séances/consultations) · `contextLabel`
  (table/room/bay/station) · `merchant` (restaurant/garage/salon/clinic)
- Publier `resolveMetricLabels(variant)` dans `verticals/index.ts`

**Prérequis** — 0 (motif §8.3 déjà en place)

### Vague 3 — modules libellés (les 4 « E » + reservations + marketing) (2 j)
- `printers/hardware/types.ts` : rename `Kitchen*`→`Prep*`, `restaurantName`→`merchantName`
- `widgets/*` : soit restaurant-only avec header UI clair, soit adapters par verticale
- `reports/*` : `couverts`→`unitCount+unitLabel(variant)`
- `reservations/*` : libellés via `resolveMetricLabels(variant)`
- `marketing/*` : slug + `couverts`

**Prérequis** — Vague 2

### Vague 4 — MCC fleet cross-verticale (1 j)
- `intelligence/ia/fleet/FleetBenchmark.ts` : colonne dynamique par variant
- `FleetRollout.type = 'catalog' | 'config' | 'template'` (menu → catalog)

**Prérequis** — Vague 2 + `MetricAdapter` par verticale

### Vague 5 — onboarding par verticale (2 j)
- Extraire `sourceSystems` + `guides` + `floorPlanProfiles` dans `verticals/<v>/onboarding/`
- Résoudre à runtime dans `commerce/acquisition/onboarding/`

**Prérequis** — Vague 2 · condition ouverture verticale non-restaurant

### Vague 6 — documents événementiels (½ j)
- `PrivatisationContract` → `EventContract` + `IVerticalContractAdapter` × verticales concernées

**Prérequis** — Vague 3 (labels merchant)

### Vague 7 — floor-plan (schéma-gelé, opening-gated)
- Contrat `Space` + overlays — **attend une ouverture qui l'exige** (motif §8.6 inventory 12/08)

---

## 5. Dépendances croisées

```
    ┌─── Vague 0 (stubs, tip-pooling) ── indépendant
    │
    ├─── Vague 1 (culinaire gate) ── stockProfile ✓
    │
    └─── Vague 2 (labels partagés) ── §8.3 roleLabels ✓
             ├─── Vague 3 (printers/widgets/reports/reservations/marketing)
             ├─── Vague 4 (MCC fleet)
             ├─── Vague 5 (onboarding par verticale)
             └─── Vague 6 (documents évén.) — dépend aussi Vague 3
    
    Vague 7 (floor-plan) ── opening-gated (bloqué par ouverture verticale qui l'exige)
```

---

## 6. Risques & pièges

| Risque | Mitigation |
|--------|------------|
| **Régression restaurant** en généralisant labels | Défaut `resolveMetricLabels()` = restaurant → aucun changement UX pour le tenant existant |
| **Faux positif teinture** — `<table>` HTML confondu avec `Table` métier | Grep de teinture doit exclure `<table\|Table<\|tableRow` (déjà appliqué dans cet audit) |
| **Vague 5 (onboarding)** déclenche N×M chantiers importers | Ne l'ouvrir qu'à l'ouverture effective d'une verticale non-restaurant (pas de spéculation) |
| **Widgets** — 11 fichiers restaurant intégrés | Restaurant-only assumé jusqu'à demande commerciale explicite ; header UI clair (`« Widget de réservation restaurant »`) |
| **HACCP** en `usesCulinaryStock` — cas retail alimentaire | Étendre gate à `variant === 'retail' && capabilities.food` avant de gater dur |

---

## 7. Ce qui ne fait PAS partie de cet audit

- **Ouverture de nouvelles verticales** — c'est la conséquence de ce nettoyage, pas ce nettoyage.
- **Contrats de données schéma-gelés** (`Ingredient → StockItem`, `Table → Space`) — voir `PLAN_COMPLET.md`
  §7.8 « schéma-gelé, opening-gated ».
- **Refonte UI** (§6) — c'est un chantier design system, orthogonal.
- **MCC EInvoicing/Exchange** — séparé (§7.2 + §8 alignement MCC).

---

## 8. Preuve gate baseline

Mesuré au HEAD (`agent-gate.sh`) — reprise §0.8 du plan v4.5 :

```
TSC : 0 erreurs
Cycles : 2 (baseline finance/billing)
Kernel→modules : 0
Shared→modules : 0
Store→modules : 0
Barrels : 0
```

Cet audit n'a touché **aucun fichier** sauf ce document et `.claude/sessions.md`.

---

*Rédigé 2026-08-12 · session `tour-s86-teintes` · lecture seule + 1 `.md`.*
*Sources : `PLAN_COMPLET.md` §7.8, `PLAN_COMPLET.md` §0.8, `logistics/stock/stockProfile.ts`,*
*`verticals/*/roles.ts` (motif §8.3), 21 modules inspectés fichier par fichier.*
