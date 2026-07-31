import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';

export class ContractRenewalAlertHandler {
  static register() { return NexusEventBus.on('hr.contract_expiring', async (payload) => {
      console.log(`[ContractRenewalAlertHandler] Contrat ${payload.contractId} expire dans ${payload.daysRemaining} jours.`);

      empireAudit.log({
        action: 'hr.contract_renewal_alert',
        module: 'human',
        userId: 'system',
        instanceId: payload.tenantId,
        details: {
          contractId: payload.contractId,
          daysRemaining: payload.daysRemaining,
        },
        severity: 'medium',
        timestamp: new Date(),
});

      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId: payload.tenantId,
        id: `alert-contract-${payload.contractId}`,
        type: 'alert',
        title: 'Renouvellement de Contrat',
        message: `Le contrat de l'employé expire dans ${payload.daysRemaining} jours. Veuillez préparer le renouvellement ou le solde de tout compte.`,
        priority: payload.daysRemaining <= 7 ? 'high' : 'medium',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
