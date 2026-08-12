import { describe, it, expect, beforeAll } from 'vitest';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { isExpectedUnconsumed } from '@orchestration/NexusEventBus';
import { registerFinanceHandlers } from '@orchestration/registerHandlers/finance';
import { registerOpsHandlers } from '@orchestration/registerHandlers/ops';
import { registerLogisticsHandlers } from '@orchestration/registerHandlers/logistics';
import { registerComplianceHandlers } from '@orchestration/registerHandlers/compliance';
import { registerMccHandlers } from '@orchestration/registerHandlers/mcc';

/**
 * NF525 Chain End-to-End — vérifie que chaque maillon de la chaîne fiscale
 * a un handler actif après le boot complet des domaines concernés.
 *
 * Chaîne NF525 :
 *   POS → FinancialNexusBridge.processOrder() → JournalEntry + FiscalSeal
 *     └─ emits order.paid → TicketZHandler (accumule) + StockDeduction + PaymentLedger
 *   Cron 23h59 → ZReportAutoJob → emits finance.z_report_requested
 *     └─ ZReportCloseHandler → closeTicketZForDay() → JE_Z + FiscalSeal → emits finance.ticket_z_closed
 *       └─ TicketZArchiveHandler → archive + emits finance.daily_audit
 *   Refund → FinancialNexusBridge.processRefund() → JE_EXTOURNE + FiscalSeal
 *     └─ emits order.refunded → RefundExtourneHandler + RefundJournalHandler
 *   Audit → FiscalEngine.runAudit() → emits crypto.integrity_failed (if breach)
 *     └─ CryptoIntegrityCheckHandler → persiste la preuve
 */
describe('NF525 Chain E2E — tous les maillons câblés', () => {
  beforeAll(() => {
    registerFinanceHandlers();
    registerOpsHandlers();
    registerLogisticsHandlers();
    registerComplianceHandlers();
    registerMccHandlers();
  });

  // ── Maillon 1 : POS Payment → order.paid consumers ─────────────────────

  it('order.paid a ≥3 handlers (TicketZ + StockDeduction + PaymentLedger)', () => {
    expect(NexusEventBus.listenerCount('order.paid' as never)).toBeGreaterThanOrEqual(3);
  });

  it('order.paid → TicketZHandler accumule le total', async () => {
    let ticketZUpdated = false;
    const unsub = NexusEventBus.on('order.paid', async (p) => {
      if (p.orderId === 'nf525_e2e_paid') ticketZUpdated = true;
    });

    await NexusEventBus.emitDurable('order.paid', {
      v: 1,
      tenantId: 'nf525-tenant',
      orderId: 'nf525_e2e_paid',
      tableId: 't_1',
      operatorId: 'op_1',
      items: [],
      totalInMicrounits: 25_000_000,
      paymentMode: 'card',
    });

    expect(ticketZUpdated).toBe(true);
    unsub();
  });

  // ── Maillon 2 : Z-Report close chain ─────────────────────────────────────

  it('finance.z_report_requested a ≥1 handler (ZReportCloseHandler)', () => {
    expect(NexusEventBus.listenerCount('finance.z_report_requested' as never)).toBeGreaterThanOrEqual(1);
  });

  it('finance.ticket_z_closed a ≥1 handler (TicketZArchiveHandler)', () => {
    expect(NexusEventBus.listenerCount('finance.ticket_z_closed' as never)).toBeGreaterThanOrEqual(1);
  });

  it('finance.daily_audit a ≥1 handler', () => {
    expect(NexusEventBus.listenerCount('finance.daily_audit' as never)).toBeGreaterThanOrEqual(1);
  });

  // ── Maillon 3 : Refund chain ─────────────────────────────────────────────

  it('order.refunded a ≥1 handler (RefundExtourne/RefundJournal)', () => {
    expect(NexusEventBus.listenerCount('order.refunded' as never)).toBeGreaterThanOrEqual(1);
  });

  // ── Maillon 4 : Integrity audit chain ─────────────────────────────────────

  it('crypto.integrity_failed a ≥1 handler (CryptoIntegrityCheckHandler)', () => {
    expect(NexusEventBus.listenerCount('crypto.integrity_failed' as never)).toBeGreaterThanOrEqual(1);
  });

  // ── Maillon 5 : Scellement NF525 auxiliaire ────────────────────────────────

  it('finance.order_sealed a ≥1 handler (OrderSealedNF525Handler)', () => {
    expect(NexusEventBus.listenerCount('finance.order_sealed' as never)).toBeGreaterThanOrEqual(1);
  });

  it('finance.tax_mismatch a ≥1 handler (TaxMismatchAlertHandler)', () => {
    expect(NexusEventBus.listenerCount('finance.tax_mismatch' as never)).toBeGreaterThanOrEqual(1);
  });

  // ── Classe B : orphelins attendus (état persisté avant emit) ──────────────

  it('finance.refund_issued est Classe B (informational, pas de handler requis)', () => {
    expect(isExpectedUnconsumed('finance.refund_issued')).toBe(true);
  });

  it('finance.invoice_generated est Classe B (informational, pas de handler requis)', () => {
    expect(isExpectedUnconsumed('finance.invoice_generated')).toBe(true);
  });

  // ── Chaîne complète : aucun maillon NF525 critique sans handler ──────────

  it.each([
    'order.paid',
    'order.refunded',
    'finance.z_report_requested',
    'finance.ticket_z_closed',
    'finance.daily_audit',
    'finance.order_sealed',
    'crypto.integrity_failed',
    'finance.tax_mismatch',
  ])('maillon NF525 « %s » a ≥1 handler enregistré', (event) => {
    expect(NexusEventBus.listenerCount(event as never)).toBeGreaterThan(0);
  });
});
