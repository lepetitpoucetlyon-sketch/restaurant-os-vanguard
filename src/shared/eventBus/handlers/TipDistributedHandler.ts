import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

import { withRoleGuard } from '../middleware/withRoleGuard';

export function registerTipDistributedHandler(): () => void {
  return NexusEventBus.on(
    'hr.tip_distributed',
    withRoleGuard('manager', async (payload) => {
      const { tenantId, orderId, tipInMicrounits, staffIds } = payload;
      try {
        const shareInMicrounits = staffIds.length > 0
          ? Math.floor(tipInMicrounits / staffIds.length)
          : 0;

        await Promise.all(
          staffIds.map(staffId =>
            Nexus.adapter.set(
              `tenants/${tenantId}/payroll/tips/${orderId}_${staffId}`,
              {
                orderId,
                staffId,
                amountInMicrounits: shareInMicrounits,
                totalTipInMicrounits: tipInMicrounits,
                distributedAt: new Date().toISOString(),
              },
            ),
          ),
        );

        empireAudit.log({
          module: 'human',
          action: 'TIP_DISTRIBUTED',
          details: { orderId, tipInMicrounits, staffCount: staffIds.length },
          severity: 'low',
          timestamp: new Date(),
        });

        logger.info(`[TipDistributedHandler] ${tipInMicrounits}µ distribués entre ${staffIds.length} staff pour commande ${orderId}`);
      } catch (err) {
        logger.error(`[TipDistributedHandler] Échec distribution pourboire: ${toError(err).message}`);
      }
    }),
    { id: 'tip-distributed', priority: 'BACKGROUND' },
  );
}
