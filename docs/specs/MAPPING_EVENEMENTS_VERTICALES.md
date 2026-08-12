# 🔀 MAPPING ÉVÉNEMENTS VERTICALES ⇄ HANDLERS

> **Mission C.3.** Pour chacun des **72 événements** de `src/orchestration/events/vertical.events.ts` :
> est-il abonné aujourd'hui ? sinon quel handler **générique** ferait le travail ? sinon quel handler
> **restaurant** est son équivalent structurel ?
>
> C'est le chiffre qui dit **le vrai coût d'ouverture d'une verticale**.
> Mesuré le 2026-08-11 — lecture seule, aucun fichier `src/` modifié.

---

## 0. Les 3 chiffres de tête (mesurés, pas estimés)

```bash
# les 72 événements
grep -cE "^\s+'[a-z_]+\.[a-z_.]+'" src/orchestration/events/vertical.events.ts            # → 72
# abonnements des 166 handlers génériques (NexusEventBus.on)
grep -rhA1 "NexusEventBus.on(" src/orchestration/handlers src/orchestration/registerHandlers | grep -oE "'[a-z_.]+'" | sort -u | wc -l   # → 136 abonnements
# handlers génériques écoutant un événement vertical
grep -rhoE "'(auto|hotel|health|bakery|salon|retail)\.[a-z_.]+'" src/orchestration/handlers src/orchestration/registerHandlers* | sort -u   # → 0
```

| Question | Réponse mesurée |
|----------|-----------------|
| Combien des 72 sont **émis** ? | **72 / 72** — tous câblés dans `src/verticals/<v>/adapters/*.ts` |
| Combien ont **un abonné quelconque** ? | **35 / 72** — uniquement des re-émetteurs **intra-verticale** (`context.registerEventHandler` dans `*Vertical.ts`) |
| Combien sont servis par un **handler métier générique** (les 166 de `orchestration/handlers/`) ? | **0 / 72** |
| Combien sont émis **sans aucun consommateur** ? | **37 / 72** (dont les 6 `connectors.*`) |

> ⚠️ **Correction du mapping d'origine.** Le mapping annonce « 83 % des cascades cibles sont génériques…
> il ne reste qu'à brancher les handlers ». Le potentiel de réutilisation est réel (§3 : **~64 %**),
> mais l'état **actuel du branchement est 0**. Aucun des 72 événements n'est aujourd'hui consommé par
> `StockDeductionHandler`, `LoyaltyPointsAccrualHandler`, la cascade `order.paid`, etc. « Il ne reste qu'à
> brancher » sous-entend que quelques-uns le sont déjà — **aucun ne l'est**.

---

## 1. Comment les handlers génériques s'abonnent (mécanisme lu)

`src/orchestration/handlers/StockDeductionHandler.ts:58` :

```ts
export function registerStockDeductionHandler(): () => void {
  return NexusEventBus.on('order.paid', async (payload) => { /* explosion BOM, déduction stock */ });
}
```

→ Les 166 handlers écoutent un vocabulaire **restaurant / commun** : `order.paid`, `reservation.*`,
`stock.*`, `kds.*`, `haccp.*`, `hr.*`, `crm.*`, `table.*`, `finance.*`, `facility.*`, `analytics.*`.
**Aucun `NexusEventBus.on('auto.…')` / `'hotel.…'` etc.** n'existe. La cascade riche est prête, mais
branchée sur le restaurant seulement.

Les 35 événements « abonnés » le sont via un autre mécanisme : `context.registerEventHandler('auto.…', …)`
**dans la classe verticale** (`src/verticals/garage/AutoVertical.ts:61`). Ce sont des re-émissions légères
(ex. `auto.diagnostic_completed → emit auto.repair_started`), **pas** les handlers métier.

---

## 2. La cascade de référence `order.paid` (ce qui est réutilisable)

Émis à la clôture POS (`src/modules/ops/service/pos/hooks/usePos.ts:173`). Handlers abonnés (mesuré,
`NexusEventBus.on('order.paid'` → 7 abonnements) :

| Handler générique | Rôle | Transposable ? |
|-------------------|------|----------------|
| `StockDeductionHandler` | explosion recette/BOM → déduction stock | ✅ tout métier consommant du stock |
| `LoyaltyPointsAccrualHandler` | points fidélité | ✅ |
| CRM (`crm.*` handlers) | mise à jour fiche client | ✅ |
| `FiscalSeal` / `finance.order_sealed` | scellement NF525 | ✅ (via `billingUnit`) |
| `DigitalReceiptHandler` | reçu numérique | ✅ |
| `PaymentLedgerHandler` | grand-livre | ✅ |

**C'est cette cascade que chaque « facturation » verticale (`auto.invoice_issued`, `hotel.guest_checked_out`,
`retail.sale_completed`, `salon.appointment_completed`, `health.act_billed`) devrait déclencher.** Aucune ne
la déclenche aujourd'hui.

---

## 3. Table des 72 événements ⇄ handlers

**Légende verdict** :
- ✅ **RÉUTILISABLE** — un handler générique **existe** pour l'équivalent structurel ; coût = brancher (abonner ou pont d'événement).
- 🟠 **PARTIEL** — un handler proche existe mais demande une adaptation (TVA, PII, sous-état).
- 🔴 **NEUF** — concept sans équivalent générique ; handler à écrire.

**Colonne « intra-V »** : ✔ = déjà ré-émis par un `registerEventHandler` dans la classe verticale (35/72).

### 3.1 — connectors.* (6) — génériques, hors cascade verticale

| Événement | intra-V | Équivalent générique | Handler réutilisable | Verdict |
|-----------|:---:|----------------------|----------------------|:---:|
| `connectors.auto_activated` | — | (natif) émis par `TenantSeeder` | — (aucun abonné) | 🟠 émis, non consommé |
| `connectors.activated` | — | émis par routes API connecteurs | — | 🟠 émis, non consommé |
| `connectors.deactivated` | — | idem | — | 🟠 |
| `connectors.config_saved` | — | idem | — | 🟠 |
| `connectors.sync_completed` | — | idem | — | 🟠 |
| `connectors.sync_failed` | — | idem | — | 🟠 |

> Ces 6 ne sont pas sectoriels : ce sont des événements d'infrastructure connecteurs qui vivent par erreur
> dans `vertical.events.ts`. Le « 72 » du mapping = **66 verticaux + 6 connecteurs**.

### 3.2 — auto / garage (14)

| Événement | intra-V | Équivalent générique | Handler réutilisable | Verdict |
|-----------|:---:|----------------------|----------------------|:---:|
| `auto.vehicle_checked_in` | ✔ | `service.opened` (→ `table.assigned`) | lifecycle table (partiel) | 🟠 |
| `auto.diagnostic_completed` | ✔ | — (diagnostic = propre garage) | — | 🔴 |
| `auto.repair_started` | — | `service.working` | — (thin) | 🔴 |
| `auto.part_consumed` | ✔ | `inventory.deducted` | **`StockDeductionHandler`** | ✅ |
| `auto.part_reorder_needed` | — | `stock.low` | **`StockAlertHandler`** | ✅ |
| `auto.invoice_issued` | ✔ | **`order.paid`** | **cascade order.paid (6 handlers)** | ✅ |
| `auto.vehicle_released` | — | `table.released` | `TableAutoReleaseHandler`, `TicketZHandler` | ✅ |
| `auto.warranty_claim_submitted` | ✔ | — (garantie = ligne à 0 €, propre) | — | 🔴 |
| `auto.certification_expiry` | — | `cert.expired` | handler cert. (CT/pollution ≈ certif.) | ✅ |
| `auto.appointment_booked` | — | `reservation.created` | handlers réservation | ✅ |
| `auto.customer_satisfaction_logged` | — | `review.negative` / `crm.*` | CRM (partiel) | 🟠 |
| `auto.technician_assigned` | — | affectation ressource `hr.*` | — (pas d'équivalent exact) | 🟠 |
| `auto.workshop_metrics_snapshot` | — | `analytics.sales_data_ready` | pipeline reporting | ✅ |
| `auto.lift_maintenance_required` | ✔ | `facility.maintenance_required` | handler maintenance | ✅ |

**auto : ✅ 8 · 🟠 3 · 🔴 3**

### 3.3 — hotel (13)

| Événement | intra-V | Équivalent générique | Handler réutilisable | Verdict |
|-----------|:---:|----------------------|----------------------|:---:|
| `hotel.guest_checked_in` | ✔ | `service.opened` (`reservation.confirmed`) | résa (partiel) | 🟠 |
| `hotel.guest_checked_out` | ✔ | **`order.paid`** + `table.released` | **cascade order.paid** | ✅ |
| `hotel.room_status_changed` | ✔ | statut ressource / `facility.*` | facility (partiel) | 🟠 |
| `hotel.housekeeping_task_created` | — | `facility.maintenance_required` | maintenance (proche) | 🟠 |
| `hotel.folio_charged` | — | facturation à-compte | `PaymentLedgerHandler` (partiel) | 🟠 |
| `hotel.city_ledger_entry` | ✔ | compte tiers (`on_account`) | AP / grand-livre (partiel) | 🟠 |
| `hotel.room_booked` | ✔ | `reservation.created` | handlers réservation | ✅ |
| `hotel.yield_rate_updated` | — | tarification dynamique | — | 🟠 |
| `hotel.fire_safety_check` | — | `compliance.calendar` / `cert.expired` | compliance | ✅ |
| `hotel.housekeeper_assigned` | — | affectation `hr.*` | — | 🟠 |
| `hotel.amenity_consumed` | ✔ | `inventory.deducted` | **`StockDeductionHandler`** | ✅ |
| `hotel.occupancy_snapshot` | — | `analytics.*` | reporting | ✅ |
| `hotel.room_maintenance_required` | ✔ | `facility.maintenance_required` | maintenance | ✅ |

**hotel : ✅ 6 · 🟠 7 · 🔴 0**

### 3.4 — health / clinic (14)

| Événement | intra-V | Équivalent générique | Handler réutilisable | Verdict |
|-----------|:---:|----------------------|----------------------|:---:|
| `health.patient_admitted` | ✔ | `service.opened` | lifecycle (partiel, **PII**) | 🟠 |
| `health.patient_discharged` | ✔ | `service.closed` | `table.released` (partiel, **PII**) | 🟠 |
| `health.bed_status_changed` | — | statut ressource | facility (partiel) | 🟠 |
| `health.insurance_claim_submitted` | — | — (tiers-payant, propre) | — | 🔴 |
| `health.act_billed` | ✔ | **`order.paid`** (TVA exonérée) | cascade **via `billingUnit`** | 🟠 |
| `health.hds_audit_log` | — | `system.audit_log` | handler audit | ✅ |
| `health.consent_recorded` | ✔ | RGPD / `compliance.*` | handler conformité | ✅ |
| `health.appointment_booked` | ✔ | `reservation.created` | réservation | ✅ |
| `health.appointment_cancelled` | — | `reservation.cancelled` | réservation | ✅ |
| `health.practitioner_on_call` | — | planning `hr.*` | — (partiel) | 🟠 |
| `health.medication_dispensed` | ✔ | `inventory.deducted` | **`StockDeductionHandler`** | ✅ |
| `health.supply_reorder_needed` | — | `stock.low` | **`StockAlertHandler`** | ✅ |
| `health.patient_flow_snapshot` | — | `analytics.*` | reporting | ✅ |
| `health.equipment_maintenance_required` | ✔ | `facility.maintenance_required` | maintenance | ✅ |

**health : ✅ 8 · 🟠 5 · 🔴 1** — *avec le caveat PII (RGPD art. 9) sur admitted/discharged/act_billed.*

### 3.5 — bakery (9)

| Événement | intra-V | Équivalent générique | Handler réutilisable | Verdict |
|-----------|:---:|----------------------|----------------------|:---:|
| `bakery.batch_started` | ✔ | production (KDS-like) | — (propre production) | 🟠 |
| `bakery.batch_completed` | ✔ | production → mise en stock | inventaire (partiel) | 🟠 |
| `bakery.oven_temp_alert` | ✔ | `sensor.temperature_anomaly` / `haccp.alert` | handler HACCP température | ✅ |
| `bakery.preorder_received` | ✔ | `order.placed` / `reservation.created` | réservation / commande | ✅ |
| `bakery.display_stock_low` | ✔ | `stock.low` | **`StockAlertHandler`** | ✅ |
| `bakery.allergen_declared` | ✔ | allergènes recette (`recipe.updated`) | HACCP (partiel) | 🟠 |
| `bakery.ingredient_consumed` | — | `inventory.deducted` | **`StockDeductionHandler`** | ✅ |
| `bakery.waste_logged` | — | `waste.logged` / `inventory.waste_logged` | `WasteStockReconciliationHandler` | ✅ |
| `bakery.metrics_snapshot` | — | `analytics.*` | reporting | ✅ |

**bakery : ✅ 6 · 🟠 3 · 🔴 0**

### 3.6 — salon (8)

| Événement | intra-V | Équivalent générique | Handler réutilisable | Verdict |
|-----------|:---:|----------------------|----------------------|:---:|
| `salon.appointment_booked` | ✔ | `reservation.created` | réservation | ✅ |
| `salon.appointment_completed` | ✔ | **`order.paid`** | cascade order.paid | ✅ |
| `salon.appointment_cancelled` | — | `reservation.cancelled` | réservation | ✅ |
| `salon.no_show` | ✔ | `reservation.no_show` | **`NoShowCRMHandler`, `NoShowTableReleaseHandler`** | ✅ |
| `salon.stylist_assigned` | — | affectation ressource | — | 🟠 |
| `salon.product_consumed` | ✔ | `inventory.deducted` | **`StockDeductionHandler`** | ✅ |
| `salon.loyalty_earned` | — | `crm.points_earned` | **`LoyaltyPointsAccrualHandler`** | ✅ |
| `salon.chair_metrics_snapshot` | — | `analytics.*` | reporting | ✅ |

**salon : ✅ 7 · 🟠 1 · 🔴 0** — *la verticale la mieux couverte par le générique (rendez-vous + fidélité + stock).*

### 3.7 — retail (8)

| Événement | intra-V | Équivalent générique | Handler réutilisable | Verdict |
|-----------|:---:|----------------------|----------------------|:---:|
| `retail.sale_completed` | ✔ | **`order.paid`** | **cascade order.paid complète** | ✅ |
| `retail.return_processed` | ✔ | `order.refunded` | `OrderCancelRestockHandler` | ✅ |
| `retail.stock_alert` | ✔ | `stock.low` | **`StockAlertHandler`** | ✅ |
| `retail.promotion_activated` | ✔ | `commerce.promotion_activated` | handler promo (**correspondance exacte**) | ✅ |
| `retail.pos_session_opened` | ✔ | `pos.terminal_login` | ouverture caisse (partiel) | 🟠 |
| `retail.pos_session_closed` | — | `finance.ticket_z_closed` / `finance.cash_counted` | `TicketZHandler` (clôture Z) | ✅ |
| `retail.loyalty_earned` | — | `crm.points_earned` | **`LoyaltyPointsAccrualHandler`** | ✅ |
| `retail.metrics_snapshot` | — | `analytics.*` | reporting | ✅ |

**retail : ✅ 7 · 🟠 1 · 🔴 0**

---

## 4. Taux de couverture — le chiffre du coût d'ouverture

Sur les **66 événements verticaux** (hors 6 `connectors.*`) :

| Verdict | Nombre | Part | Signification |
|---------|:---:|:---:|---------------|
| ✅ **RÉUTILISABLE** | **42** | **64 %** | un handler générique existe déjà ; coût = **brancher** (abonner ou pont d'événement) |
| 🟠 **PARTIEL** | **19** | 29 % | handler proche, adaptation requise (TVA/PII/affectation/sous-état) |
| 🔴 **NEUF** | **5** | 7 % | à écrire : `diagnostic_completed`, `repair_started`, `warranty_claim`, `insurance_claim`, sous-cycle production |

> **Sur 72 événements verticales, 0 sont couverts par un handler générique *aujourd'hui*, mais 42/66 (64 %)
> le seraient par simple branchement, 19 demandent une adaptation, 5 sont réellement à écrire.**

### Écart avec le « 83 % » du mapping

- Le mapping mesurait un **potentiel théorique** (« 137 des 166 handlers sont génériques ») — c'est-à-dire
  la part de handlers *réutilisables en principe*, pas la part d'événements *couverts*.
- La mesure ici est **par événement cible** : 64 % ont un handler équivalent prêt. L'écart 83 % → 64 %
  vient des 24 % d'événements (partiels + neufs) qui portent une spécificité verticale réelle
  (TVA exonérée clinique, garantie à 0 €, tiers-payant, diagnostic, séquençage production).
- La divergence la plus importante n'est pas 83 vs 64, c'est **potentiel vs réel** : le branchement est à
  **0**. Le coût d'ouverture d'une verticale n'est donc pas « rien », c'est **brancher 42 abonnements +
  adapter 19 + écrire 5**, par verticale — après avoir créé le **pont générique** qui traduit
  `*.billed → order.paid`, `*.consumed → inventory.deducted`, `*.closed → table.released`.

### La bonne architecture de branchement (déduite)

Deux options, la seconde est la bonne :

1. ❌ Abonner chaque handler générique à chaque événement verticale (7 verticales × 42 = 294 abonnements).
2. ✅ **Un pont** `VerticalEventBridge` qui traduit les événements verticaux vers le vocabulaire générique
   (`auto.invoice_issued → order.paid`, `hotel.amenity_consumed → inventory.deducted`…). Les handlers
   génériques restent branchés sur `order.paid` **une fois**. C'est le point d'ancrage #7 du mapping
   (« Handlers de cascade ») qui devrait donc être **un pont**, pas des handlers dupliqués par verticale.

---

## 5. Ce que cette analyse corrige dans le mapping d'origine

1. **« Il ne reste qu'à brancher les handlers »** → aucun n'est branché (0/72). Le travail est réel, pas nul.
2. **« 83 % des cascades sont génériques »** → par événement cible, **64 %** ont un handler prêt ; 29 %
   partiels, 7 % neufs.
3. **Point d'ancrage #7 (`orchestration/handlers/`, 🔴 restaurant uniquement)** → exact, mais la bonne
   réponse n'est pas « écrire les handlers par verticale » : c'est **un pont d'événements** vers le
   vocabulaire générique existant.
4. Les 6 `connectors.*` ne sont pas des événements verticaux — le vrai compte est **66 verticaux**.
5. Les 35 « abonnements » existants sont des **re-émetteurs intra-verticale**, pas des cascades métier —
   à ne pas confondre avec une couverture réelle.

---

*Sources : `src/orchestration/events/vertical.events.ts` · `src/orchestration/handlers/*.ts` ·
`src/orchestration/registerHandlers/` · `src/verticals/*/adapters/*.ts` · `src/verticals/*/*Vertical.ts`.
Abstraction de clôture : `SPEC_SERVICE_TICKET.md`.*
