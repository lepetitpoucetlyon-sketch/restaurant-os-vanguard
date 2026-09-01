# 🔌 PLAN — Câblage bout-en-bout & purge de la verticale RESTAURANT

> **Destinataire** : Antigravity (exécution)
> **Auteur** : session `claude-plan-cablage-verticale` (Claude Code)
> **Date** : 2026-09-01
> **Type** : plan d'exécution — dette « feature scaffoldée / testée / jamais câblée »
> **Périmètre code** : `src/verticals/restaurant/`, `src/modules/ops/service/restaurant/`, `src/modules/ops/production/kds/`, `src/modules/ops/service/core/printing/`
> **Effort estimé** : 6–9 j (11 lots, la moitié = suppression/dédup rapide)

---

## 0. Le constat (preuve reproductible)

Un scan des 208 fichiers de la verticale restaurant (script en [Annexe A](#annexe-a--script-de-scan)) donne :

```
MORT-TOTAL=7   HANDLER-MORT=0   BARREL-SEUL=0   TEST-SEUL=48
COMPOSANT-NON-RENDU=2   ILOT=3   ROUTE=0
```

**~55 fichiers / ~5 000 LOC** sont codés — **48 avec un test unitaire dédié** — mais avec **zéro appelant applicatif** :
- ni `usePOSController` (`src/modules/ops/service/restaurant/pos/hooks/usePos.ts`)
- ni `useKDSController` (`src/modules/ops/production/kds/hooks/useKDSController.ts`) — qui ne lit que `useKitchen` → `ordersNodeAtom`
- ni les 10 handlers KDS (qui n'importent que `NexusEventBus` / `logger` / `audit` / `NexusAdapter`)
- ni une route, ni un composant monté
- ils ne sont même pas ré-exportés par un barrel (`pos/services/index.ts` fait 3 lignes ; `@/modules/ops/index.ts` ne sort que `SplitBillDialog`, `KDSCourseSequencingEngine`, `ServiceTicketService` de tout cet arbre).

### Pourquoi les gates n'ont rien vu

Chaque service mort a **exactement un `X.test.ts`** qui l'importe → `vitest run` vert, couverture en hausse. Les mesures existantes (`orphans`, `verticalStubs`, `verticalScreensUnwired`, `gate-last-mile`) ne regardent que les **composants `.tsx`** et les **stubs de page**, **jamais les `services/`**. Le test unitaire **est** le camouflage : le sprint livre `Service + Service.test.ts`, la CI passe, ça a l'air fini.

**Lot 0 comble ce trou de mesure — il est prioritaire absolu.**

---

## 1. Règles d'exécution (NON négociables — cf. `AGENTS.md`, `CLAUDE.md`)

### 1.1 Avant toute action
1. **Lire `.claude/sessions.md`**. S'inscrire : nom court (ex. `antigravity-cablage-verticale`), périmètre **avec chemins explicites**, date, `active`.
2. Vérifier les collisions : une session `active` sur `src/modules/ops/` ou `src/verticals/restaurant/` → **STOP, se coordonner**.
3. Mettre à jour sa ligne au fil de l'eau, `terminée` à la fin.

### 1.2 Lois
- **Loi 7 (Zero-Claim)** : tout chiffre d'un compte rendu = **mesuré dans la session** avec commande reproductible. Jamais recopié.
- **Loi 8 (bout-en-bout)** : « câbler » = **le vrai flux appelle le service** (un composant monté, un handler enregistré sur un event réellement émis, une route atteignable). Un `return true` / un mock / un appel derrière un flag jamais activé **ne compte pas**. Cf. mémoire *« jamais de stubs déguisés »*.
- **Loi 2 (anti-desserrement)** : **ne jamais relever un cliquet**. `scripts/verify-gate-integrity.mjs` le refuse. Un cliquet qui baisse → on **abaisse le seuil** à la source dans `scripts/preflight.sh`.

### 1.3 Architecture
- **Barrel Contract** : import uniquement depuis `@/modules/<pilier>` (racine). Jamais `@/modules/<pilier>/<domaine>/...` en profondeur inter-pilier. Intra-pilier → import **relatif**.
- **Microunits** : tout montant en `*InMicrounits` (`1 € = 1 000 000 µ`). Helper `toMicrounits()`. Accès total commande : `SovereignMath.orderTotalMicrounits(order)`.
- **Nexus** : lecture/écriture via `Nexus.adapter.{get,set,query,runTransaction}`. Path `tenants/{tenantId}/{collection}/{id}`, `tenantId` = `activeTenantId`, jamais hardcodé.
- **Events** : `NexusEventBus.emit()` (fire-and-forget) ou `emitDurable()` (persisté outbox). Un handler s'enregistre dans `src/shared/eventBus/registerHandlers/*` ou dans `RestaurantVertical.initialize()`.
- **RBAC** : action sensible (remise, annulation, transfert, clôture) → `ActionGuard` (`src/shared/components/rbac/ActionGuard.tsx`) ou `pos/_hooks/useRbacGate.ts`.
- **i18n** : toute clé `t('x.y')` doit exister dans `src/i18n/` (5 locales : fr, en, es, pt, ja). Ne jamais traduire les libellés réglementaires (NF525, FEC, PCG, HCR) — français légal.
- **NF525** : `journalEntries`, `fiscalSeals`, `fiscalLedger` = WORM, jamais delete/update. Toute vente → `FinancialNexusBridge.processOrder()` → sceau via `FiscalSealer.sealDataAtomically`.

### 1.4 Boucle de dev (rapide — voir commit `967a2718a`)
```bash
npm run loop        # oxlint --quiet + tsc --noEmit  (~8 s) — après chaque édition
npm run loop:test   # vitest run --changed             — tests impactés
npm run gate:fast   # tsc + oxlint + gate-integrity + vitest --changed — avant commit
npm run preflight   # AVANT MERGE UNIQUEMENT (contient next build)
```

### 1.5 Git
- Un commit **par unité cohérente** (un sous-système câblé, une famille supprimée). Convention `feat(ops):` / `chore(ops):` / `refactor(ops):`, message **en français**.
- **Pas de `Co-Authored-By`**. **Pas de `git push`** (l'humain pousse).
- Hook pre-commit (`.githooks/pre-commit`) : ne jamais `--no-verify`. S'il bloque → corriger le code.

### 1.6 Vérité terrain (piège RTK)
RTK masque `tsc`/`build`/`eslint` (exit 0 trompeur). Pour toute preuve : `rtk proxy <cmd>` ou commande brute (`./node_modules/.bin/tsc --noEmit`).

---

## 2. LOT 0 — Instrument : mesure « service de verticale non câblé » + cliquet

**Sans ça, la dette repousse au prochain sprint. À faire EN PREMIER.**

### 2.1 Créer la mesure
- Ajouter dans `scripts/measure/measures.mjs` une mesure `verticalServicesUnwired` :
  - **Motif** : pour chaque `.ts` sous `src/verticals/*/` OU `src/modules/*/service/*/` OU `src/modules/*/production/*/` exportant une `class`/`function`/`const` non-composant, compter les références **hors** : le fichier lui-même, les `*.test.ts` / `__tests__`, les `index.ts` de ré-export pur.
  - **Coupable** = 0 référence applicative. (S'appuyer sur la logique de `scan-vertical-restaurant.mjs`, Annexe A — la porter dans le style des mesures existantes, **pure et rapide**.)
  - **Pièges à encoder** (cf. `CLAUDE.md` § mesures) :
    - un ré-export de barrel ≠ un usage ;
    - un handler appelé par son **fichier** (pas son symbole) via `registerHandlers` = câblé ;
    - un service appelé **uniquement** par un autre service lui-même mort = **îlot**, à compter comme non câblé (référence transitive).
- Écrire le détail fichier-par-fichier sous `npm run measure:detail`.

### 2.2 Poser le cliquet
- Dans `scripts/preflight.sh` : `VERTICAL_SERVICES_UNWIRED_MAX=<valeur mesurée ce jour>` (baseline honnête).
- Dans `scripts/gate-last-mile.mjs` : ajouter `verticalServicesUnwired: seuil('VERTICAL_SERVICES_UNWIRED_MAX', <n>)` au bloc `CLIQUETS`.
- Dans `scripts/verify-gate-integrity.mjs` : ajouter `verticalServicesUnwired` à `ratchets` + à la boucle de vérification (comme `verticalStubs`).
- `node scripts/verify-gate-integrity.mjs --freeze` pour re-figer la baseline **après** ajout.

### 2.3 Critère de sortie du lot
`npm run measure` affiche la nouvelle mesure ; `node scripts/gate-last-mile.mjs` la liste ; `verify-gate-integrity` OK.
**Commit** : `feat(measure): mesure + cliquet "service de verticale non câblé" (angle mort Loi 8)`.

---

## 3. LOT 1 — Tri : décision par fichier (aucune écriture de code)

Re-lancer le scan (Annexe A), puis **pour chaque fichier listé** : ouvrir, comprendre l'intention, trancher **CÂBLER / DÉDUPLIQUER / SUPPRIMER**. Produire `docs/plans/TRI-VERTICALE-RESTAURANT.md` = tableau `fichier | intention | verdict | lot cible | risque`.

> ⚠️ Le scan est un **premier tri automatique**. Vérifier chaque verdict : grep du symbole exact, tracer l'unique appelant (est-ce une vraie UI/flux, ou un autre service mort ?), regarder si un event du service est réellement émis quelque part.

### 3.1 Inventaire de départ (résultat scan 2026-09-01 — à re-mesurer)

#### MORT-TOTAL (0 référence nulle part) — 7
| Fichier | Symbole | Verdict proposé |
|---|---|---|
| `kds/components/KDSCoursingAnimationIndicator.tsx` | `KDSCoursingAnimationIndicator` | **Lot 10** — monter dans `KDSTicket` ou supprimer |
| `kds/components/OrdersLiveBoard.tsx` | `OrdersLiveBoard` | **Lot 10** — doublon probable de `KDSDashboard`, supprimer |
| `service/core/printing/hardware/adapters/BluetoothPrinterAdapter.ts` | `BluetoothPrinterAdapter` | **SUPPRIMER** — spéculatif (aucun flux BLE) |
| `service/core/printing/hardware/escpos/ReceiptBuilder.ts` | `ReceiptBuilder` | **DÉDUP** — recoupe `EscPosBuilder` / `EscPosReceiptFormatter` (câblés) |
| `pos/hooks/useTableLock.ts` | `useTableLock` | **Lot 6** — le vrai verrou concurrence ; `usePos` ne l'appelle pas |
| `pos/services/ChangeAsTipService.ts` | `ChangeAsTipService` | **Lot 4** — « rendu → pourboire », à câbler dans `PaymentDialog` cash |
| `pos/services/CommercialGestureService.ts` | `CommercialGestureService` | **Lot 4/DÉDUP** — recoupe `cartDiscounts.ts` (offert/remise, câblé) |

#### TEST-SEUL (codé + testé, 0 appelant applicatif) — 48

**KDS (14)** — `useKDSController` ne consomme **aucun** de ces services :
| Fichier | Rôle supposé | Verdict |
|---|---|---|
| `kds/services/KDSPacingEngine.ts` | bridage débit si retard KDS > seuil `kds.overheat_threshold_min` | **Lot 7 — CÂBLER** (acceptation commandes online/borne) |
| `kds/services/MeatRestingTimerService.ts` | minuteur repos viandes | **Lot 7 — CÂBLER** (board KDS) |
| `kds/services/PassPickupReminderService.ts` | relance « plat prêt au passe » | **Lot 7 — CÂBLER** |
| `kds/services/KDSMicroSequencingService.ts` | micro-cadençage intra-service | **DÉDUP** de `KDSCourseSequencingEngine` |
| `kds/services/KDSItemDeltaModificationService.ts` | modif article après envoi | **DÉDUP / Lot 7** selon usage réel |
| `kds/services/KDSStationRecoveryService.ts` | reprise poste après crash | **Lot 7 — CÂBLER** (mode dégradé) |
| `kds/services/KDSVisualDelayWarningService.ts` | codes couleur retard | **DÉDUP** — recoupe `KDSPacingEngine` + UI existante |
| `kds/services/SmartStationRoutingService.ts` | routage article → poste | **DÉDUP** de `KdsRoutingHandler` (câblé) |
| `kds/services/HotColdSyncKdsService.ts` | synchro chaud/froid | **Lot 7 — CÂBLER** ou dédup |
| `kds/services/LateAllergenInterceptionService.ts` | interception allergène tardive | **DÉDUP** de `AllergenGateService` (câblé POS) |
| `kds/services/LotAllergenMatrixService.ts` | matrice allergène × lot | **DÉDUP** idem |
| `kds/services/SelfHealingRecipeBomService.ts` | auto-réparation nomenclature | **DÉDUP** de `EightysixtService` |
| `kds/services/DegradedDishwashingModeService.ts` | mode plonge en panne | **SUPPRIMER / @wip** — spéculatif |
| `kds/services/DisinfectionSequenceService.ts` | séquence désinfection | **SUPPRIMER / @wip** — spéculatif |

**Caisse / fond de caisse / rendu (7)** — `PaymentDialog` cash ne fait que `printerService.openCashDrawer()` :
| Fichier | Rôle | Verdict |
|---|---|---|
| `pos/services/ExactChangeAssistanceService.ts` | calcul rendu monnaie | **Lot 4 — CÂBLER** |
| `pos/services/CashCounterModal.tsx` | modale comptage coupures | **Lot 4 — CÂBLER** (monter) |
| `pos/hooks/useCashDrawer.ts` | état tiroir-caisse | **Lot 4 — CÂBLER** |
| `pos/services/CashDrawerTriggerService.ts` | ouverture tiroir sur règle | **Lot 4 — CÂBLER** |
| `pos/services/BlindCashCloseService.ts` + `CashDrawerReconciliationService.ts` (paire îlot) | clôture caisse aveugle + rapprochement | **Lot 4 — CÂBLER** (flux Ticket Z) |
| `pos/services/BilingualTipGratuityHelper.ts` | saisie pourboire bilingue | **Lot 4 — CÂBLER** |

**Titres-restaurant (1)** :
| `pos/services/ConecsVatSplittingService.ts` | ventilation TVA titres-resto CONECS | **Lot 5 — CÂBLER** (= le « moyen de paiement 📐 » de `plan-audit-ultra-complet.md` : en fait **déjà codé**) |

**Tables / service en salle (4)** — aucune UI de transfert/fusion :
| `pos/services/TableTransferService.ts` | transfert ticket table X→Y | **Lot 6 — CÂBLER** |
| `pos/services/TableMergeService.ts` | fusion de tables | **Lot 6 — CÂBLER** |
| `pos/services/TableHandoffService.ts` | passation de rang serveur | **Lot 6 — CÂBLER** |
| `pos/services/SharedBillDispatchService.ts` | répartition addition partagée | **Lot 6 / DÉDUP** de `usePosSplit` |

**Split bill (1)** :
| `pos/services/SplitBillService.ts` | partage d'addition (2ᵉ impl) | **DÉDUP** — chemin vivant = `usePosSplit` hook |

**Imprimantes / TPE (5)** — `plan-audit-ultra-complet.md` §18 « crash imprimante ✅ » est **faux** :
| `pos/services/PrinterFailoverRoutingService.ts` | reroutage impression sur panne | **Lot 8 — CÂBLER** |
| `pos/services/PrintJobQueueService.ts` | file d'impression | **Lot 8 — CÂBLER** |
| `pos/services/ThermalOverheatP2PFailoverService.ts` | repli P2P surchauffe | **Lot 8 / DÉDUP** de `PrinterFailoverManager` (câblé) |
| `pos/services/TpeResilienceSimulatorService.ts` | simulateur résilience TPE | **SUPPRIMER** — outil de test, pas du produit |
| `printing/components/settings/AddPrinterWizard.tsx` (non rendu) | assistant ajout imprimante | **Lot 10 — monter** dans `PrinterSettings.tsx` |

**Bar / boissons (6)** — spéculatif, aucune demande produit :
| `pos/services/KegHydrostaticLossService.ts` · `CocktailDilutionIndexService.ts` · `CodeAmbreService.ts` · `FermentationMonitorService.ts` · `CorkedBottleDisputeService.ts` · `AgecCarafeService.ts` | | **SUPPRIMER / @wip** (Lot 3) |

**Divers (7)** :
| `pos/services/OrderLineDAGService.ts` | graphe de dépendances lignes | **DÉDUP / SUPPRIMER** |
| `pos/services/PosIdempotencyGuard.ts` | idempotence encaissement | **Lot 4 — CÂBLER** (dans `finalizePayment`) — ADR-001 |
| `pos/services/PosFiscalSealE2EPipeline.ts` + `TaxRateGuard.ts` (paire îlot) | pipeline scellement E2E | **DÉDUP** de `FinancialNexusBridge` + `FiscalSealer` (câblés) |
| `pos/services/BarcodeScannerInputService.ts` | saisie code-barres | **Lot 4/SUPPRIMER** selon besoin matériel |
| `pos/services/CustomerFacingDisplayService.ts` | afficheur client | **CÂBLER ou SUPPRIMER** — dépend d'un écran secondaire |
| `pos/services/HardenedTouchUiHelper.ts` | durcissement tactile (anti-double-tap) | **Lot 4 — CÂBLER** dans `Cart`/`ProductGrid` |
| `pos/services/DineAndDashDetectorService.ts` | détection départ sans payer | **Lot 6 — CÂBLER** (sur `table.released` sans `order.paid`) |
| `pos/services/RainPlanTerraceSwitchService.ts` | bascule terrasse si pluie | **SUPPRIMER / @wip** |
| `pos/services/ReservationService.ts` | réservations POS-local | **DÉDUP** — doublon de `commerce/relation/reservations` (module réel) |

**Verticale — 4 adapters sur 8 (Lot 9)** :
| `verticals/restaurant/adapters/RestaurantCommerceAdapter.ts` | émet `reservation.confirmed`, `crm.rfm_trigger`, `crm.points_earned` | **Lot 9** |
| `verticals/restaurant/adapters/RestaurantComplianceAdapter.ts` | émet `haccp.check.saved`, `sensor.temperature_anomaly`, `recall.declared` | **Lot 9** |
| `verticals/restaurant/adapters/RestaurantHumanAdapter.ts` | émet `hr.tip_distributed` | **Lot 9** |
| `verticals/restaurant/adapters/RestaurantLogisticsAdapter.ts` | émet `inventory.deducted`, `dlc.expired`, `inventory.waste_logged` | **Lot 9** |

> `RestaurantVertical.ts` n'importe/appelle que `RestaurantFinanceAdapter`, `RestaurantFacilityAdapter`, `RestaurantIntelligenceAdapter`, `RestaurantMccAdapter`.

**Commit** : `docs(plan): tri fichier-par-fichier de la verticale restaurant`.

---

## 4. LOT 2 — DÉDUPLIQUER (rapide, fait chuter le compteur)

**Pour chaque paire « service mort ⟷ service câblé équivalent »** identifiée au Lot 1 :
1. Confirmer l'équivalence fonctionnelle (le survivant couvre bien le cas).
2. Si le service mort a une logique **supérieure** (edge case, précision) → **porter** ce delta dans le survivant + test.
3. `git rm` le service mort **+ son `.test.ts`**.
4. Retirer tout ré-export orphelin dans les `index.ts`.
5. `npm run loop` + `npm run loop:test` verts.

Cibles fermes (sous réserve confirmation Lot 1) :
- `SplitBillService` → `usePosSplit` (+ `SovereignMath.splitRemainder`)
- `SharedBillDispatchService` → `usePosSplit`
- `SelfHealingRecipeBomService` + `LotAllergenMatrixService` + `LateAllergenInterceptionService` → `EightysixtService` + `AllergenGateService`
- `KDSMicroSequencingService` + `SmartStationRoutingService` + `KDSVisualDelayWarningService` → `KDSCourseSequencingEngine` + `KdsRoutingHandler`
- `PosFiscalSealE2EPipeline` + `TaxRateGuard` → `FinancialNexusBridge` + `FiscalSealer`
- `ReceiptBuilder` → `EscPosBuilder`
- `ThermalOverheatP2PFailoverService` → `PrinterFailoverManager`
- `ReservationService` (POS) → `@/modules/commerce` (module réservations)
- `CommercialGestureService` → `pos/domain/cartDiscounts.ts`

**Commits** : 1 par famille — `refactor(ops): supprime <X>, doublon de <Y> (déjà câblé)`.

---

## 5. LOT 3 — SUPPRIMER / GELER les spéculatifs

Fichiers sans demande produit ni roadmap :
`BluetoothPrinterAdapter`, `TpeResilienceSimulatorService`, `KegHydrostaticLossService`, `CocktailDilutionIndexService`, `CodeAmbreService`, `FermentationMonitorService`, `CorkedBottleDisputeService`, `AgecCarafeService`, `DegradedDishwashingModeService`, `DisinfectionSequenceService`, `RainPlanTerraceSwitchService`, `OrderLineDAGService`, `OrdersLiveBoard`.

**Règle de décision** (par fichier) :
- **Roadmap produit confirmée par l'humain** → garder, mais marquer `@wip` en tête (`// @wip owner:<nom> échéance:<AAAA-MM-JJ> — câblage prévu`) + le sortir du décompte du cliquet (liste d'exemptions comme `ORPHAN_COMPONENTS_MAX` le fait pour les 14 `shared/ui/*`).
- **Sinon** → `git rm <fichier> <fichier>.test.ts`. Le code reste dans l'historique git ; on le ressuscite si le besoin arrive.

> Ne PAS supprimer un fichier référencé (même par un seul autre fichier) sans avoir résolu la chaîne au Lot 1/2.

**Commit** : `chore(ops): retire N services spéculatifs non câblés (ressuscitables via git)` — lister les fichiers dans le message.

---

## 6. LOT 4 — CÂBLER : sous-système Caisse / rendu / clôture

**Objectif** : le flux d'encaissement réel utilise les services de caisse.

### 6.1 Points d'ancrage (à localiser, ne pas supposer les numéros de ligne)
- `pos/components/PaymentDialog.tsx` — branche `method === "cash"` (actuellement : `printerService.openCashDrawer()` seul).
- `pos/hooks/usePos.ts` — `finalizePayment` / `processPayment` / `handlePaymentComplete`.
- Flux Ticket Z : `src/shared/eventBus/handlers/TicketZHandler.ts`, `finance/fiscalite/TicketZEnforcementService.ts`, `src/lib/cron/ZReportAutoJob.ts`.

### 6.2 Câblages
| Service | Où | Effet attendu |
|---|---|---|
| `ExactChangeAssistanceService` | `PaymentDialog` cash : à la saisie du montant reçu | afficher le rendu (`montantReçu − totalTTC`), en microunits, décomposé en coupures |
| `ChangeAsTipService` | `PaymentDialog` cash, après calcul du rendu | proposer « laisser le rendu en pourboire » → alimente `TipDistributionService` |
| `useCashDrawer` + `CashDrawerTriggerService` | `usePos` | ouverture tiroir sur règle (vente cash, remboursement, no-sale manager avec `ActionGuard`) |
| `CashCounterModal` | monter dans le flux clôture (`TicketZ`) et à l'ouverture de service | comptage physique des coupures → `BlindCashCloseService` |
| `BlindCashCloseService` + `CashDrawerReconciliationService` | handler `finance.z_report_requested` ou bouton « Clôturer la caisse » | écart théorique (ventes cash) vs réel (comptage) → consigné dans le Ticket Z |
| `PosIdempotencyGuard` | `finalizePayment`, avant `processPayment` | clé `JE-PAYMENT-${orderId}` — bloque le double encaissement (ADR-001) |
| `HardenedTouchUiHelper` | `Cart` / `ProductGrid` — boutons +/- quantité, envoi cuisine, encaissement | anti-double-tap / anti-rage-tap |
| `BilingualTipGratuityHelper` | `PaymentDialog` — champ pourboire | saisie CB/espèces bilingue (`useLexicon`) |

### 6.3 Acceptation
- Paiement espèces de 50 € sur un ticket de 37,40 € → l'UI affiche « Rendu : 12,60 € » (2×5 + 2×1 + 1×0,50 + 1×0,10).
- Bouton « Clôturer la caisse » → modale comptage → écart affiché → écriture dans `tenants/{t}/fiscalLedger` ou équivalent, visible dans le Ticket Z.
- Double-clic rapide sur « Encaisser » → un seul `JournalEntry` créé.
- Tests : mettre à jour/étendre les `*.test.ts` existants pour couvrir le **point d'appel** (pas seulement la logique isolée).

**Commit** : `feat(ops): câble le sous-système caisse (rendu, tiroir, clôture aveugle, idempotence)`.

---

## 7. LOT 5 — CÂBLER : Titres-restaurant (CONECS)

### 7.1 Ancrages
- `pos/components/payment-dialog/PaymentMethodSelector.tsx` — enum `PaymentMethod` (actuellement `card` / `cash` / `mobile`).
- `pos/services/ConecsVatSplittingService.ts` — ventilation TVA.
- `pos/services/MealVoucherLimitGuard.ts` — **déjà câblé (1 réf)** : vérifier qu'il plafonne bien (limite légale journalière), sinon compléter.
- Écriture journal : `FinancialNexusBridge` / `FinancialJournalBuilder`.

### 7.2 Câblage
- Ajouter `meal_voucher` à `PaymentMethod` + i18n (5 locales, libellé « Titre-restaurant »).
- Branche `method === "meal_voucher"` dans `PaymentDialog` :
  - `MealVoucherLimitGuard` : refuser si dépassement du plafond légal (paramétrable, réglage `pos.meal_voucher_daily_cap`), **pas de rendu de monnaie** sur titre-resto.
  - `ConecsVatSplittingService` : ventiler le montant réglé par titre entre les taux de TVA des lignes (les titres-resto ne financent pas l'alcool → exclure).
- Le `JournalEntry` porte la ventilation.

### 7.3 Acceptation
- Ticket 25 € (plat 18 € TVA 10 %, bière 7 € TVA 20 %) réglé partiellement 19 € en titre-resto → la bière est exclue, ventilation TVA correcte, aucun rendu proposé, plafond respecté.

**Commit** : `feat(ops): moyen de paiement Titres-restaurant (CONECS, ventilation TVA, plafond)`.

---

## 8. LOT 6 — CÂBLER : Tables (transfert / fusion / handoff / verrou / dine&dash)

### 8.1 Ancrages
- `pos/components/TableSelector.tsx` — sélection de table.
- `pos/hooks/usePos.ts` — `currentTable`, `selectedTableId`, `updateTable`.
- `useFloorPlan` (`src/modules/facility/spaces/hooks/useFloorPlan.tsx`) + `FloorPlanView` réservations.
- ⚠️ `logiquemetier.md` : `TableTransferService` / `TableHandoffService` lisent `tenants/{t}/orders` alors que le POS écrivait `ops_flows`/`ops_nodes` — **vérifier que le nom de collection est unifié** avant de câbler, sinon transfert sur collection vide.

### 8.2 Câblages
| Service | UI | Event |
|---|---|---|
| `TableTransferService` | menu contextuel table (long-press / bouton « Transférer ») dans `TableSelector` ou plan de salle | émet `table.transferred` ; `ActionGuard` niveau ≥ 50 (chef de rang) |
| `TableMergeService` | idem, « Fusionner avec… » | `table.merged` |
| `TableHandoffService` | « Passer le rang à… » (sélection serveur) | `table.handoff` |
| `useTableLock` + `TableLockService` | `usePos` : au montage d'une table, poser le verrou optimiste `versionTag` ; à chaque mutation panier, vérifier | bloquer la 2ᵉ saisie concurrente + toast « Table éditée par {serveur} » |
| `DineAndDashDetectorService` | handler sur `table.released` **sans** `order.paid` correspondant sous X min | alerte manager, `notification.created` priorité `high` |

### 8.3 Acceptation
- Ouvrir la table 12 sur 2 terminaux → le 2ᵉ voit « éditée par … », ses ajouts sont refusés ou mis en file.
- Transférer le ticket de la table 12 vers la 14 → lignes déplacées, table 12 libérée, `table.transferred` émis, audit consigné.
- Libérer une table avec un ticket non soldé → alerte « départ sans paiement » après le délai.

**Commit** : `feat(ops): opérations de table (transfert, fusion, handoff, verrou concurrence, dine&dash)`.

---

## 9. LOT 7 — CÂBLER : KDS pacing, timers & reprise poste

### 9.1 Ancrages
- `kds/hooks/useKDSController.ts` — le hook de l'écran KDS (lit `useKitchen` → `ordersNodeAtom`).
- `kds/components/KDSDashboard.tsx`, `KDSTicket.tsx`, `KDSHeader.tsx`.
- Handlers : `kds/handlers/*` (s'enregistrent via `src/shared/eventBus/registerHandlers/`).
- Acceptation commande online/borne : `posOrderSubmit.ts` (`submitKitchenOrder` émet `order.placed`), agrégateurs `commerce/relation/delivery/`.

### 9.2 Câblages
| Service | Où | Effet |
|---|---|---|
| `KDSPacingEngine` | handler sur `order.placed` en provenance borne/online (pas salle) | si retard moyen KDS > `kds.overheat_threshold_min` → `isThrottled` : différer l'acceptation auto, afficher un délai de retrait rallongé côté borne |
| `MeatRestingTimerService` | `useKDSController` — état dérivé par ticket contenant une viande | minuteur de repos affiché sur `KDSTicket`, alerte à échéance |
| `PassPickupReminderService` | handler sur passage `READY` sans `SERVED` sous N s | relance sonore/visuelle au passe (`KDSAudioHardwareService`) |
| `KDSStationRecoveryService` | `KDSHeader` — bouton « Reprendre poste » après déconnexion | reconstruit l'état du poste depuis `ordersNodeAtom` |
| `HotColdSyncKdsService` | `useKDSController` — quand un ticket a des articles chaud + froid | synchro des échéances pour envoi simultané au passe |

### 9.3 Acceptation
- Simuler 25 min de retard KDS + une commande borne → délai de retrait annoncé augmenté, `KDS_PACING_THROTTLE_ACTIVATED` en audit.
- Un ticket « entrecôte » affiche un minuteur de repos de 4 min après passage `COOKING`→`READY`.
- Marquer un plat `READY` et ne rien faire 90 s → relance au passe.

**Commit** : `feat(ops): KDS — pacing débit, minuteurs viande, relance passe, reprise poste`.

---

## 10. LOT 8 — CÂBLER : failover impression

### 10.1 Ancrages
- `printing/hardware/` — `EscPosBuilder`, `EscPosEncoder`, `PrinterFailoverManager` (câblé), `UniversalPrinterBridgeService` (câblé).
- Le `printerService` utilisé par `PaymentDialog` (`printerService.openCashDrawer()`) et `posOrderSubmit`.
- `kds/handlers/KdsPrintFallbackHandler.ts` (déjà : bon cuisine KO → repli passe).

### 10.2 Câblages
| Service | Où | Effet |
|---|---|---|
| `PrintJobQueueService` | `printerService` — toute impression (ticket, bon cuisine, Z) passe par la file | retry, ordre, persistance offline (outbox) |
| `PrinterFailoverRoutingService` | `PrintJobQueueService` sur échec d'un job | reroute vers l'imprimante de secours déclarée (passe, comptoir) sous le délai, alerte KDS |

### 10.3 Acceptation
- Débrancher (simuler) l'imprimante cuisine → le bon part sur l'imprimante du passe sous le délai, une notif remonte, le job n'est pas perdu (rejoué au retour).

**Commit** : `feat(ops): file d'impression + reroutage automatique sur panne`.

---

## 11. LOT 9 — CÂBLER : les 4 adapters de verticale

### 11.1 Décision préalable (par adapter)
Pour `RestaurantCommerceAdapter` / `RestaurantComplianceAdapter` / `RestaurantHumanAdapter` / `RestaurantLogisticsAdapter` :
1. Lister les events qu'il émet (déjà fait — voir Lot 1 § « Verticale »).
2. Vérifier si ces events sont **déjà émis directement** par le module métier concerné (ex. `haccp.check.saved` émis par `compliance/qualite/haccp/`).
   - **Oui, et l'adapter n'ajoute rien** → l'adapter est une **indirection morte** : `git rm` l'adapter + son test + le ré-export dans `adapters/index.ts`.
   - **Non, ou l'adapter enrichit / coordonne cross-domaine** (comme `RestaurantFinanceAdapter.emitOrderFiscalSeal` fait sur `order.paid`) → **câbler** : ajouter le bloc `context.registerEventHandler(...)` correspondant dans `RestaurantVertical.initialize()`, sur le modèle des 4 adapters déjà branchés.

### 11.2 Modèle de câblage (si on garde l'adapter)
Dans `src/verticals/restaurant/RestaurantVertical.ts`, section `initialize()` :
```ts
// Commerce — points fidélité gagnés à l'encaissement
context.registerEventHandler<{ tenantId: string; orderId: string; customerId?: string; totalInMicrounits: number }>(
  'order.paid',
  ({ tenantId, customerId, totalInMicrounits }) => {
    if (customerId) RestaurantCommerceAdapter.emitPointsEarned({ tenantId, customerId, amountInMicrounits: totalInMicrounits });
  },
);
```
(adapter à importer depuis `./adapters`).

### 11.3 Acceptation
- Chaque adapter conservé : un event métier réel déclenche son `emit*` (tracé en log/audit).
- Chaque adapter supprimé : `grep -rn RestaurantXAdapter src` → 0 hors historique ; `tsc` + `preflight` verts.

**Commit** : `feat(verticals): câble (ou retire) les 4 adapters restaurant inertes`.

---

## 12. LOT 10 — Composants non montés

| Composant | Action |
|---|---|
| `kds/components/KDSCoursingAnimationIndicator.tsx` | monter dans `KDSTicket.tsx` sur transition de service (`FIRED`→`COOKING`) **ou** supprimer si `KDSCoursingAnimationIndicator` fait doublon avec l'animation déjà présente |
| `kds/components/OrdersLiveBoard.tsx` | comparer à `KDSDashboard` — supprimer le doublon |
| `pos/components/CashCounterModal.tsx` | monté au Lot 4 (sinon supprimer) |
| `printing/components/settings/AddPrinterWizard.tsx` | monter dans `src/shared/components/settings/PrinterSettings.tsx` (qui l'importe déjà sans le rendre) — bouton « Ajouter une imprimante » |

**Commit** : `feat(ops): monte les composants KDS/impression orphelins (ou supprime les doublons)`.

---

## 13. Critères de sortie du plan

1. `node <scan>` (Annexe A) → **`MORT-TOTAL=0`, `TEST-SEUL` = résidu documenté `@wip` uniquement**.
2. `npm run measure` → `verticalServicesUnwired` = valeur cible (0 ou exemptions `@wip`).
3. `node scripts/gate-last-mile.mjs` → aucun compteur en hausse ; `VERTICAL_SERVICES_UNWIRED_MAX` abaissé à la valeur réelle à chaque lot.
4. `node scripts/verify-gate-integrity.mjs` → OK.
5. `npm run preflight` → **10/10 vert** (dont `next build`, sentrux, suite Vitest complète).
6. Chaque service câblé a un test qui couvre **le point d'appel** (composant monté / handler enregistré / route), pas seulement la logique isolée.
7. `.claude/sessions.md` : ligne passée à `terminée` avec les mesures Loi 7 de la session.

---

## Annexe A — Script de scan

À sauvegarder en `scripts/oneshot-scan-vertical-restaurant.mjs` (préfixe `oneshot-` = jetable ; la version pérenne = la mesure du Lot 0). Lancer : `node scripts/oneshot-scan-vertical-restaurant.mjs`.

```js
#!/usr/bin/env node
/**
 * Scan "bout-en-bout" de la verticale RESTAURANT.
 * Pour chaque symbole exporté du périmètre : compte les références réelles
 * (hors tests, hors self, hors ré-export de barrel) et classe le fichier.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const PERIMETRE = [
  'src/verticals/restaurant',
  'src/modules/ops/service/restaurant',
  'src/modules/ops/production/kds',
  'src/modules/ops/service/core/printing',
];

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (['node_modules', '.next', 'e2e'].includes(e)) continue;
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(e)) acc.push(p);
  }
  return acc;
}
const ALL = walk(SRC);
const isTest = (p) => /\.(test|spec)\.tsx?$/.test(p) || /(__tests__|\/tests\/)/.test(p);
const APP = ALL.filter((p) => !isTest(p));
const content = new Map();
for (const p of ALL) content.set(p, readFileSync(p, 'utf8'));

const TARGET = APP.filter((p) => {
  const rel = relative(ROOT, p);
  return PERIMETRE.some((d) => rel === d || rel.startsWith(d + '/'));
});

function exportsOf(src) {
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:class|function|const|let|var)\s+([A-Za-z0-9_]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:interface|type|enum)\s+([A-Za-z0-9_]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (let part of m[1].split(',')) {
      part = part.trim().replace(/^type\s+/, '');
      const as = part.split(/\s+as\s+/);
      const n = (as[1] || as[0]).trim();
      if (n && /^[A-Za-z0-9_]+$/.test(n)) names.add(n);
    }
  }
  return { names: [...names] };
}

function refCount(name, selfPath) {
  const wordRx = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
  let app = 0, test = 0, barrel = 0;
  const appFiles = [], testFiles = [];
  for (const p of ALL) {
    if (p === selfPath) continue;
    const c = content.get(p);
    if (!wordRx.test(c)) continue;
    const onlyReexports = basename(p) === 'index.ts' && c.split('\n').every((l) => {
      const t = l.trim();
      return t === '' || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || /^export .* from /.test(t) || /^import /.test(t);
    });
    if (onlyReexports) { barrel++; continue; }
    if (isTest(p)) { test++; testFiles.push(relative(ROOT, p)); }
    else { app++; appFiles.push(relative(ROOT, p)); }
  }
  return { app, test, barrel, appFiles, testFiles };
}

const registerFiles = APP.filter((p) => /registerHandlers|register.*Handler|eventBus\/register/i.test(p) || /RestaurantVertical\.ts$/.test(p) || /CoreInfraProviders|bootstrap/i.test(p));
const registerBlob = registerFiles.map((p) => content.get(p)).join('\n');

const verdicts = [];
for (const p of TARGET) {
  const rel = relative(ROOT, p);
  const src = content.get(p);
  const bn = basename(p);
  if (bn === 'index.ts' || /\.d\.ts$/.test(bn)) continue;
  const { names } = exportsOf(src);
  if (!names.length) continue;

  let best = { app: 0, test: 0, barrel: 0, appFiles: [], testFiles: [], name: names[0] };
  for (const n of names) {
    if (n.length < 3) continue;
    const r = refCount(n, p);
    if (r.app > best.app || (r.app === best.app && r.test > best.test)) best = { ...r, name: n };
  }

  const isComponent = /\.tsx$/.test(p) && /export\s+(default\s+)?function\s+[A-Z]/.test(src);
  const isHandler = /Handler|Notifier/.test(bn);
  const isRoute = /\/route\.ts$/.test(bn) || /page\.tsx$/.test(bn);

  let rendered = false;
  if (isComponent) {
    const comp = names.find((n) => /^[A-Z]/.test(n)) || best.name;
    const jsxRx = new RegExp('<' + comp + '[\\s/>]');
    rendered = APP.some((q) => q !== p && jsxRx.test(content.get(q)));
  }
  let registered = null;
  if (isHandler) {
    const hname = names.find((n) => /Handler|Notifier|register/i.test(n)) || best.name;
    registered = new RegExp('\\b' + hname + '\\b').test(registerBlob) || new RegExp(basename(p, '.ts')).test(registerBlob);
  }

  let verdict, why;
  if (isRoute) { verdict = 'ROUTE'; why = 'route/page — atteignabilité à vérifier'; }
  else if (isHandler && registered === false) { verdict = 'HANDLER-MORT'; why = 'handler jamais importé par un registre'; }
  else if (best.app === 0 && best.test === 0 && best.barrel === 0) { verdict = 'MORT-TOTAL'; why = '0 référence nulle part'; }
  else if (best.app === 0 && best.test === 0 && best.barrel > 0) { verdict = 'BARREL-SEUL'; why = 'exposé en index.ts, aucun consommateur'; }
  else if (best.app === 0 && best.test > 0) { verdict = 'TEST-SEUL'; why = `codé + testé (${best.test}) mais 0 appelant applicatif`; }
  else if (isComponent && !rendered) { verdict = 'COMPOSANT-NON-RENDU'; why = `importé (${best.app}) mais jamais <${best.name}> en JSX`; }
  else if (best.app === 1 && best.appFiles[0] && /\/services\/|\/handlers\//.test(best.appFiles[0]) && best.appFiles[0] !== rel) {
    verdict = 'ILOT'; why = `1 seul appelant, lui-même service/handler : ${best.appFiles[0]}`;
  }
  else { verdict = 'OK'; why = `${best.app} appelant(s) applicatif(s)`; }

  verdicts.push({ rel, verdict, why, symbol: best.name, appFiles: best.appFiles.slice(0, 3) });
}

const order = ['MORT-TOTAL', 'HANDLER-MORT', 'BARREL-SEUL', 'TEST-SEUL', 'COMPOSANT-NON-RENDU', 'ILOT', 'ROUTE', 'OK'];
verdicts.sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict) || a.rel.localeCompare(b.rel));
const byV = {};
for (const v of verdicts) (byV[v.verdict] ??= []).push(v);
console.log(`\n# SCAN VERTICALE RESTAURANT — ${TARGET.length} fichiers\n`);
for (const k of order) {
  const list = byV[k] || [];
  if (k === 'OK') { console.log(`\n## OK : ${list.length} (sains)`); continue; }
  console.log(`\n## ${k} — ${list.length}`);
  for (const v of list) {
    console.log(`  ${v.rel}\n      → ${v.symbol} : ${v.why}`);
    if (v.appFiles.length) console.log(`        appelants: ${v.appFiles.join(', ')}`);
  }
}
console.log(`\n---\nRésumé : ` + order.slice(0, -1).map((k) => `${k}=${(byV[k] || []).length}`).join('  '));
```

---

## Annexe B — Ancres de flux (vérifiées le 2026-09-01)

| Flux | Fichier | Note |
|---|---|---|
| POS — orchestration | `pos/hooks/usePos.ts` → `usePOSController` | `finalizePayment` → `processPayment` ; `submitKitchenOrder` émet `order.placed` |
| POS — paiement UI | `pos/components/PaymentDialog.tsx` | branches `card` / `cash` / `mobile` ; cash → `printerService.openCashDrawer()` seulement |
| POS — split | `pos/hooks/usePosSplit.ts` | **seul chemin vivant** ; `SovereignMath.splitRemainder` |
| KDS — données | `kds/hooks/useKDSController.ts` → `useKitchen` (`src/modules/ops/providers/hooks/kitchenHooks.tsx`) → `ordersNodeAtom` (`@/store/pillars/ops`) | aucun service KDS consommé |
| KDS — cadençage vivant | `kds/services/KDSCourseSequencingEngine.ts` (statuts `HOLD/FIRED/COOKING/READY/SERVED`) + `kds/handlers/KdsRoutingHandler.ts` | |
| Verticale — wiring events | `src/verticals/restaurant/RestaurantVertical.ts` `initialize()` | branche : `order.paid`, `table.released`, `reservation.confirmed`, `reservation.no_show`, `sensor.temperature_anomaly`, `dlc.expired`, `intelligence.menu_engineering_requested`, `floor_plan.table_moved`, `maintenance.issue_reported`, `tenant.ready`. **Adapters utilisés : Finance, Facility, Intelligence, Mcc.** |
| Fiscal | `src/modules/finance/comptabilite/FinancialNexusBridge.ts` + `src/lib/mcc/fiscal/FiscalSealer.ts` | `sealDataAtomically` (chaîne `chainHead`, `GENESIS_ROOT`) |
| Ticket Z | `src/shared/eventBus/handlers/TicketZHandler.ts`, `finance/fiscalite/TicketZEnforcementService.ts`, `src/lib/cron/ZReportAutoJob.ts` | |
| Impression | `printing/hardware/` (`EscPosBuilder`, `PrinterFailoverManager`, `UniversalPrinterBridgeService` câblés) | `kds/handlers/KdsPrintFallbackHandler.ts` = repli passe existant |

---

## Annexe C — Dette connexe (hors périmètre, à ne pas mélanger)

| Sujet | Doc | Statut |
|---|---|---|
| Durcissement RH/paie (séquence facture `Math.random()`, fuseau nuit, vigilance URSSAF) | plan séparé | en cours (`InvoiceSequenceService`, `UrssafVigilanceService` déjà exportés dans `human/index.ts`) |
| Collections `ops_flows`/`ops_nodes` vs `tenants/{t}/orders` | `logiquemetier.md` | **bloquant pour le Lot 6** — vérifier l'unification d'abord |
| 3 ⚠️ (audit chaîne NF525, SovereignGuard hors chemin serveur, 174/216 routes bypass auth) | `plan-audit-ultra-complet.md` Annexe C | à trier séparément |
| Auth DB-agnostique | `firestore.md` (Lots B3 → G) | chantier dédié |
