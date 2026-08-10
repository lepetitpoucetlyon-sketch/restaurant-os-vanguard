import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerCertExpiryHandler(): () => void {
  return NexusEventBus.on(
    'cert.expired',
    async (payload) => {
      if (payload.isSimulation) return;

      logger.error(
        `[CertExpiry] ${payload.certType} "${payload.entityName}" expired on ${payload.expiredAt} for tenant ${payload.tenantId}`
      );

      empireAudit.log({
        module: 'compliance',
        action: 'cert_expired',
        details: {
          certId: payload.certId,
          certType: payload.certType,
          entityName: payload.entityName,
          expiredAt: payload.expiredAt,
        },
        severity: 'critical',
        timestamp: new Date(),
      });

      await Nexus.adapter.update(
        `tenants/${payload.tenantId}/notifications/${payload.certId}_expired`,
        {
          type: 'cert_expired',
          title: `Certification expirée : ${payload.entityName}`,
          body: `La certification "${payload.certType}" de "${payload.entityName}" a expiré le ${payload.expiredAt}. Renouvellement urgent requis.`,
          severity: 'critical',
          read: false,
          createdAt: Date.now(),
        }
      );
    },
    { id: 'cert-expiry-handler', priority: 'HIGH' }
  );
}
