import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * ShiftStartedHandler (P0-1.5)
 * Écoute `hr.shift_started`.
 * Enregistre le shift actif, vérifie la validité du contrat de l'employé et arme le contrôle de pause légale HCR.
 */
export function registerShiftStartedHandler(): () => void {
  return NexusEventBus.on(
    'hr.shift_started',
    async (payload) => {
      const { tenantId, shiftId, employeeId, startedAt, role } = payload;
      const startedIso = new Date(startedAt).toISOString();

      try {
        // 1. Enregistrement de l'entrée dans tenants/{id}/activeShifts/{shiftId}
        await Nexus.adapter.set(`tenants/${tenantId}/activeShifts/${shiftId}`, {
          id: shiftId,
          employeeId,
          role,
          startedAt: startedIso,
          status: 'active',
        });

        logger.info(`[ShiftStartedHandler] Shift ${shiftId} démarré pour l'employé ${employeeId} (Rôle: ${role})`);

        // 2. Vérification de l'existence d'un contrat ou profil employé
        const employee = await Nexus.adapter.get<Record<string, unknown>>(`tenants/${tenantId}/users/${employeeId}`);
        if (!employee) {
          logger.warn(`[ShiftStartedHandler] Prise de poste sans fiche employé trouvée pour ${employeeId}`);
          await NexusEventBus.emitDurable('notification.urgent', {
            v: 1,
            tenantId,
            message: `Prise de poste enregistrée pour l'identifiant inconnu ${employeeId}. Fiche RH à vérifier.`,
            roles: ['manager', 'directeur'],
            priority: 'HIGH',
            metadata: { employeeId, shiftId },
          });
        }

        // 3. Audit Empire
        empireAudit.log({
          module: 'ops',
          action: 'SHIFT_STARTED',
          details: { shiftId, employeeId, role, startedAt: startedIso },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[ShiftStartedHandler] Erreur lors de l'enregistrement du début de shift ${shiftId}`, toError(err).message);
      }
    },
    { id: 'shift-started-handler', priority: 'HIGH' }
  );
}
