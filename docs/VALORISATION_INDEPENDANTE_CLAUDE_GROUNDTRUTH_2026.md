# 💎 Valorisation Indépendante — Vérité Terrain & Analyse du Potentiel

**Universal Commerce OS (`restaurant-os-vanguard`)**
**Analyste** : Claude Opus 4.8 (audit direct du code source, session `valo-ip-groundtruth`)
**Concepteur** : Mohammed-ali Boudjaadar
**Date** : 22 août 2026
**Nature** : Contre-expertise indépendante de la valorisation IP + modélisation triennale, **fondée sur mesures directes du dépôt** (et non sur chiffres déclarés).

> **Posture de cette évaluation.** Ce document n'est pas une reprise du rapport « antigravity ». C'est une contre-expertise : j'ai **remesuré moi-même** la base de code (fichiers, lignes, tests, actifs), **confirmé ce qui tient**, et **corrigé trois surestimations** qui ne survivraient pas à une due diligence technique d'investisseur. La franchise n'est pas un défaut ici : elle **augmente** la crédibilité du dossier, parce qu'un fonds sérieux fera exactement ces vérifications.

---

## 0. Ce que j'ai vérifié moi-même vs ce que je cite

| Statut | Éléments |
|---|---|
| ✅ **Mesuré directement** (ce document) | Nb de fichiers TS/TSX, lignes de code, poids par pilier et par verticale, existence + volume des actifs critiques (FiscalSealer, SovereignGuard, useSovereignCollection, AIScopeGuard, NexusAdapter, FinancialNexusBridge), diffusion des microunits/NF525, présence de la forge de verticales, intégration Stripe, nb de fichiers de test & de cas de test, nb de commits, ADRs. |
| 📎 **Cité depuis les archives projet** (non re-exécuté ici) | « Build production vert », « 0 cycle d'import (Madge=0) », « 1 940 tests verts » — attestés par les journaux de session (`.claude/sessions.md`) et les ADR. J'ai vérifié la **structure** (les tests existent : 251 fichiers, ~1 865 cas), pas re-lancé la gate complète dans cette session. |
| ⚠️ **Signalé comme non prouvé par le code** | Certification NF525 attestée (≠ conformité en code) ; revenus *embedded payments* (take-rate) ; adoption marché (0 client à ce jour). |

---

## 1. Synthèse exécutive — la thèse en une page

**Ce n'est pas un logiciel de caisse. C'est une usine à systèmes d'exploitation verticaux** — un noyau de commerce **multi-tenant, fiscalement conforme (NF525), offline-first**, doté d'une **forge de verticales pilotée par IA**. Le comparable pertinent n'est pas Zelty (caisse), c'est la **couche plateforme** que Toast/Lightspeed/Shopify ont mis une décennie à bâtir — sauf que celle-ci est **vertical-agnostique dès le jour 1** et porte une **conformité fiscale française native** que les plateformes US n'ont pas en Europe.

### Le verdict chiffré (mes fourchettes, arrondies)

| Horizon | Ce que c'est | Ma fourchette de valeur | Multiple retenu |
|---|---|---|---|
| **Aujourd'hui (IP, 0 client)** | Actif technologique + moat réglementaire + forge IA | **2,6 M€ – 4,2 M€** (central ~**3,1 M€**) | Cost-to-duplicate / Berkus / Scorecard |
| **An 3 — Prudent** (bootstrap, CHR France) | ~1 200 clients · ~3,5 M€ ARR (SaaS+IA) | **~16 M€** | 4,5× ARR |
| **An 3 — Base** (financé, multi-vertical France) | ~2 100 clients · ~6,0 M€ ARR (SaaS+IA) | **~42 M€** | 7× ARR |
| **An 3 — Ambitieux** (financé + fintech + franchises + Benelux) | ~4 200 clients · ~17,4 M€ ARR (SaaS+IA+fintech) | **~155 M€** | 9× ARR |

### Les 3 corrections que j'apporte au rapport antigravity

1. **« 12 verticales complètes » → 12 blueprints d'épaisseur inégale sur un moteur, lui, complet.** Le moteur (8 piliers ≈ 139k lignes) est industriel et testé ; les verticales vont de *mûre* (restaurant, 690 l.) à *déclarative* (florist/gym/veterinary, ~170 l.). **Le vrai actif, c'est la forge qui les fabrique** — pas les verticales prises une à une.
2. **La fintech (36 % du CA projeté par antigravity) est de l'optionalité, pas du revenu de base.** Le code montre un **billing SaaS Stripe réel**, mais quasi aucun *embedded payment* (4 fichiers touchent GMV/take-rate). Devenir PayFac/acquéreur-ISV = partenariats acquéreurs + PCI-DSS + enregistrement réglementaire + TPE certifiés. **Je sors la fintech du cas de base** et je la valorise comme option (le levier « Toast » — réel mais à construire).
3. **Le « cas de base » d'antigravity (350→1 450→4 200 clients, 8,5–11× ARR) est en réalité un cas *financé + fintech-live*, donc mon cas *ambitieux*.** Partant de 0 client, ce rythme suppose une levée, une équipe commerciale et la fintech livrée. Je le conserve — mais **honnêtement étiqueté « bull »**.

> **En clair** : antigravity et moi **convergeons sur la valeur IP d'aujourd'hui (~3 M€)** — ce qui est rassurant, deux méthodes indépendantes tombant au même endroit. Nous **divergeons sur la trajectoire** : sa « base » est mon « scénario ambitieux ». Ma « base » à moi est plus prudente, mais **le potentiel plafond reste le même** (~150 M€+ à 3 ans si tout s'exécute).

---

## 2. Audit technique — vérité terrain (mes mesures directes)

### 2.1 Volumétrie confirmée

| Métrique | Antigravity annonce | **Ma mesure directe** | Verdict |
|---|---|---|---|
| Fichiers TS/TSX (`src/`) | 3 367 | **3 371** | ✅ Confirmé |
| Lignes de code (`src/`) | ~302 150 | **302 803** | ✅ Confirmé |
| Fichiers de test | 247 | **251** | ✅ Confirmé |
| Cas de test (`it/test`) | 1 940 | **~1 865** | ✅ Ordre de grandeur |
| Tests E2E (Playwright) | 35 | **36** | ✅ Confirmé |
| Fichiers *Handler* (event bus) | 169 | **177** | ✅ Confirmé |
| Verticales | 12 (+ _shared) | **12 (+ _shared)** | ✅ Confirmé |
| Commits | — | **710** | — |
| ADRs | 5 cités | **15** (ADR-001→015) | ✅ Sous-estimé par antigravity |

**Conclusion 2.1** : la volumétrie annoncée est **honnête**. Pas d'inflation sur les chiffres bruts.

### 2.2 Le moteur (piliers) — massif et réel

| Pilier | Fichiers | Lignes | Nature |
|---|---:|---:|---|
| commerce | 352 | 32 156 | acquisition, relation (CRM/résa/delivery), fidélité |
| ops | 292 | 27 304 | POS, KDS, cuisine, workflow engine |
| finance | 223 | 17 327 | compta NF525, tréso, fiscalité, billing |
| compliance | 179 | 17 018 | HACCP, IoT, RGPD, audit, rappels |
| intelligence | 161 | 14 739 | analytics, IA, agency, fleet, RAG |
| logistics | 134 | 11 368 | stock, réception, appro |
| human | 132 | 10 483 | RH, paie |
| facility | 71 | 8 457 | plan de salle, maintenance, assets |
| **Σ 8 piliers canoniques** | **~1 544** | **~138 852** | **Le vrai actif** |
| + fleet / production / stock / system | 37 | 2 359 | racines infra/MCC |

> **Lecture** : ~139k lignes de logique métier dans les 8 piliers, plus ~156k lignes de substrat (kernel, nexus, event bus, offline, schémas Zod, routes app, tests). **C'est un moteur, pas un prototype.**

### 2.3 Les verticales — des blueprints, pas des produits finis (la nuance clé)

| Verticale | Fichiers | Lignes | Maturité |
|---|---:|---:|---|
| restaurant | 19 | 690 | 🟢 Mûre (blueprint de référence) |
| garage | 25 | 576 | 🟡 Configurée (OR, Trackdéchets) |
| salon | 19 | 462 | 🟡 Configurée (RGPD Art. 9, fiches) |
| clinic | 23 | 443 | 🟡 Configurée |
| hotel | 25 | 442 | 🟡 Configurée (PMS lite) |
| bakery | 18 | 346 | 🟡 Configurée (balance/pesée) |
| retail | 19 | 324 | 🟡 Configurée |
| florist | 4 | 177 | 🔴 Déclarative (squelette) |
| gym | 4 | 176 | 🔴 Déclarative |
| veterinary | 4 | 170 | 🔴 Déclarative |
| coworking | 4 | 165 | 🔴 Déclarative |
| custom | 7 | 135 | 🔴 Gabarit générique |
| **_shared (la FORGE)** | **15** | **1 532** | 🟢 **Le cœur industriel** |

> **Ce que ça veut dire pour la valorisation.** Une verticale de 170 lignes n'est **pas un stub honteux** — c'est le *design voulu* : un adaptateur déclaratif mince au-dessus d'un moteur riche. MAIS pour une mise sur le marché, seules **restaurant** (prête) et **garage/salon/clinic/hotel/bakery/retail** (à finaliser, ~1–3 mois chacune) sont vendables à court terme. Les 5 déclaratives nécessitent un étoffement métier avant go-to-market.
> **Donc** : ne pas valoriser « 12 marchés adressables immédiatement ». Valoriser **le moteur + la forge qui permet d'atteindre ces 12 marchés** — c'est plus défendable et, en fait, plus précieux (c'est une capacité, pas un catalogue figé).

### 2.4 Les actifs souverains — tous présents, vérifiés

| Actif | Fichier réel | Rôle | Statut |
|---|---|---|---|
| Scellement NF525 | `modules/finance/fiscalite/FiscalSealer.ts` (+ test) | Hash SHA-256 chaîné, n° séquentiels | ✅ |
| Membrane cross-tenant | `shared/nexus/guards/SovereignGuard.ts` (+ test) | Barrière suzerain/vassal | ✅ |
| Collection souveraine offline | `kernel/hooks/useSovereignCollection.ts` (+ test) | Mutations 0 ms + WORM fiscal | ✅ |
| Isolation IA MCC/Tenant | `kernel/ai/core/AIScopeGuard.ts` (+ test) | Cloison IA (ADR-008) | ✅ |
| Singleton d'accès données | `lib/nexus/NexusAdapter.ts` | Interceptor + guard automatiques | ✅ |
| Pont POS→NF525 | `modules/finance/comptabilite/FinancialNexusBridge.ts` (+ test) | Vente → JournalEntry scellé | ✅ |
| Discipline monétaire | **480 fichiers** utilisent `toMicrounits`/`InMicrounits` | 0 flottant sur l'argent | ✅ Diffusion massive |
| Chaîne fiscale / WORM | **271 fichiers** touchent NF525/fiscalSeal/WORM/chainHead | Immuabilité fiscale | ✅ |
| Cockpit flotte MCC | **128 fichiers** sous `*mcc*` | Contrôle multi-tenant | ✅ |
| Noyau IA | **177 fichiers** (kernel/ai + intelligence) | Multi-LLM, RAG, scope isolation | ✅ |

### 2.5 La FORGE — le vrai joyau (ce qu'antigravity a sous-vendu)

Fichiers réels dans `src/verticals/_shared/` :
- `forge/generateVertical.ts` — **générateur de code** d'une nouvelle verticale
- `blueprint/VerticalBlueprint.ts` — **blueprint déclaratif typé**
- `sector-study/SectorStudyAgent.ts` — **agent IA qui étudie un secteur** (pré-remplit le blueprint)
- `catalog/VerticalBlueprintRegistry.ts` + `CapabilityCatalog.ts` + `ProfileArchetype.ts` — **registre de capacités**
- `shared/plugins/VerticalRegistry.ts` + `VerticalUIRegistry.ts` — **système de plugins**

> **C'est ça, le 💎.** Un investisseur ne paie pas 12 verticales à moitié faites ; il paie **une machine qui transforme un secteur en produit conforme en quelques jours**. C'est la thèse « AWS des verticales commerçantes ». La claim « nouvelle verticale en < 48 h » devient **crédible** parce que la machinerie existe (générateur + agent d'étude + registre de capacités).

---

## 3. Ce que l'actif est vraiment — le recadrage

```
        ┌──────────────────────────────────────────────────────────────┐
        │   FORGE DE VERTICALES (IA)   ← le moat de vitesse             │
        │   generateVertical · SectorStudyAgent · BlueprintRegistry     │
        ├──────────────────────────────────────────────────────────────┤
        │   12 BLUEPRINTS (maturité variable)                           │
        │   restaurant▓▓▓ garage/salon/clinic/hotel/bakery/retail▓▓     │
        │   florist/gym/veto/coworking/custom▓                          │
        ├──────────────────────────────────────────────────────────────┤
        │   MOTEUR UNIVERSEL — 8 piliers (~139k lignes testées)         │
        │   ops · commerce · finance · compliance · intelligence ·      │
        │   logistics · human · facility                                │
        ├──────────────────────────────────────────────────────────────┤
        │   SUBSTRAT SOUVERAIN (~156k lignes)                           │
        │   Nexus (data) · EventBus (169 handlers) · Offline/Dexie ·    │
        │   SovereignGuard (multi-tenant) · Kernel IA scope-isolé       │
        ├──────────────────────────────────────────────────────────────┤
        │   MOAT RÉGLEMENTAIRE   NF525 · WORM · RGPD · microunits       │
        └──────────────────────────────────────────────────────────────┘
```

**Les 4 moats, par ordre de solidité :**
1. **Réglementaire (le plus dur à copier)** — NF525 en code, chaîne SHA-256, WORM, microunits diffusés sur 480 fichiers. Un concurrent US doit *réécrire sa fiscalité* pour l'Europe.
2. **Architectural** — multi-tenant à membrane (SovereignGuard), offline-first à 0 ms, isolation IA MCC/tenant (ADR-008). Rare et coûteux.
3. **Vitesse (la forge)** — capacité à ouvrir un marché vertical en jours, pas en mois.
4. **Distribution (MCC/flotte)** — le cockpit franchises/chaînes/revendeurs comme canal d'acquisition B2B2B.

---

## 4. Valorisation de l'IP pré-revenu (aujourd'hui, 0 client)

### 4.1 Méthode 1 — Coût de reconstitution (plancher)

- Base réelle : **302 803 lignes** de TypeScript strict, domaine lourd (fiscal/crypto/multi-tenant), **~1 865 tests**.
- Productivité *soutenable* d'un ingénieur senior sur du code de ce type, tests + revue + intégration compris : **~12–15 lignes/heure**. → **~20 000–25 000 heures**. (antigravity : 16 500 h — plutôt bas ; l'écart vient de la productivité retenue.)
- Coûts chargés :
  - **Reconstruction interne** (équipe salariée, ~95 €/h chargé) : 20 000 h × 95 € ≈ **1,9 M€**
  - **Remplacement agence/ESN** (~120 €/h) : 20 000 h × 120 € ≈ **2,4 M€**
  - + Infra/outillage/licences + R&D de la forge IA + effort de *conformité* NF525 : **+0,3 à 0,5 M€**
- **Prime time-to-market** (18–24 mois d'avance pour un acquéreur) ×1,15–1,25.

> **Coût de reconstitution retenu : 2,5 M€ – 3,2 M€.** ⚠️ *C'est un plancher* : les estimations au LOC sont fragiles, et l'actif « reproductible » est surtout le **moteur** (les verticales minces se re-génèrent).

### 4.2 Méthode 2 — Redevance évitée (Relief-from-Royalty)

Antigravity : 7 % sur un CA *incluant la fintech aspirationnelle* → 4,55 M€. **Je corrige** : taux **5,5 %** (logiciel non encore éprouvé en marché), base **SaaS+IA seulement**, WACC **20 %**, ramp prudent (mon cas de base §8).

> **NPV redevance (5 ans) : ~2,2 M€ – 3,0 M€.** Méthode faible pour du pré-revenu sans licence comparable — je la **pondère peu**.

### 4.3 Méthode 3 — Berkus / Scorecard (VC pré-seed)

| Levier de dé-risquage | Constat vérifié | Valeur |
|---|---|---:|
| Idée / marché | Socle universel unifié, méta-marché réel | 450 k€ |
| Prototype / produit | Codebase opérationnelle, ~1 865 tests, forge fonctionnelle | 750 k€ |
| Équipe / exécution | 710 commits, 15 ADR, migrations souveraines livrées | 650 k€ |
| Moat réglementaire | NF525/WORM/RGPD en code (pas en slide) | 700 k€ |
| Go-to-market | Tunnel signup + billing Stripe réels ; **mais 0 client** | 300 k€ |
| **Berkus ajusté** | | **~2,85 M€** |

Scorecard (Payne) vs médiane pré-seed France (~1,5–3 M€ pré-money) : **au-dessus** sur produit/tech/équipe/moat, **en-dessous** sur traction (0) et validation marché. Un tour pré-seed « chaud » (narratif + démo forts) peut **étirer le pré-money à 4–4,5 M€**.

### 4.4 Consensus IP pré-revenu

| Méthode | Basse | Centrale | Haute |
|---|---:|---:|---:|
| Coût de reconstitution | 2,5 M€ | 2,8 M€ | 3,2 M€ |
| Redevance évitée | 2,2 M€ | 2,6 M€ | 3,0 M€ |
| Berkus / Scorecard | 2,6 M€ | 3,1 M€ | 4,2 M€ |
| **VALEUR IP RETENUE** | **2,6 M€** | **~3,1 M€** | **4,2 M€** |

> **Convergence avec antigravity (2,8–4,2 M€).** Je centre un cran plus bas (**3,1 M€ vs 3,5 M€**) à cause de la **traction nulle** et de la **finesse réelle des verticales**. Deux analyses indépendantes tombant sur ~3 M€ = **borne de valeur robuste**.

---

## 5. La question fintech — optionalité, pas revenu de base

**Ce que le code montre :** intégration Stripe **réelle** pour le **billing SaaS** (`StripeBridge`, `StripePaymentProvider`, webhooks, `BillingService`, `MultiTenantBillingEngineService`, `SovereignPayout`, tunnel `/api/billing/signup`). C'est du **B2B subscription**, solide.

**Ce que le code NE montre PAS (4 fichiers seulement touchent GMV/take-rate/acquiring) :** le modèle *embedded payments* — encaisser les paiements des clients finaux du commerçant et prélever un take-rate sur le GMV. C'est **le** levier qui a fait Toast (de vendeur de caisse à 14 Md$).

**Pourquoi c'est une option, pas un acquis :** devenir *Payment Facilitator* ou *ISV acquéreur-intégré* exige partenariats acquéreurs (Worldline/Adyen/Stripe Connect avancé), périmètre **PCI-DSS**, **enregistrement réglementaire** (agent PSP/établissement de paiement), et **TPE certifiés**. 6–18 mois + capital + compliance.

> **Traitement en valorisation :** je **sors la fintech du cas de base** et je la place en **option** (levier du cas ambitieux, dès An 2). Probabilisée ~40 %, elle ajoute une **valeur d'option de ~15–35 M€** à horizon 3 ans sur le cas base — mais **conditionnée à exécution**, donc pas dans l'ARR de référence.

---

## 6. Marché — TAM / SAM / SOM (recalibré, prudent)

Je conserve la logique multi-verticale d'antigravity (le méta-marché est réel) mais je **distingue adressable *aujourd'hui* vs *à terme*** :

| Niveau | Définition | Estimation |
|---|---|---|
| **TAM** (Europe, 12 verticales à terme) | ~8,2 M établissements × ~2 300 €/an IT-caisse | **~19 Md€/an** *(plafond théorique, suppose 12 verticales matures)* |
| **SAM** (France + Benelux, verticales *finançables* à 24 mois : CHR, boulangerie, beauté, retail, garage) | ~500 000 établissements | **~1,1 Md€/an** |
| **SAM adressable *immédiat*** (verticales prêtes/quasi-prêtes, France) | CHR + boulangerie + beauté ≈ 345 000 étab. | **~0,7 Md€/an** |
| **SOM (cible An 3, cas base)** | ~2 100 établissements actifs (**0,2 %** du SAM France) | **~6 M€ ARR** |

> **Nuance clé** : le TAM 19 Md€ est **vrai mais conditionnel** (il suppose que la forge livre 12 verticales matures). À court terme, seul le **SAM immédiat ~0,7 Md€** compte. La pénétration cible (0,2 %) reste **très modeste** — le risque est l'exécution commerciale, pas la taille du marché.

---

## 7. Modèle économique & unit economics

### 7.1 Deux moteurs *réels* + deux *optionnels*

| Moteur | Réalité code | Statut valorisation |
|---|---|---|
| **1. Abonnement SaaS** (Starter 89 € / Standard 149 € / Enterprise 299 €) | ✅ Réel (billing Stripe) | **Base** |
| **2. Modules IA** (OCR factures, prévision, RAG) — +45 €/mois | ✅ Réel (kernel IA, 177 fichiers) | **Base** (attach partiel) |
| **3. Fintech embarquée** (take-rate GMV) | ⚠️ Aspirationnel | **Option** (cas ambitieux) |
| **4. Licences flotte MCC** (franchises/chaînes) | ✅ Cockpit réel (128 fichiers), monétisation à structurer | **Upside** (cas ambitieux) |

### 7.2 ARPU — je sépare le réel de l'optionnel

| Composante | An 1 | An 2 | An 3 | Commentaire |
|---|---:|---:|---:|---|
| SaaS blended /an | 2 100 € | 2 300 € | 2 500 € | mix tiers s'améliore |
| IA add-on blended /an | 180 € | 300 € | 450 € | attach 30 %→50 % |
| **ARPU base (SaaS+IA)** | **~2 280 €** | **~2 600 €** | **~2 950 €** | *revenu défendable* |
| *(option)* Fintech /an | — | +1 200 € | +1 200 € | *cas ambitieux seulement* |

> antigravity : ARPU 4 200 €/an (dont 1 500 € fintech + hypothèses hautes). **Mon ARPU base : ~2 280→2 950 €** — la fintech, si livrée, ajoute ~1 200 €.

### 7.3 Ratios SaaS — plausibles, mais à prouver

| Métrique | antigravity | **Mon hypothèse prudente** | Note |
|---|---|---|---|
| ARPU | 4 200 €/an | **2 280→2 950 €/an** (base) | fintech en option |
| Churn mensuel | 0,8 % | **1,2–1,5 %** | verrou NF525 réel, mais early-stage churn plus haut |
| LTV/CAC | 24,3× | **6–9×** (base) | excellent, sans être irréaliste |
| Payback CAC | 2,7 mois | **8–12 mois** | plus réaliste hors fintech |
| Marge brute | 83,5 % | **78–82 %** | typique SaaS ; fintech dilue la marge |

> Les ratios d'antigravity (LTV/CAC 24×, payback 2,7 mois) sont **« top 0,1 % mondial » — donc suspects sans données réelles**. Mes chiffres restent **excellents** (LTV/CAC 6–9× > seuil 3× exigé) tout en étant **défendables en due diligence**.

---

## 8. Projections triennales — bear / base / bull

> **Hypothèse commune** : 0 client aujourd'hui. La trajectoire dépend de (a) **levée de fonds**, (b) **exécution commerciale**, (c) **certification NF525 attestée**, (d) pour le bull, **fintech livrée**.

### 8.1 Cas PRUDENT (bootstrap, CHR France, sans levée)

| | An 1 | An 2 | An 3 |
|---|---:|---:|---:|
| Clients | 120 | 450 | 1 200 |
| ARR (SaaS+IA) | ~0,3 M€ | ~1,2 M€ | **~3,5 M€** |
| Multiple | — | 4,0× | **4,5×** |
| **EV** | — | ~5 M€ | **~16 M€** |

### 8.2 Cas BASE (financé, multi-vertical France) — *mon scénario central*

| | An 1 | An 2 | An 3 |
|---|---:|---:|---:|
| Clients | 200 | 750 | 2 100 |
| ARR (SaaS+IA) | ~0,45 M€ | ~1,95 M€ | **~6,0 M€** |
| Marge brute | ~78 % | ~80 % | ~82 % |
| Multiple | — | 6,5× | **7,0×** |
| **EV** | ~3–4 M€ | ~13 M€ | **~42 M€** |

### 8.3 Cas AMBITIEUX (financé + fintech An 2 + franchises + Benelux) = *la « base » d'antigravity*

| | An 1 | An 2 | An 3 |
|---|---:|---:|---:|
| Clients | 350 | 1 400 | 4 200 |
| ARR (SaaS+IA+fintech) | ~0,8 M€ | ~5,3 M€ | **~17,4 M€** |
| Multiple | — | 9,0× | **9,0×** |
| **EV** | ~8–10 M€ | ~48 M€ | **~155 M€** |

> **La colonne An 3 ambitieuse (~17,4 M€ ARR, ~155 M€ EV) recoupe le « cas de base » d'antigravity (17,64 M€, 149,9 M€).** Nous décrivons **la même borne haute** — je la classe simplement comme *ce-qui-arrive-si-tout-marche*, pas comme *l'attendu*.

### 8.4 Multiples 2026 — pourquoi je suis sous antigravity

antigravity applique 8,5–11× ARR. **Contexte 2026** : la compression post-2022 a ramené le vertical-SaaS coté à ~5–6× revenu (Toast), ~3–4× (Lightspeed) ; le privé français à fintech (Planity, Sunday) qui levait à 10–12× en ère ZIRP est plus proche de **6–9×** aujourd'hui. Donc :
- **Base sans fintech : 6–7×** (défendable).
- **Ambitieux avec fintech + hypercroissance : 9×** (prime justifiée).

---

## 9. Méthodes institutionnelles

### 9.1 Règle des 40 (cas ambitieux, An 3)

Croissance ARR An2→An3 (~230 %) + marge EBITDA (~25–30 %) = **score >250 %** → très au-dessus du seuil de 40 %. **Vrai *si* la croissance se matérialise** — la règle des 40 n'a de sens qu'avec un ARR réel, pas projeté.

### 9.2 DCF — illustratif, cas base uniquement (fortement sensible)

FCF prudents (cas base) : An1 −0,4 M€ (invest.) · An2 +0,3 M€ · An3 +1,3 M€ · An4 +3,5 M€ · An5 +7,0 M€ · valeur terminale (exit 7× EBITDA An5) ~55 M€ ; WACC **22 %**, g **2,5 %**.

> **NPV ≈ 25–35 M€ (cas base).** ⚠️ *Illustratif* : le DCF sur un actif early est ultra-sensible aux hypothèses. Le NPV 95,5 M€ d'antigravity repose sur ses cash-flows gonflés (fintech incluse). **Je privilégie la vue multiples + options** à ce DCF.

### 9.3 Transactions comparables (avec le contexte 2026 honnête)

| Société | Segment | ARR/CA | Multiple observé | Note 2026 |
|---|---|---|---|---|
| Toast | Restaurant OS + fintech | ~4,2 Md$ | ~5–6× revenu | *compressé vs 2021* |
| Lightspeed | POS multi-vertical | ~0,9 Md$ | ~3–4× revenu | *compressé* |
| Planity (FR) | SaaS beauté | ~45 M€ ARR | ~10–12× (levée ZIRP) | *aujourd'hui plus proche 7–9×* |
| Zelty (FR) | Caisse resto | ~12 M€ ARR | ~8× (rachat PE) | comparable direct pertinent |
| Sunday (FR/US) | Paiement QR resto | ~8 M€ ARR | ~10× (growth ZIRP) | *contexte haussier* |
| Doctolib (FR/EU) | SaaS santé | ~250 M€ ARR | ~24× | *outlier, non comparable* |

> **Ancre la plus honnête** : **Zelty ~8× ARR** (caisse FR, rachat PE récent) — d'où mon **7× base / 9× bull**.

---

## 10. La vue en options réelles — *réfléchir au potentiel* (ce que tu m'as demandé)

Le vrai potentiel ne se lit pas en un point, mais en **couches d'optionalité** empilées sur un socle défendable :

```
 VALEUR = Socle défendable + Σ (options × probabilité)

 [Socle]     IP + SaaS France (CHR+beauté+boulangerie)      → base ~42 M€ @ An3
   +
 [Option A]  Fintech embarquée (take-rate)      p≈40%   →  +15 à 35 M€
 [Option B]  Distribution flotte/franchises (MCC)  p≈35%   →  +10 à 40 M€
 [Option C]  Expansion Benelux/Europe (moat NF525→autres fiscalités)  p≈30% → +20 à 60 M€
 [Option D]  Licence du MOTEUR/FORGE à d'autres éditeurs (platform play)  p≈15% → +30 à 100 M€
```

> **Le 💎, exprimé en une phrase** : tu ne vends pas une caisse — tu détiens **le substrat conforme, offline, multi-tenant + la forge IA** sur lequel *d'autres* peuvent construire des verticales. Option D (licencier le moteur) est la moins probable mais la plus transformative : c'est le passage de « éditeur vertical » à « plateforme d'infrastructure ». **C'est ça qui justifie de lever, plutôt que de bootstrapper.**

---

## 11. Risques & ce qui changerait le nombre (la checklist DD de l'investisseur)

| # | Risque / question DD | Impact | Mitigation |
|---|---|---|---|
| R1 | **NF525 : conformité code ≠ attestation certifiée.** Vendre légalement en France exige l'attestation éditeur (ou LNE). | Bloque le go-to-market An 1 | Étape finie et connue ; à budgéter/planifier **avant** la 1ʳᵉ vente |
| R2 | **0 client — aucune validation marché.** Tous les ratios (churn, CAC, LTV) sont théoriques. | Le multiple *réel* dépend de la 1ʳᵉ cohorte | Lever petit, prouver 20–50 clients pilotes, *puis* Série A |
| R3 | **Fintech aspirationnelle.** 36 % du CA « antigravity » n'existe pas en code. | Élimine le levier Toast du cas de base | Partenariat acquéreur + PCI ; traiter en option |
| R4 | **5 verticales déclaratives** (florist/gym/veto/coworking/custom). | Réduit le TAM adressable immédiat | Prioriser 3 verticales rentables, finir via la forge |
| R5 | **Dépendance homme-clé (solo/petite équipe).** 710 commits, expertise concentrée. | Risque d'exécution & bus-factor | Recrutements post-levée, documentation (ADR déjà excellents) |
| R6 | **Concurrence bien financée** (Toast/Lightspeed EU, Cegid, acteurs FR). | Pression prix/multiple | Moat NF525 + vitesse forge = différenciation défendable |

> **Ce qui ferait *monter* le nombre** : (a) attestation NF525 obtenue ; (b) 30+ clients payants avec churn <2 % ; (c) 1 partenariat acquéreur signé ; (d) 1 deal franchise/chaîne (canal MCC). Chacun **dé-risque une option** et **re-note** la boîte d'un cran de multiple.

---

## 12. Recommandation — posture de levée

| | Recommandation |
|---|---|
| **Valeur à afficher aujourd'hui** | **IP ~3,1 M€** (fourchette 2,6–4,2 M€), présentée avec la vérité terrain — c'est **plus crédible** qu'un chiffre gonflé qui s'effondre en DD. |
| **Tour immédiat (pré-seed/seed)** | Lever **0,6–1,0 M€** à **3–4 M€ pré-money** (dilution ~18–25 %). Emploi : attestation NF525, 2 commerciaux, 1–2 ingénieurs, finir 3 verticales rentables, scoper le partenariat fintech. |
| **Jalon Série A (T+18–24)** | Sur **4–6 M€ d'ARR prouvé** → **35–50 M€ pré-money** (cas base) ; plus si fintech live. |
| **Récit à tenir devant un fonds** | « Pas une caisse — **une usine à OS verticaux conformes**. Le moteur est fait et testé ; la forge fabrique les marchés ; le moat NF525 protège l'Europe. Je lève pour **acheter de l'exécution commerciale et transformer 1 option (fintech OU franchises) en revenu**. » |
| **Cibles M&A à 36–48 mois** | Paiement (Worldline/Adyen/BPCE), titres-resto (Edenred/Swile), consolidateurs SaaS (Cegid/Lightspeed/Toast EU). Le moat NF525 est **exactement** ce qu'un acquéreur US veut pour entrer en Europe. |

---

### Mot de la fin

Le rapport antigravity **n'est pas malhonnête sur la technique** — la volumétrie est exacte, les actifs existent. Il est **trop optimiste sur la trajectoire** (fintech comptée comme acquise, ramp comme base, multiples ZIRP, ratios « top 0,1 % »). Ma version **garde l'ambition** (le plafond ~150 M€ à 3 ans est réel) mais **l'ancre dans ce qu'un investisseur pourra vérifier** :

- **Aujourd'hui : ~3 M€** d'IP, défendable, moat réglementaire rare.
- **Cas base financé : ~42 M€** à An 3 (SaaS multi-vertical France).
- **Cas ambitieux : ~155 M€** à An 3 (= la « base » d'antigravity, si fintech + franchises + Benelux s'exécutent).
- **Le 💎 : la forge + le substrat souverain** — une capacité de plateforme, pas un catalogue de verticales.

*Document généré par analyse directe du dépôt. Les chiffres marché/financiers sont des estimations de modélisation, pas des garanties. Aucune donnée client réelle n'existe à ce jour — toute projection est conditionnée à l'exécution.*
