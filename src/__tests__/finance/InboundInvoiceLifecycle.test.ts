import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InboundInvoiceLifecycle } from '@/modules/finance/comptabilite/einvoicing/InboundInvoiceLifecycle';
import type { InboundInvoiceRecord } from '@/modules/finance/comptabilite/einvoicing/InboundInvoiceLifecycle';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const TENANT_ID = 'tenant_einvoice_test';

describe('InboundInvoiceLifecycle — Machine à états Factur-X entrantes (§7.3)', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    Nexus.adapter = mockAdapter;
    vi.restoreAllMocks();
  });

  function createSampleInvoice(status: InboundInvoiceRecord['status']): InboundInvoiceRecord {
    return {
      id: 'inbound_inv_001',
      tenantId: TENANT_ID,
      providerInvoiceId: 'pdp_ref_123',
      invoiceNumber: 'FAC-SUP-2026-09',
      status,
      seller: { name: 'Fournisseur Boissons SARL', siret: '11122233300044' },
      totalHTInMicrounits: 200_000_000,
      totalVATInMicrounits: 40_000_000,
      totalTTCInMicrounits: 240_000_000,
      dueDate: '2026-09-30',
      receivedAt: new Date().toISOString(),
    };
  }

  it('valide une facture au statut received (received → validated)', async () => {
    const inv = createSampleInvoice('received');
    await Nexus.adapter.set(`tenants/${TENANT_ID}/inboundInvoices/${inv.id}`, inv);

    const busSpy = vi.spyOn(NexusEventBus, 'emitDurable');

    await InboundInvoiceLifecycle.validate(TENANT_ID, inv.id, 'user_accountant_1');

    const updated = await Nexus.adapter.get<InboundInvoiceRecord>(
      `tenants/${TENANT_ID}/inboundInvoices/${inv.id}`
    );
    expect(updated?.status).toBe('validated');
    expect(updated?.validatedBy).toBe('user_accountant_1');
    expect(updated?.validatedAt).toBeDefined();

    expect(busSpy).toHaveBeenCalledWith(
      'einvoice.validated',
      expect.objectContaining({
        tenantId: TENANT_ID,
        invoiceId: inv.id,
        invoiceNumber: 'FAC-SUP-2026-09',
        validatedBy: 'user_accountant_1',
      })
    );
  });

  it('refuse la validation si la facture est déjà approuvée (transition invalide)', async () => {
    const inv = createSampleInvoice('approved');
    await Nexus.adapter.set(`tenants/${TENANT_ID}/inboundInvoices/${inv.id}`, inv);

    await expect(
      InboundInvoiceLifecycle.validate(TENANT_ID, inv.id, 'user_1')
    ).rejects.toThrow('Transition invalide : approved → validated');
  });

  it('approuve une facture validée (validated → approved)', async () => {
    const inv = createSampleInvoice('validated');
    await Nexus.adapter.set(`tenants/${TENANT_ID}/inboundInvoices/${inv.id}`, inv);

    const busSpy = vi.spyOn(NexusEventBus, 'emitDurable');

    await InboundInvoiceLifecycle.approve(TENANT_ID, inv.id, 'manager_directeur', 'bl_delivery_888');

    const updated = await Nexus.adapter.get<InboundInvoiceRecord>(
      `tenants/${TENANT_ID}/inboundInvoices/${inv.id}`
    );
    expect(updated?.status).toBe('approved');
    expect(updated?.approvedBy).toBe('manager_directeur');
    expect(updated?.linkedDeliveryNoteId).toBe('bl_delivery_888');

    expect(busSpy).toHaveBeenCalledWith(
      'einvoice.approved',
      expect.objectContaining({
        tenantId: TENANT_ID,
        invoiceId: inv.id,
        approvedBy: 'manager_directeur',
        totalTTCInMicrounits: 240_000_000,
      })
    );
  });

  it('rejette une facture avec motif (received → rejected) et notifie le PDP', async () => {
    const inv = createSampleInvoice('received');
    await Nexus.adapter.set(`tenants/${TENANT_ID}/inboundInvoices/${inv.id}`, inv);

    const busSpy = vi.spyOn(NexusEventBus, 'emitDurable');

    await InboundInvoiceLifecycle.reject(TENANT_ID, inv.id, 'comptable_1', 'Erreur sur quantité livrée');

    const updated = await Nexus.adapter.get<InboundInvoiceRecord>(
      `tenants/${TENANT_ID}/inboundInvoices/${inv.id}`
    );
    expect(updated?.status).toBe('rejected');
    expect(updated?.rejectedBy).toBe('comptable_1');
    expect(updated?.rejectionReason).toBe('Erreur sur quantité livrée');

    expect(busSpy).toHaveBeenCalledWith(
      'einvoice.rejected',
      expect.objectContaining({
        tenantId: TENANT_ID,
        invoiceId: inv.id,
        reason: 'Erreur sur quantité livrée',
      })
    );
  });

  it('marque une facture comme payée (approved → paid)', async () => {
    const inv = createSampleInvoice('approved');
    await Nexus.adapter.set(`tenants/${TENANT_ID}/inboundInvoices/${inv.id}`, inv);

    const busSpy = vi.spyOn(NexusEventBus, 'emitDurable');

    await InboundInvoiceLifecycle.markPaid(TENANT_ID, inv.id, 'treasurer_1', 'VIR-SEPA-20260901-01');

    const updated = await Nexus.adapter.get<InboundInvoiceRecord>(
      `tenants/${TENANT_ID}/inboundInvoices/${inv.id}`
    );
    expect(updated?.status).toBe('paid');
    expect(updated?.paidBy).toBe('treasurer_1');
    expect(updated?.paymentReference).toBe('VIR-SEPA-20260901-01');

    expect(busSpy).toHaveBeenCalledWith(
      'einvoice.paid',
      expect.objectContaining({
        tenantId: TENANT_ID,
        invoiceId: inv.id,
        paymentReference: 'VIR-SEPA-20260901-01',
      })
    );
  });
});
