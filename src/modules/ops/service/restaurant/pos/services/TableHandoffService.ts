import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

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
        const order = await Nexus.adapter.get<Record<string, unknown>>(`tenants/${tenantId}/ops_flows/${orderId}`);
        
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
        await Nexus.adapter.set(`tenants/${tenantId}/ops_flows/${orderId}`, order);

        // 3. Log Audit Inaltérable (Souveraineté)
        empireAudit.log({
            module: 'ops',
            action: 'TABLE_HANDOFF',
            details: { tenantId, orderId, from: previousOwner, to: toOperatorId, approver: approvingManagerId } as Record<string, string>,
            severity: 'low',
            timestamp: new Date(),
        });

        logger.info(`[Handoff] Table transférée avec succès à ${toOperatorId}.`);
    }
}
