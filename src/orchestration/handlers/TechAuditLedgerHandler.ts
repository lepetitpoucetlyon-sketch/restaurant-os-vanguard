import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { CryptoService } from '@/lib/CryptoService';

export function registerTechAuditLedgerHandler() {
  return NexusEventBus.on(
    'system.audit_log',
    async (payload) => {
      const { tenantId, action, userId, details, severity } = payload;
      
      const auditId = SharedKernel.generateId('AUDIT');
      const timestamp = new Date().toISOString();
      
      // Signature cryptographique pour garantir l'inaltérabilité des logs système
      const hash = await CryptoService.generateHash(`${auditId}${action}${userId}${timestamp}`);
      
      await Nexus.adapter.set(`tenants/${tenantId}/auditLogs/${auditId}`, {
        id: auditId,
        action,
        userId,
        details,
        severity,
        timestamp,
        hash,
      });
    },
    { id: 'tech-audit-ledger-handler', priority: 'BACKGROUND' }
  );
}
