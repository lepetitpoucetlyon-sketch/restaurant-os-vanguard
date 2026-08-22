import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { FiscalHACCPMapper } from '@modules/finance';

/**
 * 🏛️ CriticalWasteFiscalHandler
 * Écoute 'compliance.critical_waste_detected' et orchestre la provision comptable
 * de perte fiscale suite à une anomalie sanitaire critique (ADR-015).
 */
export function registerCriticalWasteFiscalHandler(): () => void {
  return NexusEventBus.on(
    'compliance.critical_waste_detected',
    async (payload) => {
      try {
        logger.info(`🚨 [CriticalWasteFiscalHandler] Processing critical waste event for sensor ${payload.reading.sensorId || payload.reading.id}`);
        await FiscalHACCPMapper.processCriticalWaste(
          payload.reading,
          payload.impactedStock ?? [],
          payload.tenantId
        );
      } catch (err) {
        logger.error(`[CriticalWasteFiscalHandler] Error processing critical waste:`, toError(err).message);
      }
    },
    { id: 'critical-waste-fiscal-handler', priority: 'HIGH' }
  );
}
