# Plan — Audit du bus événementiel : orphelins, succès silencieux, DLQ, RBAC

> **Origine** : bug trouvé sur `inventory.stock_adjusted` (ajustement/comptage stock =
> no-op silencieux). Ce document généralise le principe à **tout le bus** : quels
> événements sont émis sans consommateur, quels handlers écoutent dans le vide, ce que
> la DLQ **ne** rattrape pas, et où RBAC tient (ou pas).
>
> **Statut des chiffres** : mesurés le 2026-08-12 @ `759aba211`, reproductibles (§2).
> **Périmètre code** : `src/**` hors `*.test.ts`.

---

## 1. La racine : zéro handler = succès silencieux, hors DLQ

`NexusEventBus.emit()` ([src/orchestration/NexusEventBus.ts:186](src/orchestration/NexusEventBus.ts:186)) :

```ts
const all = this.handlers.get(event) ?? [];
if (all.length === 0) return;   // ← aucun handler : retour immédiat, sans warning
```

`emitDurable()` ([:107](src/orchestration/NexusEventBus.ts:107)) enveloppe `emit()` d'un **outbox** :

```
1. db.busOutbox.put({ status: 'pending' })
2. await this.emit(...)          // ← si 0 handler : return immédiat
3. db.busOutbox.update({ status: 'done' })   // ← marqué « traité »
```

**Conséquence structurelle** :
- La **DLQ** (`db.deadLetterEvents`) ne capture QUE les handlers qui **lèvent** une
  exception ([:204](src/orchestration/NexusEventBus.ts:204), [:230](src/orchestration/NexusEventBus.ts:230), [:251](src/orchestration/NexusEventBus.ts:251)).
- Un événement **sans aucun handler** ne lève rien → il est marqué `done` dans l'outbox
  et **ne part jamais en DLQ**. Aucun warning, aucune trace d'anomalie.
- Côté appelant, `emitDurable()` résout sans erreur → l'UI affiche « succès ».

> **C'est le cœur du problème** : émettre un événement que personne n'écoute **ressemble
> exactement** à un succès. Rien dans le système ne distingue « traité par 3 handlers »
> de « traité par 0 handler ». Le bug `inventory.stock_adjusted` n'est pas un accident
> isolé — c'est la manifestation d'un angle mort du bus.

---

## 2. Méthode de mesure (reproductible)

```bash
# Événements ÉMIS (noms littéraux)
grep -rhoE "emit(Durable)?\(\s*'[a-z0-9_]+\.[a-z0-9_]+'" src --include='*.ts' --include='*.tsx' \
  | grep -oE "'[a-z0-9_.]+'" | tr -d "'" | sort -u > /tmp/emitted.txt

# Événements CONSOMMÉS (.on, nom possiblement sur la ligne suivante)
grep -rhA1 -E "\.on\(" src --include='*.ts' \
  | grep -oE "'[a-z0-9_]+\.[a-z0-9_]+'" | tr -d "'" | sort -u > /tmp/consumed.txt

comm -23 /tmp/emitted.txt /tmp/consumed.txt   # ORPHELINS  (émis, jamais consommés)
comm -13 /tmp/emitted.txt /tmp/consumed.txt   # HANDLERS MORTS (consommés, jamais émis)
```

**Limite connue** (à garder en tête pour éviter les faux positifs) : ne capture que les
noms **littéraux**. Un `emit(\`${x}\`)` dynamique ou un handler enregistré via une autre API
échappe au scan. Chaque item du périmètre restreint (§4) est donc **vérifié à la main**.

---

## 3. Cartographie chiffrée

| Mesure | Nombre |
|---|--:|
| Événements **émis** (littéraux) | **178** |
| Événements **consommés** par ≥1 handler | **139** |
| **Orphelins** (émis, 0 handler) | **91** |
| — dont **verticaux** (`auto./bakery./health./hotel./salon./retail.`) | ~67 |
| — dont **non-verticaux** (périmètre à trier) | **24** |
| **Handlers morts** (consommés, 0 émetteur) | **51** |

Les ~67 orphelins verticaux sont **attendus et documentés** (`PLAN_COMPLET.md` §7.1 :
*« événements verticaux servis par un handler générique aujourd'hui : 0/72 »*). Ils sont
publiés pour branchement futur via `VerticalEventBridge` (§8.5). **Hors périmètre de ce plan.**

---

## 4. Orphelins non-verticaux — classés par intention (vérifiés)

> Règle de classement : un orphelin n'est un **bug** que si l'événement **EST** la mutation
> attendue. S'il est émis **après** une persistance directe, c'est une notification fan-out
> (« intention en attente »), pas une perte de données.

### 🔴 Classe A — Perte de données / fonctionnalité cassée (l'event est la seule mutation)

| Événement | Émetteurs | Preuve du bug | Sévérité |
|---|---|---|---|
| `inventory.stock_adjusted` | action `adjustStockAction`, `/api/inventory/adjust`, `AtlasLogisticsAgent` | Modales « Ajustement manuel » + « Comptage physique » ([InventoryInlineModals.tsx:90](src/modules/logistics/stock/inventory/components/InventoryInlineModals.tsx:90),[:123](src/modules/logistics/stock/inventory/components/InventoryInlineModals.tsx:123)) appellent l'action, toast « succès » — **0 handler**, quantité jamais écrite. Le handler qui saurait le faire (`PhysicalInventoryHandler`) écoute un **autre** event (`inventory.physical`, jamais émis). | **P0** |
| `haccp.temperature_logged` | `/api/haccp/log-temp` ([route.ts:12](src/app/api/haccp/log-temp/route.ts:12)) | La route fait `requireTenantUser` (RBAC ✓) puis **uniquement** `emitDurable(...)` et retourne `success:true`. **Ne persiste pas** la température, **0 handler** → relevé perdu + **aucun contrôle de seuil → aucune `haccp.alert` chaîne du froid**. Enjeu sécurité alimentaire. | **P0** |

### 🟠 Classe C — Alerte / notification perdue (l'état peut exister ailleurs, mais l'alerte n'atteint personne)

| Événement | Émetteur | Effet manquant | Sévérité |
|---|---|---|---|
| `cash_drawer.opened_unauthorized` | `useCashDrawer.ts:99` | Ouverture caisse non autorisée → **aucune escalade** (pas de notif manager/MCC, pas d'audit dédié). Sécurité/observabilité. | **P1** |
| `finance.refund_issued` | `RestaurantFinanceAdapter` | Remboursement émis → aucune réaction (notif/rapprochement). Vérifier que le journal NF525 est écrit par un **autre** chemin (FinancialNexusBridge) avant conclusion. | **P1** |
| `finance.z_report_requested` | 5 émetteurs | Demande de clôture Z → aucun handler ne génère le rapport. Vérifier si Z généré synchrone ailleurs. | **P1** |
| `finance.invoice_generated` | 1 | Notification post-facture (relance, envoi) absente. | **P2** |
| `mcc.alert_triggered` | 2 | Alerte MCC (supervision flotte) qui n'atteint pas le panel. | **P1** |
| `connectors.sync_failed` / `sync_completed` / `activated` / `deactivated` / `auto_activated` / `config_saved` | connecteurs | Statuts de connecteur émis, aucun consommateur (UI temps réel / retry). | **P2** |
| `commerce.margin_warning` / `commerce.yield_updated` | 2 / 1 | Signaux marge/rendement sans réaction. | **P2** |
| `kds.ticket_received` | 1 | À vérifier : le KDS lit peut-être l'état directement (atom), event redondant. | **P2** |
| `fleet.vehicle_assigned` | 1 | À trier. | **P3** |

### 🟡 Classe B — Notification fan-out, effet déjà fait (PAS un bug, « intention en attente »)

| Événement | Pourquoi ce n'est pas un bug |
|---|---|
| `ops.service_ticket_opened` / `_working` / `_closed` / `_cancelled` | `ServiceTicketService` fait `Nexus.adapter.set(...serviceTickets/${id})` + `empireAudit.log()` **avant** d'émettre ([ServiceTicketService.ts:120](src/modules/ops/service/core/application/services/ServiceTicketService.ts:120)). L'état est persisté ; l'event est un fan-out pour le bridge/futurs abonnés. |
| `crm.allergen_flagged` | `ResaAllergenCheckHandler` persiste le flag allergène **d'abord** (étape 1), émet ensuite « pour mise à jour CRM » (enrichissement optionnel). |
| `anomaly.detected` | Émis par des handlers qui ont déjà posé `status:'alert_raised'`. Event = fan-out notification. |
| `system.reference_promoted`, `oracle.query` | Notification/télémétrie ; à confirmer mais sans mutation attendue. |

> Ces Classe-B ne sont pas des bugs **aujourd'hui**, mais ce sont des **contrats publiés sans
> abonné** : le jour où on attend une réaction (ex : `ops.service_ticket_closed` → facturation
> auto), il faudra brancher un handler. À documenter comme « surface d'extension », pas à supprimer.

---

## 5. Handlers morts (51) — écoutent un événement que personne n'émet

Un handler mort **ne nuit pas** (il ne se déclenche jamais) mais signale soit un **producteur
jamais construit**, soit un **mismatch de nommage**. Extrait le plus parlant :

### 🔴 Le mismatch qui prouve le principe
- `inventory.physical` (écouté par `PhysicalInventoryHandler`, applique `quantity: physicalQty`)
  ⇄ `inventory.stock_adjusted` (émis par l'UI). **Même fonctionnalité, deux noms, jamais reliés.**
  → Fix P0 : réconcilier (voir §7).

### 🟠 Réactions métier manquantes (handler prêt, producteur absent)
- **Finance** : `finance.payment_failed`, `finance.invoice_approved`, `finance.tax_mismatch`,
  `finance.bank_transaction_synced`, `payment.rejected`, `invoice.overdue`
- **RH/pointage** : `hr.clock_in`, `hr.shift_ended`, `staff.clock_in`, `staff.clock_out`,
  `hr.payroll_exported`, `hr.schedule_published`, `hr.training_expired`, `hr.break_checked`,
  `hr.application_received`, `overtime.threshold`, `store.shift_ended`, `service.end`
- **Salle** : `table.assigned`, `table.cleared`, `table.locked`, `table.transferred`
- **KDS** : `kds.ticket_delayed`, `kds.printer_failed`
- **Appro/CRM/divers** : `supplier.delivery_received`, `supplier.invoice_processed`,
  `order.proforma_printed`, `quote.sent`, `review.negative`, `delivery.delivered`,
  `crm.reward_redeemed`, `crm.segment_matched`, `biggroup.confirmed`, `reservation.large_group`,
  `resa.j1`, `inactive.90d`, `review.negative`
- **IA/MCC/tenant** : `ai.document_uploaded`, `ai.fleet_brief_requested`, `ai.weekly_report_due`,
  `llm.timeout`, `mcc.feature_flag_toggled`, `tenant.subscription_expired`,
  `tenant.onboarding_step_completed`, `support.ticket_escalated`, `compliance.deadline_approaching`
- **Intégrations** : `integration.menu_sync_requested`, `integration.reservation_received`,
  `hardware.printer_mapped`, `pos.terminal_login`, `stock.transfer`, `recipe.updated`

> Liste **brute** (issue du diff mécanique). Chaque item = **à trier** en : (a) brancher le
> producteur, (b) renommer pour matcher un producteur existant, (c) supprimer le handler mort.
> Ne PAS supprimer en masse : certains sont des points d'extension légitimes.

---

## 5bis. Handlers ÉCRITS mais JAMAIS ENREGISTRÉS (la couche invisible)

> Distinct des « handlers morts » (§5, qui sont *enregistrés* mais écoutent un event non émis).
> Ici : le fichier existe, exporte un `register*`, contient une vraie logique — mais **aucun
> `registerXHandlers()` ne l'appelle**. À l'exécution, son `.on(...)` ne s'exécute jamais.

**Mesure** : `registerNexusHandlers()` ([registerHandlers/index.ts](src/orchestration/registerHandlers/index.ts)) câble **157** handlers via 10 groupes-domaine. Sur les fichiers `handlers/*Handler.ts` exportant un `register*`, **3 ne sont appelés nulle part** :

| Handler | Écoute (intention) | Event mort correspondant (§5) |
|---|---|---|
| `HaccpCorrectiveActionHandler` | action corrective HACCP (non-conformité → mesure) | — HACCP |
| `ProformaHandler` | impression proforma | `order.proforma_printed` |
| `SupportEscalationHandler` | escalade SAV niveau sup. | `support.ticket_escalated` |

`git log -S` sur `registerHandlers.ts` : **ces 3 noms n'y sont jamais apparus** — écrits (commits `feat(eventbus)`), jamais branchés. Enjeu HACCP pour le premier (action corrective = obligation réglementaire).

> **Nuance importante (auto-correction)** : `PhysicalInventoryHandler` est **bien enregistré**
> (dans `logistics-supply.ts`, pas `-stock`). Le problème inventory n'est donc **pas** un
> dé-enregistrement — c'est un **pur mismatch de nommage** : handler câblé qui écoute
> `inventory.physical`, UI qui émet `inventory.stock_adjusted`. Deux moitiés jamais reliées.

**Pourquoi c'est invisible** : même racine qu'au §1. Un `register...Handler()` qui saute pendant
un refactor (l'historique montre `revert: annuler Phase 3 — build cassé`) ne produit **aucune
erreur** — ni au build, ni au runtime. Le handler devient inerte en silence. **95 % du travail
présent + 1 ligne de registration manquante = indiscernable, de l'extérieur, de 0 %.**

---

## 6. RBAC — état des lieux (ce n'est PAS le trou principal)

Les points d'entrée émetteurs vérifiés **sont protégés** :

| Entrée | Garde | Verdict |
|---|---|---|
| `/api/inventory/adjust` | `requireTenantRole(req, 'manager')` | ✅ |
| `/api/haccp/log-temp` | `requireTenantUser(req)` | ✅ (mais data-loss, cf. §4-A) |
| `adjustStockAction`, `receiveStockAction` | `createSafeAction({ page, action })` | ✅ (wrapper RBAC + Zod) |
| `useCashDrawer.triggerUnauthorizedOpen` | check `roleLevel < MIN_ALERT_ROLE_LEVEL` | ✅ |

**Conclusion RBAC** : l'autorisation est globalement en place sur les émetteurs. Le risque
n'est pas « un non-autorisé déclenche » — c'est « un autorisé déclenche, ça affiche succès,
et **rien ne se passe** ». RBAC protège l'entrée d'un tuyau **débranché à la sortie**.

> À vérifier tout de même (non fait ici) : les **handlers** eux-mêmes re-valident-ils le tenant
> avant d'écrire (défense en profondeur cross-tenant) ? Point de contrôle §8-3.

---

## 7. Plan de remédiation priorisé

### P0 — Bugs de perte de données (à corriger en premier)

0. **Trancher les 3 handlers non-enregistrés (§5bis).** Pour chacun : soit l'ajouter au
   `registerXHandlers()` de son domaine (si le producteur existe / doit exister), soit le
   supprimer (mort). `HaccpCorrectiveActionHandler` = **P0 réglementaire** (action corrective
   HACCP obligatoire) : vérifier qu'un producteur émet bien l'event qu'il écoute, puis câbler.
   `ProformaHandler` / `SupportEscalationHandler` : brancher ou supprimer selon usage réel.

1. **`inventory.stock_adjusted` → écriture réelle.**
   Créer `StockAdjustmentHandler` (calqué sur `PhysicalInventoryHandler`) consommant
   `inventory.stock_adjusted` et appliquant `Nexus.adapter.update(stockPath, { quantity: newQuantity })`
   + audit + émission `stock.low`/`stock.zero` si franchissement de seuil. L'enregistrer dans
   `registerNexusHandlers()`.
   *Alternative* : réconcilier avec `inventory.physical` (renommer l'un des deux). **Décision :**
   garder `inventory.stock_adjusted` (déjà émis en 3 points) et retirer/rediriger le handler
   `inventory.physical` mort.
   → Test : émettre l'event, asserter la quantité en base. + test d'intégration modal→base.

2. **`haccp.temperature_logged` → persistance + seuil.**
   Brancher un handler (ou déléguer à `HACCPLogService` existant : `iotHistory` immuable +
   `haccpLogs` + `nonConformities` sur seuil). La route `/api/haccp/log-temp` doit aboutir à
   un relevé persisté ET à une `haccp.alert` si hors plage. Enjeu NF525/sécurité alimentaire.
   → Test : POST route → relevé en base + `haccp.alert` émis si temp hors seuil.

### P1 — Alertes/observabilité perdues

3. `cash_drawer.opened_unauthorized` → handler d'escalade (notif manager + `system.audit_log`).
4. `mcc.alert_triggered` → handler de remontée au panel MCC.
5. `finance.refund_issued` / `finance.z_report_requested` → **d'abord vérifier** que l'effet
   fiscal n'est pas déjà fait en synchrone ; sinon brancher.

### P2 — Nettoyage & cohérence

6. Trier les 51 handlers morts (§5) : brancher / renommer / supprimer, un par un, avec preuve.
7. Connecteurs (`connectors.*`) : brancher un consommateur de statut ou documenter comme réservé.
8. Classe B (§4) : documenter en commentaire « fan-out sans abonné (extension) » sur chaque emit.

### P3 — Garde-fou structurel du bus (empêche la récidive)

9. **Instrumenter `emit()` sur le cas zéro-handler.** À la ligne `if (all.length === 0) return;` :
   - En **dev** (`NODE_ENV !== 'production'`) : `logger.warn('[EventBus] Événement émis sans handler: ' + event)`.
   - Optionnel : registre `KNOWN_UNCONSUMED` (les verticaux + Classe B attendus) pour ne warner
     que sur les **imprévus**.
10. **Distinguer outbox `done` de `done_no_consumer`.** Dans `emitDurable`, si `emit` rapporte
    0 handler, marquer l'outbox `done_no_consumer` au lieu de `done` → observable, auditable,
    et ça n'atteint jamais la DLQ silencieusement.
11. **Test d'invariant** (`__tests__/invariants/`) : « tout event déclaré dans `ops.events.ts`
    qui est émis avec `emitDurable` a ≥1 handler enregistré ET ENREGISTRÉ (§5bis), SAUF liste
    blanche pilotée par l'état d'ouverture des verticales (§10) ». Gèle le principe : un futur
    orphelin non-blanchi, ou un handler écrit-non-câblé, casse le test.

---

## 8. Tiers TEST / DEMO / REF par verticale — ordre & dépendances

> **Pourquoi cette section dans un audit du bus** : la validité d'un orphelin et **le lieu où
> on peut prouver le câblage** dépendent entièrement de cette structure. On ne peut pas
> raisonner « event X sans handler = bug » sans savoir si la verticale de X est ouverte, ni
> tester un handler sans savoir quel tenant accepte l'écriture.

**24 tenants système = 8 verticales × 3 tiers** ([SystemTenantRegistry.ts](src/lib/mcc/SystemTenantRegistry.ts)) :

| Tier | Convention | Écriture | Rôle |
|---|---|---|---|
| **REFERENCE** | `_ref_V` | ❌ bloquée (promotion MCC only) | **maître cloneable** — les clients de V en sont clonés |
| **TEST** | `_test_V` | ✅ libre (reset à la demande) | **bac à sable dev** — seul endroit où valider une mutation |
| **DEMO** | `_demo_V` | ❌ Simulacra (intercepté) | vitrine prospect, lecture seule |

### Conséquences directes sur cet audit (l'ordre & les dépendances)

1. **Un orphelin n'est un bug que si sa verticale est OUVERTE.** Les ~67 events verticaux
   (`auto./health./salon./…`) sont orphelins parce que leur `_ref_V` n'est pas encore
   construit (verticale non ouverte). C'est **attendu**. Un event `restaurant`/transverse
   orphelin, lui, concerne une verticale vivante (`_ref_restaurant` = le gabarit) → **bug réel**.

   > **⚠️ Réalité mesurée (traque 12/08)** : le statut d'ouverture `PRODUCTION/BÊTA/SQUELETTE`
   > de `PLAN_COMPLET.md` §8 **n'existe PAS en runtime**. Aucun champ sur `IVerticalPlugin`,
   > ni config verticale, ni tenant. `ProvisioningEngine` ne gate PAS sur un statut. Le statut
   > est seulement **calculé** par `scripts/gen-vertical-playbook.ts` (score /12 sur 12 points
   > d'ancrage) → `statusBadge` = `✅ Prête à ouvrir` / `⚠️ N avert.` / `❌ N bloquants`,
   > matérialisé en `docs/specs/VERTICAL_<V>.md`. Lancé **uniquement pour garage** à ce jour
   > (seul `VERTICAL_GARAGE.md` existe). Donc : **implémenter le statut persistant = un vrai
   > chantier ouvert (PLAN_COMPLET §8 MCC, non fait).**

   → **Liste blanche concrète, disponible AUJOURD'HUI** (sans attendre le statut persistant) :
   dérivée de la **table préfixe→verticale** (`gen-vertical-playbook.ts:69` :
   `garage→auto`, `clinic→health`, sinon `préfixe = variant`). Restaurant étant la **seule
   verticale ouverte** (gabarit) :
   - **Whitelistés** (orphelins attendus) : préfixes `auto. bakery. health. hotel. salon. retail.`
   - **DOIVENT avoir un consommateur** : `restaurant`-implicite + transverses
     (`finance. inventory. haccp. ops. kds. crm. stock. order. table. cash_drawer. …`).
   → Le jour où une verticale ouvre, on régénère son playbook ; quand il passe `✅ Prête`,
   on **retire son préfixe de la whitelist** → ses orphelins deviennent des erreurs de test.

2. **On ne peut valider le câblage que dans `_test_V`.** `_ref_` bloque l'écriture (SovereignGuard),
   `_demo_` est en Simulacra (mutations interceptées). Donc les tests P0 (« émettre
   `inventory.stock_adjusted` → asserter la quantité en base ») **doivent viser `_test_restaurant`**,
   jamais `_demo_` ni `_ref_`. Tester le bug inventory sur un tenant demo ne prouverait rien
   (l'écriture n'arrive jamais au store, indépendamment du handler).

3. **Ordre de traitement par verticale** (dépendance dure) :
   ```
   câbler events+handlers de V ──► valider dans _test_V ──► promouvoir _ref_V (MCC) ──► cloner clients
   ```
   Corriger le câblage du bus est donc un **prérequis** à la construction d'un `_ref_V` sain :
   un `_ref_restaurant` promu alors que `inventory.stock_adjusted` est orphelin **cloné le bug
   chez tous les futurs clients restaurant**. → Les P0/P1 de ce plan précèdent toute promotion REF.

4. **La démo ment deux fois.** En Simulacra, un ajustement de stock « réussit » à l'écran sans
   écrire (normal, c'est le mode) — mais avec le bug actuel, il « réussirait » **aussi** sur un
   tenant client réel (émet, 0 handler). Le mode demo **masque** donc le bug : impossible de le
   voir en démo, il ne se révèle que sur `_test_` ou en prod client.

---

## 9. Ce qui est vérifié vs ce qui reste à trier (honnêteté)

**Vérifié à la main dans cette passe :**
- Le mécanisme racine (zéro-handler = silent, hors DLQ) — lecture de `NexusEventBus.ts`.
- Classe A : `inventory.stock_adjusted` (émetteurs + modales + absence handler) et
  `haccp.temperature_logged` (route ne persiste pas).
- Classe B : `ops.service_ticket_*`, `crm.allergen_flagged`, `anomaly.detected` (persistance directe confirmée).
- RBAC des 4 émetteurs listés (§6).
- Le mismatch `inventory.physical` ⇄ `inventory.stock_adjusted`.

**Mesuré mécaniquement — ⚠️ CONTIENT DES FAUX POSITIFS, à trier item par item :**
- Les 24 orphelins non-verticaux au-delà des 2 Classe-A, et les 51 handlers morts (§5), sont
  issus d'un **diff grep** qui sous-compte les consommateurs quand la forme du `.on(...)` varie
  (nom d'event sur une autre ligne, constante au lieu d'un littéral).
- **Faux positif prouvé** : `cash_drawer.opened_unauthorized` était listé orphelin — il est en
  fait **bien consommé** par `CashDrawerAnomalyHandler` (enregistré). Donc **ne jamais agir sur
  ces listes sans vérifier chaque item à la main** (relire le handler + sa registration).
- Défense en profondeur cross-tenant **dans** les handlers : **confirmée manquante** sur
  échantillon (`SplitPaymentHandler`, `CertExpiryHandler`, `CompEntryHandler` : 0 `SovereignGuard`).

**Solide, vérifié à la main (agir sans re-trier) :** le mécanisme §1, les 2 P0 (§4-A), les 3
handlers non-enregistrés (§5bis), la table préfixe→verticale (§8).

**Explicitement hors périmètre (attendu, documenté) :**
- Les ~67 orphelins verticaux (`auto./bakery./health./hotel./salon./retail.`) — §7.1 du plan maître.

### Recoupement avec les audits « promesses » (docs/audits/) — MÊME FAMILLE

L'`AUDIT_GLOBAL_PROMESSE_OS.md` (31/07) avait déjà cartographié ce problème sous un autre angle
(**écrire sans émettre** = l'inverse de l'orphelin). Re-vérifié le 12/08 :

| Finding juillet | Statut 12/08 | Preuve |
|---|---|---|
| 0-day `api-keys/validate` (tenantId depuis body) | ✅ **corrigé** | lit `body.key` désormais |
| `finance/bank/sync` écrit `journalEntries`+scelle **sans emit** | 🔴 **toujours vif** | 0 `emit` dans la route |
| `hr/employees` crée staff **sans emit** `hr.employee_created` | 🔴 **toujours vif** | 0 `emit` |
| Handlers font confiance à `payload.tenantId` sans `SovereignGuard` | 🔴 **toujours vif** | échantillon 0 enforce |
| `IntelligenceHandler` `setTimeout`+buffer RAM (perte en serverless) | ⏳ à re-vérifier | (non contrôlé cette passe) |

> **Ce recoupement valide l'intuition initiale** : ces sujets ont été **audités** (juillet, puis
> `dlq-rbac-audit` 08/08) mais **l'exécution n'a pas suivi**. Ce n'est pas « du travail perdu »,
> c'est « des audits sans remédiation ». Le présent plan est le 3ᵉ à décrire la même famille —
> il doit se conclure par des **commits**, pas par un 4ᵉ document.

---

## 10. Ordre d'attaque recommandé

```
P3-9/10 garde-fou bus (warn 0-handler + outbox done_no_consumer)  ← D'ABORD : rend tout le reste visible
P0-0 trancher les 3 handlers non-câblés (HACCP corrective = réglementaire)
P0-1 inventory.stock_adjusted   (bug actif, données perdues, UI ment)
P0-2 haccp.temperature_logged   (data-loss + sécurité alimentaire/NF525)
     └─ tests P0 exécutés contre _test_restaurant (seul tier writable, §8-2)
P3-11 test d'invariant (gèle le principe, liste blanche = état d'ouverture verticale)
P1-3..5 alertes perdues         (sécurité caisse, MCC, finance : vérifier avant de brancher)
P2-6 tri des 51 handlers morts  (long, mécanique, un commit par lot cohérent)
────────────────────────────────────────────────────────────
⛔ DÉPENDANCE DURE : aucune promotion `_ref_restaurant` (MCC) tant que les P0 ne sont pas
   verts — sinon le bug est cloné chez tous les futurs clients restaurant (§8-3).
```

> Le garde-fou (P3-9/10) passe **en premier** malgré sa priorité nominale : c'est lui qui
> transforme « 91 orphelins + 3 handlers morts invisibles » en « liste qui apparaît au boot »,
> et qui empêche le prochain fil débranché de passer inaperçu. On corrige ensuite à la lumière.
