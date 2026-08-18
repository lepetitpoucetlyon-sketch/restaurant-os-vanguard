import type { IAggregatorAdapter } from './IAggregatorAdapter';
import { logger } from '@/lib/logger';

export class DeliverooAdapter implements IAggregatorAdapter {
    readonly platformId = 'deliveroo';
    
    // URL mockée
    private readonly API_BASE = process.env.DELIVEROO_API_URL || 'https://mock.deliveroo.com/api/v1';

    async suspendItem(tenantId: string, externalItemId: string): Promise<boolean> {
        logger.info(`[DeliverooAdapter] Désactivation de l'article ${externalItemId} (Tenant: ${tenantId})`);
        try {
            // API MOCK: POST /restaurants/{restaurantId}/items/{itemId}/availability
            const url = `${this.API_BASE}/restaurants/${tenantId}/items/${externalItemId}/availability`;
            
            logger.info(`[DeliverooAdapter] POST ${url} { available: false }`);
            
            return true;
        } catch (error) {
            logger.error(`[DeliverooAdapter] Erreur lors de la suspension:`, error);
            return false;
        }
    }

    async resumeItem(tenantId: string, externalItemId: string): Promise<boolean> {
        logger.info(`[DeliverooAdapter] Réactivation de l'article ${externalItemId} (Tenant: ${tenantId})`);
        try {
            const url = `${this.API_BASE}/restaurants/${tenantId}/items/${externalItemId}/availability`;
            logger.info(`[DeliverooAdapter] POST ${url} { available: true }`);
            
            return true;
        } catch (error) {
            logger.error(`[DeliverooAdapter] Erreur lors de la réactivation:`, error);
            return false;
        }
    }

    async pushMenu(tenantId: string, menuData: unknown): Promise<boolean> {
        logger.info(`[DeliverooAdapter] Push du menu complet vers Deliveroo (Tenant: ${tenantId})`);
        try {
            const url = `${this.API_BASE}/restaurants/${tenantId}/menu`;
            logger.info(`[DeliverooAdapter] POST ${url} (Payload de ${JSON.stringify(menuData).length} bytes)`);
            return true;
        } catch (error) {
            logger.error(`[DeliverooAdapter] Erreur lors du push menu:`, error);
            return false;
        }
    }

    async suspendStore(tenantId: string): Promise<boolean> {
        logger.info(`[DeliverooAdapter] Activation du MODE RUSH (Store OFFLINE) pour le tenant ${tenantId}`);
        try {
            const url = `${this.API_BASE}/restaurants/${tenantId}/status`;
            logger.info(`[DeliverooAdapter] POST ${url} { "status": "OFFLINE" }`);
            return true;
        } catch (error) {
            logger.error(`[DeliverooAdapter] Erreur lors de la suspension du restaurant:`, error);
            return false;
        }
    }

    async resumeStore(tenantId: string): Promise<boolean> {
        logger.info(`[DeliverooAdapter] Désactivation du MODE RUSH (Store ONLINE) pour le tenant ${tenantId}`);
        try {
            const url = `${this.API_BASE}/restaurants/${tenantId}/status`;
            logger.info(`[DeliverooAdapter] POST ${url} { "status": "ONLINE" }`);
            return true;
        } catch (error) {
            logger.error(`[DeliverooAdapter] Erreur lors de la réactivation du restaurant:`, error);
            return false;
        }
    }
}
