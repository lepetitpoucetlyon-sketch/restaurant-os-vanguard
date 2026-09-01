# 📋 Tri Fichier-par-Fichier — Verticale Restaurant & Production Ops

> **Document de référence** : Lot 1 du plan de câblage bout-en-bout & purge
> **Date de tri** : 2026-09-01
> **Périmètre scanné** : `src/verticals/restaurant/`, `src/modules/ops/service/restaurant/`, `src/modules/ops/production/kds/`, `src/modules/ops/service/core/printing/`
> **Statut initial** : 7 MORT-TOTAL, 48 TEST-SEUL, 3 ÎLOTS, 2 COMPOSANTS NON RENDUS

---

## 1. Synthèse des Décisions par Lot

| Catégorie | Action | Nb Fichiers | Lots Cibles |
|---|---|---|---|
| **DÉDUPLIQUER** | Reporter le delta si pertinent puis `git rm` le doublon + test | 12 | **Lot 2** |
| **PURGER (Spéculatifs)** | `git rm` code + test sans demande produit (historique git préservé) | 13 | **Lot 3** |
| **CÂBLER — Caisse & Clôture** | Brancher dans `PaymentDialog`, `usePos`, `TicketZ` | 8 | **Lot 4** |
| **CÂBLER — Titres-Restaurant** | Brancher CONECS & ventilation TVA dans `PaymentDialog` | 1 | **Lot 5** |
| **CÂBLER — Tables & Salle** | Brancher menus contextuels, verrou concurrence, dine & dash | 5 | **Lot 6** |
| **CÂBLER — KDS Pacing & Timers** | Brancher throttling, minuteurs viandes, relance passe | 5 | **Lot 7** |
| **CÂBLER — Impression & Failover** | Brancher queue de jobs et bascule sur panne | 2 | **Lot 8** |
| **CÂBLER / PURGER — Adapters** | Brancher dans `RestaurantVertical.initialize()` ou retirer | 4 | **Lot 9** |
| **MONTER — Composants Orphelins** | Monter dans les écrans parents (`KDSTicket`, `PrinterSettings`) | 2 | **Lot 10** |

---

## 2. Inventaire Détaillé & Tableau de Décision

| Fichier | Symbole Principal | Intention Métier | Verdict | Lot Cible | Risque & Justification |
|---|---|---|---|---|---|
| `kds/components/KDSCoursingAnimationIndicator.tsx` | `KDSCoursingAnimationIndicator` | Animation visuelle de changement de coursing (entrée, plat, dessert) | **MONTER** | Lot 10 | Faible : monter dans `KDSTicket.tsx` sur statut `FIRED` / `COOKING`. |
| `kds/components/OrdersLiveBoard.tsx` | `OrdersLiveBoard` | Vue alternative de board KDS | **SUPPRIMER** | Lot 10 | Faible : doublon non maintenu de `KDSDashboard.tsx`. |
| `service/core/printing/hardware/adapters/BluetoothPrinterAdapter.ts` | `BluetoothPrinterAdapter` | Connexion imprimante WebBluetooth | **SUPPRIMER** | Lot 3 | Nul : aucun matériel BLE en production, `NetworkAdapter` et `USBAdapter` suffisent. |
| `service/core/printing/hardware/escpos/ReceiptBuilder.ts` | `ReceiptBuilder` | Constructeur de ticket ESC/POS | **DÉDUP** | Lot 2 | Nul : doublon partiel de `EscPosBuilder.ts` et `EscPosReceiptFormatter.ts` déjà câblés. |
| `pos/hooks/useTableLock.ts` | `useTableLock` | Verrouillage optimiste anti-concurrence des tables | **CÂBLER** | Lot 6 | Modéré : à intégrer dans `usePos.ts` pour empêcher la modification simultanée par 2 serveurs. |
| `pos/services/ChangeAsTipService.ts` | `ChangeAsTipService` | Conversion du rendu de monnaie en pourboire | **CÂBLER** | Lot 4 | Faible : intégrer dans `PaymentDialog.tsx` lors du paiement espèces. |
| `pos/services/CommercialGestureService.ts` | `CommercialGestureService` | Remises et gestes commerciaux | **DÉDUP** | Lot 2 | Faible : recoupe `pos/domain/cartDiscounts.ts` déjà en place. |
| `kds/services/KDSPacingEngine.ts` | `KDSPacingEngine` | Régulation du débit de commande en cas de surchauffe cuisine | **CÂBLER** | Lot 7 | Modéré : brancher sur `order.placed` (bornes/online) pour ajuster les délais annoncés. |
| `kds/services/MeatRestingTimerService.ts` | `MeatRestingTimerService` | Chronomètre de repos des viandes après cuisson | **CÂBLER** | Lot 7 | Faible : à afficher sur `KDSTicket.tsx` pour les articles catégorie viande. |
| `kds/services/PassPickupReminderService.ts` | `PassPickupReminderService` | Relance visuelle/sonore pour les plats en attente au passe | **CÂBLER** | Lot 7 | Faible : handler sur passage en `READY` sans `SERVED` après délai. |
| `kds/services/KDSMicroSequencingService.ts` | `KDSMicroSequencingService` | Ordonnancement fin des articles par poste | **DÉDUP** | Lot 2 | Faible : redondant avec `KDSCourseSequencingEngine.ts`. |
| `kds/services/KDSItemDeltaModificationService.ts` | `KDSItemDeltaModificationService` | Mise à jour des lignes de commande en cours de cuisson | **DÉDUP** | Lot 2 | Faible : la gestion delta est portée par `ordersNodeAtom`. |
| `kds/services/KDSStationRecoveryService.ts` | `KDSStationRecoveryService` | Reprise d'état du poste KDS après crash/déconnexion | **CÂBLER** | Lot 7 | Faible : bouton « Reprendre poste » dans `KDSHeader.tsx`. |
| `kds/services/KDSVisualDelayWarningService.ts` | `KDSVisualDelayWarningService` | Alertes visuelles de retard | **DÉDUP** | Lot 2 | Faible : déjà géré par les styles conditionnels de `KDSTicket.tsx`. |
| `kds/services/SmartStationRoutingService.ts` | `SmartStationRoutingService` | Routage automatique des plats vers les postes de cuisine | **DÉDUP** | Lot 2 | Faible : couvert par `KdsRoutingHandler.ts` (câblé). |
| `kds/services/HotColdSyncKdsService.ts` | `HotColdSyncKdsService` | Synchronisation de l'envoi chaud et froid | **CÂBLER** | Lot 7 | Faible : synchronisation dans `useKDSController.ts`. |
| `kds/services/LateAllergenInterceptionService.ts` | `LateAllergenInterceptionService` | Alerte allergène après transmission cuisine | **DÉDUP** | Lot 2 | Faible : couvert par `AllergenGateService.ts`. |
| `kds/services/LotAllergenMatrixService.ts` | `LotAllergenMatrixService` | Traçabilité allergènes par lot de fabrication | **DÉDUP** | Lot 2 | Faible : géré par le module `@/modules/compliance` (HACCP). |
| `kds/services/SelfHealingRecipeBomService.ts` | `SelfHealingRecipeBomService` | Réajustement dynamique de nomenclature en rupture | **DÉDUP** | Lot 2 | Faible : géré par `EightysixtService.ts` (86 / rupture). |
| `kds/services/DegradedDishwashingModeService.ts` | `DegradedDishwashingModeService` | Mode dégradé en cas de panne plonge | **SUPPRIMER** | Lot 3 | Nul : spéculatif sans demande client. |
| `kds/services/DisinfectionSequenceService.ts` | `DisinfectionSequenceService` | Protocole de désinfection cuisine | **SUPPRIMER** | Lot 3 | Nul : relève de `compliance/qualite/haccp`, pas du KDS opérationnel. |
| `pos/services/ExactChangeAssistanceService.ts` | `ExactChangeAssistanceService` | Calcul précis et décomposition du rendu de monnaie | **CÂBLER** | Lot 4 | Faible : afficher le détail des coupures dans `PaymentDialog.tsx`. |
| `pos/components/CashCounterModal.tsx` | `CashCounterModal` | Interface de comptage physique de la caisse (billets/pièces) | **CÂBLER** | Lot 4 | Faible : monter dans l'ouverture/clôture de caisse (`TicketZ`). |
| `pos/hooks/useCashDrawer.ts` | `useCashDrawer` | État et pilotage du tiroir-caisse | **CÂBLER** | Lot 4 | Faible : relier au hook `usePos.ts`. |
| `pos/services/CashDrawerTriggerService.ts` | `CashDrawerTriggerService` | Règles d'ouverture automatique du tiroir | **CÂBLER** | Lot 4 | Faible : déclenchement sur paiement cash et no-sale. |
| `pos/services/BlindCashCloseService.ts` | `BlindCashCloseService` | Clôture de caisse à l'aveugle (comptage sans total théorique) | **CÂBLER** | Lot 4 | Modéré : intégrer au flux de clôture journalière NF525. |
| `pos/services/CashDrawerReconciliationService.ts` | `CashDrawerReconciliationService` | Rapprochement théorique vs réel et calcul d'écart | **CÂBLER** | Lot 4 | Modéré : consigner les écarts dans le rapport Z. |
| `pos/services/BilingualTipGratuityHelper.ts` | `BilingualTipGratuityHelper` | Libellés pourboires bilingues EN/FR | **CÂBLER** | Lot 4 | Faible : intégrer dans la saisie du tip `PaymentDialog.tsx`. |
| `pos/services/ConecsVatSplittingService.ts` | `ConecsVatSplittingService` | Ventilation de TVA éligible titres-restaurant CONECS | **CÂBLER** | Lot 5 | Modéré : obligatoire pour conformité titres-resto (hors alcool). |
| `pos/services/TableTransferService.ts` | `TableTransferService` | Déplacement d'un ticket d'une table à une autre | **CÂBLER** | Lot 6 | Modéré : brancher dans le plan de salle / `TableSelector.tsx`. |
| `pos/services/TableMergeService.ts` | `TableMergeService` | Fusion de tickets de tables distinctes | **CÂBLER** | Lot 6 | Modéré : brancher dans `TableSelector.tsx`. |
| `pos/services/TableHandoffService.ts` | `TableHandoffService` | Transfert de responsabilité de rang entre serveurs | **CÂBLER** | Lot 6 | Faible : menu serveur sur table active. |
| `pos/services/SharedBillDispatchService.ts` | `SharedBillDispatchService` | Répartition d'addition partagée | **DÉDUP** | Lot 2 | Faible : doublon de `usePosSplit.ts`. |
| `pos/services/SplitBillService.ts` | `SplitBillService` | Calcul de partage d'addition | **DÉDUP** | Lot 2 | Faible : doublon de `usePosSplit.ts` + `SovereignMath`. |
| `pos/services/PrinterFailoverRoutingService.ts` | `PrinterFailoverRoutingService` | Reroutage automatique d'impression si une imprimante échoue | **CÂBLER** | Lot 8 | Modéré : brancher dans `PrintJobQueueService.ts`. |
| `pos/services/PrintJobQueueService.ts` | `PrintJobQueueService` | File d'attente d'impression avec persistance et retry | **CÂBLER** | Lot 8 | Modéré : canal central d'envoi d'impression. |
| `pos/services/ThermalOverheatP2PFailoverService.ts` | `ThermalOverheatP2PFailoverService` | Repli P2P surchauffe thermique | **DÉDUP** | Lot 2 | Faible : doublon de `PrinterFailoverManager.ts`. |
| `pos/services/TpeResilienceSimulatorService.ts` | `TpeResilienceSimulatorService` | Simulateur de crash TPE | **SUPPRIMER** | Lot 3 | Nul : outil de test non utilisé en runtime. |
| `printing/components/settings/AddPrinterWizard.tsx` | `AddPrinterWizard` | Assistant pas-à-pas d'ajout d'imprimante | **MONTER** | Lot 10 | Faible : monter dans `PrinterSettings.tsx` (bouton « Ajouter »). |
| `pos/services/KegHydrostaticLossService.ts` | `KegHydrostaticLossService` | Calcul perte hydrostatique fûts de bière | **SUPPRIMER** | Lot 3 | Nul : spéculatif. |
| `pos/services/CocktailDilutionIndexService.ts` | `CocktailDilutionIndexService` | Index de dilution des cocktails | **SUPPRIMER** | Lot 3 | Nul : spéculatif. |
| `pos/services/CodeAmbreService.ts` | `CodeAmbreService` | Gestion code ambre | **SUPPRIMER** | Lot 3 | Nul : spéculatif. |
| `pos/services/FermentationMonitorService.ts` | `FermentationMonitorService` | Suivi de fermentation | **SUPPRIMER** | Lot 3 | Nul : spéculatif. |
| `pos/services/CorkedBottleDisputeService.ts` | `CorkedBottleDisputeService` | Gestion litige bouteille bouchonnée | **SUPPRIMER** | Lot 3 | Nul : spéculatif. |
| `pos/services/AgecCarafeService.ts` | `AgecCarafeService` | Mention loi AGEC carafe d'eau | **SUPPRIMER** | Lot 3 | Nul : spéculatif. |
| `pos/services/OrderLineDAGService.ts` | `OrderLineDAGService` | Graphe acyclique direct des lignes de commande | **SUPPRIMER** | Lot 3 | Nul : sur-ingénierie non exploitée. |
| `pos/services/PosIdempotencyGuard.ts` | `PosIdempotencyGuard` | Protection contre double encaissement (clé idempotente) | **CÂBLER** | Lot 4 | Modéré : clé `JE-PAYMENT-${orderId}` dans `finalizePayment`. |
| `pos/services/PosFiscalSealE2EPipeline.ts` | `PosFiscalSealE2EPipeline` | Pipeline de scellement fiscal | **DÉDUP** | Lot 2 | Modéré : doublon de `FinancialNexusBridge.ts` + `FiscalSealer.ts`. |
| `pos/services/TaxRateGuard.ts` | `TaxRateGuard` | Validation des taux de TVA autorisés | **DÉDUP** | Lot 2 | Faible : doublon de `SovereignMath.ts` / `FinancialNexusBridge.ts`. |
| `pos/services/BarcodeScannerInputService.ts` | `BarcodeScannerInputService` | Capture des scanners codes-barres | **SUPPRIMER** | Lot 3 | Nul : géré nativement en émulation clavier HID par les navigateurs. |
| `pos/services/CustomerFacingDisplayService.ts` | `CustomerFacingDisplayService` | Pilotage d'afficheur client externe | **SUPPRIMER** | Lot 3 | Nul : spéculatif sans écran client configuré. |
| `pos/services/HardenedTouchUiHelper.ts` | `HardenedTouchUiHelper` | Protection anti-rebond et tactile durci | **CÂBLER** | Lot 4 | Faible : câbler sur les boutons d'incrément panier et envoi commande. |
| `pos/services/DineAndDashDetectorService.ts` | `DineAndDashDetectorService` | Détection automatique des tables libérées sans paiement | **CÂBLER** | Lot 6 | Faible : handler sur `table.released` si solde > 0. |
| `pos/services/RainPlanTerraceSwitchService.ts` | `RainPlanTerraceSwitchService` | Bascule météo plan de terrasse pluie | **SUPPRIMER** | Lot 3 | Nul : spéculatif. |
| `pos/services/ReservationService.ts` | `ReservationService` | Gestion locale des réservations POS | **DÉDUP** | Lot 2 | Faible : doublon de `@/modules/commerce` (module central réservations). |
| `verticals/restaurant/adapters/RestaurantCommerceAdapter.ts` | `RestaurantCommerceAdapter` | Émission `crm.points_earned` et `reservation.confirmed` | **CÂBLER** | Lot 9 | Faible : brancher dans `RestaurantVertical.initialize()` sur `order.paid`. |
| `verticals/restaurant/adapters/RestaurantComplianceAdapter.ts` | `RestaurantComplianceAdapter` | Émission `haccp.check.saved` et alertes hygiène | **CÂBLER** | Lot 9 | Faible : brancher dans `RestaurantVertical.initialize()`. |
| `verticals/restaurant/adapters/RestaurantHumanAdapter.ts` | `RestaurantHumanAdapter` | Émission `hr.tip_distributed` lors du paiement | **CÂBLER** | Lot 9 | Faible : brancher sur `order.paid` avec pourboire. |
| `verticals/restaurant/adapters/RestaurantLogisticsAdapter.ts` | `RestaurantLogisticsAdapter` | Déduction de stock et pertes | **CÂBLER** | Lot 9 | Faible : brancher sur `order.paid` pour impacter le stock matières. |
