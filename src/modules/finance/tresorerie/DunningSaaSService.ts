/**
 * MCC-D2 — Dunning SaaS (relance impayé J+3 / J+7 / coupure J+14).
 *
 * Workflow standard SaaS non couvert : quand un tenant ne règle pas sa facture
 * mensuelle, il n'y a aucune relance automatique → perte MRR silencieuse.
 *
 * Workflow :
 *  - J+3 : email de rappel courtois
 *  - J+7 : email d'avertissement + banner dans l'app
 *  - J+14 : suspension du service + email de coupure
 *
 * Ce service est appelé par un cron quotidien.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § MCC-D2 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance';

export interface UnpaidInvoice {
  invoiceId: string;
  tenantId: string;
  tenantEmail: string;
  amountInMicrounits: number;
  dueDateIso: string;
  duedAt: number;
}

export interface DunningStep {
  step: 'j3' | 'j7' | 'j14';
  overdayDays: number;
  action: 'email_reminder' | 'email_warning' | 'service_suspension';
}

const DUNNING_STEPS: DunningStep[] = [
  { step: 'j3', overdayDays: 3, action: 'email_reminder' },
  { step: 'j7', overdayDays: 7, action: 'email_warning' },
  { step: 'j14', overdayDays: 14, action: 'service_suspension' },
];

export class DunningSaaSService {
  static computeStep(duedAt: number, now: number): DunningStep | null {
    const overdueDays = Math.floor((now - duedAt) / 86400_000);
    const applicable = DUNNING_STEPS.filter(s => overdueDays >= s.overdayDays)
      .sort((a, b) => b.overdayDays - a.overdayDays);
    return applicable[0] ?? null;
  }

  static async processTenant(invoice: UnpaidInvoice, now?: number): Promise<DunningStep | null> {
    const ts = now ?? Date.now();
    const step = this.computeStep(invoice.duedAt, ts);
    if (!step) return null;

    const stateKey = `tenants/${invoice.tenantId}/dunning_state/${invoice.invoiceId}`;
    const existing = await Nexus.adapter.get<{ lastStep: string }>(stateKey);
    if (existing?.lastStep === step.step) return null;

    await Nexus.adapter.set(stateKey, { lastStep: step.step, processedAt: ts });

    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `mcc/dunning_log`,
      targetId: `dunning_${invoice.invoiceId}_${step.step}`,
      priority: OutboxPriority.LEGAL,
      payload: { invoiceId: invoice.invoiceId, tenantId: invoice.tenantId, step: step.step, processedAt: ts },
    }).catch(() => 0);

    await AuditLogger.logAction(
      'system',
      'DUNNING_STEP_PROCESSED',
      invoice.invoiceId,
      { tenantId: invoice.tenantId, step: step.step, action: step.action },
    ).catch(() => null);

    await NexusEventBus.emitDurable('finance.dunning_email_sent', {
      v: 1,
      tenantId: invoice.tenantId,
      invoiceId: invoice.invoiceId,
      step: step.step,
      emailRecipient: invoice.tenantEmail,
      sentAt: ts,
    });

    if (step.action === 'service_suspension') {
      await Nexus.adapter.set(`tenants/${invoice.tenantId}/status`, { suspended: true, suspendedAt: ts, reason: 'unpaid_invoice' });
      await NexusEventBus.emitDurable('finance.tenant_suspended_unpaid', {
        v: 1,
        tenantId: invoice.tenantId,
        invoiceId: invoice.invoiceId,
        overduedays: step.overdayDays,
        suspendedAt: ts,
      });
    }

    return step;
  }
}
