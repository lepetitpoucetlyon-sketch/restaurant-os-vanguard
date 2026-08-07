import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface StaffMember {
  id?: string;
  name?: string;
  role?: string;
}

interface ApplicationRecord {
  id?: string;
  status?: string;
  assignedTo?: string;
}

export class RecruitmentRouterHandler {
  static register() {
    return NexusEventBus.on('hr.application_received', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, applicationId, role, applicantName } = payload;
      logger.info(`[RecruitmentRouterHandler] Nouvelle candidature reçue pour le poste de ${role}`);

      try {
        // Sauvegarder la candidature
        await Nexus.adapter.update(`tenants/${tenantId}/hr/recruitment/applications/${applicationId}`, {
            role,
            applicantName,
            status: 'new',
            receivedAt: Date.now(),
            updatedAt: Date.now(),
        });

        // --- Assignation automatique au recruteur le moins chargé ---
        let assignedRecruiterName = '';

        // Requête des managers et directeurs du tenant
        const managers = await Nexus.adapter.query<StaffMember>(
          `tenants/${tenantId}/hr/staff`,
          {
            where: [{ field: 'role', operator: 'in', value: ['manager', 'directeur'] }],
          }
        );

        if (managers.length > 0) {
          // Compter les candidatures ouvertes par recruteur (round-robin par charge)
          const openApplications = await Nexus.adapter.query<ApplicationRecord>(
            `tenants/${tenantId}/hr/recruitment/applications`,
            {
              where: [{ field: 'status', operator: '==', value: 'new' }],
            }
          );

          // Comptage des applications par assignedTo
          const countByRecruiter = new Map<string, number>();
          for (const mgr of managers) {
            const mgrId = mgr.id ?? '';
            if (mgrId) countByRecruiter.set(mgrId, 0);
          }
          for (const app of openApplications) {
            if (app.assignedTo && countByRecruiter.has(app.assignedTo)) {
              countByRecruiter.set(
                app.assignedTo,
                (countByRecruiter.get(app.assignedTo) ?? 0) + 1
              );
            }
          }

          // Trouver le manager avec le moins de candidatures ouvertes
          let minCount = Infinity;
          let selectedManager: StaffMember | null = null;
          for (const mgr of managers) {
            const mgrId = mgr.id ?? '';
            const count = countByRecruiter.get(mgrId) ?? 0;
            if (count < minCount) {
              minCount = count;
              selectedManager = mgr;
            }
          }

          if (selectedManager && selectedManager.id) {
            assignedRecruiterName = selectedManager.name ?? selectedManager.id;
            await Nexus.adapter.update(
              `tenants/${tenantId}/hr/recruitment/applications/${applicationId}`,
              {
                assignedTo: selectedManager.id,
                assignedToName: assignedRecruiterName,
                updatedAt: Date.now(),
              }
            );
            logger.info(
              `[RecruitmentRouterHandler] Candidature ${applicationId} assignée à ${assignedRecruiterName} (${minCount} candidatures ouvertes)`
            );
          }
        }

        empireAudit.log({
            action: 'hr.application_received',
            module: 'human',
            userId: 'system',
            instanceId: tenantId,
            details: {
              applicationId,
              role,
              applicantName,
              assignedTo: assignedRecruiterName || null,
            },
            severity: 'low',
            timestamp: new Date(),
        });

        const assignmentInfo = assignedRecruiterName
          ? ` Assignée à ${assignedRecruiterName}.`
          : '';

        NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-recruitment-${applicationId}`,
            type: 'info',
            title: 'Nouvelle Candidature',
            message: `${applicantName} a postulé pour le poste : ${role}.${assignmentInfo}`,
            priority: 'low',
            read: false,
            timestamp: new Date().toISOString(),
        });
      } catch (err) {
        logger.error('[RecruitmentRouterHandler] Error saving application', toError(err).message);
      }
    }, { id: 'recruitment-router', priority: 'BACKGROUND' });
  }
}
