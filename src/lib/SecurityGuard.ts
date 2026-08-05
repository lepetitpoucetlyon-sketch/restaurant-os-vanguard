import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * SecurityGuard — Vérifications de souveraineté B2B.
 * Garantit qu'un owner ne peut pas agir sur un tenant qui ne lui appartient pas.
 */
export const SecurityGuard = {
    /**
     * Vérifie que `ownerId` est bien le propriétaire de `tenantId`.
     * Lit `tenants/{tenantId}/tenantConfig.metadata.ownerId` en Firestore.
     * Retourne false (et log) si le tenant n'existe pas ou si l'owner ne correspond pas.
     */
    async verifyTenantOwnership(ownerId: string, tenantId: string): Promise<boolean> {
        if (!ownerId || !tenantId) {
            logger.error(`[SecurityGuard] verifyTenantOwnership appelé avec des paramètres vides — rejet`);
            return false;
        }

        try {
            const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as
                | { metadata?: { ownerId?: string } } | null;

            if (!config) {
                logger.error(`[SecurityGuard] Tenant ${tenantId} introuvable — accès refusé`);
                return false;
            }

            const storedOwner = config.metadata?.ownerId;
            if (storedOwner !== ownerId) {
                logger.error(
                    `🚨 [SecurityGuard] BREACH: Owner "${ownerId}" a tenté d'accéder au tenant "${tenantId}" ` +
                    `(propriétaire réel: "${storedOwner}")`
                );
                return false;
            }

            return true;
        } catch (err) {
            logger.error(`[SecurityGuard] Erreur lors de la vérification d'ownership — rejet par défaut`, err);
            return false;
        }
    },
};
