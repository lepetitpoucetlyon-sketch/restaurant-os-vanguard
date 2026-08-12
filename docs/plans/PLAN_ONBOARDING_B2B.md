# Plan Onboarding B2B — From Zero & Migration Concurrents

> Objectif : le client a le sentiment d'un **plug-and-play**. S'il est bloqué, il a **toujours une option** (import auto, import guidé, saisie manuelle, accompagnement humain).

---

## Table des matières

1. [Vue d'ensemble des 2 parcours](#1-vue-densemble-des-2-parcours)
2. [Parcours A — From Zero](#2-parcours-a--from-zero)
3. [Parcours B — Migration depuis un concurrent](#3-parcours-b--migration-depuis-un-concurrent)
4. [Catalogue des concurrents et prestataires](#4-catalogue-des-concurrents-et-prestataires)
5. [Pipeline d'import universel](#5-pipeline-dimport-universel)
6. [OCR & IA — fallback universel](#6-ocr--ia--fallback-universel)
7. [Architecture technique](#7-architecture-technique)
8. [Séquence d'onboarding — ordre des imports](#8-séquence-donboarding--ordre-des-imports)
9. [UI/UX — Wizard Majordome](#9-uiux--wizard-majordome)
10. [Validation & rollback](#10-validation--rollback)
11. [Plan d'exécution par sprints](#11-plan-dexécution-par-sprints)
12. [Métriques de succès](#12-métriques-de-succès)

---

## 1. Vue d'ensemble des 2 parcours

```
┌───────────────── ONBOARDING B2B ─────────────────┐
│                                                    │
│   WEBHOOK STRIPE → TenantProvisioningService       │
│              │                                     │
│              ▼                                     │
│   ┌──── TenantSeeder.seed() ────┐                 │
│   │ tenantConfig + PCG + fiscal  │                 │
│   │ genesis + floors + zones +   │                 │
│   │ tables + admin user          │                 │
│   └──────────┬──────────────────┘                 │
│              │                                     │
│        ┌─────┴─────┐                              │
│        ▼           ▼                              │
│   PARCOURS A    PARCOURS B                        │
│   From Zero     Migration                         │
│        │           │                              │
│        ▼           ▼                              │
│   Wizard        Wizard                            │
│   guidé         import                            │
│   (saisie)      (fichiers)                        │
│        │           │                              │
│        └─────┬─────┘                              │
│              ▼                                     │
│   TENANT OPÉRATIONNEL                             │
│   → POS, KDS, Finance, HACCP prêts               │
└────────────────────────────────────────────────────┘
```

### État actuel (déjà implémenté)

| Composant | Status |
|-----------|--------|
| TenantProvisioningService → TenantSeeder | FAIT (appel câblé) |
| TenantSeeder (config + PCG + fiscal + floor + tables) | FAIT |
| Module onboarding avec 10 importers | FAIT |
| Parsers CSV/XLSX/JSON/FEC | FAIT |
| Détection source (Zenchef, TheFork, L'Addition, Zelty, Lightspeed) | FAIT |
| Import IA via Gemini (menu, recettes) | FAIT |
| CustomerCSVImporter avec dédup SHA-256 | FAIT |
| Email filters (TheFork masqués) | FAIT |
| CSV templates téléchargeables | FAIT |
| Connecteurs piliers (payroll, IoT, delivery, reviews, weather, etc.) | FAIT |
| UI MigrationPlaceholder | SQUELETTE |
| Import API concurrents (pull automatique) | MANQUANT |
| OCR documents (factures, menus papier, inventaires) | MANQUANT |
| Wizard onboarding complet | MANQUANT |
| Import HACCP historique (registres, relevés) | MANQUANT |

---

## 2. Parcours A — From Zero

Le client n'a aucun système existant (ouverture de restaurant, changement total).

### 2.1 Séquence guidée

| Étape | Action | Temps estimé | Fallback si bloqué |
|-------|--------|-------------|-------------------|
| 1. Plan de salle | Éditeur visuel drag-and-drop | 10 min | Templates pré-faits (bistrot 20 couverts, restaurant 40, brasserie 80) |
| 2. Menu & Carte | 3 options : saisie manuelle, coller texte (IA parse), photo carte papier (OCR) | 15-30 min | Menu démo pré-rempli modifiable |
| 3. Équipe | Formulaire par employé ou import CSV | 10 min | Créer juste l'admin, ajouter le staff au fil de l'eau |
| 4. Fournisseurs | Saisie guidée ou catalogue pré-intégré (Metro, Pomona, Transgourmet) | 10 min | Skip — ajouter plus tard |
| 5. Stocks initiaux | Comptage assisté par catégorie | 15 min | Skip — le POS fonctionne sans stock initial |
| 6. HACCP | Activation capteurs IoT ou registre manuel | 5 min | Registre papier → numérique plus tard |
| 7. Comptabilité | Lien expert-comptable (Pennylane, email FEC) | 5 min | Skip — FEC auto-généré par le POS |

### 2.2 Templates de démarrage par variant

| Variant | Template inclus |
|---------|----------------|
| `restaurant` | 10 tables, 2 zones (salle + terrasse), 5 catégories menu, registre HACCP, PCG restauration |
| `hotel` | 20 chambres, réception, room service, PCG hôtellerie |
| `bakery` | Comptoir, vitrine, production, PCG boulangerie |
| `salon` | Postes de travail, agenda, PCG services |
| `garage` | Baies, parking, PCG auto |
| `clinic` | Cabinets, salle d'attente, PCG santé |
| `retail` | Rayons, caisse, stock, PCG commerce |

### 2.3 Checklist « prêt à ouvrir »

Le wizard ne se ferme que quand les étapes obligatoires sont complètes :

- [ ] Au moins 1 table (ou poste) créée
- [ ] Au moins 1 produit dans le menu
- [ ] Admin PIN configuré et testé
- [ ] Mode de paiement POS vérifié (espèces par défaut)
- [ ] Sceau fiscal GENESIS présent ✅ (auto via TenantSeeder)

---

## 3. Parcours B — Migration depuis un concurrent

Le client quitte un logiciel existant et veut récupérer ses données.

### 3.1 Matrice des données récupérables

| Catégorie | Sources possibles | Format attendu | Méthode primaire | Fallback |
|-----------|-------------------|---------------|-----------------|----------|
| **Menu / Carte** | POS concurrent, photo carte, PDF | CSV, XLSX, PDF, image | API ou CSV export | OCR + IA Gemini |
| **Équipe / Staff** | Excel RH, logiciel paie | CSV, XLSX | CSV import | Saisie manuelle |
| **Clients / CRM** | Zenchef, TheFork, Excel fidélité | CSV, XLSX | API pull ou CSV | Saisie manuelle |
| **Réservations historiques** | Zenchef, TheFork, Resy | CSV, XLSX | API pull ou CSV | Skip (non bloquant) |
| **Fournisseurs** | Excel maison, logiciel achat | CSV, XLSX | CSV import | Saisie guidée |
| **Stocks / Inventaire** | Logiciel caisse, comptage papier | CSV, XLSX, photo | CSV ou OCR | Comptage assisté |
| **Recettes / Fiches techniques** | PDF fiches, Excel maison | CSV, XLSX, PDF, image | CSV ou OCR + IA | Saisie guidée |
| **FEC exercice précédent** | Expert-comptable | TXT FEC (DGFiP) | Import FEC natif | Demander au comptable |
| **Relevés bancaires** | Banque en ligne | CSV, PDF, OFX | CSV import | Agrégateur Powens/GoCardless |
| **Plan de salle** | Mémoire du restaurateur | JSON, CSV, saisie | Éditeur visuel | Templates + ajustement |
| **Registres HACCP** | Logiciel HACCP, papier | CSV, PDF, image | CSV ou OCR | Nouveau registre (pas d'historique) |
| **Comptabilité** | Pennylane, Sage, Cegid, ACD | API, FEC, CSV | API connecteur | FEC import |

### 3.2 Stratégie par source de données

#### API Pull automatique (quand le concurrent expose une API)

```
Client autorise → OAuth/API key → Pull automatique → Mapping → Preview → Import
```

#### Export fichier (le client exporte depuis son ancien logiciel)

```
Client exporte CSV/XLSX → Upload → Détection source auto → Mapping colonnes → Preview → Import
```

#### OCR + IA (aucun export disponible)

```
Client photographie/scanne → Upload image/PDF → Gemini Vision OCR → Structuration IA → Preview → Import
```

#### Saisie guidée (dernier recours)

```
Formulaire pas-à-pas → Champs pré-remplis avec suggestions → Validation → Enregistrement
```

---

## 4. Catalogue des concurrents et prestataires

### 4.1 Logiciels de caisse / POS (France)

| Concurrent | API disponible | Export natif | Données récupérables | Priorité |
|-----------|---------------|-------------|---------------------|----------|
| **Zelty** | API REST (partenaire) | CSV produits (price_cents) | Menu, ventes, clients | P1 |
| **L'Addition** | API REST (sur demande) | CSV (Montant TTC/HT) | Menu, tickets, CRM | P1 |
| **Lightspeed** | API REST publique | CSV/XLSX | Menu, stocks, clients, ventes | P1 |
| **Tiller (SumUp)** | API REST | CSV export | Menu, tickets, staff | P2 |
| **Cashpad** | Pas d'API publique | CSV basique | Menu | P2 |
| **Popina** | Pas d'API publique | PDF/CSV limité | Menu (OCR) | P3 |
| **Clyo Systems** | Pas d'API | Export limité | Menu (OCR) | P3 |
| **iKentoo (Lightspeed)** | Via Lightspeed API | CSV | Menu, stocks | P2 |
| **Symbioz** | Pas d'API | Export PDF | Menu (OCR) | P3 |
| **Tabesto** | Pas d'API | Pas d'export | OCR ou saisie | P3 |
| **Innovorder** | API interne | CSV partiel | Menu, commandes | P2 |
| **PI Électronique** | Pas d'API | Pas d'export | OCR ou saisie | P3 |

### 4.2 Plateformes de réservation

| Plateforme | API | Export | Données | Priorité |
|-----------|-----|--------|---------|----------|
| **Zenchef** | API REST (partenaire) | CSV réservations + clients | Réservations, CRM, couverts historiques | P1 |
| **TheFork (LaFourchette)** | API REST (partenaire) | CSV (emails masqués @thefork.com) | Réservations, CRM (filtré), stats | P1 |
| **Resy** | API REST | CSV | Réservations, CRM | P2 |
| **OpenTable** | API REST | CSV | Réservations, CRM | P2 |
| **Google Réservations** | Via Google Business Profile API | N/A | Réservations | P2 |
| **Widget natif Restaurant OS** | Déjà intégré | N/A | Automatique | FAIT |

### 4.3 Logiciels HACCP / Qualité

| Logiciel | API | Export | Données | Priorité |
|---------|-----|--------|---------|----------|
| **Epack Hygiene** | Pas d'API publique | PDF rapports | Registres température, plans de nettoyage | P2 |
| **Octopus HACCP** | Pas d'API | PDF/Excel | Relevés, non-conformités | P2 |
| **Traqfood** | API REST (sur demande) | CSV/PDF | Températures, DLC, traçabilité | P2 |
| **Yuma** | Pas d'API | PDF | Registres | P3 |
| **CookSafe** | Pas d'API | PDF | Registres | P3 |
| **Registre papier** | N/A | Photo/scan | OCR → registres numériques | P2 |

**Stratégie HACCP** : l'historique des relevés HACCP est rarement récupérable via API. Le fallback standard est : nouveau registre numérique (Restaurant OS), les anciens registres papier/PDF sont archivés dans le coffre documentaire du tenant.

### 4.4 Logiciels de comptabilité

| Logiciel | API | Export | Données | Priorité |
|---------|-----|--------|---------|----------|
| **Pennylane** | API REST | FEC, CSV | Plan comptable, écritures, factures | P1 |
| **Sage (Sage 50, Sage Online)** | API REST | FEC | Écritures, tiers | P2 |
| **Cegid (Quadratus, Loop)** | API REST (partenaire) | FEC | Écritures | P2 |
| **ACD (Expert-comptable)** | FEC export | FEC TXT | Écritures exercice N-1 | P1 |
| **Inqom (ex-Receipt Bank)** | API REST | CSV factures | Factures fournisseurs, OCR natif | P2 |
| **Dext (ex-Receipt Bank)** | API REST | CSV | Factures fournisseurs OCR | P2 |
| **Excel comptable** | N/A | XLSX/CSV | Écritures manuelles | P1 |

**Stratégie comptabilité** : le minimum pour démarrer = FEC de l'exercice précédent (optionnel) + activation de l'export FEC automatique. Les écritures POS génèrent automatiquement des JournalEntry NF525. Le lien avec l'expert-comptable se fait par export FEC mensuel automatique (email via Resend ou API Pennylane).

### 4.5 Fournisseurs alimentaires (catalogue pré-intégré)

| Fournisseur | Intégration | Données | Priorité |
|------------|-------------|---------|----------|
| **Metro** | Catalogue produits (scraping ou partenariat) | Produits, prix, DLC | P2 |
| **Pomona** | EDI / catalogue | Produits, prix | P2 |
| **Transgourmet** | Catalogue en ligne | Produits, prix | P3 |
| **Sysco** | API REST (US, UK) | Produits, prix | P3 |
| **Rungis (MIN)** | Pas de catalogue numérique | N/A | P3 (saisie) |
| **Brake** | EDI | Produits | P3 |
| **Davigel** | Catalogue | Produits | P3 |

**Stratégie fournisseurs** : Phase 1 = saisie manuelle / CSV. Phase 2 = catalogue produits pré-intégrés (Metro, Pomona) pour auto-complétion et rapprochement automatique des bons de livraison.

### 4.6 Logiciels de paie / RH

| Logiciel | Connecteur | Status |
|---------|-----------|--------|
| **Silae** | `SilaeConnectorProvider` | FAIT (connecteur implémenté) |
| **PayFit** | Via Merge.dev | FAIT (via `MergeConnectorProvider`) |
| **Lucca** | Via Merge.dev | FAIT |
| **Sage Paie** | Via Merge.dev | FAIT |
| **ADP** | Via Merge.dev | FAIT |

### 4.7 Plateformes de livraison

| Plateforme | Connecteur | Status |
|-----------|-----------|--------|
| **Uber Eats** | `UberEatsProvider` | FAIT |
| **Deliveroo** | Webhook provider | En attente partenariat |
| **Just Eat** | Webhook provider | En attente partenariat |
| **Click & Collect natif** | `ClickCollectProvider` | FAIT |

---

## 5. Pipeline d'import universel

### 5.1 Architecture existante (à étendre)

```
src/modules/onboarding/
├── migration/
│   ├── types.ts                 # 10 ImportCategory, 6 SourceSystem, stages
│   ├── onboardingSteps.ts       # Séquence d'onboarding (6 étapes)
│   ├── csvTemplates.ts          # Templates CSV téléchargeables
│   ├── emailFilters.ts          # Filtre emails masqués TheFork
│   ├── CustomerCSVImporter.ts   # Import CRM avec dédup SHA-256
│   ├── parsers/
│   │   ├── csvParser.ts         # Parse CSV multi-encodage
│   │   ├── xlsxParser.ts        # Parse XLSX
│   │   └── fileDetector.ts      # Détection format + source auto
│   ├── importers/
│   │   ├── menuImporter.ts      # CSV + IA (Gemini)
│   │   ├── staffImporter.ts     # CSV (rôles FR/EN, PIN auto)
│   │   ├── crmImporter.ts       # CSV (dédup email)
│   │   ├── suppliersImporter.ts # CSV
│   │   ├── inventoryImporter.ts # CSV (unités normalisées)
│   │   ├── recipesImporter.ts   # CSV + IA (fuzzy match ingrédients)
│   │   ├── reservationsImporter.ts # CSV → CRM historique
│   │   ├── statementsImporter.ts   # CSV → StatementIngestionService
│   │   ├── fecImporter.ts       # FEC DGFiP (SHA-256 sealed, NF525)
│   │   └── floorplanImporter.ts # CSV/JSON → tables + zones
│   └── hooks/
│       └── useImportPipeline.ts # Hook React (stages: idle→done)
```

### 5.2 Extensions nécessaires

#### A. Nouveaux parsers

| Parser | Input | Output | Priorité |
|--------|-------|--------|----------|
| `pdfParser.ts` | PDF facture, menu, relevé | Texte structuré | P1 |
| `imageParser.ts` | Photo (JPEG, PNG, WebP) | Texte via Gemini Vision | P1 |
| `ofxParser.ts` | Relevé bancaire OFX/QIF | Transactions structurées | P3 |
| `fecParser.ts` | Déjà dans csvParser (parseFECText) | FAIT | — |

#### B. Nouveaux SourceSystem

Ajouter à `types.ts` :

```typescript
export type SourceSystem =
  | 'zenchef' | 'thefork' | 'laddition' | 'zelty' | 'lightspeed'  // existants
  | 'tiller' | 'cashpad' | 'popina' | 'ikentoo' | 'innovorder'    // POS
  | 'pennylane' | 'sage' | 'cegid'                                 // Comptabilité
  | 'epack' | 'traqfood' | 'octopus'                               // HACCP
  | 'generic';
```

#### C. API Connectors (import pull)

Nouveau répertoire :

```
src/modules/onboarding/migration/connectors/
├── types.ts                    # ISourceConnector interface
├── ConnectorRegistry.ts        # Factory + catalogue
├── zenchef/
│   ├── ZenchefConnector.ts     # OAuth → pull réservations + clients
│   └── zenchef.mappings.ts     # Mapping colonnes Zenchef → Restaurant OS
├── thefork/
│   ├── TheForkConnector.ts     # API key → pull réservations
│   └── thefork.mappings.ts
├── zelty/
│   ├── ZeltyConnector.ts       # API key → pull menu + clients
│   └── zelty.mappings.ts
├── lightspeed/
│   ├── LightspeedConnector.ts  # OAuth → pull menu + stocks + clients
│   └── lightspeed.mappings.ts
├── pennylane/
│   ├── PennylaneConnector.ts   # API → pull FEC + factures
│   └── pennylane.mappings.ts
└── laddition/
    ├── LAdditionConnector.ts   # API → pull menu + tickets
    └── laddition.mappings.ts
```

#### D. Interface ISourceConnector

```typescript
interface ISourceConnector {
  readonly sourceId: SourceSystem;
  readonly displayName: string;
  readonly logo: string;
  readonly categories: ImportCategory[];

  /** Vérifie que les credentials sont valides */
  testConnection(credentials: ConnectorCredentials): Promise<{ ok: boolean; error?: string }>;

  /** Récupère les données pour une catégorie donnée */
  pull(category: ImportCategory, credentials: ConnectorCredentials): Promise<ParsedFile>;

  /** Retourne les catégories disponibles pour ce connecteur */
  availableCategories(): ImportCategory[];
}
```

---

## 6. OCR & IA — fallback universel

### 6.1 Architecture OCR

```
Upload image/PDF
      │
      ▼
┌─ Gemini Vision API ─┐
│  (modèle multimodal) │
│                       │
│  Prompt structurant:  │
│  "Extrais les données │
│   et retourne JSON"   │
└───────┬───────────────┘
        │
        ▼
  JSON structuré
        │
        ▼
  Même pipeline import
  (mapping → preview → inject)
```

### 6.2 Cas d'usage OCR

| Document | Prompt IA | Output attendu | Qualité estimée |
|----------|----------|----------------|-----------------|
| **Carte restaurant (photo)** | Extrais plats, prix, catégories | `{ categories, products }` | 85-95% |
| **Fiche recette (PDF)** | Extrais ingrédients, quantités, étapes | `{ recipes }` | 80-90% |
| **Facture fournisseur (PDF)** | Extrais fournisseur, lignes, montants | `{ supplier, lines, total }` | 90-95% |
| **Relevé bancaire (PDF)** | Extrais date, libellé, montant | `{ transactions }` | 85-90% |
| **Registre HACCP papier (photo)** | Extrais relevés température, dates | `{ readings }` | 70-80% |
| **Inventaire manuscrit (photo)** | Extrais produit, quantité, unité | `{ items }` | 75-85% |
| **Bon de livraison (photo)** | Extrais produits, qté reçue, prix | `{ receptionLines }` | 85-90% |

### 6.3 Implémentation

L'API Gemini Vision est déjà utilisée par le module Oracle (`/api/oracle`). L'extension OCR consiste à :

1. Accepter `image/*` et `application/pdf` dans le endpoint Oracle
2. Encoder le fichier en base64
3. Utiliser le prompt structurant adapté à la catégorie d'import
4. Parser le JSON retourné et l'injecter dans le pipeline standard

**Déjà partiellement implémenté** : `menuImporter.ts` et `recipesImporter.ts` appellent déjà `/api/oracle` pour le parsing IA de texte brut. Il suffit d'étendre au multimodal (image + PDF).

### 6.4 Fallback si OCR échoue

1. **Re-essai avec prompt ajusté** : reformuler le prompt avec plus de contraintes
2. **Extraction partielle** : afficher ce qui a été extrait et demander au client de compléter
3. **Mode hybride** : OCR + saisie manuelle côte à côte
4. **Accompagnement humain** : ticket support → agent MCC aide à l'import

---

## 7. Architecture technique

### 7.1 Flux complet onboarding post-provisioning

```
                    TenantProvisioningService.provisionNewClient()
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              TenantSeeder     Stripe         Fleet telemetry
              (config, PCG,    customer       (MCC visible)
               fiscal, floor,
               tables, admin)
                    │
                    ▼
            Email PIN admin
                    │
                    ▼
            Client se connecte
                    │
                    ▼
        ┌── onboardingStatus dans tenantConfig ──┐
        │   { step: 1, completed: [], mode: ? }   │
        └─────────────┬───────────────────────────┘
                      │
              ┌───────┴───────┐
              ▼               ▼
         FROM ZERO        MIGRATION
              │               │
              ▼               ▼
        Wizard guidé    Choix concurrent
        (saisie pas     (Zelty, Zenchef,
         à pas)          L'Addition, ...)
              │               │
              │          ┌────┴────┐
              │          ▼         ▼
              │     API pull    Upload
              │     auto        fichier
              │          │         │
              │          └────┬────┘
              │               ▼
              │         fileDetector
              │         (format + source)
              │               │
              │          ┌────┴────┐
              │          ▼         ▼
              │      Mapping    OCR + IA
              │      colonnes   (Gemini)
              │          │         │
              │          └────┬────┘
              │               ▼
              │          Preview
              │          (validation)
              │               │
              │               ▼
              │          Import DB
              │          (Nexus batch)
              │               │
              └───────┬───────┘
                      ▼
               Checklist verte
               → TENANT OPÉRATIONNEL
```

### 7.2 Modèle de données onboarding

```typescript
// Dans tenantConfig (merge post-seeding)
interface OnboardingState {
  mode: 'from_zero' | 'migration';
  sourceSystem?: SourceSystem;          // Si migration
  startedAt: string;                    // ISO
  completedAt?: string;                 // ISO — null tant que checklist pas verte
  steps: {
    [stepId: string]: {
      status: 'pending' | 'in_progress' | 'completed' | 'skipped';
      completedAt?: string;
      importResult?: ImportResult;      // Stats d'import
      source?: 'manual' | 'csv' | 'api' | 'ocr';
    };
  };
  connectorCredentials?: {              // Chiffré — credentials API concurrent
    provider: SourceSystem;
    encryptedToken: string;
    expiresAt?: string;
  };
}
```

### 7.3 Nouveau endpoint API

```
POST /api/tenant/onboarding/import
  Body: { category: ImportCategory, file?: File, connectorId?: string }
  → Déclenche le pipeline d'import pour la catégorie donnée

GET /api/tenant/onboarding/status
  → Retourne OnboardingState du tenant

POST /api/tenant/onboarding/connector/test
  Body: { provider: SourceSystem, credentials: ... }
  → Teste la connexion au concurrent

POST /api/tenant/onboarding/connector/pull
  Body: { provider: SourceSystem, category: ImportCategory, credentials: ... }
  → Pull les données via API du concurrent

POST /api/tenant/onboarding/ocr
  Body: FormData { file: File, category: ImportCategory }
  → OCR via Gemini Vision → JSON structuré
```

---

## 8. Séquence d'onboarding — ordre des imports

L'ordre est critique car certaines données dépendent d'autres :

```
1. Plan de salle (tables, zones)
   └─ Aucune dépendance
   
2. Menu & Produits
   └─ Aucune dépendance (catégories créées à la volée)
   
3. Équipe / Staff
   └─ Aucune dépendance
   
4. Fournisseurs
   └─ Aucune dépendance
   
5. Stocks / Inventaire
   └─ DÉPEND DE: fournisseurs (lien optionnel)
   
6. Recettes / Fiches techniques
   └─ DÉPEND DE: inventaire (fuzzy match ingrédients)
   
7. Clients / CRM
   └─ Aucune dépendance
   
8. Réservations historiques
   └─ DÉPEND DE: CRM (enrichissement visitHistory)
   
9. FEC exercice précédent
   └─ Aucune dépendance (scellé NF525 immédiatement)
   
10. Relevés bancaires
    └─ Aucune dépendance (PCG heuristic auto)
```

**Règle** : le wizard affiche toutes les étapes mais grise celles qui ont des dépendances non remplies. Le client peut quand même forcer l'import (avec un warning).

---

## 9. UI/UX — Wizard Majordome

### 9.1 Écran d'accueil (post-login, première connexion)

```
┌──────────────────────────────────────────────────┐
│                                                    │
│   🎉 Bienvenue sur Restaurant OS !                │
│                                                    │
│   Comment souhaitez-vous démarrer ?               │
│                                                    │
│   ┌─────────────────┐  ┌─────────────────┐       │
│   │  🆕 FROM ZERO   │  │  📦 MIGRATION   │       │
│   │                  │  │                  │       │
│   │  Nouvelle        │  │  J'ai déjà un   │       │
│   │  installation    │  │  logiciel et je  │       │
│   │                  │  │  veux récupérer  │       │
│   │  Je pars de      │  │  mes données     │       │
│   │  zéro            │  │                  │       │
│   └─────────────────┘  └─────────────────┘       │
│                                                    │
│   ⏭️ Je veux juste explorer (skip)                │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 9.2 Écran migration — choix du concurrent

```
┌──────────────────────────────────────────────────┐
│                                                    │
│   📦 D'où venez-vous ?                            │
│                                                    │
│   Logiciel de caisse                               │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│   │ Zelty│ │L'Add.│ │Light │ │Tiller│           │
│   └──────┘ └──────┘ └──────┘ └──────┘           │
│   ┌──────┐ ┌──────┐ ┌──────┐                     │
│   │Cashp.│ │Popina│ │Autre │                     │
│   └──────┘ └──────┘ └──────┘                     │
│                                                    │
│   Réservation                                      │
│   ┌──────┐ ┌──────┐ ┌──────┐                     │
│   │Zench.│ │TheFk │ │Autre │                     │
│   └──────┘ └──────┘ └──────┘                     │
│                                                    │
│   Comptabilité                                     │
│   ┌──────┐ ┌──────┐ ┌──────┐                     │
│   │Penny │ │ Sage │ │Autre │                     │
│   └──────┘ └──────┘ └──────┘                     │
│                                                    │
│   💡 Pas de panique — vous pouvez                 │
│      aussi importer vos fichiers manuellement     │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 9.3 Stepper latéral (pendant l'onboarding)

Barre latérale présente sur toutes les pages pendant l'onboarding :

```
┌────────────────────┐
│ 🏗️ Installation    │
│                     │
│ ✅ Plan de salle   │
│ ✅ Menu            │
│ 🔵 Équipe (en cours)│
│ ⬜ Fournisseurs    │
│ ⬜ Stocks          │
│ ⬜ CRM             │
│                     │
│ ─────────────────  │
│ Optionnel          │
│ ⬜ Recettes        │
│ ⬜ Réservations    │
│ ⬜ FEC             │
│ ⬜ Relevés         │
│                     │
│ ─────────────────  │
│ Progrès: 3/6       │
│ [██████░░░░] 50%   │
│                     │
│ ⏭️ Passer au POS   │
│ (étapes restantes   │
│  disponibles plus   │
│  tard)              │
└────────────────────┘
```

### 9.4 Résolution de blocage — « toujours une option »

Pour chaque étape, si le client est bloqué :

| Blocage | Option proposée |
|---------|----------------|
| « Je n'arrive pas à exporter mes données » | Guide pas-à-pas avec screenshots pour chaque concurrent |
| « Mon fichier n'est pas reconnu » | Option « coller le texte » + OCR photo |
| « L'import a des erreurs » | Preview ligne par ligne, correction manuelle, re-import |
| « Je ne sais pas quoi mettre » | Template pré-rempli modifiable + suggestions IA |
| « Mon comptable ne répond pas » | Skip FEC, activer l'export FEC auto pour le futur |
| « Je n'ai pas le temps maintenant » | Sauvegarder et reprendre plus tard (état persisté) |
| « Rien ne marche » | Bouton « Demander de l'aide » → ticket support + agent IA MCC |

---

## 10. Validation & rollback

### 10.1 Preview avant import

Chaque import affiche un preview complet avant d'écrire en base :

```
┌──────────────────────────────────────────────────┐
│ 📋 Preview import Menu (42 produits détectés)     │
│                                                    │
│ ┌─────────────────────────────────────────────┐   │
│ │ Catégorie    │ Produit          │ Prix      │   │
│ │──────────────│──────────────────│───────────│   │
│ │ Entrées      │ Oeuf Mayo        │ 8,50 €   │   │
│ │ Entrées      │ Salade César     │ 12,00 €  │   │
│ │ Plats        │ Steak Frites     │ 18,50 €  │   │
│ │ ⚠️ Plats     │ Burger XL        │ 0,00 € ❌│   │
│ │ Desserts     │ Tiramisu         │ 7,00 €   │   │
│ └─────────────────────────────────────────────┘   │
│                                                    │
│ ⚠️ 1 warning : prix à 0 € (ligne 12)             │
│                                                    │
│ [Corriger]  [Ignorer et importer]  [Annuler]      │
└──────────────────────────────────────────────────┘
```

### 10.2 Rollback

Chaque import crée un snapshot avant injection :

```typescript
// Avant batch.commit()
const snapshot = {
  importId: `import_${crypto.randomUUID()}`,
  category: 'menu',
  timestamp: new Date().toISOString(),
  documentPaths: ['products/xxx', 'menu_categories/yyy'],
  previousData: { ... },  // null si création
};
await Nexus.adapter.set(`tenants/${tenantId}/importSnapshots/${snapshot.importId}`, snapshot);
```

Le client peut « Annuler le dernier import » depuis le wizard → supprime les documents créés.

---

## 11. Plan d'exécution par sprints

### Sprint 1 — Fondations (2-3 jours)

| # | Tâche | Fichiers | Impact |
|---|-------|----------|--------|
| 1.1 | Modèle `OnboardingState` dans tenantConfig | `shared/nexus/contracts/tenant.types.ts` | Base de données |
| 1.2 | API `GET/POST /api/tenant/onboarding/status` | `app/api/tenant/onboarding/` | Endpoints |
| 1.3 | Wizard Majordome — écran d'accueil (from zero / migration) | `modules/onboarding/components/` | UI |
| 1.4 | Stepper latéral avec progression | `modules/onboarding/components/` | UI |
| 1.5 | Route `/onboarding` protégée + redirect post-login | `app/(client)/onboarding/` | Routing |

### Sprint 2 — Import fichier robuste (2-3 jours)

| # | Tâche | Fichiers | Impact |
|---|-------|----------|--------|
| 2.1 | UI d'import par catégorie (drag-drop, coller texte) | `modules/onboarding/components/` | UI |
| 2.2 | Preview table avec correction inline | `modules/onboarding/components/` | UI |
| 2.3 | Rollback / snapshot avant import | `modules/onboarding/migration/importers/` | Data safety |
| 2.4 | Guides export par concurrent (screenshots, pas-à-pas) | `modules/onboarding/guides/` | UX |
| 2.5 | Tests importers (menu, staff, CRM, fournisseurs, stocks) | `__tests__/onboarding/` | Qualité |

### Sprint 3 — OCR & IA (2-3 jours)

| # | Tâche | Fichiers | Impact |
|---|-------|----------|--------|
| 3.1 | Extension Oracle API → multimodal (image + PDF) | `app/api/oracle/route.ts` | Backend |
| 3.2 | Parser PDF via Gemini Vision | `modules/onboarding/migration/parsers/pdfParser.ts` | Parser |
| 3.3 | Parser image via Gemini Vision | `modules/onboarding/migration/parsers/imageParser.ts` | Parser |
| 3.4 | Prompts IA structurants par catégorie | `modules/onboarding/migration/prompts/` | IA |
| 3.5 | UI upload image/scan avec preview OCR | `modules/onboarding/components/` | UI |
| 3.6 | Fallback mode hybride (OCR + correction manuelle) | `modules/onboarding/components/` | UX |

### Sprint 4 — API Connectors P1 (3-4 jours)

| # | Tâche | Fichiers | Impact |
|---|-------|----------|--------|
| 4.1 | Interface `ISourceConnector` + `ConnectorRegistry` | `modules/onboarding/migration/connectors/` | Architecture |
| 4.2 | Connecteur Zenchef (OAuth → réservations + clients) | `modules/onboarding/migration/connectors/zenchef/` | Intégration |
| 4.3 | Connecteur Zelty (API key → menu + clients) | `modules/onboarding/migration/connectors/zelty/` | Intégration |
| 4.4 | Connecteur Lightspeed (OAuth → menu + stocks) | `modules/onboarding/migration/connectors/lightspeed/` | Intégration |
| 4.5 | Connecteur Pennylane (API → FEC + factures) | `modules/onboarding/migration/connectors/pennylane/` | Intégration |
| 4.6 | UI connexion OAuth / API key dans le wizard | `modules/onboarding/components/` | UI |
| 4.7 | Tests connecteurs (mock API) | `__tests__/onboarding/connectors/` | Qualité |

### Sprint 5 — Parcours From Zero complet (2-3 jours)

| # | Tâche | Fichiers | Impact |
|---|-------|----------|--------|
| 5.1 | Templates de démarrage par variant (hotel, bakery, salon, etc.) | `shared/seeds/` | Data |
| 5.2 | Wizard saisie guidée (formulaires pas-à-pas) | `modules/onboarding/components/` | UI |
| 5.3 | Éditeur plan de salle simplifié (drag-drop basique) | `modules/onboarding/components/` | UI |
| 5.4 | Checklist « prêt à ouvrir » avec validation auto | `modules/onboarding/components/` | UX |
| 5.5 | Redirect auto vers POS quand checklist verte | `middleware.ts` | Routing |

### Sprint 6 — Connectors P2 + polish (2-3 jours)

| # | Tâche | Fichiers | Impact |
|---|-------|----------|--------|
| 6.1 | Connecteur L'Addition | `modules/onboarding/migration/connectors/` | Intégration |
| 6.2 | Connecteur TheFork | `modules/onboarding/migration/connectors/` | Intégration |
| 6.3 | Connecteur Tiller/SumUp | `modules/onboarding/migration/connectors/` | Intégration |
| 6.4 | Guides export avec screenshots animés | `modules/onboarding/guides/` | UX |
| 6.5 | Bouton « Demander de l'aide » → ticket support IA | `modules/onboarding/components/` | Support |
| 6.6 | Tests E2E onboarding complet (from zero + migration) | `e2e/onboarding/` | Qualité |

### Sprint 7 — Catalogue fournisseurs + HACCP (2-3 jours)

| # | Tâche | Fichiers | Impact |
|---|-------|----------|--------|
| 7.1 | Catalogue produits Metro (données statiques ou scraping) | `modules/logistics/connectors/suppliers/` | Data |
| 7.2 | Catalogue produits Pomona | `modules/logistics/connectors/suppliers/` | Data |
| 7.3 | Auto-complétion fournisseur dans l'import | `modules/onboarding/components/` | UX |
| 7.4 | Import HACCP historique (PDF → OCR → registre) | `modules/onboarding/migration/importers/` | Compliance |
| 7.5 | Archivage documents HACCP papier dans coffre tenant | `modules/compliance/` | Compliance |

---

## 12. Métriques de succès

| Métrique | Cible | Comment mesurer |
|----------|-------|----------------|
| Temps moyen onboarding from zero | < 45 min | Timer dans OnboardingState |
| Temps moyen onboarding migration | < 90 min | Timer dans OnboardingState |
| Taux de complétion onboarding | > 85% | steps.completed / steps.total |
| Taux d'abandon onboarding | < 15% | Tenants qui ne terminent jamais |
| Taux de succès import fichier (1er essai) | > 75% | ImportResult.errors.length === 0 |
| Taux de succès OCR menu | > 85% | Comparaison preview vs correction |
| Tickets support pendant onboarding | < 20% des tenants | Compteur tickets liés onboarding |
| NPS post-onboarding | > 40 | Survey après complétion |

---

## Annexe A — Commandes d'export par concurrent

### Zelty
1. Dashboard Zelty → Paramètres → Export données
2. Exporter « Catalogue produits » en CSV
3. Exporter « Clients » en CSV

### L'Addition
1. Back-office L'Addition → Rapports → Export
2. Choisir période → Exporter en CSV
3. Attention : prix en centimes (détecté automatiquement)

### Zenchef
1. Dashboard Zenchef → Réservations → Historique
2. Filtrer par période → Exporter CSV
3. OU : API → Settings → Générer clé API → coller dans Restaurant OS

### TheFork (LaFourchette)
1. Manager TheFork → Statistiques → Exporter
2. Format CSV (emails masqués @thefork.com = normal, on les filtre)

### Lightspeed
1. Back-office Lightspeed → Produits → Exporter tout
2. Format CSV ou XLSX
3. OU : Settings → API → Générer clé → coller dans Restaurant OS

### Pennylane
1. Pennylane → Exports → FEC
2. Choisir exercice → Télécharger
3. OU : Intégrations → API → Générer token → coller dans Restaurant OS

---

## Annexe B — Prompts IA par catégorie

### Menu (OCR photo carte)
```
Tu es un assistant de migration Restaurant OS.
Voici la photo d'une carte de restaurant.
Extrais TOUS les plats visibles avec leur prix et catégorie.
Retourne UNIQUEMENT un JSON valide :
{ "categories": [...], "products": [...] }
```

### Facture fournisseur (OCR PDF/photo)
```
Tu es un assistant de migration Restaurant OS.
Voici une facture fournisseur.
Extrais : nom fournisseur, date, numéro facture,
et chaque ligne (produit, quantité, unité, prix HT, TVA).
Retourne UNIQUEMENT un JSON valide :
{ "supplier": {...}, "lines": [...], "totalHT": ..., "totalTTC": ... }
```

### Inventaire manuscrit (OCR photo)
```
Tu es un assistant de migration Restaurant OS.
Voici une photo d'un inventaire/comptage manuscrit.
Extrais chaque produit avec sa quantité et son unité.
Retourne UNIQUEMENT un JSON valide :
{ "items": [{ "name": "...", "quantity": ..., "unit": "..." }] }
```

### Registre HACCP papier (OCR photo)
```
Tu es un assistant de migration Restaurant OS.
Voici une photo d'un registre HACCP papier.
Extrais les relevés de température avec date, heure, zone, température.
Retourne UNIQUEMENT un JSON valide :
{ "readings": [{ "date": "...", "time": "...", "zone": "...", "temperature": ... }] }
```
