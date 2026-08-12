import { logger } from '@/lib/logger';
import { NexusEventBus } from '../NexusEventBus';

export class TenantMismatchError extends Error {
  constructor(
    public readonly handlerId: string,
    public readonly payloadTenantId: string,
    public readonly pathTenantId: string,
  ) {
    super(`[SovereignGuard:Handler] CROSS-TENANT BLOCKED — handler=${handlerId} payload.tenantId=${payloadTenantId} vs path tenant=${pathTenantId}`);
    this.name = 'TenantMismatchError';
  }
}

export function assertHandlerTenant(
  handlerId: string,
  payloadTenantId: string,
  writePath: string,
): void {
  const match = writePath.match(/^tenants\/([^/]+)\//);
  if (!match) return;
  const pathTenantId = match[1];

  if (pathTenantId !== payloadTenantId) {
    const err = new TenantMismatchError(handlerId, payloadTenantId, pathTenantId);
    logger.error(err.message);

    NexusEventBus.emit('sovereign.breach', {
      v: 1,
      targetTenantId: pathTenantId,
      anchoredTenantId: payloadTenantId,
      path: writePath,
      message: `Handler ${handlerId}: payload.tenantId=${payloadTenantId} vs path tenant=${pathTenantId}`,
    }).catch(() => {});

    throw err;
  }
}
