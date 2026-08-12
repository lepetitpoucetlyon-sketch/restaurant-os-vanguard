# ✅ VÉRIFICATION & RECLASSIFICATION — 11 août 2026 (session `mapping-verticales`)

> **Mission d'analyse, lecture seule — aucun fichier `src/` modifié.** Ce bloc re-mesure chaque chiffre du
> document d'origine (conservé plus bas), puis remplace la classification « générique vs sectoriel » — faite
> **par nom de module** — par une classification **fondée sur le code lu**. Toute affirmation est accompagnée
> de sa commande. Livrables liés : `SPEC_SERVICE_TICKET.md`, `MAPPING_EVENEMENTS_VERTICALES.md`.
>
> Contexte de départ vérifié : branche `fix/coherence-ui-backend-securite` · **TSC 0** · **806 tests passed**.

---

## A — Vérification des chiffres (✅ conforme · ⚠️ dérive <10 % · ❌ faux ≥10 % ou nature différente)

| § | Affirmation d'origine | Mesuré (2026-08-11) | Verdict |
|---|-----------------------|---------------------|:---:|
| en-tête | « 2 122 fichiers » | **2 572** tous · **2 450** hors tests (`find src -name "*.ts*"`) | ❌ non reproductible |
| 1 | kernel 188 / 13 694 | 188 / 13 694 | ✅ |
| 1 | orchestration 196 / 13 760 | 196 / 13 760 | ✅ |
| 1 | design 153 / 22 244 | 153 / 22 244 | ✅ |
| 1 | shared 135 / 10 209 | 135 / 10 209 | ✅ |
| 1 | lib 176 / 13 811 | 176 / 13 811 | ✅ |
| 1 | store 21 / 513 | 21 / 513 | ✅ |
| 1 | **TOTAL socle 878 / 75 399** | somme des 6 lignes = **869 / 74 231** ; le total 878/75 399 n'est atteint qu'en **ajoutant `config/` (9/1168), non affiché** | ⚠️ total inclut une ligne cachée |
| 2 | piliers **1 099** fic. | **1 099** (`find src/modules -name "*.ts" -o -name "*.tsx"`) | ✅ |
| 2 | ventilation par pilier (ops 210, finance 171, compliance 123, human 106, logistics 76…) | ops **206**, finance **169**, compliance **121**, human **104**, logistics **73**, commerce 242, intelligence 140, facility 41, **+ mcc 2 (non mentionné)** ; somme réelle 1 098 (+1 barrel racine = 1 099) | ⚠️ ventilation d'origine gonflée (somme interne = 1 109 ≠ 1 099) |
| 2 | **965 génériques / 134 sectoriels (88 %)** | classification **par nom** — **refaite en §B** | ❌ méthode |
| 2 synth. | **18 coquilles sectorielles** | **41 coquilles `export {}`** au total, dont **~23 sectorielles** ; `bar` (16 l. d'atoms) et `tip-pooling` (re-export réel) mal classés en coquille par le doc | ❌ sous-compté |
| 3.1 | `ops/service/core` = 30 l. · `ops/workflow/core` = 23 l. | 30 · 23 | ✅ |
| 3.1 | `ServiceTicket` absent | `grep -rn "ServiceTicket" src/` → **0** | ✅ |
| 4 | 9 adapters / verticale | restaurant 9 ✅ | ✅ |
| 4 | 72 événements verticales | **72** = **66 verticaux + 6 `connectors.*` (génériques)** | ✅ (nuance) |
| 4 | 241 événements totaux | 241 | ✅ |
| 4 | 166 handlers | 166 | ✅ |
| 4 | « 137 génériques » | non vérifiable tel quel ; mesure par événement : **0/72 servis, 42/66 réutilisables** (voir `MAPPING_EVENEMENTS_VERTICALES.md`) | ⚠️ |
| 4 | 38 capabilities nav | 38 | ✅ |
| 5 | événements par verticale (hotel 13, garage 14, clinic 14, bakery 9, salon 8, retail 8) | 13 / 14 / 14 / 9 / 8 / 8 | ✅ |
| 5 | adapters « 🟠 squelettes sauf restaurant » | **les 7 verticales ont leurs 9 adapters** (90–123 l.) ; restaurant (123) à peine plus gros | ❌ |
| §3.3 | `IVerticalInvoicingAdapter` absent | `find src -name "*InvoicingAdapter*"` → **0** ; `finance/**/invoicing/` → **0** | ✅ |
| §3.2 | `ServiceSubject` absent | `grep -rniE "ServiceSubject" src/` → **0** | ✅ |
| §3.4 | `roleLabels` absent | `grep -rn "roleLabels" src/` → **0** ; aucun `verticals/*/roles.ts` | ✅ |
| §3.6 | « aucun read model » | `grep -rniE "readModel|projection|materializ" src` → **7** (quasi-nul) | ✅ |

**Bilan A : 15 ✅ · 5 ⚠️ · 5 ❌.** Les chiffres d'**infrastructure** (socle par dossier, 1099, 241, 166, 38,
événements) sont exacts. Les **classifications** et **synthèses** (88 %, 18 coquilles, adapters « squelettes »,
ventilation par pilier, 2122 fichiers) sont fausses ou non reproductibles.

---

## B — Reclassification par LECTURE du code (4 classes)

**Méthode.** Les 147 modules `src/modules/<pilier>/<domaine>/<module>/` ont été scannés pour : lignes,
**marqueurs sectoriels** (`couvert|convive|CourseType|plat|recette|allergen|haccp|DLC|pourboire|table|barman|
cuisson|kitchen|kds`), **couplage structurel restaurant** (`couverts|CourseType|TableSchema|useTables|
PosTicket|haccp_readings|pageType:menu`), et **imports sectoriels**. Les modules à signal fort ont été **lus**
(types de domaine, pas seulement le nom).

### B.1 — Marqueurs établis par lecture de `kitchen` + `pos`

Densité mesurée dans `ops/production/kitchen` + `ops/service/pos` : `table` 86 · `course/CourseType` 67 ·
`allergen` 65 · `convive` 33 · `tip/pourboire` 32 · `plat` 20 · `recette/recipe` 10. Preuve de couplage
structurel : `pos/hooks/usePos.ts:13,55,61` importe `CourseType`, tient `selectedTableId`, `tipInMicrounits`.

### B.2 — Résultat : le vrai ratio en 4 classes

| Classe | Modules | % mod. | Fichiers | % fic. | Critère |
|--------|:---:|:---:|:---:|:---:|---------|
| **GÉNÉRIQUE PUR** | **77** | 52 % | 303 | 33 % | 0 marqueur, 0 couplage — réutilisable tel quel |
| **GÉNÉRIQUE TEINTÉ** | **21** | 14 % | **447** | **49 %** | générique mais **porte des présupposés restaurant** |
| **SECTORIEL** | **6** | 4 % | 116 | 13 % | concept mono-industrie (cuisine/HACCP food service) |
| **COQUILLE** | **43** | 29 % | 43 | 5 % | ≤ 5 lignes / `export {}` |

*(147 modules du domaine, 909 fichiers ; les ~190 fichiers restants du `find src/modules` sont l'infra de
pilier — `domain/schemas`, `providers`, `services` racine — transversale et non classée par module.)*

> 🎯 **L'écart avec les 88 % annoncés.** Le « 88 % générique » compte un module comme générique si **son nom**
> n'est pas celui d'une verticale. Par **lecture du code**, **21 modules (447 fichiers = 49 % du code métier)**
> que le doc classe « générique » portent en réalité des présupposés restaurant → classe **TEINTÉ**. Le
> vraiment-réutilisable-tel-quel n'est donc pas 88 % mais **~33 % des fichiers / 52 % des modules**. Le reste
> « générique » du doc est du **teinté** (à généraliser) ou de la **coquille** (à remplir).

### B.3 — 🟠 Modules TEINTÉS : le présupposé à lever (le vrai livrable)

> Chaque ligne : ce qui *semble* réutilisable, **le présupposé restaurant précis**, ce qu'il faut généraliser.
> Preuve = chemin exact lu.

| Module (classé « générique » par le doc) | Fic. | Présupposé restaurant (preuve) | À généraliser en |
|------------------------------------------|:---:|--------------------------------|------------------|
| `ops/service/pos` | 72 | `tableId`, `covers`, `CourseType`, `tipInMicrounits` (`usePos.ts:13,55,61`; `pos.ts:19,55,58`) | `ServiceTicket` + `resourceId` + métrique déléguée (`SPEC_SERVICE_TICKET.md`) |
| `ops/service/printers` | 18 | routage station **cuisine/bar** codé en dur (`kitchen` 9, `bar` 6, `kds` 1) | routage station paramétré par verticale |
| `ops/workflow/engine` | 23 | importe `PosTicket, CartLine` de `ops/domain/schemas/pos` (`engine/types.ts:19`) + `CourseType` | moteur sur `ServiceTicket`, pas `PosTicket` |
| `commerce/relation/reservations` | 46 | **91 occ. `table`** — réservation **de tables** ; or `resource-booking` et `appointments` (génériques) sont des coquilles vides | booking de ressource générique (créneau × ressource) |
| `commerce/acquisition/onboarding` | 65 | import concurrent présuppose **menu/tables/recettes/HACCP** (`restaurant` 34, `menu` 39, `haccp` 6) | wizard piloté par les entités déclarées de la verticale |
| `commerce/acquisition/marketing` | 59 | attribution ROI en **`couverts`** (`CampaignAttributionService.ts:8,61`), SEO `pageType:'menu'` | métrique de conversion déléguée |
| `commerce/acquisition/landing` | 2 | gabarits de landing restaurant | blocs de landing par verticale |
| `commerce/catalog/menu-engineering` | 2 | nom « menu » — mais c'est la **matrice BCG star/puzzle/plow/dog** (product-mix), transposable | renommer `product-mix`, garder la logique |
| `commerce/fidelite/widgets` | 11 | widgets de **booking de tables** (`OnlineBookingToggle.tsx` : `TableSchema`, `Couverts`) | widgets de booking de ressource |
| `finance/fiscalite/tax` | 6 | 🔴 **`vatResolver.ts:42-43`** : mots-clés TVA **en dur** (`entrée\|plat\|dessert\|pizza\|burger\|menu`→food) | `IVerticalInvoicingAdapter` (§3.3) — **bloque toute autre verticale** |
| `finance/comptabilite/documents` | 4 | `PrivatisationContract.ts` : `cocktail_dinatoire\|buffet`, `nombreConvives` | contrat d'événement générique (le reste du module est pur) |
| `finance/comptabilite/analytics` | 4 | KPI restaurant (couverts) | KPI délégués |
| `human/effectifs/hr` | 52 | 🔴 **libellés de rôles en dur** : `Barman`, `Chef de cuisine`, `Commis` (`QuickAddStaffModal.tsx:13-15`) + `tipDistribution.ts:17` `role:'barman'` | `roleLabels` par verticale (§3.4) |
| `logistics/stock/inventory` | 33 | stock **alimentaire** : `ingredient` 34, `recipe` 27, `DLC` 24 (vs `part` 4) | stock d'items génériques (SKU/pièce/lot) |
| `intelligence/analytique/reports` | 3 | KPI **`covers`** 8 + `table` 7 | presets de rapport par verticale |
| `intelligence/analytique/services` | 3 | agrégats restaurant | délégués |
| `intelligence/ia/fleet` | 13 | benchmark en **`couverts`** (`FleetBenchmark.ts:6,57`), rollout `type:'menu'`, importe `HACCPTelemetryBridge` | benchmark métrique déléguée + retirer HACCP en dur |
| `intelligence/ia/ai` | 11 | agent Hermès **HACCP en dur** (`HermesEngine.ts:64` `haccp_readings`) | agent conformité par verticale |
| `intelligence/ia/simulator` | 9 | métrique `activeConvives` (`TemporalSimulator.ts:15`) — *note : `SimulatorDB` `Table` = `Dexie.Table`, faux positif* | métrique de charge déléguée |
| `facility/spaces/floor-plan` | 9 | **86 occ. `table`**, fichiers `TableChairs.tsx`, `TableInsightPanel.tsx` | plan de ressources positionnées (le `zone`, 50 occ., est déjà générique) |
| `facility/spaces/hooks` | 2 | hooks de plan de table | hooks de plan génériques |

> **Les 3 plus dangereux à l'ouverture du garage** : `tax/vatResolver` (facturation fausse), `pos`
> (tout le flux de prise en charge), `inventory` (stock pensé en recettes/DLC, pas en pièces).

### B.4 — SECTORIEL (6 modules, vrai code mono-industrie restaurant food service)

`compliance/qualite/haccp` (7 954 l.) · `ops/production/kitchen` (3 463) · `ops/production/kds` (1 632) ·
`ops/production/recipes` (799) · `compliance/qualite/donation` (dons alimentaires, loi Garot) ·
`ops/service/bar` (16 l., atoms). *(`recall` = rappel produit → générique cross-industrie, laissé en PUR ;
`kds` a un cœur « file de tickets par station » transposable au garage, mais son implémentation est food.)*

---

## C.2 — Table d'équivalence des modules sectoriels COQUILLES

> Pour rendre l'ouverture d'une verticale **mécanique**. Chaque coquille → module générique parent (dont elle
> hérite) → module restaurant de référence → événements déjà déclarés → handlers réutilisables.
> **Correction** : le doc annonce 18 coquilles sectorielles ; il y en a **~23** (liste ci-dessous).

| Module coquille | Vertic. | Générique parent | Réf. restaurant | Événements déclarés | Handlers réutilisables |
|-----------------|:---:|------------------|-----------------|---------------------|------------------------|
| `ops/service/repair-intake` | garage | `ops/service/core` (`ServiceTicket`) | `ops/service/pos` | `auto.vehicle_checked_in/released` | cascade `ServiceTicket` (SPEC) |
| `ops/production/repair-bay` | garage | `ops/production/core` | `ops/production/kds` | `auto.repair_started` | 🔴 neuf (file par poste) |
| `commerce/catalog/spare-parts` | garage | `commerce/catalog/core` | `logistics/stock/inventory` | `auto.part_consumed/reorder_needed` | `StockDeductionHandler`, `StockAlertHandler` |
| `logistics/fleet/courtesy-cars` | garage | `logistics/fleet/core` | — | (aucun) | 🔴 neuf |
| `intelligence/ia/diagnostic-assist` | garage | `intelligence/ia/core` | `intelligence/ia/ai` | `auto.diagnostic_completed` | 🔴 neuf |
| `finance/comptabilite/warranty-claims` | garage/retail | `finance/comptabilite/core` | `finance/comptabilite/billing` | `auto.warranty_claim_submitted` | 🔴 neuf (ligne à 0 €) |
| `logistics/stock/serial-tracking` | retail/garage | `logistics/stock/inventory` | `logistics/stock/inventory` | `retail.stock_alert` | `StockAlertHandler` |
| `facility/spaces/bays` | garage | `facility/spaces/core` | `facility/spaces/floor-plan` | (facility) | `floor-plan` (via généralisation) |
| `ops/service/front-desk` 🟠 | hôtel | `ops/service/core` | `ops/service/pos` | `hotel.guest_checked_in/out` | cascade `ServiceTicket` (a déjà `WaitlistManager.ts`) |
| `ops/workflow/housekeeping` | hôtel | `ops/workflow/core` | `ops/workflow/table-management` | `hotel.housekeeping_task_created` | `facility.maintenance_required` |
| `commerce/acquisition/ota-sync` | hôtel | `commerce/acquisition/core` | `ops/connectors/reservations` | `hotel.room_booked` | handlers réservation |
| `facility/spaces/rooms` | hôtel | `facility/spaces/core` | `facility/spaces/floor-plan` | `hotel.room_status_changed` | `floor-plan` généralisé |
| `facility/spaces/beds` | hôtel/clinique | `facility/spaces/core` | `facility/spaces/floor-plan` | `health.bed_status_changed` | `floor-plan` généralisé |
| `ops/service/consultation` | clinique | `ops/service/core` | `ops/service/pos` | `health.patient_admitted/discharged` | cascade `ServiceTicket` (**PII**) |
| `ops/production/lab` | clinique/boul. | `ops/production/core` | `ops/production/kitchen` | (aucun) | 🔴 neuf |
| `commerce/acquisition/doctolib-sync` | clinique | `commerce/acquisition/core` | `commerce/relation/reservations` | `health.appointment_booked` | handlers réservation |
| `finance/comptabilite/insurance-billing` | clinique | `finance/comptabilite/core` | `finance/comptabilite/billing` | `health.insurance_claim_submitted` | 🔴 neuf (tiers-payant) |
| `compliance/reglementaire/medical-secrecy` | clinique | `compliance/reglementaire/rgpd` | `compliance/reglementaire/rgpd` | `health.hds_audit_log` | handler audit/RGPD |
| `compliance/reglementaire/waivers` | clinique/salon | `compliance/reglementaire/core` | `compliance/reglementaire/rgpd` | `health.consent_recorded` | handler conformité |
| `compliance/qualite/bio-hazard` | clinique | `compliance/qualite/core` | `compliance/qualite/haccp` | (aucun) | HACCP généralisé |
| `ops/production/batch-planner` | boulangerie | `ops/production/core` | `ops/production/kitchen` | `bakery.batch_started/completed` | 🔴 neuf (production) |
| `logistics/stock/perishables` | resto/boul. | `logistics/stock/inventory` | `logistics/stock/inventory` | `dlc.expired` | **`DLCExpiryHandler`, `DLCBlockerHandler`, `DLCExpiryJob`** ✅ |
| `commerce/relation/appointments` | salon/clinique | `commerce/relation/core` | `commerce/relation/reservations` | `salon.appointment_booked` | handlers réservation |

*Le détail événement-par-événement des cascades (les 72 → handlers, taux de couverture 64 %) est dans
`MAPPING_EVENEMENTS_VERTICALES.md`.*

---

## C.4 — Les 4 manques de base : confirmés + 2 non vus par le doc

| Manque | Commande | Résultat | Statut |
|--------|----------|----------|:---:|
| §3.1 `ServiceTicket` | `grep -rn "ServiceTicket" src/` | 0 | 🔴 confirmé absent |
| §3.2 `ServiceSubject` | `grep -rniE "ServiceSubject" src/` | 0 | 🔴 confirmé absent |
| §3.3 `IVerticalInvoicingAdapter` | `find src -name "*InvoicingAdapter*"` | 0 | 🔴 confirmé absent |
| §3.4 `roleLabels` | `grep -rn "roleLabels" src/` + `verticals/*/roles.ts` | 0 / 0 | 🔴 confirmé absent |

**Manques supplémentaires trouvés (non listés par le doc) :**

1. 🔴 **La TVA restaurant est câblée dans le moteur, pas seulement « l'adapter manque ».** `finance/fiscalite/tax/vatResolver.ts:42`
   contient une **liste de plats** pour choisir le taux. Tant qu'elle y est, `IVerticalInvoicingAdapter` ne
   suffit pas : il faut **retirer** la logique restaurant du moteur, pas seulement ajouter une couche.
2. 🔴 **Aucun pont d'événements vertical → générique.** Les 72 événements sont émis mais 0 consommé par un
   handler métier. Le point d'ancrage #7 (« handlers de cascade ») devrait être **un `VerticalEventBridge`**
   (traduire `auto.invoice_issued → order.paid`), pas des handlers dupliqués 7 fois. Voir `MAPPING_EVENEMENTS_VERTICALES.md` §4.
3. 🟠 **`tip-pooling` (human/remuneration) n'est pas une coquille** : c'est un **re-export** de
   `hr/services/tipDistribution` (`export * from '../../effectifs/hr/services/tipDistribution'`) — et une
   **violation de barrel** (import relatif profond inter-domaines). À redresser, pas à remplir.

---

## Réponses aux 3 questions qui font la valeur de la mission

1. **Quels modules semblent génériques mais portent des présupposés restaurant ?** → **21 modules / 447 fic.**
   (§B.3). Les 3 qui casseront à l'ouverture du garage : `tax/vatResolver`, `pos`, `inventory`.
2. **Sur les 72 événements, combien déjà servis par un handler générique ?** → **0 aujourd'hui** ; **42/66
   (64 %) réutilisables par branchement**, 19 partiels, 5 neufs (`MAPPING_EVENEMENTS_VERTICALES.md`).
3. **Les 4 « prises en charge » sont-elles la même opération ?** → **OUI**, machine à 6 phases confirmée par
   lecture, avec **3 délégations** (durée/PII/sous-cycle). `repair-intake` par-dessus ≈ **85 lignes < 100** →
   abstraction **fondée** (`SPEC_SERVICE_TICKET.md`).

---
---

> ⬇️ **DOCUMENT D'ORIGINE (11 août 2026) conservé tel quel ci-dessous.** Les chiffres qu'il contient sont
> ceux d'avant re-mesure ; se référer au bloc de vérification ci-dessus en cas de divergence.

---

# 🗺️ MAPPING COMPLET — Base, piliers et verticales

> Mesuré le **11 août 2026** sur 2 122 fichiers.
> Objectif : savoir **ce qui est réutilisable**, **ce qui manque comme base**, et **ce qu'il reste à écrire par verticale** — avant d'en ouvrir une nouvelle.

---

# 1. LA BASE — 3 couches, 100 % réutilisables

| Couche | Fic. | Lignes | Contenu | Sectoriel ? |
|--------|-----:|-------:|---------|-------------|
| **`kernel/`** | 188 | 13 694 | `nexus` (contrats, guards, vault, state) · `adapter` (Nexus, interceptor, Firestore) · `auth` · `branding` · `services` · `workers` | ❌ **0 %** |
| **`orchestration/`** | 196 | 13 760 | `events` (241 déclarés) · `handlers` (166) · `middleware` · `registerHandlers` | 17 % |
| **`design/`** | 153 | 22 244 | `ui` (39 composants) · `layout` · `settings` · `rbac` · `voice` · `atomic` · `integrations` | ❌ **0 %** |
| `shared/` | 135 | 10 209 | `hooks` · `utils` · `providers` · `contexts` · `plugins` · `seeds` · `rbac` · `schemas` | ❌ 0 % |
| `lib/` | 176 | 13 811 | `mcc` · `cron` · `sync` · `offline` · `server` · `storage` · `push` · `chaos` | ❌ 0 % |
| `store/` | 21 | 513 | `pillars` · `selectors` | ❌ 0 % |
| **TOTAL SOCLE** | **878** | **75 399** | | **≈ 97 % réutilisable** |

> ✅ **Cette couche ne se réécrit jamais.** Auth, multi-tenant, souveraineté, scellement NF525, bus d'événements, DLQ, design system, MCC, provisioning, offline, cron — tout est acquis pour les 8 industries.

---

# 2. LES PILIERS — générique vs sectoriel

**1 099 fichiers.** Chaque pilier a un socle générique + des modules sectoriels.

## Légende de remplissage
✅ rempli · 🟠 amorcé · 🔴 coquille (`export {}`, 2 lignes)

## ops — 210 fic.

| Domaine | Modules GÉNÉRIQUES | Modules SECTORIELS | État |
|---------|--------------------|--------------------|------|
| `service` | `core` 🔴 30 l. · `pos` ✅ · `printers` ✅ | `bar` 🔴 16 l. *(resto)* · `front-desk` 🟠 82 l. *(hôtel)* · `consultation` 🔴 *(clinique)* · `repair-intake` 🔴 *(garage)* | |
| `production` | `core` | `kitchen` ✅ 3 463 l. · `kds` ✅ 1 632 l. · `recipes` ✅ 799 l. *(resto)* · `lab` 🔴 · `batch-planner` 🔴 *(boulangerie)* · `repair-bay` 🔴 *(garage)* | |
| `workflow` | `core` 🔴 23 l. · `engine` ✅ · `services` · `table-management` | `housekeeping` 🔴 *(hôtel)* | |
| `connectors` | `delivery` · `reservations` | — | |

## commerce — 242 fic.

| Domaine | GÉNÉRIQUES | SECTORIELS |
|---------|-----------|------------|
| `acquisition` | `core` · `landing` · `marketing` · `onboarding` · `seo` | `doctolib-sync` *(clinique)* · `ota-sync` *(hôtel)* |
| `relation` | `appointments` · `core` · `crm` · `customers` · `delivery` · `loyalty` · `reservations` · `services` | — |
| `catalog` | `core` · `services` | `menu-engineering` 🟠 125 l. *(resto)* · `spare-parts` 🔴 *(garage)* |
| `fidelite` | `loyalty` · `quotes` · `widgets` | — |

## finance — 171 fic. — **100 % générique sauf 2**

| Domaine | GÉNÉRIQUES | SECTORIELS |
|---------|-----------|------------|
| `comptabilite` | `accounting` · `analytics` · `billing` · `documents` · `fec` · `repositories` · `services` | `insurance-billing` 🔴 *(clinique)* · `warranty-claims` 🔴 *(retail/garage)* |
| `fiscalite` | `core` · `nf525` · `tax` | — |
| `tresorerie` | `ap` · `banking` · `collection` · `deposit` · `payout` · `split-bill` | — |
| `connectors` | `accounting` · `invoices` · `payments` | — |

> 🎯 **Le pilier le plus rentable.** Facturation, TVA, NF525, banque, encaissement, FEC — tout est acquis pour les 8 industries.

## compliance — 123 fic.

| Domaine | GÉNÉRIQUES | SECTORIELS |
|---------|-----------|------------|
| `reglementaire` | `core` · `rgpd` · `services` | `medical-secrecy` 🔴 · `waivers` 🔴 *(clinique)* |
| `securite` | `audit` | — |
| `qualite` | `core` · `calendar` · `iot` · `recall` | `haccp` ✅ **7 954 l.** *(resto)* · `donation` 🟠 *(resto)* · `bio-hazard` 🔴 *(clinique)* · `safety-protocols` 🔴 |

## human — 106 fic. — **quasi 100 % générique**

| Domaine | GÉNÉRIQUES | SECTORIELS |
|---------|-----------|------------|
| `effectifs` | `core` · `hr` · `resource-booking` · `services` · `shift-bidding` | — |
| `remuneration` | `commissions` · `core` · `payroll` · `services` | `tip-pooling` 🔴 *(resto)* |
| `connectors` | `payroll` · `recruitment` · `timeclock` | — |

## logistics — 76 fic.

| Domaine | GÉNÉRIQUES | SECTORIELS |
|---------|-----------|------------|
| `stock` | `core` · `inventory` · `services` | `perishables` 🔴 *(resto)* · `serial-tracking` 🔴 *(retail/garage)* |
| `approvisionnement` | `core` · `edi-b2b` · `procurement` · `reception` | — |
| `fleet` | `core` · `delivery` | `courtesy-cars` 🔴 *(garage)* |

## intelligence — 140 fic. — **100 % générique sauf 1**

`analytique` (analytics, anomaly, attendance, reports, yield-management) · `ia` (agency, ai, fleet, realtime, resilience, simulator, tools) · `knowledge` (rag) · `simulation` — tout générique.
Seul sectoriel : `diagnostic-assist` 🔴 *(garage)*

## facility — 41 fic.

| Domaine | GÉNÉRIQUES | SECTORIELS |
|---------|-----------|------------|
| `spaces` | `core` · `floor-plan` · `hooks` · `settings` | `rooms` 🔴 · `beds` 🔴 *(hôtel)* · `bays` 🔴 *(garage)* |
| `maintenance` | `core` · `iot-monitoring` · `registre` · `services` | — |

## Synthèse piliers

| | Fichiers | Part |
|---|---:|---:|
| Modules **génériques** | **965** | **88 %** |
| Modules **sectoriels remplis** (resto) | 116 | 10 % |
| Modules **sectoriels coquilles** | 18 | 2 % |

---

# 3. 🔴 CE QUI MANQUE COMME BASE

> **Section la plus importante de ce document.** Ces manques touchent **toutes** les verticales. Les combler avant d'en ouvrir une nouvelle évite de les réinventer 8 fois.

## 3.1 — 🔴 L'abstraction « prise en charge » n'existe pas

**Le manque le plus structurant.** Ces quatre opérations sont **la même** :

| Verticale | Opération | Module |
|-----------|-----------|--------|
| restaurant | ouverture de table | `ops/service/pos` |
| garage | prise en charge véhicule | `ops/service/repair-intake` 🔴 |
| hôtel | check-in client | `ops/service/front-desk` 🟠 |
| clinique | accueil patient | `ops/service/consultation` 🔴 |

**Le motif commun** : on reçoit une entité, on ouvre un ticket de service, on l'assigne à une ressource, on suit son avancement, on le clôture, on facture.

**État mesuré** :
```
ops/service/core      →  30 lignes (index + domain/types + .gitkeep)
ops/workflow/core     →  23 lignes
grep -r "ServiceTicket" src/  →  0 résultat
```

**Sans cette abstraction, chaque verticale réécrit le même cycle de vie.** Avec elle, ouvrir le garage = fournir un vocabulaire et deux champs.

- [ ] 🔴 **Écrire `ops/service/core` comme le vrai socle** : entité `ServiceTicket` (ouverture, ressource assignée, statut, clôture, lien facture), machine à états, événements génériques
- [ ] Faire de `pos` (restaurant) une **spécialisation** de ce socle — c'est la preuve que l'abstraction est juste
- [ ] Les 3 autres verticales n'écrivent alors qu'un adapter de vocabulaire

> 💡 **Le test qui valide l'abstraction** : si `repair-intake` peut être écrit en moins de 100 lignes une fois `service/core` fait, l'abstraction est bonne. S'il en faut 800, elle est fausse.

## 3.2 — 🔴 L'entité « bien pris en charge » n'existe pas

Le ticket de service porte toujours **quelque chose** :

| Verticale | Entité | Attributs propres |
|-----------|--------|-------------------|
| garage | véhicule | immatriculation, VIN, kilométrage, historique |
| hôtel | chambre + séjour | dates, occupants, taxe de séjour |
| clinique | patient | 🔴 **données de santé** — régime RGPD art. 9 |
| retail | article sérialisé | n° de série, garantie |
| restaurant | table | couverts, zone |

- [ ] Définir un contrat `ServiceSubject` dans `kernel/nexus/contracts/`
- [ ] ⚠️ Prévoir dès la conception que le sujet peut être une **personne physique** (clinique) → `PiiVault` obligatoire, jamais en clair dans un document fiscal

## 3.3 — 🔴 `IVerticalInvoicingAdapter` n'existe pas

Aucune verticale ne peut facturer correctement aujourd'hui. Les règles diffèrent :

| Verticale | Spécificité |
|-----------|-------------|
| hôtel | **taxe de séjour** — collectée pour la commune, ni CA ni TVA |
| clinique | **actes médicaux exonérés de TVA** |
| garage | garantie = ligne à 0 € qui doit apparaître |
| boulangerie | **le même croissant** change de taux selon la consommation |

→ Voir plan §7.8. **À écrire avant le premier connecteur PA**, sinon le restaurant sera câblé en dur dans le moteur.

## 3.4 — 🔴 Le RBAC est mono-industrie

11 rôles, **tous restaurant** (`chef_rang`, `serveur`, `barman`, `plongeur`…).
→ Voir plan §3.0 Décision 3 : séparer **NIVEAU** (universel) et **LIBELLÉ** (par verticale).

- [ ] `verticals/<v>/roles.ts` — table `Record<number, string>`

## 3.5 — 🟠 `withRoleGuard` ne protège que 6 handlers sur 166

La matrice de permissions existe mais n'est appliquée qu'à **4 %** des cascades.
Non urgent aujourd'hui (un événement ne s'émet pas depuis l'extérieur), **critique** quand le Nexus Exchange fera traverser des événements entre tenants.

## 3.6 — 🟠 Aucun read model / projection

Une fiche client riche = 7 requêtes jointes dans le navigateur.
→ Voir plan §6.5. **Plafonne la profondeur d'UI de toutes les verticales.**

## 3.7 — 🔴 Aucun moteur de migration de schéma à l'échelle flotte

10 000 tenants, un changement de schéma. Rien ne couvre ça.
Aggravé par le NF525 : les données scellées ne sont **jamais** migrables.

- [ ] Séparer explicitement **mutable** (migrable, versionné) et **scellé** (figé à vie)

## 3.8 — 🟠 Le variant `custom` n'a pas de tokens

C'est pourtant celui censé porter l'UI sur mesure. Un client `custom` retombe sur les tokens globaux.

---

# 4. LES 12 POINTS D'ANCRAGE D'UNE VERTICALE

> Dérivés de ce que `restaurant` déclare réellement.

| # | Point | Emplacement | État pour les 8 |
|---|-------|-------------|-----------------|
| 1 | `PlatformVariant` | `modules/system/domain/schemas/tenant.ts` | ✅ 8 déclarés |
| 2 | ADN de provisioning | `shared/seeds/<v>-full-dna.ts` | ✅ 8 seeds |
| 3 | Plugin UI + `scopedTokens` | `verticals/<v>/ui.ts` | ✅ 8 *(sauf tokens `custom`)* |
| 4 | Classe verticale | `verticals/<v>/<V>Vertical.ts` | ✅ 8 |
| 5 | **9 adapters de pilier** | `verticals/<v>/adapters/` | 🟠 squelettes sauf restaurant |
| 6 | Vocabulaire d'événements | `orchestration/events/vertical.events.ts` | ✅ **72 déclarés** |
| 7 | **Handlers de cascade** | `orchestration/handlers/` | 🔴 restaurant uniquement |
| 8 | Libellés RBAC | `verticals/<v>/roles.ts` | 🔴 n'existe pas |
| 9 | Nav + capabilities | `config/navConfig.ts` (38 capabilities) | 🟠 partiel |
| 10 | Tenants `_demo_` `_test_` `_ref_` | `lib/mcc/SystemTenantRegistry.ts` | ✅ 24 |
| 11 | Adapter de facturation | `finance/comptabilite/invoicing/verticals/` | 🔴 n'existe pas |
| 12 | Registres de conformité | `/registre` + RGPD §7.6.1 | ✅ **hérité automatiquement** |

### Les 9 adapters — le contrat exact

```
verticals/<v>/adapters/
├── <V>OpsAdapter.ts          ├── <V>ComplianceAdapter.ts
├── <V>CommerceAdapter.ts     ├── <V>HumanAdapter.ts
├── <V>FinanceAdapter.ts      ├── <V>LogisticsAdapter.ts
├── <V>IntelligenceAdapter.ts ├── <V>FacilityAdapter.ts
└── <V>MccAdapter.ts
```

**Un adapter ne contient QUE des émissions d'événements.** Référence — `RestaurantComplianceAdapter` :
```ts
emitHaccpCheckSaved(payload) { NexusEventBus.emitDurable('haccp.check.saved', {v:1, ...payload}); }
```
13 lignes. **C'est la bonne taille.** Un adapter qui calcule quelque chose viole la Décision 1.

---

# 5. ÉTAT PAR VERTICALE

| Verticale | Vocab. événements | Modules métier | Adapters | Pages | Verdict |
|-----------|:-----------------:|:--------------:|:--------:|:-----:|---------|
| **restaurant** | ✅ | ✅ 116 fic. (haccp, kitchen, kds, recipes) | ✅ 9 remplis | ✅ réelles | 🟢 **RÉFÉRENCE** |
| **hotel** | ✅ 13 | 🟠 `front-desk` 82 l. · 3 coquilles | 🟠 | ✅ réelles | 🟠 amorcé |
| **garage** | ✅ 14 | 🔴 6 coquilles | 🟠 | ✅ réelles | 🔴 squelette |
| **clinic** | ✅ 14 *(health)* | 🔴 4 coquilles | 🟠 | ✅ réelles | 🔴 **VERROUILLÉ** *(données de santé)* |
| **bakery** | ✅ 9 | 🔴 2 coquilles | 🟠 | 🔴 4 stubs | 🔴 squelette |
| **salon** | ✅ 8 | 🔴 — | 🟠 | 🔴 3 stubs | 🔴 squelette |
| **retail** | ✅ 8 | 🔴 3 coquilles | 🟠 | 🔴 5 stubs | 🔴 squelette |
| **custom** | — | — | 🟠 | — | 🔴 sans tokens |

> 💡 **Le vocabulaire d'événements est déjà écrit pour les 7.** Exemple garage :
> `auto.vehicle_checked_in` · `auto.diagnostic_completed` · `auto.repair_started` ·
> `auto.vehicle_released` · `auto.part_consumed` · `auto.part_reorder_needed` ·
> `auto.warranty_claim_submitted` · `auto.invoice_issued`
>
> **Le cycle de vie métier est déjà modélisé.** Il ne reste qu'à brancher les handlers — et 83 % des cascades cibles sont génériques.

---

# 6. PROCÉDURE D'OUVERTURE D'UNE VERTICALE

> À suivre **après** avoir comblé les manques §3.1 à §3.4.

### Phase A — Vérifier les prérequis de base

- [ ] `ops/service/core` porte l'abstraction `ServiceTicket` (§3.1)
- [ ] `ServiceSubject` défini dans `kernel/nexus/contracts/` (§3.2)
- [ ] `IVerticalInvoicingAdapter` existe (§3.3)
- [ ] `roleLabels` par verticale supporté (§3.4)

### Phase B — Déclarer la verticale (½ journée)

- [ ] Vérifier les points 1, 2, 3, 4, 6, 10 — **déjà faits pour les 8**
- [ ] Écrire `verticals/<v>/roles.ts` (point 8)
- [ ] Écrire `<V>InvoicingAdapter` (point 11)
- [ ] Compléter `scopedTokens` (point 3)

### Phase C — Remplir le métier

Pour **chaque** module sectoriel de la verticale :

1. Identifier le module **générique équivalent** dans le pilier (colonne « GÉNÉRIQUES » §2)
2. Écrire la **spécialisation**, pas une réimplémentation
3. Émettre les événements **déjà déclarés** dans `vertical.events.ts`
4. Vérifier : `tsc 0` · `vitest` vert · `sentrux` cycles inchangés
5. Un commit par module

### Phase D — Brancher les cascades

Pour chaque événement du vocabulaire :

1. Trouver la cascade **équivalente restaurant** (`order.paid` → 4 handlers)
2. Réutiliser les handlers **génériques** (137 sur 166 le sont)
3. N'écrire un handler que si aucun générique ne convient

### Phase E — Recette

- [ ] Bootstrapper `_test_<v>` et `_demo_<v>`
- [ ] Recette complète sur `_demo_<v>` (Simulacra — zéro appel externe)
- [ ] Promotion `_test_` → `_ref_` depuis le MCC
- [ ] Passer le statut MCC de `SQUELETTE` à `BÊTA` puis `PRODUCTION`

---

# 7. GÉNÉRER CE DOCUMENT, NE PAS L'ÉCRIRE

> **Leçon acquise** : `CLAUDE.md` avait dérivé de 4 domaines. Un document écrit à la main devient faux, et fait travailler humains **et IA** sur une carte fausse en toute confiance.

- [ ] Écrire `scripts/gen-vertical-playbook.ts <variant>` qui **mesure** :
  - les 12 points d'ancrage : présents / absents, avec chemin exact
  - les modules sectoriels de la verticale : nombre de fichiers, lignes → rempli / coquille
  - les événements déclarés pour cette verticale dans `vertical.events.ts`
  - les handlers abonnés à ces événements
  - le module **générique équivalent** de chaque module sectoriel
- [ ] Sortie : `VERTICAL_<VARIANT>.md` — colonne `restaurant` remplie automatiquement (la référence), colonne cible avec le reste à faire
- [ ] Régénérer avant chaque ouverture de verticale

```bash
npx tsx scripts/gen-vertical-playbook.ts garage   →   VERTICAL_GARAGE.md
```

---

# 8. RECOMMANDATION

**Ne pas ouvrir de verticale avant d'avoir comblé §3.1 à §3.4.**

Ces quatre manques touchent les 8 industries. Les combler coûte quelques jours ; les ignorer coûte de les réinventer 8 fois, avec 8 divergences.

**Ordre recommandé :**

```
1. §3.1  ServiceTicket dans ops/service/core        ← le plus structurant
2. §3.2  ServiceSubject dans kernel/contracts
3. §3.4  roleLabels par verticale
4. §3.3  IVerticalInvoicingAdapter
5. Finir restaurant proprement                       ← il devient le gabarit
6. §7    gen-vertical-playbook.ts
7. Ouvrir garage — le plus simple après restaurant
```

> 🎯 **`restaurant` n'est pas ton premier client, c'est ton GABARIT.** Chaque raccourci qu'on y laisse sera copié sept fois. Et les 4 modules restaurant encore vides (`bar` 16 l., `lab`, `batch-planner`, `tip-pooling`) montrent que la référence elle-même n'est pas finie.

---

*Mesuré le 11 août 2026. Plan d'exécution : `PLAN_MAITRE_CORRIGE.md` · Stratégie : `A_FAIRE.md` Partie 2.*
