import { registerStockDeductionHandler } from './handlers/StockDeductionHandler';
import { registerTicketZHandler } from './handlers/TicketZHandler';
import { registerIntelligenceHandler } from './handlers/IntelligenceHandler';

let initialized = false;
const unsubs: Array<() => void> = [];

/**
 * Enregistre tous les handlers métier sur NexusEventBus.
 * Idempotent — safe à appeler plusieurs fois.
 * Appelé une seule fois dans NexusSyncService.init().
 */
export function registerNexusHandlers(): void {
  if (initialized) return;
  initialized = true;

  unsubs.push(
    registerStockDeductionHandler(),  // HIGH  — parallèle avec FinancialBridge
    registerTicketZHandler(),          // BACKGROUND — Ticket Z temps réel
    registerIntelligenceHandler(),     // BACKGROUND — analyse IA
  );
}

export function unregisterNexusHandlers(): void {
  unsubs.forEach(fn => fn());
  unsubs.length = 0;
  initialized = false;
}
