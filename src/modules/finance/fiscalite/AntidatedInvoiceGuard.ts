/**
 * T10 — Blocage facture antidatée.
 *
 * Art. 441-1 Code Pénal (faux en écriture) + Art. 1729 CGI (mauvaise foi) :
 * Une facture antidatée de plus de X jours est un faux en écriture pénalement
 * répréhensible. Fiscalement, elle peut permettre de décaler la TVA collectée
 * ou de gonfler des charges sur une période antérieure — infraction détectée
 * lors des contrôles FEC.
 *
 * Ce service bloque toute création de facture avec une date d'émission
 * antérieure de plus de MAX_BACKDATE_DAYS par rapport à la date système.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T10.
 */
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const MAX_BACKDATE_DAYS = 3;

export interface AntidatedCheckResult {
  allowed: boolean;
  invoiceDateIso: string;
  systemDateIso: string;
  backdateDays: number;
  maxAllowedDays: number;
}

export class AntidatedInvoiceGuard {
  static check(invoiceDateIso: string, now?: number): AntidatedCheckResult {
    const ts = now ?? Date.now();
    const invoiceTs = new Date(invoiceDateIso).getTime();
    const backdateMs = ts - invoiceTs;
    const backdateDays = Math.floor(backdateMs / 86400_000);
    const systemDateIso = new Date(ts).toISOString().slice(0, 10);

    return {
      allowed: backdateDays <= MAX_BACKDATE_DAYS,
      invoiceDateIso,
      systemDateIso,
      backdateDays: Math.max(0, backdateDays),
      maxAllowedDays: MAX_BACKDATE_DAYS,
    };
  }

  static async assertAllowed(input: {
    invoiceDateIso: string;
    issuedBy: string;
    tenantId: string;
    now?: number;
  }): Promise<AntidatedCheckResult> {
    const result = this.check(input.invoiceDateIso, input.now);

    if (!result.allowed) {
      await AuditLogger.logAction(
        input.issuedBy,
        'FISCAL_SEAL_ANOMALY_DETECTED',
        'invoice_date',
        {
          type: 'antidated_invoice_blocked',
          invoiceDateIso: input.invoiceDateIso,
          backdateDays: result.backdateDays,
          legalRef: 'Art. 441-1 Code Penal + Art. 1729 CGI',
        },
      ).catch(() => null);

      await NexusEventBus.emit('finance.antidated_invoice_blocked', {
        v: 1,
        tenantId: input.tenantId,
        issuedBy: input.issuedBy,
        invoiceDateIso: input.invoiceDateIso,
        backdateDays: result.backdateDays,
        blockedAt: input.now ?? Date.now(),
      }).catch(() => null);

      throw new Error(`ANTIDATED_INVOICE_BLOCKED: ${result.backdateDays} jours (max ${MAX_BACKDATE_DAYS})`);
    }

    return result;
  }
}
