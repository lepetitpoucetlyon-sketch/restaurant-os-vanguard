import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from '@/lib/toError';

export function registerHardwareFaultHandler(): () => void {
  const unsubFault = NexusEventBus.on(
    'facility.hardware_fault',
    async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, deviceType, deviceId, faultCode, severity, message, timestamp } = payload;
      logger.warn(`[HardwareFaultHandler] Panne ${deviceType} (${deviceId}) — code ${faultCode} — sévérité ${severity}`);

      try {
        await NexusEventBus.emitDurable('notification.created', {
          v: 1,
          tenantId,
          id: `hf-${deviceId}-${Date.now()}`,
          type: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
          title: `Panne matérielle : ${deviceType} (${faultCode})`,
          message,
          priority: severity === 'critical' ? 'high' : 'medium',
          read: false,
          timestamp,
        });

        const ticketId = `hwfault_${deviceId}_${Date.now()}`;
        await Nexus.adapter.set(`tenants/${tenantId}/maintenanceTickets/${ticketId}`, {
          deviceType,
          deviceId,
          faultCode,
          severity,
          description: message,
          status: 'open',
          createdAt: timestamp,
        });

        empireAudit.log({
          module: 'facility',
          action: 'HARDWARE_FAULT_LOGGED',
          instanceId: tenantId,
          details: { deviceId, deviceType, faultCode, severity },
          severity: severity === 'critical' ? 'high' : 'medium',
          timestamp: new Date(timestamp),
        });
      } catch (err) {
        logger.error('[HardwareFaultHandler] Erreur traitement panne', toError(err).message);
        await Nexus.adapter.set(`tenants/${tenantId}/dlq/hardwareFaults/${deviceId}_${Date.now()}`, {
          payload,
          error: toError(err).message,
          failedAt: Date.now(),
        });
      }
    },
    { id: 'hardware-fault-handler', priority: 'HIGH' }
  );

  const unsubRestored = NexusEventBus.on(
    'facility.hardware_restored',
    async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, deviceType, deviceId, timestamp } = payload;
      logger.info(`[HardwareFaultHandler] Équipement ${deviceType} (${deviceId}) rétabli`);

      try {
        await NexusEventBus.emitDurable('notification.created', {
          v: 1,
          tenantId,
          id: `hr-${deviceId}-${Date.now()}`,
          type: 'info',
          title: `Matériel rétabli : ${deviceType}`,
          message: `L'équipement ${deviceId} est de nouveau opérationnel.`,
          priority: 'low',
          read: false,
          timestamp,
        });

        empireAudit.log({
          module: 'facility',
          action: 'HARDWARE_RESTORED',
          instanceId: tenantId,
          details: { deviceId, deviceType },
          severity: 'low',
          timestamp: new Date(timestamp),
        });
      } catch (err) {
        logger.error('[HardwareFaultHandler] Erreur notification restauration', toError(err).message);
      }
    },
    { id: 'hardware-restored-handler', priority: 'BACKGROUND' }
  );

  return () => {
    unsubFault();
    unsubRestored();
  };
}
