import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export class ContractRenewalAlertHandler {
  static register() { 
    return NexusEventBus.on('hr.contract_expiring', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, contractId, daysRemaining, userId } = payload;
      logger.info(`[ContractRenewalAlertHandler] Contrat ${contractId} expire dans ${daysRemaining} jours.`);

      try {
        const contractRef = await Nexus.adapter.query<{ id: string; type: string; status: string }>(`tenants/${tenantId}/hr/contracts`, {
            where: [{ field: 'id', operator: '==', value: contractId }]
        });
        
        const contract = contractRef[0];
        if (contract && contract.status === 'active') {
            await Nexus.adapter.update(`tenants/${tenantId}/hr/contracts/${contractId}`, {
                renewalAlertTriggered: true,
                updatedAt: Date.now()
            });

            empireAudit.log({
                action: 'hr.contract_renewal_alert',
                module: 'human',
                userId: 'system',
                instanceId: tenantId,
                details: {
                contractId: contractId,
                daysRemaining: daysRemaining,
                contractType: contract.type
                },
                severity: 'medium',
                timestamp: new Date(),
            });

            NexusEventBus.emitDurable('notification.created', {
                v: 1,
                tenantId: tenantId,
                id: `alert-contract-${contractId}`,
                type: 'alert',
                title: 'Renouvellement de Contrat',
                message: `Le contrat de l'employé expire dans ${daysRemaining} jours. Veuillez préparer le renouvellement ou le solde de tout compte.`,
                priority: daysRemaining <= 7 ? 'high' : 'medium',
                read: false,
                timestamp: new Date().toISOString()
            });
        }
      } catch (err) {
        logger.error('[ContractRenewalAlertHandler] Error fetching contract', toError(err).message);
        throw err;
      }
    }, { id: 'contract-renewal-alert', priority: 'BACKGROUND' });
  }
}
