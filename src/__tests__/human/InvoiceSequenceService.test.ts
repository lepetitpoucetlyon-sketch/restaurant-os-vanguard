import { describe, it, expect } from 'vitest';
import { InvoiceSequenceService } from '@/modules/human/services/InvoiceSequenceService';

describe('InvoiceSequenceService — Séquençage strict des factures d\'auto-facturation', () => {
  it('génère une séquence consécutive sans trou (0001, 0002, 0003)', async () => {
    const tenantId = 'tenant_seq_test';
    const period = '2026-09';

    const num1 = await InvoiceSequenceService.next(tenantId, period);
    const num2 = await InvoiceSequenceService.next(tenantId, period);
    const num3 = await InvoiceSequenceService.next(tenantId, period);

    expect(num1).toBe('FAC-AUTO-202609-0001');
    expect(num2).toBe('FAC-AUTO-202609-0002');
    expect(num3).toBe('FAC-AUTO-202609-0003');

    const current = await InvoiceSequenceService.current(tenantId, period);
    expect(current).toBe(3);
  });

  it('isole les compteurs par mois calendaire (reset mensuel strict)', async () => {
    const tenantId = 'tenant_seq_month';

    const sep1 = await InvoiceSequenceService.next(tenantId, '2026-09');
    const oct1 = await InvoiceSequenceService.next(tenantId, '2026-10');

    expect(sep1).toBe('FAC-AUTO-202609-0001');
    expect(oct1).toBe('FAC-AUTO-202610-0001');
  });

  it('isole les compteurs entre tenants différents', async () => {
    const tA = await InvoiceSequenceService.next('tenant_a', '2026-09');
    const tB = await InvoiceSequenceService.next('tenant_b', '2026-09');

    expect(tA).toBe('FAC-AUTO-202609-0001');
    expect(tB).toBe('FAC-AUTO-202609-0001');
  });
});
