import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerNonConformActionHandler(): () => void {
  return NexusEventBus.on(
    'haccp.nonconform',
    async (payload) => {
      const { tenantId, checkId, correctionDeadline } = payload;
      logger.warn(`[NonConformAction] Non-conformité HACCP (Check: ${checkId})`);

      const actionId = SharedKernel.generateId('CORRECTIVE_ACTION');
      await Nexus.adapter.set(`tenants/${tenantId}/correctiveActions/${actionId}`, {
        id: actionId,
        checkId,
        status: 'pending',
        deadline: correctionDeadline,
        createdAt: new Date().toISOString(),
      });

      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId,
        message: `Non-conformité HACCP détectée (relevé ${checkId}). Action corrective requise avant le ${correctionDeadline}.`,
        roles: ['proprietaire', 'manager'],
        priority: 'CRITICAL',
      });

      empireAudit.log({
        module: 'compliance',
        action: 'NONCONFORMITY_ACTION_CREATED',
        details: { checkId, actionId, correctionDeadline },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'nonconform-action-handler', priority: 'HIGH' }
  );
}
