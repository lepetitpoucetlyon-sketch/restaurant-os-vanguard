import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { IAggregatorAdapter } from '../adapters/IAggregatorAdapter';
import { UberEatsAdapter } from '../adapters/UberEatsAdapter';
import { DeliverooAdapter } from '../adapters/DeliverooAdapter';

export interface IntegrationMapping {
    id: string; // The internal ingredient or recipe ID
    externalId: string; // The ID on UberEats/Deliveroo
}

export interface TenantIntegration {
    id: string; // e.g. 'ubereats' or 'deliveroo'
    platform: 'ubereats' | 'deliveroo';
    isActive: boolean;
    storeId: string;
    mappings: IntegrationMapping[];
}

export class AggregatorMappingService {
    private static readonly adapters: Record<string, IAggregatorAdapter> = {
        'ubereats': new UberEatsAdapter(),
        'deliveroo': new DeliverooAdapter()
    };

    /**
     * Retourne tous les adaptateurs actifs pour un restaurant donné
     * avec leurs mappings associés.
     */
    static async getActiveAdapters(tenantId: string): Promise<Array<{ adapter: IAggregatorAdapter, mappings: IntegrationMapping[] }>> {
        try {
            const integrations = await Nexus.adapter.query<TenantIntegration>(
                `tenants/${tenantId}/integrations`,
                { where: [{ field: 'isActive', operator: '==', value: true }] }
            );

            return integrations
                .map(int => {
                    const adapter = this.adapters[int.platform];
                    if (!adapter) {
                        logger.warn(`[AggregatorMappingService] Adaptateur inconnu: ${int.platform}`);
                        return null;
                    }
                    return { adapter, mappings: int.mappings || [] };
                })
                .filter(Boolean) as Array<{ adapter: IAggregatorAdapter, mappings: IntegrationMapping[] }>;
        } catch (error) {
            logger.error(`[AggregatorMappingService] Erreur lors de la lecture des intégrations du tenant ${tenantId}`, error);
            return [];
        }
    }

    /**
     * Trouve l'ID externe pour un ID interne donné dans une liste de mappings
     */
    static resolveExternalId(internalId: string, mappings: IntegrationMapping[]): string | null {
        const match = mappings.find(m => m.id === internalId);
        return match ? match.externalId : null;
    }
}
