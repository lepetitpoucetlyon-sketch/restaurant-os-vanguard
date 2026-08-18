import type { IAggregatorAdapter } from './IAggregatorAdapter';
import { logger } from '@/lib/logger';

export class UberEatsAdapter implements IAggregatorAdapter {
    readonly platformId = 'ubereats';
    
    // Pour la démo, URL mockée. En prod, ce serait https://api.uber.com/v2/eats/
    private readonly API_BASE = process.env.UBEREATS_API_URL || 'https://mock.uber.com/v2/eats';

    async suspendItem(tenantId: string, externalItemId: string): Promise<boolean> {
        logger.info(`[UberEatsAdapter] Demande de suspension de l'article ${externalItemId} pour le tenant ${tenantId}`);
        try {
            // API MOCK: POST /v2/eats/stores/{storeId}/menus/items/{itemId}/suspend
            const url = `${this.API_BASE}/stores/${tenantId}/menus/items/${externalItemId}/suspend`;
            
            logger.info(`[UberEatsAdapter] POST ${url}`);
            // En réalité: 
            // const response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ...' }});
            // if (!response.ok) throw new Error('API Error');

            return true;
        } catch (error) {
            logger.error(`[UberEatsAdapter] Erreur lors de la suspension:`, error);
            return false;
        }
    }

    async resumeItem(tenantId: string, externalItemId: string): Promise<boolean> {
        logger.info(`[UberEatsAdapter] Remise en stock de l'article ${externalItemId} pour le tenant ${tenantId}`);
        try {
            const url = `${this.API_BASE}/stores/${tenantId}/menus/items/${externalItemId}/suspend`;
            logger.info(`[UberEatsAdapter] DELETE ${url}`);
            
            return true;
        } catch (error) {
            logger.error(`[UberEatsAdapter] Erreur lors de la remise en stock:`, error);
            return false;
        }
    }

    async pushMenu(tenantId: string, menuData: unknown): Promise<boolean> {
        logger.info(`[UberEatsAdapter] Push du catalogue vers UberEats pour le tenant ${tenantId}`);
        try {
            const url = `${this.API_BASE}/stores/${tenantId}/menus`;
            logger.info(`[UberEatsAdapter] PUT ${url} (Payload de ${JSON.stringify(menuData).length} bytes)`);
            return true;
        } catch (error) {
            logger.error(`[UberEatsAdapter] Erreur lors du push menu:`, error);
            return false;
        }
    }

    async suspendStore(tenantId: string): Promise<boolean> {
        logger.info(`[UberEatsAdapter] Activation du MODE RUSH (Store PAUSED) pour le tenant ${tenantId}`);
        try {
            const url = `${this.API_BASE}/stores/${tenantId}/status`;
            logger.info(`[UberEatsAdapter] POST ${url} { "status": "PAUSED" }`);
            return true;
        } catch (error) {
            logger.error(`[UberEatsAdapter] Erreur lors de la suspension du restaurant:`, error);
            return false;
        }
    }

    async resumeStore(tenantId: string): Promise<boolean> {
        logger.info(`[UberEatsAdapter] Désactivation du MODE RUSH (Store ONLINE) pour le tenant ${tenantId}`);
        try {
            const url = `${this.API_BASE}/stores/${tenantId}/status`;
            logger.info(`[UberEatsAdapter] POST ${url} { "status": "ONLINE" }`);
            return true;
        } catch (error) {
            logger.error(`[UberEatsAdapter] Erreur lors de la réactivation du restaurant:`, error);
            return false;
        }
    }
}
