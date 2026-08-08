import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * HaccpCorrectiveActionHandler (P0-1.12)
 * Écoute `haccp.nonconform`.
 * Enregistre l'action corrective obligatoire dans le registre sanitaire HACCP et alerte le chef cuisinier et manager.
 */
export function registerHaccpCorrectiveActionHandler(): () => void {
  return NexusEventBus.on(
    'haccp.nonconform',
    async (payload) => {
      const { tenantId, checkId, correctionDeadline } = payload;
      const deadlineIso = new Date(correctionDeadline).toISOString();
      const actionId = Nexus.adapter.generateId(`tenants/${tenantId}/haccpCorrectiveActions`);

      try {
        logger.warn(`[HaccpCorrectiveActionHandler] Non-conformité HACCP détectée (Check: ${checkId}). Deadline correction: ${deadlineIso}`);

        // 1. Persister l'action corrective légale
        await Nexus.adapter.set(`tenants/${tenantId}/haccpCorrectiveActions/${actionId}`, {
          id: actionId,
          checkId,
          correctionDeadline: deadlineIso,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });

        // 2. Alerte urgente pour le responsable hygiène / chef cuisinier / manager
        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Non-conformité sanitaire HACCP (Check ${checkId}). Action corrective requise avant ${deadlineIso}.`,
          roles: ['chef_cuisinier', 'manager'],
          priority: 'CRITICAL',
          metadata: { checkId, actionId, correctionDeadline },
        });

        // 3. Audit Empire (Sévérité Haute)
        empireAudit.log({
          module: 'compliance',
          action: 'HACCP_NONCONFORM_FLAGGED',
          details: { checkId, actionId, correctionDeadline: deadlineIso },
          severity: 'high',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[HaccpCorrectiveActionHandler] Erreur création action corrective HACCP ${checkId}`, toError(err).message);
      }
    },
    { id: 'haccp-corrective-action-handler', priority: 'CRITICAL' }
  );
}
