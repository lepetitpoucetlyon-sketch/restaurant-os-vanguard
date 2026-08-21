/**
 * L38 — Clôture auto badgeage au Ticket Z.
 *
 * Art. L. 3171-4 Code du Travail : l'employeur doit décompter le temps
 * de travail effectif. Si le dernier badge de sortie n'a pas été enregistré
 * (oubli fréquent en fin de service), le Ticket Z marque la fin du service.
 *
 * Ce service, appelé lors de la génération du Ticket Z, badge automatiquement
 * les salariés encore "en poste" selon le badgeage, avec une note "auto Z".
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L38.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface BadgeRecord {
  employeeId: string;
  clockIn: number;
  clockOut?: number;
  autoClockOut?: boolean;
  autoClockOutReason?: 'ticket_z';
}

export interface AutoClockoutResult {
  closedCount: number;
  closedEmployeeIds: string[];
}

export class BadgeClockoutAtZService {
  static async runAtZClosure(input: {
    tenantId: string;
    zClosureAt: number;
    operatorId: string;
  }): Promise<AutoClockoutResult> {
    const openBadges = await Nexus.adapter.query<BadgeRecord & { id: string }>(
      `tenants/${input.tenantId}/badge_records`,
    );

    const stillOpen = openBadges.filter(b => !b.clockOut);
    if (stillOpen.length === 0) return { closedCount: 0, closedEmployeeIds: [] };

    for (const badge of stillOpen) {
      const updated: BadgeRecord = {
        ...badge,
        clockOut: input.zClosureAt,
        autoClockOut: true,
        autoClockOutReason: 'ticket_z',
      };
      await Nexus.adapter.set(
        `tenants/${input.tenantId}/badge_records/${badge.id}`,
        updated,
      );
    }

    const closedEmployeeIds = stillOpen.map(b => b.employeeId);

    await AuditLogger.logAction(
      input.operatorId,
      'REST_PERIOD_VIOLATION',
      'badge_clockout_z',
      { autoClosedCount: stillOpen.length, zClosureAt: input.zClosureAt },
    ).catch(() => null);

    await NexusEventBus.emit('hr.auto_clockout_at_z', {
      v: 1,
      tenantId: input.tenantId,
      closedCount: stillOpen.length,
      closedEmployeeIds,
      zClosureAt: input.zClosureAt,
    }).catch(() => null);

    return { closedCount: stillOpen.length, closedEmployeeIds };
  }
}
