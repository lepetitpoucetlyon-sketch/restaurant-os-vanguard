import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * 🚀 C5.4: Fleet Rollout Service
 * Permet au Super Admin de pousser une configuration sur N restaurants.
 */
export class FleetRolloutService {
    
    /**
     * Pousse un nouveau menu sur plusieurs tenants.
     */
    static async rolloutMenu(
        superAdminId: string, 
        targetTenantIds: string[], 
        menuConfig: Record<string, unknown>
    ): Promise<{ successful: string[]; failed: string[] }> {
        logger.info(`[Rollout] Déploiement du menu sur ${targetTenantIds.length} tenants par ${superAdminId}`);
        
        const successful: string[] = [];
        const failed: string[] = [];

        for (const tenantId of targetTenantIds) {
            try {
                // 1. Sauvegarde du menu dans la DB du tenant
                await Nexus.adapter.set(`tenants/${tenantId}/config/menu`, {
                    ...menuConfig,
                    updatedAt: Date.now(),
                    rolledOutBy: superAdminId
                });

                // 2. Trace inaltérable pour le tenant
                empireAudit.log({
                    module: 'fleet',
                    action: 'FLEET_ROLLOUT_RECEIVED',
                    details: { tenantId, type: 'menu', rolledOutBy: superAdminId, timestamp: Date.now() },
                    severity: 'high',
                    timestamp: new Date(),
                });

                successful.push(tenantId);
            } catch (e) {
                logger.error(`[Rollout] Échec pour le tenant ${tenantId}`, e);
                failed.push(tenantId);
            }
        }

        logger.info(`[Rollout] Terminé. Succès: ${successful.length}, Échecs: ${failed.length}`);
        return { successful, failed };
    }
}
