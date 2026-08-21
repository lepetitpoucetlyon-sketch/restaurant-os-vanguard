/**
 * T68 — Accident du travail brûlure huile : déclaration CPAM 48h obligatoire.
 *
 * Art. L. 441-2 CSS : l'employeur doit déclarer tout accident du travail à la
 * CPAM dans les 48h (jours ouvrés), via le formulaire Cerfa 14463*03.
 * Défaut de déclaration : amende + majoration cotisations AT/MP.
 *
 * Ce service crée la déclaration AT, calcule la deadline CPAM et émet l'alerte.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T68 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface WorkAccident {
  id: string;
  tenantId: string;
  employeeId: string;
  injuryType: string;
  description: string;
  accidentDate: string;
  reportedAt: number;
  reportedBy: string;
  cpamDeadlineAt: number;
  cpamDeclaredAt?: number;
  status: 'pending_cpam' | 'declared' | 'overdue';
}

function computeCpamDeadline(accidentDateIso: string): number {
  const dt = new Date(accidentDateIso);
  let businessDays = 0;
  while (businessDays < 2) {
    dt.setUTCDate(dt.getUTCDate() + 1);
    const dow = dt.getUTCDay();
    if (dow !== 0 && dow !== 6) businessDays++;
  }
  return dt.getTime();
}

export class WorkAccidentService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/work_accidents/${id}`;
  }

  static async declare(input: {
    tenantId: string;
    employeeId: string;
    injuryType: string;
    description: string;
    accidentDate: string;
    reportedBy: string;
    now?: number;
  }): Promise<WorkAccident> {
    const now = input.now ?? Date.now();
    const cpamDeadlineAt = computeCpamDeadline(input.accidentDate);

    const accident: WorkAccident = {
      id: `at_${input.employeeId}_${now}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      injuryType: input.injuryType,
      description: input.description,
      accidentDate: input.accidentDate,
      reportedAt: now,
      reportedBy: input.reportedBy,
      cpamDeadlineAt,
      status: 'pending_cpam',
    };

    await Nexus.adapter.set(this.path(input.tenantId, accident.id), accident);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/work_accidents`,
      targetId: accident.id,
      priority: OutboxPriority.LEGAL,
      payload: accident as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.reportedBy,
      'WORK_ACCIDENT_DECLARED',
      accident.id,
      { employeeId: input.employeeId, injuryType: input.injuryType, cpamDeadlineAt },
    ).catch(() => null);

    await NexusEventBus.emit('hr.work_accident_declared', {
      v: 1,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      accidentId: accident.id,
      injuryType: input.injuryType,
      reportedAt: now,
      cpamDeadlineAt,
    });

    return accident;
  }
}
