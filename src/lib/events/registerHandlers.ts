import { logger } from '@/lib/logger';
import { registerStockDeductionHandler } from './handlers/StockDeductionHandler';
import { registerStockAlertHandler } from './handlers/StockAlertHandler';
import { registerTicketZHandler } from './handlers/TicketZHandler';
import { registerIntelligenceHandler } from './handlers/IntelligenceHandler';
import { registerSovereignBreachHandler } from './handlers/SovereignBreachHandler';

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
  );
}

export function unregisterNexusHandlers(): void {
  unsubs.forEach(fn => fn());
  unsubs.length = 0;
  initialized = false;
}
