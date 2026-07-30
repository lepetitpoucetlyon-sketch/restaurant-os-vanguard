import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { CoreAuditLogger } from '@/shared/nexus/guards/audit/CoreAuditLogger';

/**
 * 🤝 C5.3: Table Handoff Service
 * Permet de transférer la propriété d'une commande (table) entre deux serveurs.
 */
export class TableHandoffService {
    
    /**
     * Transfère une addition d'un serveur à un autre.
     */
    static async transferOwnership(
        tenantId: string, 
        orderId: string, 
        fromOperatorId: string, 
        toOperatorId: string,
        approvingManagerId?: string
    ): Promise<void> {
        logger.info(`[Handoff] Demande de transfert order ${orderId} de ${fromOperatorId} à ${toOperatorId}`);

        // 1. Récupérer la commande
        const order = await Nexus.adapter.get<any>(`tenants/${tenantId}/orders/${orderId}`);
        
        if (!order) {
            throw new Error(`Commande ${orderId} introuvable.`);
        }

        if (order.operatorId !== fromOperatorId && !approvingManagerId) {
            throw new Error(`Seul le propriétaire actuel (${order.operatorId}) ou un manager peut transférer cette table.`);
        }

        // 2. Transférer
        const previousOwner = order.operatorId;
        order.operatorId = toOperatorId;
        
        // On sauvegarde
        await Nexus.adapter.set(`tenants/${tenantId}/orders/${orderId}`, order);

        // 3. Log Audit Inaltérable (Souveraineté)
        await CoreAuditLogger.log(
            tenantId,
            'TABLE_HANDOFF',
            approvingManagerId || fromOperatorId,
            {
                orderId,
                from: previousOwner,
                to: toOperatorId,
                timestamp: Date.now()
            },
            'low'
        );

        logger.info(`[Handoff] Table transférée avec succès à ${toOperatorId}.`);
    }
}
