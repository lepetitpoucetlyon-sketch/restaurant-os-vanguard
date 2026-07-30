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
  );
}

export function unregisterNexusHandlers(): void {
  unsubs.forEach(fn => fn());
  unsubs.length = 0;
  initialized = false;
}
