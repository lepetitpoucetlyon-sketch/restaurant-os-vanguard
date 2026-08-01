import { logger } from '@/lib/logger';
import { registerStockDeductionHandler } from './handlers/StockDeductionHandler';
import { registerStockAlertHandler } from './handlers/StockAlertHandler';
import { registerTicketZHandler } from './handlers/TicketZHandler';
import { registerIntelligenceHandler } from './handlers/IntelligenceHandler';
import { registerSovereignBreachHandler } from './handlers/SovereignBreachHandler';
import { registerWasteStockReconciliationHandler } from './handlers/WasteStockReconciliationHandler';
import { registerPayrollTimeclockHandler } from './handlers/PayrollTimeclockHandler';
import { registerStockRestitutionHandler } from './handlers/StockRestitutionHandler';
import { registerStockReceptionHandler } from './handlers/StockReceptionHandler';
import { registerQuarantineHandler } from './handlers/QuarantineHandler';
import { registerFoodCostRecomputer } from './handlers/FoodCostRecomputer';
import { registerMarginWarningHandler } from './handlers/MarginWarningHandler';
import { registerCRMVipHandler } from '@/modules/commerce/marketing/handlers/CRMVipHandler';
import { registerRainStaffingHandler } from '@/modules/human/hr/handlers/RainStaffingHandler';
import { registerCashDrawerAnomalyHandler } from '@/modules/ops/pos/handlers/CashDrawerAnomalyHandler';
import { registerWasteToFoodCostHandler } from '@/modules/compliance/haccp/handlers/WasteToFoodCostHandler';
import { registerPaymentLedgerHandler } from './handlers/PaymentLedgerHandler';
import { registerSplitPaymentHandler } from './handlers/SplitPaymentHandler';
import { registerCompEntryHandler } from './handlers/CompEntryHandler';
import { registerRefundExtourneHandler } from './handlers/RefundExtourneHandler';
import { registerStockZeroBlockerHandler } from './handlers/StockZeroBlockerHandler';
import { registerPhysicalInventoryHandler } from './handlers/PhysicalInventoryHandler';
import { registerStockTransferHandler } from './handlers/StockTransferHandler';
import { registerQuarantineActivatedHandler } from './handlers/QuarantineActivatedHandler';
import { registerRecallPOSBlockerHandler } from './handlers/RecallPOSBlockerHandler';
import { registerDLCExpiryHandler } from './handlers/DLCExpiryHandler';
import { registerIotOfflineAlertHandler } from './handlers/IotOfflineAlertHandler';
import { registerKdsRoutingHandler } from './handlers/KdsRoutingHandler';
import { registerKdsCourseManagerHandler } from './handlers/KdsCourseManagerHandler';
import { registerKdsPrepTimeAnalyzerHandler } from './handlers/KdsPrepTimeAnalyzerHandler';
import { registerKdsPassNotifierHandler } from './handlers/KdsPassNotifierHandler';
import { registerKdsPrintFallbackHandler } from './handlers/KdsPrintFallbackHandler';
import { registerReservationNotifierHandler } from './handlers/ReservationNotifierHandler';
import { registerFloorPlanCapacityHandler } from './handlers/FloorPlanCapacityHandler';
import { registerNoShowPenaltyHandler } from './handlers/NoShowPenaltyHandler';
import { registerTableTurnoverAnalyzerHandler } from './handlers/TableTurnoverAnalyzerHandler';
import { registerLaborCostAnalyzerHandler } from './handlers/LaborCostAnalyzerHandler';
import { registerScheduleNotifierHandler } from './handlers/ScheduleNotifierHandler';
import { registerOvertimeAlertHandler } from './handlers/OvertimeAlertHandler';
import { registerPayrollComplianceHandler } from './handlers/PayrollComplianceHandler';
import { registerSupplierInvoiceLedgerHandler } from './handlers/SupplierInvoiceLedgerHandler';
import { registerSepaExportHandler } from './handlers/SepaExportHandler';
import { registerBankSyncAuditHandler } from './handlers/BankSyncAuditHandler';
import { registerReconciliationEngineHandler } from './handlers/ReconciliationEngineHandler';
import { registerCustomerRFMAnalyzerHandler } from './handlers/CustomerRFMAnalyzerHandler';
import { registerLoyaltyEngineHandler } from './handlers/LoyaltyEngineHandler';
import { registerMarketingCampaignRouterHandler } from './handlers/MarketingCampaignRouterHandler';
import { registerPrivacyConsentHandler } from './handlers/PrivacyConsentHandler';
import { registerAntiCorruptionLayerHandler } from './handlers/AntiCorruptionLayerHandler';
import { registerOrderAcceptanceWindowHandler } from './handlers/OrderAcceptanceWindowHandler';
import { registerAggregatorMenuSyncHandler } from './handlers/AggregatorMenuSyncHandler';
import { registerAggregatorStockSyncHandler } from './handlers/AggregatorStockSyncHandler';
import { registerDeliveryRushModeHandler } from './handlers/DeliveryRushModeHandler';
import { registerHaccpCheckArchiverHandler } from './handlers/HaccpCheckArchiverHandler';
import { registerNonConformActionHandler } from './handlers/NonConformActionHandler';
import { registerTrainingComplianceAlertHandler } from './handlers/TrainingComplianceAlertHandler';
import { registerComplianceDeadlineHandler } from './handlers/ComplianceDeadlineHandler';
import { AbsenceUnderstaffingHandler } from './handlers/AbsenceUnderstaffingHandler';
import { PayrollAutoCalcHandler } from './handlers/PayrollAutoCalcHandler';
import { PayrollExportHandler } from './handlers/PayrollExportHandler';
import { ContractRenewalAlertHandler } from './handlers/ContractRenewalAlertHandler';
import { MedicalVisitAlertHandler } from './handlers/MedicalVisitAlertHandler';
import { RecruitmentRouterHandler } from './handlers/RecruitmentRouterHandler';
import { PeriodLockGuardHandler } from './handlers/PeriodLockGuardHandler';
import { StripePaymentRetryHandler } from './handlers/StripePaymentRetryHandler';
import { OracleQueryAuditHandler } from './handlers/OracleQueryAuditHandler';
import { AutoIndexationHandler } from './handlers/AutoIndexationHandler';
import { WeeklyReportHandler } from './handlers/WeeklyReportHandler';
import { FleetStratBriefingHandler } from './handlers/FleetStratBriefingHandler';
import { BirthdayOfferHandler } from './handlers/BirthdayOfferHandler';
import { PromotionPriceHandler } from './handlers/PromotionPriceHandler';
import { PromotionExpiryHandler } from './handlers/PromotionExpiryHandler';
import { OnboardingProgressHandler } from './handlers/OnboardingProgressHandler';
import { GracePeriodHandler } from './handlers/GracePeriodHandler';
import { BankConnectionExpiredHandler } from './handlers/BankConnectionExpiredHandler';
import { PinLockoutNotifierHandler } from './handlers/PinLockoutNotifierHandler';
import { FleetOutboxHandler } from './handlers/FleetOutboxHandler';
import { CashflowForecastHandler } from './handlers/CashflowForecastHandler';
import { registerCertExpiryHandler } from './handlers/CertExpiryHandler';
import { registerComplianceCalendarHandler } from './handlers/ComplianceCalendarHandler';
import { registerRefundJournalHandler } from './handlers/RefundJournalHandler';
import { registerCompJournalHandler } from './handlers/CompJournalHandler';
import { registerResaReminderHandler } from './handlers/ResaReminderHandler';
import { registerResaKitchenTaskHandler } from './handlers/ResaKitchenTaskHandler';
import { registerNoShowCRMHandler } from './handlers/NoShowCRMHandler';
import { registerNoShowTableReleaseHandler } from './handlers/NoShowTableReleaseHandler';
import { registerTableAutoReleaseHandler } from './handlers/TableAutoReleaseHandler';
import { registerBigGroupAlertHandler } from './handlers/BigGroupAlertHandler';
import { registerReportRetryHandler } from './handlers/ReportRetryHandler';
import { registerLLMFallbackHandler } from './handlers/LLMFallbackHandler';
import { registerOvertimeJournalHandler } from './handlers/OvertimeJournalHandler';
import { registerInactiveCustomerHandler } from './handlers/InactiveCustomerHandler';
import { registerNegativeReviewHandler } from './handlers/NegativeReviewHandler';
import { registerQuoteFollowUpHandler } from './handlers/QuoteFollowUpHandler';
import { registerOverdueInvoiceHandler } from './handlers/OverdueInvoiceHandler';

let initialized = false;
const unsubs: Array<() => void> = [];

/**
 * Enregistre tous les handlers métier sur NexusEventBus.
 * Idempotent — safe à appeler plusieurs fois.
 * Appelé une seule fois dans NexusSyncService.init().
 */
export function registerNexusHandlers(): void {
  if (typeof window === 'undefined') {
    logger.warn(
      '[registerNexusHandlers] Appelé en contexte serveur (SSR/API route). ' +
      'Les handlers NexusEventBus ne recevront pas les événements émis par les API routes. ' +
      'Pour un traitement SSR, enregistrez les handlers directement dans la route API.'
    );
  }
  if (initialized) return;
  initialized = true;

  unsubs.push(
    registerStockDeductionHandler(),  // HIGH  — parallèle avec FinancialBridge
    registerStockAlertHandler(),      // HIGH  — persiste les alertes stock bas
    registerTicketZHandler(),          // BACKGROUND — Ticket Z temps réel
    registerIntelligenceHandler(),     // BACKGROUND — analyse IA
    registerSovereignBreachHandler(),  // CRITICAL — kill-switch sur brèche d'isolation
    registerWasteStockReconciliationHandler(), // HIGH — déduction stock suite à perte HACCP
    registerPayrollTimeclockHandler(), // HIGH — registre des pointages
    registerStockRestitutionHandler(), // HIGH — restitution des stocks
    registerStockReceptionHandler(),   // HIGH — réception des stocks (BL)
    registerQuarantineHandler(),       // CRITICAL — quarantaine HACCP
    registerFoodCostRecomputer(),      // HIGH — calcul de food cost dynamique (Inflation Shield)
    registerMarginWarningHandler(),    // HIGH — alertes de marge (Inflation Shield)
    registerCRMVipHandler(),           // BACKGROUND — fidélisation CRM (VIP)
    registerRainStaffingHandler(),     // HIGH — alerte urgence staffing (Météo/RH)
    registerCashDrawerAnomalyHandler(),// CRITICAL — sécurité anti-fraude tiroir
    registerWasteToFoodCostHandler(),  // BACKGROUND — conversion perte en alerte marge
    registerPaymentLedgerHandler(),    // BACKGROUND — CQRS PaymentLedger (Standard)
    registerSplitPaymentHandler(),     // BACKGROUND — CQRS PaymentLedger (Split)
    registerCompEntryHandler(),        // BACKGROUND — CQRS PaymentLedger (Comp)
    registerRefundExtourneHandler(),   // BACKGROUND — CQRS PaymentLedger (Refund)
    registerRefundJournalHandler(),    // HIGH — Extourne NF525 journal (P01-H)
    
    // --- V3 Stocks ---
    registerStockZeroBlockerHandler(), // BACKGROUND — bloque produits si stock=0
    registerPhysicalInventoryHandler(),// HIGH — validation d'inventaire
    registerStockTransferHandler(),    // HIGH — transfert inter-sites
    
    // --- V4 HACCP & IoT ---
    registerQuarantineActivatedHandler(), // CRITICAL — bloque produits en quarantaine
    registerRecallPOSBlockerHandler(),    // CRITICAL — bloque produits suite rappel
    registerDLCExpiryHandler(),           // HIGH — perte auto sur DLC
    registerIotOfflineAlertHandler(),     // CRITICAL — alerte IoT offline
    
    // --- V5 KDS Cuisine ---
    registerKdsRoutingHandler(),          // HIGH — Route les tickets vers les stations
    registerKdsCourseManagerHandler(),    // HIGH — Gère les réclames (courses)
    registerKdsPrepTimeAnalyzerHandler(), // BACKGROUND — Analyse les retards
    registerKdsPassNotifierHandler(),     // HIGH — Notifie les serveurs
    registerKdsPrintFallbackHandler(),    // CRITICAL — Imprimante de secours
    
    // --- V6 Réservations & Plan Salle ---
    registerReservationNotifierHandler(), // BACKGROUND — Notifie le client (SMS/Email)
    registerFloorPlanCapacityHandler(),   // HIGH — Jauge anti-surbooking
    registerNoShowPenaltyHandler(),       // HIGH — Pénalité et CRM (dépôt)
    registerTableTurnoverAnalyzerHandler(),// BACKGROUND — Analyse de rotation des tables
    registerCompJournalHandler(),          // HIGH — Écriture NF525 offerts (P01-G)
    registerResaReminderHandler(),         // BACKGROUND — Rappel J-1 client (P05-B)
    registerResaKitchenTaskHandler(),      // BACKGROUND — Tâches cuisine J-1 (P05-C)
    registerNoShowCRMHandler(),            // BACKGROUND — Dégradation score CRM (P05-E)
    registerNoShowTableReleaseHandler(),   // HIGH — Libération table no-show (P05-F)
    registerTableAutoReleaseHandler(),     // HIGH — Auto-libération fin de service (P05-I)
    registerBigGroupAlertHandler(),        // HIGH — Alerte grand groupe manager (P05-K)

    // --- V7 RH & Paie ---
    registerLaborCostAnalyzerHandler(),   // BACKGROUND — Calcule le Labor Cost temps réel
    registerScheduleNotifierHandler(),    // BACKGROUND — Notifie la brigade
    registerOvertimeAlertHandler(),       // HIGH — Alerte sur les dépassements légaux
    registerOvertimeJournalHandler(),     // HIGH — Journal heures sup + flag bulletin (P04-D)
    registerPayrollComplianceHandler(),   // HIGH — Verrouille les pointages

    // --- V8 Finance & Banking ---
    registerSupplierInvoiceLedgerHandler(), // HIGH — Dette fournisseur au Grand Livre
    registerSepaExportHandler(),            // BACKGROUND — Changement de statut sur décaissement
    registerBankSyncAuditHandler(),         // HIGH — Corrige le Blind Spot d'API
    registerReconciliationEngineHandler(),  // HIGH — Scelle le lettrage comptable NF525
    registerQuoteFollowUpHandler(),         // BACKGROUND — Relance devis J+7 (P07-H)
    registerOverdueInvoiceHandler(),        // HIGH — Escalade factures impayées (P07-I)

    // --- V9 CRM & Marketing ---
    registerCustomerRFMAnalyzerHandler(),   // BACKGROUND — RFM dynamique
    registerLoyaltyEngineHandler(),         // HIGH — Portefeuille points
    registerMarketingCampaignRouterHandler(),// BACKGROUND — Envoi de campagnes
    registerPrivacyConsentHandler(),        // HIGH — Droit à l'oubli RGPD
    registerInactiveCustomerHandler(),      // BACKGROUND — Réactivation client 90j (P06-E)
    registerNegativeReviewHandler(),        // BACKGROUND — Alerte avis négatif (P06-F)

    // --- V10 Connecteurs & ACL ---
    registerHaccpCheckArchiverHandler(),
    registerNonConformActionHandler(),
    registerTrainingComplianceAlertHandler(),
    registerComplianceDeadlineHandler(),
    registerCertExpiryHandler(),
    registerComplianceCalendarHandler(),

    // HR G3
    PayrollAutoCalcHandler.register(),
    AbsenceUnderstaffingHandler.register(),
    PayrollExportHandler.register(),   // provider-agnostique via PayrollConnectorFactory
    ContractRenewalAlertHandler.register(),
    MedicalVisitAlertHandler.register(),
    RecruitmentRouterHandler.register(),

    // Finance G4
    PeriodLockGuardHandler.register(),
    StripePaymentRetryHandler.register(),
    CashflowForecastHandler.register(),   // BACKGROUND — Prévision de trésorerie J+1

    // AI G5
    OracleQueryAuditHandler.register(),
    AutoIndexationHandler.register(),
    WeeklyReportHandler.register(),
    FleetStratBriefingHandler.register(),

    // CRM G6
    BirthdayOfferHandler.register(),
    PromotionPriceHandler.register(),
    PromotionExpiryHandler.register(),

    // MCC SaaS G7
    OnboardingProgressHandler.register(),
    GracePeriodHandler.register(),

    // Security G9
    PinLockoutNotifierHandler.register(),

    // Connectors G8
    BankConnectionExpiredHandler.register(),
    registerAntiCorruptionLayerHandler(),   // HIGH — Traducteur UberEats -> Interne
    registerOrderAcceptanceWindowHandler(), // HIGH — File d'attente POS pour validation manuelle
    registerAggregatorMenuSyncHandler(),    // BACKGROUND — Pousse le menu sur les plateformes
    registerAggregatorStockSyncHandler(),   // HIGH — Met à jour les ruptures (86) sur Uber/Deliveroo
    registerDeliveryRushModeHandler(),      // HIGH — Active le mode rush pour les agrégateurs
    FleetOutboxHandler.register(),

    // --- V11 Intelligence & Résilience ---
    registerReportRetryHandler(),   // BACKGROUND — Retry exponentiel envoi rapport (P08-E)
    registerLLMFallbackHandler(),   // BACKGROUND — Fallback modèle LLM sur timeout (P08-J)
  );
}

export function unregisterNexusHandlers(): void {
  unsubs.forEach(fn => fn());
  unsubs.length = 0;
  initialized = false;
}
