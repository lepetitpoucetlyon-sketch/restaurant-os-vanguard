import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';
import { toError } from "@/lib/toError";
import { z } from 'zod';

const PayloadSchema = z.object({
  tenantId: z.string(),
  checkId: z.string(),
  correctionDeadline: z.union([z.string(), z.number(), z.date()])
});

/**
 * HaccpCorrectiveActionHandler (P0-1.12)
 * Écoute `haccp.nonconform`.
 * Enregistre l'action corrective obligatoire dans le registre sanitaire HACCP et alerte le chef cuisinier et manager.
 */
export function registerHaccpCorrectiveActionHandler(): () => void {
  return NexusEventBus.onValidated(
    'haccp.nonconform',
    PayloadSchema,
    async (payload) => {
      const { tenantId, checkId, correctionDeadline } = payload;
      const deadlineIso = new Date(correctionDeadline).toISOString();
      const actionId = Nexus.adapter.generateId(`tenants/${tenantId}/haccpCorrectiveActions`);
      const writePath = `tenants/${tenantId}/haccpCorrectiveActions/${actionId}`;
      assertHandlerTenant('haccp-corrective-action', tenantId, writePath);

      try {
        logger.warn(`[HaccpCorrectiveActionHandler] Non-conformité HACCP détectée (Check: ${checkId}). Deadline correction: ${deadlineIso}`);

        await Nexus.adapter.set(writePath, {
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
        throw err; // HACCP légal — action corrective obligatoire → DLQ pour retry
      }
    },
    { id: 'haccp-corrective-action', priority: 'CRITICAL' }
  );
}
