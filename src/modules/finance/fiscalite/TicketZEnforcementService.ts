/**
 * D2 — Ticket Z / clôture journalière obligatoire avant ouverture J+1.
 *
 * NF525 exige que le ticket Z (rapport de clôture journalier) soit généré avant
 * d'ouvrir la caisse le lendemain. Actuellement il est possible d'ouvrir J+1
 * sans avoir clos J. Risque NF525 + Art. 286 CGI.
 *
 * Ce service est appelé au démarrage du POS. Si le Z de la veille n'existe pas,
 * le POS doit être bloqué jusqu'à régularisation.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § D2 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface ZReportRecord {
  dateIso: string;
  status: 'open' | 'closed';
  closedAt?: number;
}

export interface ZEnforcementResult {
  canOpen: boolean;
  missingDates: string[];
}

export class TicketZEnforcementService {
  /** Calcule les dates J-1 à J-N qui n'ont pas de Z clos */
  static async checkMissingZ(tenantId: string, currentDateIso: string, lookbackDays = 3): Promise<ZEnforcementResult> {
    const missing: string[] = [];

    for (let i = 1; i <= lookbackDays; i++) {
      const dt = new Date(currentDateIso);
      dt.setUTCDate(dt.getUTCDate() - i);
      const dateIso = dt.toISOString().split('T')[0];
      const record = await Nexus.adapter.get<ZReportRecord>(`tenants/${tenantId}/zReports/${dateIso}`);
      if (!record || record.status !== 'closed') {
        missing.push(dateIso);
      }
    }

    return { canOpen: missing.length === 0, missingDates: missing };
  }

  /** Point d'entrée appelé au démarrage POS */
  static async assertCanOpenPos(tenantId: string, operatorId: string, todayIso: string): Promise<void> {
    const result = await this.checkMissingZ(tenantId, todayIso);

    if (!result.canOpen) {
      for (const dateIso of result.missingDates) {
        await NexusEventBus.emit('finance.ticket_z_missing', {
          v: 1,
          tenantId,
          missingDateIso: dateIso,
          detectedAt: Date.now(),
        });
      }
      await AuditLogger.logAction(
        operatorId,
        'POS_OPEN_BLOCKED_MISSING_Z',
        tenantId,
        { missingDates: result.missingDates },
      ).catch(() => null);

      throw new Error(
        `POS_BLOCKED: ticket Z manquant pour ${result.missingDates.join(', ')}. Générez le rapport de clôture avant d'ouvrir.`,
      );
    }
  }
}
