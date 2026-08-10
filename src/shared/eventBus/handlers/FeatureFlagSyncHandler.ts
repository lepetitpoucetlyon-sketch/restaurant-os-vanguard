import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerFeatureFlagSyncHandler(): () => void {
  return NexusEventBus.on(
    'mcc.feature_flag_toggled',
    async (payload) => {
      const { flagKey, enabled, tenantIds } = payload;
      logger.info(`[FeatureFlagSyncHandler] Synchro flag ${flagKey} (${enabled}) sur ${tenantIds.length} tenants`);

      await Promise.all(
        tenantIds.map(async (tenantId) => {
          await Nexus.adapter.update(`tenants/${tenantId}/featureFlags/${flagKey}`, {
            flagKey,
            enabled,
            syncedAt: new Date().toISOString(),
          });
        })
      );

      empireAudit.log({
        module: 'system',
        action: 'FEATURE_FLAGS_SYNCED',
        details: { flagKey, enabled, tenantCount: tenantIds.length },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'feature-flag-sync-handler', priority: 'HIGH' }
  );
}
