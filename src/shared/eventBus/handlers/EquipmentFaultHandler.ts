import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * 🛠️ EquipmentFaultHandler — Gestionnaire d'incidents matériels, alertes et résilience DLQ
 */
export class EquipmentFaultHandler {
  static register() {
    const unsubs: Array<() => void> = [];

    // 1. Écoute des pannes d'équipement
    const unsubBreakdown = NexusEventBus.on(
      'facility.equipment_breakdown',
      async (payload) => {
        const { tenantId, equipmentId, equipmentName, severity, errorCode, reason, declaredBy, declaredAt } = payload;
        logger.warn(`[EquipmentFaultHandler] Panne déclarée sur ${equipmentName} (${equipmentId}) : ${reason}`);

        try {
          const priority = severity === 'critical' ? 'high' : 'medium';
          const errorBadge = errorCode ? ` [Code: ${errorCode}]` : '';

          // Émission d'une notification d'incident
          await NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-fault-${equipmentId}-${Date.now()}`,
            type: severity === 'critical' ? 'error' : 'warning',
            title: `🚨 Incident Matériel : ${equipmentName}${errorBadge}`,
            message: `Panne signalée par ${declaredBy} : ${reason}. Action ou révision requise.`,
            priority,
            read: false,
            timestamp: declaredAt,
          });

          // Routage dynamique selon les règles et zones de l'établissement
          try {
            const { MaintenanceAlertConfigService } = await import('@/modules/facility/services/MaintenanceAlertConfigService');
            await MaintenanceAlertConfigService.dispatchAlert({
              tenantId,
              alertType: 'EQUIPMENT_BREAKDOWN',
              severity,
              zone: 'ALL',
              equipmentId,
              equipmentName,
              message: `Panne signalée par ${declaredBy} : ${reason}`,
            });
          } catch (routeErr) {
            logger.warn('[EquipmentFaultHandler] Dynamic alert dispatch fallback', toError(routeErr).message);
          }

          // Journalisation d'audit
          empireAudit.log({
            module: 'facility',
            action: 'EQUIPMENT_FAULT_PROCESSED',
            instanceId: tenantId,
            details: { equipmentId, equipmentName, severity, errorCode, reason, declaredBy },
            severity: severity === 'critical' ? 'high' : 'medium',
            timestamp: new Date(declaredAt),
          });
        } catch (err) {
          logger.error('[EquipmentFaultHandler] Échec du traitement de la panne, transmission DLQ', toError(err).message);
          
          // Basculement vers la Dead Letter Queue (DLQ)
          await Nexus.adapter.set(`tenants/${tenantId}/dlq/equipmentFaults/${equipmentId}_${Date.now()}`, {
            payload,
            error: toError(err).message,
            failedAt: Date.now(),
          });
        }
      },
      { id: 'equipment-fault-handler', priority: 'HIGH' }
    );

    // 2. Écoute des réparations terminées
    const unsubRepaired = NexusEventBus.on(
      'facility.equipment_repaired',
      async (payload) => {
        const { tenantId, equipmentId, technicianName, costInMicrounits, resolvedAt } = payload;
        logger.info(`[EquipmentFaultHandler] Équipement ${equipmentId} réparé par ${technicianName}`);

        try {
          await NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-repaired-${equipmentId}-${Date.now()}`,
            type: 'info',
            title: `✅ Équipement Réparé & Opérationnel`,
            message: `Intervention clôturée par ${technicianName}. Matériel rétabli en service.`,
            priority: 'low',
            read: false,
            timestamp: resolvedAt,
          });
        } catch (err) {
          logger.error('[EquipmentFaultHandler] Erreur notification réparation', toError(err).message);
        }
      },
      { id: 'equipment-repaired-handler', priority: 'BACKGROUND' }
    );

    unsubs.push(unsubBreakdown, unsubRepaired);
    return () => unsubs.forEach((u) => u());
  }
}
