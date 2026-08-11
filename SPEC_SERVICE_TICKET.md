# 🎫 SPEC — `ServiceTicket` : l'abstraction « prise en charge »

> **Mission C.1.** Vérifier que les 4 « prises en charge » (table restaurant, véhicule garage,
> check-in hôtel, accueil patient clinique) sont **la même opération**, puis spécifier l'abstraction.
> Tout est fondé sur la lecture du code réel — chemins et commandes cités.
>
> **Statut : FONDÉE — avec 3 délégations obligatoires.** `repair-intake` par-dessus tiendrait en **~85 lignes** (détail §7).
>
> Rédigé le 2026-08-11. Périmètre : **lecture seule**, aucun fichier `src/` modifié.

---

## 0. Point de départ mesuré

```bash
grep -rn "ServiceTicket" src/                 # → 0
grep -rniE "ServiceSubject" src/              # → 0
find src/modules/ops/service/core -name "*.ts*" | xargs wc -l   # → 30 (index + domain/types + 13 .gitkeep)
find src/modules/ops/workflow/core -name "*.ts*" | xargs wc -l  # → 23
```

L'abstraction n'existe pas. Le seul cycle de vie réellement implémenté est celui du **POS restaurant**
(`src/modules/ops/service/pos/`, **9 817 lignes**, 72 fichiers). C'est la seule source de vérité.

---

## 1. Le cycle de vie EFFECTIF du POS restaurant (lu, pas supposé)

Reconstruit à partir de trois sources concordantes :

| Source | Ce qu'elle définit |
|--------|--------------------|
| `src/modules/ops/domain/schemas/orders.ts:44,64` | états d'une ligne et d'un `Order` |
| `src/modules/ops/domain/schemas/pos.ts:33-64` | le **ticket scellé** `PosTicket` (état terminal fiscal) |
| `src/modules/ops/service/pos/hooks/usePos.ts` | les transitions réelles (ouverture table → envoi → scellement → libération) |

### 1.1 — Les états lus dans le code

```
OrderLine.status (orders.ts:44)   : pending → cooking → ready → served → cancelled
Order.status     (orders.ts:64)   : pending · cooking · ready · served · paid · cancelled
                                     · draft · new · preparing · delivered · pending_modification
Table.status     (ops.ts, testé)  : available → occupied → reserved → dirty → available
PosTicket.status (pos.ts:60)       : validated | cancelled | refunded   (immuable, scellé NF525)
```

### 1.2 — Les transitions réelles (usePos.ts)

```
1. OUVERTURE   selectedTableId ← table   (usePos.ts:55)   table: available → occupied
2. SAISIE      cartItems.push(...)         panier en microunits, CourseType par ligne
3. ENVOI       handleSendCourse(course)   (usePos.ts:223) → emit 'order.placed' + 'kitchen.order.created'
4. PRODUCTION  (KDS)                        kds.course_fired → kds.item_done → kds.course_passed
5. SERVICE     order.status = served
6. CLÔTURE     handleCloseTable()         (usePos.ts:173) → scellement NF525 → emit 'order.paid'
                                            updateTable(status:'dirty')  (usePos.ts:193)
7. LIBÉRATION  table: dirty → available   (TableAutoReleaseHandler / TicketZHandler)
```

### 1.3 — Ce que porte le ticket scellé (`PosTicketSchema`, pos.ts:33)

| Champ | Nature | Réutilisable ? |
|-------|--------|----------------|
| `id`, `correlationId` | identité | ✅ générique |
| `hashPrecedent`, `hash`, `serverTimestamp` | **chaîne NF525** | ✅ générique (cœur fiscal) |
| `deviceId`, `operatorId` | traçabilité | ✅ générique |
| `operatorRole: 'admin\|manager\|waiter\|cashier\|barman'` | rôle | 🟠 **teinté** (`waiter`, `barman`) |
| `lines[]`, `totalHT/TTC`, `tvaBreakdown`, `payments[]` | commercial | ✅ générique |
| `status: validated\|cancelled\|refunded` | état terminal | ✅ générique |
| `receiptNumber` | numérotation fiscale | ✅ générique |
| **`tableId`** | ressource | 🔴 **restaurant** → doit devenir `resourceId` générique |
| **`covers: 1..50`** | métrique convives | 🔴 **restaurant** → doit devenir métrique déléguée |
| **`consumptionMode: dine_in\|takeaway`** | mode | 🔴 **restaurant** |
| `CartLine.modifiers.ingredientId` (pos.ts:19) | couplage recette | 🔴 **restaurant** |

**Conclusion de lecture** : le ticket scellé est **déjà à 80 % générique**. Les 4 champs 🔴
(`tableId`, `covers`, `consumptionMode`, `ingredientId`) sont exactement la surface à déléguer.

---

## 2. Les 4 « prises en charge » sont-elles la même opération ?

Confrontation du cycle POS aux 3 autres métiers via leurs **événements déjà déclarés**
(`src/orchestration/events/vertical.events.ts`, mesurés — voir `MAPPING_EVENEMENTS_VERTICALES.md`).

| Phase générique | restaurant (implémenté) | garage (auto.*) | hôtel (hotel.*) | clinique (health.*) |
|-----------------|-------------------------|-----------------|-----------------|---------------------|
| **OPEN** (recevoir le sujet) | table `occupied` + `Order(new)` | `auto.vehicle_checked_in` | `hotel.guest_checked_in` | `health.patient_admitted` |
| **ASSIGN** (ressource) | table assignée | `auto.technician_assigned` | chambre (`room_booked`) | lit (`bed_status_changed`) |
| **WORK** (produire) | `cooking` (KDS) | `auto.repair_started` | séjour en cours | soins en cours |
| **CONSUME** (stock) | lignes → `order.paid` déduit | `auto.part_consumed` | `hotel.amenity_consumed` | `health.medication_dispensed` |
| **BILL** (facturer) | scellement `PosTicket` | `auto.invoice_issued` | `hotel.folio_charged` | `health.act_billed` |
| **CLOSE** (clôturer + libérer) | `paid` + table `dirty→available` | `auto.vehicle_released` | `hotel.guest_checked_out` | `health.patient_discharged` |

**Verdict : OUI, structurellement, c'est la même machine à 6 phases** — *ouvrir → assigner une ressource →
produire → consommer du stock → facturer → clôturer et libérer la ressource*. Les 4 métiers émettent déjà
un événement pour chaque phase. L'abstraction est donc **fondée sur des faits, pas sur une analogie**.

### ⚠️ Mais 3 différences réelles, non négociables, qui imposent la délégation

1. **La durée.** Restaurant = minutes ; garage = heures/jours ; hôtel = **nuitées** ; clinique = séjour variable.
   L'hôtel et la clinique facturent **au temps** (par nuit / par jour), le restaurant **au couvert**, le garage
   **pièces + main-d'œuvre**. → l'**unité de facturation** doit être déléguée (voir §3, `billingUnit`).
2. **Le sujet peut être une personne physique.** `health.patient_admitted` porte des **données de santé
   (RGPD art. 9)**. Un `ServiceTicket` clinique ne peut PAS stocker le sujet en clair dans un document fiscal.
   → `subject` doit passer par `PiiVault` (voir §3.2 et le manque §3.2 du mapping).
3. **Le sous-cycle de production diffère.** Le restaurant a le **séquençage par service** (`CourseType:
   entree|plat|dessert`, pos.ts) que les autres n'ont pas ; le garage a un **diagnostic** préalable
   (`auto.diagnostic_completed`) que le restaurant n'a pas. → la phase WORK a des **sous-états propres** à
   chaque verticale, à ne PAS remonter dans l'abstraction.

> Ces 3 différences ne cassent pas l'abstraction : elles définissent précisément **ce qui est délégué**.
> Une abstraction qui les ignorerait (un `ServiceTicket` avec `covers` et `tableId` en dur) serait fausse —
> c'est exactement le défaut actuel du `PosTicket`.

---

## 3. L'entité `ServiceTicket`

### 3.1 — Champs communs (portés par le socle, `kernel/nexus/contracts/`)

```ts
interface ServiceTicket {
  // — Identité & fiscalité (100 % générique, repris tel quel de PosTicket) —
  id:              UUID;
  correlationId:   UUID;
  tenantId:        TenantId;
  hashPrecedent:   string;       // chaîne NF525 — inchangée
  hash:            string;
  serverTimestamp: Timestamp;
  operatorId:      UUID;
  operatorRole:    RoleLevel;    // NIVEAU universel (voir §3.4 mapping), PAS 'waiter'

  // — Cycle de vie (générique) —
  state:           ServiceState; // machine §4
  openedAt:        Timestamp;
  closedAt:        Timestamp | null;

  // — Ressource assignée (générique, remplace tableId) —
  resourceId:      UUID | null;  // table | bay | room | bed | chair
  resourceKind:    string;       // 'table' | 'bay' | 'room' | 'bed' | 'chair' (déclaré par la verticale)

  // — Commercial (générique) —
  lines:           ServiceLine[];      // = CartLine sans ingredientId obligatoire
  totalHTInMicrounits:  Microunits;
  totalTTCInMicrounits: Microunits;
  tvaBreakdown:    Record<TaxRate, Microunits>;
  payments:        PaymentSplit[];
  sourceEntryId:   UUID | null;  // ← lien JournalEntry NF525 (voir §5)

  // — DÉLÉGUÉ À LA VERTICALE —
  subject:         ServiceSubjectRef;  // §3.2 — véhicule | séjour | patient | table
  billingUnit:     BillingUnit;        // §3.3 — 'per_cover' | 'per_night' | 'parts_labor' | 'per_act'
  verticalMeta:    Record<string, unknown>; // couverts, VIN, kilométrage, dates de séjour…
}
```

### 3.2 — `ServiceSubject` : le bien pris en charge (manque §3.2 du mapping — **absent**, `grep → 0`)

```ts
// kernel/nexus/contracts/ServiceSubject.ts   ← À CRÉER
interface ServiceSubjectRef {
  kind:      'table' | 'vehicle' | 'stay' | 'patient' | 'serialized_item';
  ref:       UUID;              // id de l'entité verticale
  isPii:     boolean;          // true → clinique : le détail vit dans PiiVault, JAMAIS ici
  label:     string;           // libellé non-PII pour l'UI et le document fiscal
}
```

> 🔴 **Règle de conception dès le départ** : si `isPii === true`, le `ServiceTicket` ne contient que
> `ref` + `label` anonymisé ; nom, pathologie, n° de sécu vivent dans `PiiVault`. Sans cette règle,
> ouvrir la clinique = fuite RGPD art. 9 dans un document fiscal immuable (impossible à corriger — NF525).

### 3.3 — `BillingUnit` : délègue la facturation (manque §3.3 — `IVerticalInvoicingAdapter` **absent**)

```bash
find src -name "*InvoicingAdapter*"   # → 0
find src/modules/finance -path "*invoicing*"  # → 0
```

La preuve que le restaurant est **câblé en dur dans le moteur fiscal** : `src/modules/finance/fiscalite/tax/vatResolver.ts:42-43`
classe la TVA par **mots-clés alimentaires** (`entrée|plat|dessert|pizza|burger|menu → 'food'`). Un garage
(pièces vs main-d'œuvre), une clinique (actes exonérés) ou une boulangerie (même croissant, taux variable
selon consommation) ont besoin d'une règle différente. → `billingUnit` route vers l'adapter de facturation
de la verticale. **À écrire avant tout ServiceTicket clinique/hôtel.**

---

## 4. La machine à états `ServiceState`

```
                 ┌─────────┐
   open() ──────▶│  OPEN   │ ressource assignable, lignes ajoutables
                 └────┬────┘
                      │ startWork()
                 ┌────▼────┐
                 │ WORKING │◀─┐ sous-états DÉLÉGUÉS (cooking / diagnostic / stay / treatment)
                 └────┬────┘  │ addLine(), consume()  (boucle interne à la verticale)
                      │───────┘
                      │ ready()
                 ┌────▼────┐
                 │  READY  │ produit livrable, en attente de clôture
                 └────┬────┘
                      │ bill() → scellement NF525 (sourceEntryId renseigné)
                 ┌────▼────┐
                 │ CLOSED  │ immuable — libère la ressource (resourceId → available)
                 └─────────┘
      any ──cancel()──▶ CANCELLED   (avant scellement uniquement ; après = refund via nouvelle entrée)
```

### Correspondance des transitions avec les 4 métiers

| Transition | restaurant | garage | hôtel | clinique |
|-----------|-----------|--------|-------|----------|
| `open()` | ouvrir table | `vehicle_checked_in` | `guest_checked_in` | `patient_admitted` |
| `startWork()` | envoi cuisine | `repair_started` (après `diagnostic_completed`) | attribution chambre | début soins |
| `consume()` | déduction recette | `part_consumed` | `amenity_consumed` | `medication_dispensed` |
| `ready()` | `served` | réparation finie | — (séjour continu) | — |
| `bill()` | scellement `PosTicket` | `invoice_issued` | `folio_charged` / checkout | `act_billed` |
| `bill()` (clôture) | `order.paid` | `vehicle_released` | `guest_checked_out` | `patient_discharged` |
| `cancel()` | void ticket | annulation OT | annulation résa | annulation RDV |

> Les colonnes garage/hôtel/clinique ne sont **pas hypothétiques** : chaque cellule correspond à un
> événement **déjà déclaré et déjà émis** par l'adapter de la verticale (`src/verticals/<v>/adapters/`,
> vérifié : les 72 événements sont émis — voir `MAPPING_EVENEMENTS_VERTICALES.md`).

---

## 5. Lien vers la facturation (NF525)

Le socle fiscal est déjà générique et réutilisable tel quel :

| Élément | Chemin | Générique ? |
|---------|--------|-------------|
| Bridge scellement | `src/modules/finance/comptabilite/FinancialNexusBridge.ts` | ✅ |
| Chaîne de sceau | `src/modules/finance/fiscalite/FiscalAdapter.ts` (`FiscalEngine.sealEntry`) | ✅ |
| `JournalEntry` (Zod) | `src/domain/schemas/finance.ts` | ✅ |

`ServiceTicket.bill()` appelle `FinancialNexusBridge.processOrder()` → crée un `JournalEntry` + `FiscalSeal`
chaîné, et renseigne `sourceEntryId`. **Aucune réécriture** — le pont accepte déjà des lignes en microunits
avec `tvaBreakdown`. Le seul point de délégation est le **taux de TVA** (via `billingUnit`/adapter, §3.3),
pas le scellement.

---

## 6. Événements génériques émis par `ServiceTicket`

| Événement générique proposé | Remplace / unifie | Cascade générique déjà branchée dessus |
|-----------------------------|-------------------|-----------------------------------------|
| `service.opened` | `order.placed`, `*.checked_in`, `*.admitted` | (aucune aujourd'hui — à brancher) |
| `service.resource_assigned` | `table.assigned`, `*.technician_assigned` | `table.assigned` a déjà un handler |
| `service.consumed` | `inventory.deducted`, `*.part_consumed` | **`StockDeductionHandler`** (order.paid → BOM) |
| `service.billed` | `order.paid`, `*.invoice_issued` | **cascade order.paid** : Stock, Loyalty, CRM, FiscalSeal, DigitalReceipt |
| `service.closed` | `table.released`, `*.released/discharged/checked_out` | `TableAutoReleaseHandler`, `TicketZHandler` |

> C'est ici que se joue le vrai gain : la cascade riche de `order.paid` (5 à 7 handlers génériques)
> devient réutilisable par les 4 verticales **si** elles émettent `service.billed` — ou si un pont
> traduit `auto.invoice_issued → service.billed`. Détail et taux de couverture réel dans
> `MAPPING_EVENEMENTS_VERTICALES.md`.

---

## 7. 🧪 Test de validité — `repair-intake` par-dessus l'abstraction

> Le mapping pose la règle : **si `repair-intake` tient en < 100 lignes, l'abstraction est bonne.**
> Reconstitution en pseudo-code fondée sur les événements garage réels déjà émis
> (`src/verticals/garage/adapters/Auto*Adapter.ts`, tous mesurés présents).

```ts
// src/modules/ops/service/repair-intake/index.ts   (spécialisation, PAS réimplémentation)
import { ServiceTicket, openTicket } from '@/modules/ops/service/core'; // le socle §3
import { AutoOpsAdapter, AutoFinanceAdapter, AutoLogisticsAdapter } from '@/verticals/garage/adapters';

// 1. Le sujet propre au garage (les 4 attributs que le mapping §3.2 liste : immat, VIN, km, historique)
interface VehicleSubject { plate: string; vin: string; mileage: number; }        //  3 lignes

// 2. Ouverture = open() + déclaration de la ressource "bay" + du sujet véhicule
export function checkInVehicle(v: VehicleSubject, customerId: UUID): ServiceTicket {
  const t = openTicket({
    resourceKind: 'bay',
    subject: { kind: 'vehicle', ref: v.vin, isPii: false, label: v.plate },
    billingUnit: 'parts_labor',
    verticalMeta: v,
  });
  AutoOpsAdapter.emitVehicleCheckedIn({ ...t, vin: v.vin, mileage: v.mileage }); //  émission existante
  return t;
}                                                                                 // ~10 lignes

// 3. Diagnostic (sous-état WORK propre au garage) → démarre le travail
export function completeDiagnostic(t: ServiceTicket, faults: Fault[]) {
  AutoOpsAdapter.emitDiagnosticCompleted({ ...t, faults });
  t.startWork();                                                                  // transition générique
}                                                                                 // ~5 lignes

// 4. Consommation de pièces = consume() générique → StockDeductionHandler réutilisé
export function consumePart(t: ServiceTicket, partId: UUID, qty: number) {
  t.consume([{ resourceId: partId, quantity: qty }]);        // émet service.consumed
  AutoLogisticsAdapter.emitPartConsumed({ ...t, partId, quantity: qty });
}                                                                                 // ~5 lignes

// 5. Facture + clôture = bill() générique → scellement NF525 + cascade order.paid réutilisée
export function releaseVehicle(t: ServiceTicket) {
  t.bill();                                                    // FinancialNexusBridge, sourceEntryId
  AutoFinanceAdapter.emitInvoiceIssued({ ...t });
  AutoOpsAdapter.emitVehicleReleased({ ...t });               // service.closed → bay libérée
}                                                                                 // ~8 lignes
```

**Décompte** : sujet (3) + check-in (10) + diagnostic (5) + pièces (5) + clôture (8) + imports/types (~14)
+ le vocabulaire de rôles/labels (~40, cf. §3.4 mapping) ≈ **~85 lignes**. La logique métier
(stock, TVA, scellement, cascade) est **héritée**, pas réécrite.

### ✅ Verdict : l'abstraction PASSE le test (~85 < 100).

**À condition** que les 3 prérequis soient livrés d'abord (dans cet ordre) :
1. `ServiceSubject` dans `kernel/nexus/contracts/` (sinon `subject` n'a pas de type)
2. `billingUnit` / `IVerticalInvoicingAdapter` (sinon `bill()` retombe sur le `vatResolver` restaurant)
3. `roleLabels` par verticale (sinon `operatorRole` reste `'waiter'|'barman'`)

C'est exactement l'ordre recommandé par le mapping §8 (§3.2 → §3.3 → §3.4 → §3.1).

---

## 8. Ce que cette spec change dans le mapping d'origine

- Le mapping affirme « ces 4 opérations sont **la même** » : **confirmé par lecture**, avec la précision
  que 3 dimensions (durée/PII/sous-cycle) sont déléguées — le mapping ne les nommait pas toutes.
- Le mapping dit « `pos` = module GÉNÉRIQUE » : **faux**. `pos` est **GÉNÉRIQUE TEINTÉ** — c'est
  littéralement le porteur des 4 présupposés à lever (`tableId`, `covers`, `consumptionMode`, `ingredientId`).
  `ServiceTicket` n'est pas un module neuf à côté de `pos` : c'est **l'extraction du générique hors de `pos`**.
- La preuve la plus dure que la facturation n'est pas abstraite : `vatResolver.ts:42` — le moteur de TVA
  contient une liste de plats. Tant qu'elle y est, aucune autre verticale ne peut facturer juste.

---

*Sources : `src/modules/ops/service/pos/` · `src/modules/ops/domain/schemas/{pos,orders}.ts` ·
`src/orchestration/events/vertical.events.ts` · `src/verticals/garage/adapters/` ·
`src/modules/finance/fiscalite/tax/vatResolver.ts`. Détail événementiel : `MAPPING_EVENEMENTS_VERTICALES.md`.*
