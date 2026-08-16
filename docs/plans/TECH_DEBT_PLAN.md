# Plan dette technique — Restaurant OS Core

> Chantiers non traités lors de l'audit global 2026-08-16.
> Classé par impact/risque décroissant. Chaque section liste le périmètre exact,
> la stratégie de migration, les commandes de vérification et les critères d'acceptation.

---

## Table des matières

1. [God Files — 11 composants > 400L](#1-god-files)
2. [Barrel Violations — 252 imports cross-module](#2-barrel-violations)
3. [BusinessIdentity — généralisation headChef/owner/category](#3-businessidentity)
4. [InCents — usages résiduels dans les composants UI](#4-incentss-residuels)

---

## 1. God Files

### Contexte

11 fichiers UI dépassent 400 lignes. Seuil sentrux = 400L. Au-delà :
- Impossible de tester des parties indépendantes du composant.
- Chaque modification risque un effet de bord sur une autre section.
- Revues de code coûteuses car pas de boundaries claires.

### Règle de découpe

Chaque god file se découpe en **composants feuilles** (< 200L) et **un composant orchestrateur** (< 100L) qui les assemble. Les props traversantes deviennent des hooks dédiés ou un contexte local. Aucune logique métier dans le composant orchestrateur.

---

### 1.1 `SupplierHubDashboard.tsx` — 685L

**Chemin** : `src/modules/logistics/approvisionnement/ui/SupplierHubDashboard.tsx`

**Responsabilités actuelles (à séparer)**

| Section | Lignes estimées | Responsabilité |
|---------|----------------|----------------|
| En-tête + filtres | ~80L | Recherche, tri, filtres actifs |
| Liste fournisseurs | ~200L | Tableau paginé, statuts badge, actions rapides |
| Panneau commandes fournisseur | ~180L | Historique commandes par fournisseur sélectionné |
| Métriques & KPIs | ~140L | Totaux HT, taux de service, délais moyens |
| Logique data (hooks inline) | ~85L | Fetching + filtrage + tri |

**Découpe proposée**

```
logistics/approvisionnement/ui/
├── SupplierHubDashboard.tsx          ← orchestrateur pur (~80L)
├── SupplierList.tsx                  ← tableau + pagination + badge (~120L)
├── SupplierOrderHistory.tsx          ← commandes du fournisseur sélectionné (~130L)
├── SupplierKpiRow.tsx                ← métriques + sparklines (~100L)
├── SupplierFilters.tsx               ← barre de recherche + filtres (~80L)
└── hooks/useSupplierHub.ts           ← état, fetching, sélection (~60L)
```

**Migration** : extraire `useSupplierHub` en premier (state lifting), puis chaque section UI dans l'ordre du tableau ci-dessus. Chaque extraction = 1 commit séparé.

**Test de non-régression** : snapshot Storybook + test E2E sur le flux sélection fournisseur → commande.

---

### 1.2 `UniversalImportDropzone.tsx` — 511L

**Chemin** : `src/modules/commerce/acquisition/onboarding/migration/UniversalImportDropzone.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Dropzone + drag-and-drop | ~80L | Gestion fichier entrant |
| Parser CSV | ~100L | Lecture, détection colonnes, mapping |
| Parser JSON | ~80L | Validation schéma, normalisation |
| Parser XML | ~90L | Parsing XML → objet |
| Prévisualisation + confirmation | ~100L | Tableau de données importées |
| Logique état global | ~61L | Step machine, erreurs, progression |

**Découpe proposée**

```
onboarding/migration/
├── UniversalImportDropzone.tsx         ← orchestrateur + stepper (~80L)
├── ImportDropArea.tsx                  ← zone de drag-and-drop (~60L)
├── ImportPreview.tsx                   ← tableau de prévisualisation (~90L)
├── parsers/
│   ├── CsvParser.ts                    ← parser + détection colonnes (~80L)
│   ├── JsonParser.ts                   ← validation + normalisation (~60L)
│   └── XmlParser.ts                    ← XML → objet (~70L)
└── hooks/useImportWizard.ts            ← step machine + erreurs (~60L)
```

**Point d'attention** : les parsers doivent être des fonctions pures (entrée `File`, sortie `ParsedRow[]`) — testables unitairement sans DOM.

---

### 1.3 `SplitBillDialog.tsx` — 496L

**Chemin** : `src/modules/ops/service/pos/components/SplitBillDialog.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Sélection du mode | ~60L | Tabs : equal / by-item / custom |
| Panel partage égal | ~100L | N convives, calcul par tête |
| Panel partage par article | ~150L | Drag items vers convives |
| Panel partage personnalisé | ~100L | Entrées manuelles |
| Récapitulatif + bouton payer | ~86L | Total, reste dû |

**Découpe proposée**

```
pos/components/split/
├── SplitBillDialog.tsx              ← dialog + tabs (~80L)
├── SplitEqualPanel.tsx              ← mode égal (~80L)
├── SplitByItemPanel.tsx             ← mode article (~100L)
├── SplitCustomPanel.tsx             ← mode personnalisé (~80L)
├── SplitConviveRow.tsx              ← ligne d'un convive (~60L)
└── SplitSummaryFooter.tsx           ← récap + total dû (~60L)
```

**Point d'attention** : `SplitBillDomainService` est le seul endroit de calcul — les panels ne font que lire/émettre les changements via un hook `useSplitBill`. Ne jamais dupliquer la logique de calcul.

---

### 1.4 `MCCContractManager.tsx` — 494L

**Chemin** : `src/modules/legal/components/MCCContractManager.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Tableau des contrats | ~120L | Liste + filtres par statut |
| Panneau brouillon | ~100L | Formulaire création |
| Panneau actif | ~100L | Lecture + actions (renouveler, résilier) |
| Panneau expiré | ~80L | Archivage + export PDF |
| Logique état | ~94L | Sélection, transitions |

**Découpe proposée**

```
legal/components/
├── MCCContractManager.tsx            ← orchestrateur + tabs (~80L)
├── ContractTable.tsx                 ← liste + filtres (~100L)
├── ContractDraftPanel.tsx            ← formulaire création (~80L)
├── ContractActivePanel.tsx           ← lecture + actions (~80L)
├── ContractExpiredPanel.tsx          ← archivage + PDF (~70L)
└── hooks/useContractManager.ts       ← état + transitions (~50L)
```

---

### 1.5 `LandingDashboard.tsx` — 488L

**Chemin** : `src/modules/commerce/acquisition/landing/components/LandingDashboard.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Hero + CTA | ~100L | Bannière principale |
| Section avis | ~120L | Carousel avis Google |
| Section menu vitrine | ~100L | Catégories + plats mis en avant |
| Section réservation rapide | ~100L | Widget inline |
| Gestion thème / branding | ~68L | Couleurs, polices, logo |

**Découpe proposée**

```
landing/components/
├── LandingDashboard.tsx              ← assemblage (~80L)
├── LandingHero.tsx                   ← hero + CTA (~80L)
├── LandingReviews.tsx                ← carousel avis (~80L)
├── LandingMenuShowcase.tsx           ← vitrine plats (~80L)
└── LandingQuickBooking.tsx           ← widget réservation inline (~80L)
```

---

### 1.6 `MaintenanceSettingsPanel.tsx` — 479L

**Chemin** : `src/shared/components/settings/panels/MaintenanceSettingsPanel.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Formulaire de configuration alertes | ~150L | Seuils, destinataires, canaux |
| Historique des tickets | ~150L | Tableau + filtres |
| Planification maintenance préventive | ~120L | Calendrier + fréquences |
| Logique sauvegarde | ~59L | Debounce, persist via Nexus |

**Découpe proposée**

```
settings/panels/
├── MaintenanceSettingsPanel.tsx         ← orchestrateur + tabs (~60L)
├── MaintenanceAlertConfigForm.tsx       ← formulaire alertes (~100L)
├── MaintenanceTicketHistory.tsx         ← tableau historique (~100L)
├── MaintenanceScheduleCalendar.tsx      ← planification préventive (~90L)
└── hooks/useMaintenanceSettings.ts      ← sauvegarde + debounce (~50L)
```

---

### 1.7 `NewQuoteDialog.tsx` — 451L

**Chemin** : `src/modules/commerce/acquisition/marketing/components/quotes/NewQuoteDialog.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Step 1 — Client | ~100L | Recherche/création client |
| Step 2 — Lignes | ~150L | Ajout articles, quantités, remises |
| Step 3 — Finalisation | ~100L | TVA, totaux, notes, envoi |
| Stepper + navigation | ~101L | Progression, validation step |

**Découpe proposée**

```
quotes/
├── NewQuoteDialog.tsx               ← dialog + stepper (~80L)
├── QuoteStepClient.tsx              ← step 1 client (~80L)
├── QuoteStepLines.tsx               ← step 2 lignes (~100L)
├── QuoteStepSummary.tsx             ← step 3 finalisation (~80L)
└── hooks/useNewQuote.ts             ← état + validation + submit (~60L)
```

---

### 1.8 `PrivatisationContract.ts` — 448L

**Chemin** : `src/modules/finance/comptabilite/documents/PrivatisationContract.ts`

**Nature** : fichier `.ts` pur (pas UI), contient des templates de contrat comme chaînes longues.

**Problème** : un seul fichier avec 15+ templates inline, impossible à maintenir.

**Découpe proposée**

```
comptabilite/documents/
├── PrivatisationContract.ts         ← classe + méthode de résolution (~60L)
└── templates/
    ├── privatisation-standard.ts    ← template CDD standard (~80L)
    ├── privatisation-premium.ts     ← template premium (~80L)
    ├── privatisation-corporate.ts   ← template entreprise (~80L)
    └── privatisation-partials.ts    ← blocs réutilisables (~100L)
```

**Note** : les templates deviennent des fonctions `(context: ContractContext) => string`. L'unité de test naturelle est `template(mockContext).includes('clause X')`.

---

### 1.9 `CreatePreparationModal.tsx` — 443L

**Chemin** : `src/modules/logistics/stock/inventory/components/inventory/CreatePreparationModal.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Step 1 — Sélection recette | ~100L | Recherche, preview ingrédients |
| Step 2 — Quantités | ~120L | Ajustement par lot, unités |
| Step 3 — Validation | ~100L | Récap, coût estimé, déduction stock |
| Gestion état global | ~123L | Step machine, validation, calcul |

**Découpe proposée**

```
inventory/components/
├── CreatePreparationModal.tsx       ← modal + stepper (~70L)
├── PrepStepRecipe.tsx               ← step 1 recette (~80L)
├── PrepStepQuantities.tsx           ← step 2 quantités (~90L)
├── PrepStepConfirm.tsx              ← step 3 validation (~80L)
└── hooks/usePreparationWizard.ts    ← état + calcul + submit (~70L)
```

---

### 1.10 `AccountSettingsDashboard.tsx` — 442L

**Chemin** : `src/shared/components/settings/AccountSettingsDashboard.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Tab Profil | ~100L | Nom, email, avatar |
| Tab Sécurité | ~100L | MDP, 2FA, sessions actives |
| Tab Notifications | ~90L | Préférences canal + fréquence |
| Tab Facturation | ~100L | Abonnement, historique paiements |
| Navigation tabs + état | ~52L | Sélection tab + transitions |

**Découpe proposée**

```
settings/
├── AccountSettingsDashboard.tsx     ← tabs + layout (~60L)
├── AccountProfileTab.tsx            ← profil (~80L)
├── AccountSecurityTab.tsx           ← sécurité + 2FA (~80L)
├── AccountNotificationsTab.tsx      ← notifications (~70L)
└── AccountBillingTab.tsx            ← facturation (~80L)
```

---

### 1.11 `ReservationCreateDialog.tsx` — 441L

**Chemin** : `src/modules/commerce/relation/reservations/components/ReservationCreateDialog.tsx`

**Responsabilités actuelles**

| Section | Lignes | Responsabilité |
|---------|--------|----------------|
| Step 1 — Date/Heure | ~100L | Calendrier, créneaux disponibles |
| Step 2 — Convives | ~90L | Nombre, allergènes, besoins spéciaux |
| Step 3 — Client | ~90L | Recherche/création fiche client |
| Step 4 — Confirmation | ~80L | Récap + envoi email + SMS |
| Stepper + logique | ~81L | Validation step, état transitoire |

**Découpe proposée**

```
reservations/components/create/
├── ReservationCreateDialog.tsx      ← dialog + stepper (~70L)
├── ResaStepDateTime.tsx             ← step 1 créneau (~80L)
├── ResaStepGuests.tsx               ← step 2 convives (~70L)
├── ResaStepCustomer.tsx             ← step 3 client (~70L)
├── ResaStepConfirm.tsx              ← step 4 confirmation (~70L)
└── hooks/useReservationCreate.ts    ← état + validation + submit (~70L)
```

---

### Plan de migration God Files

**Règle absolue** : un god file par sprint, pas d'extraction partielle laissée en état intermédiaire.

| Sprint | God file | Priorité |
|--------|----------|----------|
| S+1 | `SplitBillDialog.tsx` | Haute — POS, flux critique |
| S+1 | `ReservationCreateDialog.tsx` | Haute — flux réservation |
| S+2 | `SupplierHubDashboard.tsx` | Haute — logistique |
| S+2 | `CreatePreparationModal.tsx` | Haute — stock |
| S+3 | `NewQuoteDialog.tsx` | Moyenne — devis |
| S+3 | `MaintenanceSettingsPanel.tsx` | Moyenne — settings |
| S+4 | `PrivatisationContract.ts` | Moyenne — templates |
| S+4 | `AccountSettingsDashboard.tsx` | Faible — settings |
| S+5 | `MCCContractManager.tsx` | Faible — legal |
| S+5 | `LandingDashboard.tsx` | Faible — vitrine |
| S+6 | `UniversalImportDropzone.tsx` | Faible — onboarding |

**Critères d'acceptation pour chaque migration** :

```bash
# 1. TSC = 0 après extraction
npx tsc --noEmit

# 2. Tests existants passent (aucun test nouveau requis pour la migration structurelle)
npx vitest run

# 3. Aucun composant original > 400L
find src -name "*.tsx" -exec wc -l {} + | awk '$1 > 400' | grep -v node_modules

# 4. Le composant orchestrateur n'importe plus de Nexus directement (logique dans hooks)
grep -n "Nexus\." src/path/to/OrchestratorComponent.tsx
```

---

## 2. Barrel Violations

### Contexte

**Règle** : importer uniquement depuis `@/modules/<pilier>` (barrel racine). Tout import vers `@/modules/<pilier>/<domaine>/...` est une violation.

**État actuel** : 252 violations mesurées au 2026-08-16.

### Commande de détection

```bash
# Violations : imports vers sous-dossiers de modules/
grep -rn "from '@/modules/[^']*\/[^']*'" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__\|node_modules\|\.test\." \
  | grep -v "from '@/modules/[a-z-]*'" \
  | wc -l

# Lister les violations par pilier
grep -rn "from '@/modules/[^']*\/[^']*'" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__\|node_modules\|\.test\." \
  | sed "s/.*from '@\/modules\/\([^\/]*\)\/.*/\1/" \
  | sort | uniq -c | sort -rn
```

### Violations par pilier (mesure audit 2026-08-16)

| Pilier | Violations estimées | Notes |
|--------|-------------------|-------|
| `commerce` | ~70 | Forte interdépendance reservations ↔ crm |
| `ops` | ~60 | POS importe directement KDS et vice-versa |
| `logistics` | ~40 | Inventory ↔ approvisionnement |
| `intelligence` | ~30 | IA importe analytics, analytics importe IA |
| `finance` | ~25 | Comptabilité ↔ fiscalité |
| `facility` | ~15 | Assets ↔ maintenance |
| `human` | ~8 | RH ↔ paie |
| `compliance` | ~4 | Reste résiduel |

### Stratégie de migration

**Principe** : ne pas créer de PR barrel pure. Chaque fois qu'on touche un fichier pour une autre raison, corriger ses violations barrel en passant. En plus : 1 sprint par pilier de cleanup proactif.

#### Phase 0 — Outillage (S+1, 1 jour)

Ajouter une règle ESLint custom ou sentrux pour bloquer les nouvelles violations :

```jsonc
// .sentrux/barrel-violations.json
{
  "rules": {
    "no-cross-module-imports": {
      "pattern": "from '@/modules/[^']+/[^']+'",
      "exclude": ["__tests__", "*.test.ts"],
      "message": "Violation barrel : importer depuis @/modules/<pilier> uniquement"
    }
  }
}
```

Objectif : **gate bloquant sur les nouvelles violations** avant de réduire les existantes.

#### Phase 1 — Pilier `finance` (S+1, 2 jours)

Le plus petit. 25 violations, bien localisées dans `comptabilite/` → `fiscalite/`.

**Action** : exposer dans `src/modules/finance/index.ts` les types et hooks manquants, puis corriger les imports.

```typescript
// src/modules/finance/index.ts  — ajouter les exports manquants
export { FiscalEngine } from './fiscalite/FiscalAdapter';
export type { JournalEntry, FiscalSeal } from './comptabilite/schemas';
```

**Vérification** :
```bash
grep -rn "from '@/modules/finance/" src/ | grep -v "from '@/modules/finance'" | wc -l
# Doit être 0
```

#### Phase 2 — Pilier `human` (S+1, 1 jour)

8 violations. Simple.

**Action** : exposer les types HR et payroll depuis `src/modules/human/index.ts`.

#### Phase 3 — Pilier `compliance` (S+2, 1 jour)

4 violations résiduelles. Simple.

#### Phase 4 — Pilier `facility` (S+2, 2 jours)

15 violations. Vérifier que les imports assets ↔ maintenance passent par le barrel `facility`.

#### Phase 5 — Pilier `logistics` (S+3, 3 jours)

40 violations. Les plus complexes sont dans `inventory/` qui importe directement `approvisionnement/`.

**Action** :
1. Identifier les 5 types les plus importés cross-sous-domaine.
2. Les exposer dans `src/modules/logistics/index.ts`.
3. Corriger les imports file par file.

#### Phase 6 — Pilier `intelligence` (S+4, 3 jours)

30 violations. Le cycle analytics ↔ IA est le plus difficile car les deux se consomment mutuellement.

**Action** : identifier les types partagés et les remonter dans un fichier `src/modules/intelligence/shared-types.ts` exporté par le barrel racine.

#### Phase 7 — Pilier `ops` (S+5, 4 jours)

60 violations. Le plus complexe — POS, KDS, bar, printers tous interconnectés.

**Action** :
1. Auditer les 20 imports les plus fréquents.
2. Pour chaque import cross-sous-domaine : soit exposer dans le barrel `ops`, soit déplacer le type dans `src/modules/ops/shared-types.ts`.

#### Phase 8 — Pilier `commerce` (S+6, 4 jours)

70 violations. Le plus grand volume.

**Action** : même approche que `ops`. Focus sur `reservations` ↔ `crm` qui représentent ~40% des violations.

### Suivi de progression

```bash
# Tableau de bord : violations restantes par pilier
for pilier in finance human compliance facility logistics intelligence ops commerce; do
  count=$(grep -rn "from '@/modules/$pilier/" src/ \
    --include="*.ts" --include="*.tsx" \
    | grep -v "from '@/modules/$pilier'" \
    | grep -v "__tests__\|\.test\." | wc -l)
  echo "$pilier: $count"
done
```

### Critères d'acceptation finale

```bash
# 0 violation hors tests
grep -rn "from '@/modules/[^']+/[^']+'" src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__\|\.test\.\|node_modules" | wc -l
# → 0
```

---

## 3. BusinessIdentity — généralisation headChef/owner/category

### Contexte

`BusinessIdentity` est la couche généraliste censée représenter n'importe quelle verticale (restaurant, garage, clinique, salon). Elle contient 3 champs restaurant-specifiques :

```typescript
// src/shared/nexus/contracts/settings/identity.ts
export interface BusinessIdentity {
  category: 'bistrot' | 'gastronomique' | 'brasserie' | 'fast_casual' | 'cafe' | 'bar' | 'other';
  headChef?: string;
  owner?: string;
}
```

### Pourquoi pas une suppression directe

**`headChef` et `owner`** sont utilisés dans `marketing-engine.ts` pour le scoring de complétion du profil :

```typescript
// src/modules/commerce/acquisition/marketing/services/marketing-engine.ts:43
const weights = { headChef: 10, owner: 10, ... };
if (identityDefaults.headChef) score += weights.headChef;
if (identityDefaults.owner) score += weights.owner;
```

Et dans `instance.ts` pour la config d'instance :

```typescript
// src/config/instance.ts:82
headChef: process.env.NEXT_PUBLIC_RESTAURANT_HEAD_CHEF || '',
```

**`category`** est un enum fermé restaurant-only — un garage ou une clinique n'a pas de `'bistrot'`.

### Stratégie de migration

#### Étape 1 — Généraliser `category` (S+2, 0.5 jour)

Remplacer l'enum fermé par `string` + un type helper vertical-specific :

```typescript
// src/shared/nexus/contracts/settings/identity.ts
export interface BusinessIdentity {
  // ...
  category?: string; // Libre — chaque verticale définit ses valeurs dans VerticalBlueprint.dnaOverrides
}

// src/verticals/restaurant/types.ts
export type RestaurantCategory =
  | 'bistrot' | 'gastronomique' | 'brasserie'
  | 'fast_casual' | 'cafe' | 'bar' | 'other';
```

**Impact** : `category` devient optionnel + `string`. Les composants qui le lisent pour afficher un badge restent compatibles (`category ?? 'non défini'`).

**Vérification** :
```bash
npx tsc --noEmit
grep -rn "\.category\b" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\."
```

#### Étape 2 — Renommer `headChef` → `keyContact1` + `owner` → `keyContact2` (S+3, 1 jour)

Ces champs ont une sémantique générique (personne clé de l'établissement) — seul leur nom est restaurant-specific.

```typescript
// src/shared/nexus/contracts/settings/identity.ts
export interface BusinessIdentity {
  // ...
  /** Première personne clé (ex: chef cuisinier, gérant technique, médecin référent) */
  keyContact1?: string;
  /** Propriétaire ou responsable légal */
  keyContact2?: string;

  /** @deprecated use keyContact1 */
  headChef?: string;
  /** @deprecated use keyContact2 */
  owner?: string;
}
```

**Migration du marketing-engine** :

```typescript
// src/modules/commerce/acquisition/marketing/services/marketing-engine.ts
const weights = { keyContact1: 10, keyContact2: 10, ... };
// Backward compat : lire les deux
const contact1 = identityDefaults.keyContact1 ?? identityDefaults.headChef;
const contact2 = identityDefaults.keyContact2 ?? identityDefaults.owner;
if (contact1) score += weights.keyContact1;
if (contact2) score += weights.keyContact2;
```

**Migration de instance.ts** :

```typescript
// src/config/instance.ts
keyContact1: process.env.NEXT_PUBLIC_KEY_CONTACT_1 || process.env.NEXT_PUBLIC_RESTAURANT_HEAD_CHEF || '',
keyContact2: process.env.NEXT_PUBLIC_KEY_CONTACT_2 || '',
```

#### Étape 3 — Purger les champs deprecated (S+6, 0.5 jour)

Une fois que toutes les verticales ont migré vers `keyContact1/2`, supprimer `headChef` et `owner` des interfaces.

**Vérification finale** :
```bash
grep -rn "headChef\|\.owner\b" src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v deprecated
# → 0 résultat
```

### Critères d'acceptation

- `BusinessIdentity.category` : `string` libre, non fermé.
- `headChef` / `owner` : marqués `@deprecated`, conservés pour compat.
- `keyContact1` / `keyContact2` : utilisés dans marketing-engine et instance.ts.
- TSC = 0.
- Aucune verticale non-restaurant n'affiche `'bistrot'` dans son profil.

---

## 4. InCents résiduels

### Contexte

L'audit signalait des champs `*InCents` dans les contrats partagés. **Bonne nouvelle** : au moment de l'audit, tous ces champs avaient déjà leur contrepartie `*InMicrounits` et étaient marqués `@deprecated`. Les interfaces sont conformes.

**Ce qui reste** : des usages résiduels dans le code UI et les calculs, identifiés ci-dessous.

### Usages résiduels à corriger

```bash
# Détecter les usages réels (pas juste les définitions d'interface)
grep -rn "InCents" src/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|\.test\.\|__tests__\|// @deprecated\|@deprecated" \
  | grep -v "interface \|type \|export type" \
  | head -40
```

#### Résidus connus

| Fichier | Ligne | Champ | Correction |
|---------|-------|-------|-----------|
| `src/app/(client)/(ops)/pos/page.tsx` | 49 | `cartTvaInCents` | Renommer en `cartTvaInMicrounits` |
| `src/modules/commerce/ui/pos/VoidModal.tsx` | 40,295,341 | Calculs internes en cents | Réécrire en µ via `toMicrounits()` |
| `CampaignAttributionService.ts` | 65 | `order.totalAmountInCents * 10_000` | Lire `totalAmountInMicrounits` directement |

### Règle de correction

```typescript
// ❌ Ancien pattern
const tva = cartTvaInCents / 100;
const label = `${(priceInCents / 100).toFixed(2)} €`;

// ✅ Nouveau pattern
const tva = cartTvaInMicrounits / 1_000_000;
const label = `${(priceInMicrounits / 1_000_000).toFixed(2)} €`;
```

**Helper disponible** :
```typescript
import { toMicrounits, fromMicrounits } from '@/shared/schemas/primitives';
```

### Migration par fichier

#### `pos/page.tsx` (S+1, 2h)

```typescript
// Remplacer cartTvaInCents par cartTvaInMicrounits
// Le hook usePos expose déjà la valeur en microunits — vérifier et aligner le nom
```

#### `VoidModal.tsx` (S+2, 2h)

Trois calculs en cents identifiés. Remplacer les opérations `/ 100` par `/ 1_000_000` et renommer les variables.

#### `CampaignAttributionService.ts` (S+2, 1h)

```typescript
// ❌
const revenue = order.totalAmountInCents * 10_000;

// ✅
const revenue = order.totalAmountInMicrounits;
// (le champ exist déjà sur Order depuis la migration contracts)
```

### Critères d'acceptation

```bash
# 0 usage InCents hors interfaces et commentaires @deprecated
grep -rn "InCents" src/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|\.test\.\|__tests__" \
  | grep -v "interface \|type \|// @deprecated\|@deprecated\|InMicrounits" \
  | wc -l
# → 0
```

---

## Tableau de bord priorités

| Chantier | Sprint | Jours | Risque | Valeur |
|----------|--------|-------|--------|--------|
| God Files — SplitBillDialog | S+1 | 2 | Moyen | Haute |
| God Files — ReservationCreateDialog | S+1 | 2 | Moyen | Haute |
| InCents résiduels (3 fichiers) | S+1 | 1 | Faible | Haute |
| Barrel gate ESLint (nouvelles violations) | S+1 | 1 | Faible | Haute |
| BusinessIdentity — category générique | S+2 | 0.5 | Faible | Haute |
| Barrel Phase 1-3 (finance/human/compliance) | S+2 | 4 | Faible | Haute |
| God Files — SupplierHubDashboard | S+2 | 2 | Moyen | Haute |
| God Files — CreatePreparationModal | S+2 | 2 | Moyen | Haute |
| BusinessIdentity — keyContact1/2 | S+3 | 1 | Faible | Moyenne |
| Barrel Phase 4-5 (facility/logistics) | S+3 | 5 | Moyen | Haute |
| God Files (5 restants) | S+3→S+5 | 10 | Moyen | Moyenne |
| Barrel Phase 6-8 (intelligence/ops/commerce) | S+4→S+6 | 11 | Élevé | Haute |
| BusinessIdentity — purge deprecated | S+6 | 0.5 | Faible | Faible |

---

*Document généré le 2026-08-16 — à mettre à jour à chaque sprint complété.*
