# AUDIT LOGIQUE MÉTIER — Bout-en-bout, RBAC, réglages

> Session `plan-correctif-suite-cycles`, 2026-08-30 soir.
> Audit **lecture-seule** après clôture du plan LOGIQUE MÉTIER (9/9 lots livrés,
> tag `v1.2.0-logique-metier-complete-2026-08-30`). Objectif : vérifier que
> chaque action déclarée est branchée bout-en-bout, que le RBAC est cohérent
> et que les réglages qui prétendent gouverner le RBAC le font réellement.
>
> **Loi 7** : tous les chiffres ont été mesurés dans cette session via
> `grep`/`node` reproductibles. Aucun chiffre recopié.

## Verdict rapide

Le **golden path métier est intact** : les événements du plan §2 sont tous
émis et écoutés depuis les commits LOTs A/B/C/D. Cependant l'audit RBAC
révèle **un défaut structurel P0 et 5 orphelins P1** qui n'étaient pas
dans le périmètre initial du plan LOGIQUE MÉTIER.

| Sévérité | Trouvailles |
|---|---|
| **P0** | 1 — `canAccessSetting()` retourne `true` toujours → les `roles: [...]` déclarés dans les 37 settings ne sont pas enforced |
| **P1** | 5 — événements orphelins ou orphelins de gardes UI (détails §3) |
| **P2** | 3 — cohérence de nommage et documentation (détails §4) |

Preflight rapide reste vert. Le socle applicatif est propre — les défauts
identifiés sont des trous de wiring dans la logique métier, pas du code
cassé.

---

## 1. Inventaire des actions applicatives

### POS (`usePos.ts`) — 16 actions

`handleAddToCart`, `handleApplyDiscount`, `handleApplyOffer`, `handleCancelItem`,
`handleCheckout`, `handleClearCart`, `handlePaySplit`, `handlePaymentComplete`,
`handleSendCourse`, `handleSendToKitchen`, `handleSetItemConsumptionMode`,
`handleSetItemCourse`, `handleSetItemNote`, `handleSplitComplete`,
`handleToggleDoggyBag`, `handleUpdateQuantity`.

**Fail-closed tenant** : ✅ actions d'écriture (SendToKitchen, finalizePayment,
SendCourse) refusent l'exécution sans `activeTenantId` (LOT F).

### Réservations (`useReservationsPage.ts`) — 8 actions

`handleTerraceToggle`, `handleMarkNoShow`, `handleCancelReservation`,
`handleSaveReservation`, `handleUpdateReservation`, `handleCreateGroup`,
`handleMarkArrived`, `handlePinConfirm`.

**Fail-closed tableId** : ✅ `handleMarkArrived` refuse sans table réelle
(LOT C.4).

### Plan de salle (`floorHooks.tsx`) — 6 actions

`updateTablePosition`, `updateNode`, `addNode`, `deleteNode`, `markTableCleaned`
(nouveau LOT D.4), et helpers zone/floor.

**State machine** : ✅ `updateNode` valide les transitions via
`assertTableTransition` (LOT D.2).

---

## 2. Bus événementiel — couverture émetteurs/écouteurs

Mesuré sur le corpus src/ hors tests et hors fichiers de schémas d'événements.
Régex `emit(Durable)?(...'event.name'...)` et `NexusEventBus.on(...) /
registerEventHandler(...'event.name'...)`.

| Événement | Émetteurs | Écouteurs | État |
|---|---:|---:|---|
| `reservation.created` | 2 | 2 | ✅ |
| `reservation.confirmed` | 3 | 2 | ✅ (LOT C.2) |
| `reservation.matched` | 3 | 1 | ✅ |
| `table.assigned` | 1 | 1 | ✅ (LOT C.3) |
| `table.released` | 5 | 3 | ✅ (LOT D.3) |
| `order.placed` | 6 | 1 | ⚠️ 1 seul écouteur (KdsRoutingHandler) |
| `order.paid` | 3 | 9 | ✅ (sceau + ledger + stock + loyalty + VIP + digital receipt…) |
| `order.split` | 1 | 1 | ✅ |
| `order.cancelled` | 2 | 2 | ✅ |
| `order.comp` | 1 | 3 | ✅ |
| `order.refunded` | 1 | 2 | ✅ |
| `notification.created` | 31 | 1 | ⚠️ 31 émetteurs pour 1 écouteur — voir §3-P1-B |
| `dlc.expired` | 2 | 3 | ✅ |
| `sovereign.breach` | 3 | 1 | ✅ |
| `hr.overtime_alert` | 1 | 1 | ✅ |
| `stock.received` | 1 | 1 | ✅ |

### 2.a Orphelins (P1)

Événements avec `0` émetteur OU `0` écouteur (déclarés inutilement) :

| Événement | Émetteurs | Écouteurs | Défaut |
|---|---:|---:|---|
| `table.cleaned` | 0 | 0 | **P1-A** — LOT D.4 ajoute `markTableCleaned` mais n'émet PAS `table.cleaned`. Cycle vie fantôme (voir §3) |
| `kds.item_done` | 0 | 2 | **P1-B** — 2 écouteurs (KDSReadyHandler + notif) sans émetteur : la mise en place du plat prêt n'est jamais captée depuis la brigade |
| `stock.transfer` | 0 | 1 | **P1-C** — StockTransferHandler écoute un événement jamais émis par le code métier |
| `payment.failed` | 0 | 0 | **P1-D** — Type déclaré, aucun code n'émet ni n'écoute (mort) |
| `reservation.event_created` | 0 | 0 | **P1-E** — Mort |
| `ops.order_notification` | 1 | 1 | **P2-A** — RestaurantOpsAdapter émet, OrderNotificationHandler écoute, mais adapter sans appelant (fantôme legacy) |

---

## 3. RBAC — surface et enforcement

### 3.a Table déclarative (source unique : `src/kernel/contracts/rbac.ts`)

- **26 rôles** définis (`RBAC_ROLES`), 3 MCC (`mcc_super_admin`,
  `mcc_support`, `mcc_junior_dev`) + 23 tenant (admin, directeur, manager,
  comptable, chef_rang, serveur, chef_cuisinier, cuisinier, barman, hotesse,
  plongeur, etc.).
- **Scope disjoint** fleet/tenant ✅
- **Level hiérarchique** 0-1000 pour comparaisons `>=`

### 3.b `DEFAULT_PAGE_ACCESS` (`src/shared/schemas/rbac.schemas.ts`)

24 pages avec liste des rôles autorisés à voir la page. Consommé par
`usePageAccess` et `TenantProvisioningService` à la création du tenant.

### 3.c `DEFAULT_TAB_ACCESS` (idem)

3 pages (pos, finance, staff) avec 4-5 onglets par page. Applique un
sous-filtrage granulaire aux onglets.

### 3.d `DEFAULT_ACTION_ACCESS` (idem)

19 actions granulaires réparties sur 6 pages :

| Page | Actions déclarées |
|---|---|
| pos | void_line, apply_discount, cash_count, reopen_bill, split_payment |
| kds | bump_order, recall_ticket, clear_station |
| finance | export_fec, seal_zday, reconcile_bank, cancel_entry, create_expense_claim |
| staff | edit_shifts, approve_leaves, validate_payroll |
| inventory | adjust_stock, approve_order |
| haccp | validate_temperature, archive_logs |

### 3.e Enforcement UI — `ActionGuard`

**25 usages** de `<ActionGuard>` dans le code applicatif — mais seulement
**4 dans le pilier ops** :

- `PosHeader.tsx` : `cash_count`, `void_line`
- `KDSHeader.tsx` : `recall_ticket`
- `KDSTicketFooter.tsx` : `bump_order`

### 3.f Couverture réelle par action déclarée

Nombre d'usages du nom d'action dans le code hors registry :

| Action | Usages hors registry | État |
|---|---:|---|
| adjust_stock | 5 | ✅ |
| seal_zday | 3 | ✅ |
| cash_count | 2 | ✅ |
| void_line | 2 | ✅ |
| bump_order | 1 | ✅ |
| recall_ticket | 1 | ✅ |
| edit_shifts | 1 | ✅ |
| export_fec | 1 | ✅ |
| reconcile_bank | 1 | ✅ |
| archive_logs | 1 | ✅ |
| apply_discount | **0** | ❌ **P1-F** — non gardée dans l'UI |
| split_payment | **0** | ❌ **P1-G** — bouton split accessible à tous |
| reopen_bill | **0** | ❌ **P1-H** — pas d'écran (feature absente ou orpheline) |
| clear_station | **0** | ❌ **P1-I** — pas d'écran KDS |
| cancel_entry | **0** | ❌ **P1-J** — comptable/directeur non gardé |
| approve_order | **0** | ❌ **P1-K** — inventaire non gardé |
| validate_temperature | **0** | ❌ **P1-L** — HACCP non gardé |
| approve_leaves | **0** | ❌ **P1-M** — RH non gardée |
| validate_payroll | **0** | ❌ **P1-N** — paie non gardée |

**9 actions déclarées mais jamais gardées** dans l'UI ni le code — le
registre RBAC promet une granularité qui n'existe pas au runtime.

### 3.g Enforcement route (page) — `withPageGuard`

**81 usages** de `withPageGuard` sur les routes `/app/**` — coverage
solide. Toute page canonique semble avoir sa garde de rôle.

### 3.h Réservations — pilier entier sans garde d'action

`grep 'ActionGuard' src/modules/commerce/relation/reservations` = **0 résultat**.

Aucune action de réservation (annulation, no-show, création groupe,
transfert) n'est gardée dans l'UI. Les rôles serveur/hotesse peuvent
faire toutes les actions comme le manager, si la garde de PAGE laisse
passer. **P1-O**.

---

## 4. Cohérence RBAC ↔ réglages

### 4.a Structure des settings

`config-registry.ts` déclare **37 réglages** avec un champ `roles: [...]`
qui liste les rôles autorisés à voir/modifier ce réglage. Exemples :

- `show_ca`, `ca_target` : `roles: ['admin', 'directeur']`
- `split_bill_enabled` : `roles: ['admin', 'directeur']`
- `noshow_delay` : `roles: ['admin', 'directeur', 'manager']`

### 4.b 🚨 P0-α — `canAccessSetting()` retourne toujours `true`

Fichier `src/shared/components/settings/ContextualSettings.tsx:75-78` :

```ts
const canAccessSetting = (_setting: PageSettingConfig) => {
    // Simplified for now - in a real app, check user permissions
    return true;
};
```

Le paramètre est même préfixé `_` (marqueur "intentionnellement inutilisé").

**Conséquence métier** : un serveur peut voir et modifier
`ca_target` (`roles: ['admin']`), `split_bill_enabled` (`roles: ['admin',
'directeur']`), et les 35 autres réglages restreints. Le champ `roles:` dans
config-registry est **purement décoratif** — mensonge complet du système
RBAC des paramètres.

### 4.c Réglages effectivement lus

Vérifiés en session : **oui**, les réglages critiques SONT lus par le code
qui doit les honorer :

| Réglage | Lu par |
|---|---|
| `split_bill_enabled` | `Cart.tsx:118` (bouton split) |
| `show_images` | `ProductGrid.tsx:165` |
| `button_size` | `ProductGrid.tsx:166` |
| `noshow_delay` | `NoShowDetectorJob.ts:44` |

Le pilotage fonctionnel des réglages est OK. Le seul défaut est le
**gate d'accès à leur modification**.

---

## 5. Verrous anti-régression

Vérifiés en session : les 5 invariants ajoutés au LOT I passent tous
(`vitest run src/__tests__/architecture/invariants.test.ts` — 30/30) :

- **INV-26** : 0 référence à `tenants/{}/orders` ou `tenants/{}/tables`
- **INV-27** : RestaurantVertical ne réécoute plus `ops.order_notification`
- **INV-28** : `JOURNAL_UNBALANCED` throw présent dans FinancialJournalBuilder
- **INV-29** : 0 fallback littéral `'default'`/`'restaurant-os'` en tenantId
- **INV-30** : state machine table refuse `free → paying`

---

## 6. Plan d'action correctif

Priorisé par sévérité.

### P0-α (immédiat, ~2h) — `canAccessSetting` fail-open

Fichier : `src/shared/components/settings/ContextualSettings.tsx:75`

- Lire le rôle courant via `useAuth` ou `useNexusAuth`
- Retourner `setting.roles?.includes(currentRole) ?? true` (par défaut ouvert
  si roles non spécifié)
- Ajouter test dans `invariants.test.ts` : **INV-31** vérifiant qu'un rôle
  `serveur` ne voit pas les réglages `roles: ['admin']`

### P1-A à P1-E (1-2h chacun) — orphelins événementiels

- **P1-A** `table.cleaned` : émettre depuis `markTableCleaned` (LOT D.4)
  après la transition `cleaning → free`
- **P1-B** `kds.item_done` : émetteur manquant côté brigade — ajouter
  un bouton "Prêt" dans le KDS qui émet cet événement
- **P1-C** `stock.transfer` : soit brancher un émetteur côté inventaire
  UI (transfert entre entrepôts), soit retirer StockTransferHandler
- **P1-D** `payment.failed` : soit émettre depuis `terminalService.charge`
  quand `result.status === 'error'`, soit retirer du typage
- **P1-E** `reservation.event_created` : retirer du typage (mort)

### P1-F à P1-O (2-4h chacun) — 9 actions RBAC déclarées mais jamais gardées

Ajouter `<ActionGuard page="X" action="Y">` autour de chaque bouton
correspondant, ou retirer l'action du registry si la feature n'existe pas.

### P2-A (30 min) — nettoyage `ops.order_notification`

Cet événement fantôme (émis par un adapter sans appelant, écouté par un
handler orphelin) devrait être supprimé du système. La verticale utilise
`order.paid` depuis le LOT C.1.

### P2-B (1j) — coverage réservations

Le pilier entier n'a pas de garde d'action. Ajouter les gardes manquantes :
- `handleCancelReservation` → `role >= 'chef_rang'`
- `handleMarkNoShow` → idem
- `handleCreateGroup` → `role >= 'manager'` (impact business)

### P2-C (1j) — audit similaire sur les autres verticales

Cet audit ne couvre que la verticale restaurant. Le même travail devrait
être fait sur les verticales bakery/retail/salon, une fois qu'elles
sortent du statut stub (12 verticals stubs restants).

---

## 7. Ce qui n'a PAS été vérifié

- Le comportement runtime : audit statique par lecture de code + grep.
  Aucune sonde Playwright ni instrumentation live.
- Le comportement offline : les événements passent-ils bien par outbox +
  sync en mode déconnecté ? Non instrumenté ici.
- Les 30 émetteurs de `notification.created` : peut-être un pattern
  légitime (canal générique multi-source), mais 30 vs 1 mérite un
  regard produit dédié.
- La cohérence i18n des libellés RBAC (labels des rôles en fr uniquement).
- Le comportement des 3 rôles MCC face aux 23 rôles tenant (permissions
  cross-scope).
