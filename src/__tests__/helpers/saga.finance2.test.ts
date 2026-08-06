import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockQuery, mockEmit, mockEmitDurable, mockOn, capturedHandlers } =
  vi.hoisted(() => {
    const capturedHandlers: Record<string, (payload: unknown) => Promise<void>> = {};
    const mockOn = vi.fn((event: string, cb: (p: unknown) => Promise<void>) => {
      capturedHandlers[event] = cb;
      return () => {};
    });
    return {
      mockGet: vi.fn(),
      mockSet: vi.fn(),
      mockUpdate: vi.fn(),
      mockQuery: vi.fn(),
      mockEmit: vi.fn(),
      mockEmitDurable: vi.fn(),
      mockOn,
      capturedHandlers,
    };
  });

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { get: mockGet, set: mockSet, update: mockUpdate, query: mockQuery } },
}));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { on: mockOn, emit: mockEmit, emitDurable: mockEmitDurable },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));
vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: { generateId: vi.fn((p: string) => `${p}-id`) },
}));
vi.mock('@/lib/CryptoService', () => ({
  CryptoService: { generateHash: vi.fn(async () => 'hash-abc') },
}));
vi.mock('@/modules/finance/comptabilite/FinancialNexusBridge', () => ({
  FinancialNexusBridge: { processRefund: vi.fn(async () => undefined) },
}));
vi.mock('@/modules/intelligence', () => ({
  LightRAGClient: vi.fn().mockImplementation(() => ({
    insert: vi.fn(async () => ({ status: 'ok', id: 'doc-1' })),
  })),
}));
vi.mock('@/lib/adapters/NotificationGateway', () => ({
  NotificationGateway: { sendEmail: vi.fn(async () => true) },
}));
vi.mock('@/lib/push/browserPush', () => ({
  browserPush: { sendToRole: vi.fn(async () => true) },
}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerMonthlyFECExportHandler } from '@/shared/eventBus/handlers/MonthlyFECExportHandler';
import { BankConnectionExpiredHandler } from '@/shared/eventBus/handlers/BankConnectionExpiredHandler';
import { registerBankSyncAuditHandler } from '@/shared/eventBus/handlers/BankSyncAuditHandler';
import { CashflowForecastHandler } from '@/shared/eventBus/handlers/CashflowForecastHandler';
import { registerSepaExportHandler } from '@/shared/eventBus/handlers/SepaExportHandler';
import { registerOverdueInvoiceHandler } from '@/shared/eventBus/handlers/OverdueInvoiceHandler';
import { registerSplitPaymentHandler } from '@/shared/eventBus/handlers/SplitPaymentHandler';
import { registerRefundExtourneHandler } from '@/shared/eventBus/handlers/RefundExtourneHandler';
import { registerReconciliationEngineHandler } from '@/shared/eventBus/handlers/ReconciliationEngineHandler';
import { registerSupplierInvoiceLedgerHandler } from '@/shared/eventBus/handlers/SupplierInvoiceLedgerHandler';
import { registerTechAuditLedgerHandler } from '@/shared/eventBus/handlers/TechAuditLedgerHandler';
import { PeriodLockGuardHandler } from '@/shared/eventBus/handlers/PeriodLockGuardHandler';
import { registerTicketZArchiveHandler } from '@/shared/eventBus/handlers/TicketZArchiveHandler';
import { registerCryptoIntegrityCheckHandler } from '@/shared/eventBus/handlers/CryptoIntegrityCheckHandler';
import { AutoIndexationHandler } from '@/shared/eventBus/handlers/AutoIndexationHandler';
import { registerCertExpiryHandler } from '@/shared/eventBus/handlers/CertExpiryHandler';

const T = 'tenant-fin';

// ─── MonthlyFECExportHandler ──────────────────────────────────────────────────

describe('MonthlyFECExportHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerMonthlyFECExportHandler(); });

  it('génère et archive le FEC pour le mois clos', async () => {
    mockQuery.mockResolvedValue([
      { id: 'je-1', type: 'sale', description: 'Vente', amountInMicrounits: 5000000, timestamp: '2026-01-15T12:00:00Z' },
    ]);
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['finance.month_closed']({ tenantId: T, month: '2026-01', closedBy: 'admin' });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/fecExports/2026-01`,
      expect.objectContaining({ month: '2026-01' }),
    );
  });
});

// ─── BankConnectionExpiredHandler ────────────────────────────────────────────

describe('BankConnectionExpiredHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); BankConnectionExpiredHandler.register(); });

  it('passe la connexion bancaire à expired', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['finance.bank_connection_expired']({
      tenantId: T, connectionId: 'conn-1',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/finance/bank_connections/conn-1`,
      expect.objectContaining({ status: 'expired' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['finance.bank_connection_expired']({ tenantId: T, connectionId: 'x', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── BankSyncAuditHandler ─────────────────────────────────────────────────────

describe('BankSyncAuditHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerBankSyncAuditHandler(); });

  it('persiste la transaction bancaire si elle n\'existe pas encore', async () => {
    mockGet.mockResolvedValue(null);
    mockQuery.mockResolvedValue([]);
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['finance.bank_transaction_synced']({
      tenantId: T, transactionId: 'tx-new', bankAccountId: 'acc-1',
      amountInMicrounits: 10000000, syncedAt: '2026-01-15T12:00:00Z',
    });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/bankTransactions/tx-new`,
      expect.objectContaining({ id: 'tx-new', status: 'unreconciled' }),
    );
  });

  it('ne repersiste pas si la transaction existe déjà (idempotence)', async () => {
    mockGet.mockResolvedValue({ transactionId: 'tx-1' });

    await capturedHandlers['finance.bank_transaction_synced']({
      tenantId: T, transactionId: 'tx-1', bankAccountId: 'acc-1', amountInMicrounits: 0, syncedAt: Date.now(),
    });

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── CashflowForecastHandler ──────────────────────────────────────────────────

describe('CashflowForecastHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); CashflowForecastHandler.register(); });

  it('persiste la prévision de CA J+1', async () => {
    mockQuery.mockResolvedValue([
      { date: '2026-01-08', totalInMicrounits: 5000000 },
      { date: '2026-01-09', totalInMicrounits: 6000000 },
      { date: '2026-01-10', totalInMicrounits: 5500000 },
    ]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['finance.ticket_z_closed']({ tenantId: T, date: '2026-01-15', totalInMicrounits: 7000000 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/`),
      expect.objectContaining({ predictedRevenueInMicrounits: expect.any(Number) }),
    );
  });
});

// ─── SepaExportHandler ────────────────────────────────────────────────────────

describe('SepaExportHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerSepaExportHandler(); });

  it('marque les factures du batch SEPA comme payées', async () => {
    mockQuery.mockResolvedValue([
      { id: 'inv-1', status: 'pending', sepaBatchId: 'batch-1' },
      { id: 'inv-2', status: 'paid', sepaBatchId: 'batch-1' },
    ]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['finance.payment_dispatched']({
      tenantId: T, paymentBatchId: 'batch-1', totalAmountInMicrounits: 20000000, dispatchedBy: 'admin',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/supplierInvoices/inv-1`, expect.objectContaining({ status: 'paid' }),
    );
    expect(mockUpdate).not.toHaveBeenCalledWith(
      `tenants/${T}/supplierInvoices/inv-2`, expect.anything(),
    );
  });
});

// ─── OverdueInvoiceHandler ────────────────────────────────────────────────────

describe('OverdueInvoiceHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerOverdueInvoiceHandler(); });

  it('escalade J+30 : met à jour la facture avec le niveau de relance', async () => {
    mockUpdate.mockResolvedValue(undefined);
    mockGet.mockResolvedValue({ email: 'c@ex.com', name: 'Client A' });

    await capturedHandlers['invoice.overdue']({
      tenantId: T, invoiceId: 'inv-1', customerId: 'cust-1', amountInMicrounits: 5000000, dueDaysOverdue: 15,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/invoices/inv-1`, expect.objectContaining({ reminderLevel: 'J+30' }),
    );
  });
});

// ─── SplitPaymentHandler ──────────────────────────────────────────────────────

describe('SplitPaymentHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerSplitPaymentHandler(); });

  it('persiste chaque paiement partiel dans le ledger', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.split']({
      tenantId: T, orderId: 'ord-1', operatorId: 'op-1',
      payments: [{ amount: 20, method: 'card', guest: 'guest-1' }, { amount: 30, method: 'cash', guest: 'guest-2' }],
    });

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/paymentLedger/`),
      expect.objectContaining({ type: 'split', method: 'card' }),
    );
  });
});

// ─── RefundExtourneHandler ────────────────────────────────────────────────────

describe('RefundExtourneHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerRefundExtourneHandler(); });

  it('appelle FinancialNexusBridge.processRefund avec le JE original', async () => {
    const { FinancialNexusBridge } = await import('@/modules/finance/comptabilite/FinancialNexusBridge');
    mockGet.mockResolvedValue({ id: 'je-1', type: 'sale', amountInMicrounits: 5000000 });

    await capturedHandlers['order.refunded']({ tenantId: T, orderId: 'je-1', operatorId: 'op-1' });

    expect(FinancialNexusBridge.processRefund).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: T }),
    );
  });

  it('lève une erreur si le JE original est introuvable', async () => {
    mockGet.mockResolvedValue(null);
    await expect(
      capturedHandlers['order.refunded']({ tenantId: T, orderId: 'ghost', operatorId: 'op-1' }),
    ).rejects.toThrow();
  });
});

// ─── ReconciliationEngineHandler ──────────────────────────────────────────────

describe('ReconciliationEngineHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerReconciliationEngineHandler(); });

  it('passe la transaction bancaire et l\'entité cible à reconciled', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['finance.reconciliation_completed']({
      tenantId: T, reconciliationId: 'rec-1', bankTransactionId: 'tx-1',
      matchedEntityId: 'ticketz-1', matchedEntityType: 'ticket_z', reconciledBy: 'admin',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/bankTransactions/tx-1`, expect.objectContaining({ status: 'reconciled' }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/fiscalLedger/ticket_z_ticketz-1`, expect.objectContaining({ status: 'reconciled' }),
    );
  });
});

// ─── SupplierInvoiceLedgerHandler ─────────────────────────────────────────────

describe('SupplierInvoiceLedgerHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerSupplierInvoiceLedgerHandler(); });

  it('inscrit la facture fournisseur approuvée dans le Grand Livre', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['finance.invoice_approved']({
      tenantId: T, invoiceId: 'inv-supp-1', supplierId: 'supp-1',
      amountInMicrounits: 10000000, approvedBy: 'manager',
    });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/fiscalLedger/ap_entry_inv-supp-1`,
      expect.objectContaining({ type: 'ACCOUNTS_PAYABLE', status: 'awaiting_payment' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['finance.invoice_approved']({
      tenantId: T, invoiceId: 'x', supplierId: 'y', amountInMicrounits: 0, approvedBy: 'z', isSimulation: true,
    });
    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── TechAuditLedgerHandler ───────────────────────────────────────────────────

describe('TechAuditLedgerHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerTechAuditLedgerHandler(); });

  it('persiste le log système avec un hash crypto', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['system.audit_log']({
      tenantId: T, action: 'CONFIG_CHANGED', userId: 'admin', details: {}, severity: 'medium',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/auditLogs/`),
      expect.objectContaining({ action: 'CONFIG_CHANGED', hash: 'hash-abc' }),
    );
  });
});

// ─── PeriodLockGuardHandler ───────────────────────────────────────────────────

describe('PeriodLockGuardHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); PeriodLockGuardHandler.register(); });

  it('verrouille la période fiscale dans le ledger', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['finance.period_locked']({
      tenantId: T, periodId: '2026-01', lockedBy: 'admin', lockedAt: '2026-02-01T00:00:00Z',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/fiscalPeriodLocks/`),
      expect.objectContaining({ isLocked: true }),
    );
  });

  it('isPeriodLocked retourne true si le verrou existe', async () => {
    mockGet.mockResolvedValue({ isLocked: true });
    const locked = await PeriodLockGuardHandler.isPeriodLocked(T, '2026-01-15');
    expect(locked).toBe(true);
  });
});

// ─── TicketZArchiveHandler ────────────────────────────────────────────────────

describe('TicketZArchiveHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerTicketZArchiveHandler(); });

  it('archive le Ticket Z du jour dans la collection froide', async () => {
    mockGet.mockResolvedValue({ total: 5000000, date: '2026-01-15' });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['finance.ticket_z_closed']({ tenantId: T, date: '2026-01-15' });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/archives/ticketZ_2026-01-15`,
      expect.objectContaining({ archivedAt: expect.any(String) }),
    );
  });

  it('ne fait rien si le Ticket Z est introuvable', async () => {
    mockGet.mockResolvedValue(null);
    await capturedHandlers['finance.ticket_z_closed']({ tenantId: T, date: '2026-01-15' });
    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── CryptoIntegrityCheckHandler ─────────────────────────────────────────────

describe('CryptoIntegrityCheckHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerCryptoIntegrityCheckHandler(); });

  it('ne fait rien si aucun sceau pour la journée', async () => {
    mockQuery.mockResolvedValue([]);

    await capturedHandlers['finance.daily_audit']({ tenantId: T, date: '2026-01-15' });

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('vérifie la chaîne NF525 si des sceaux existent', async () => {
    const { CryptoService } = await import('@/lib/CryptoService');
    mockQuery.mockResolvedValue([
      { id: 'seal-1', hash: 'abc', previousHash: '', timestamp: '2026-01-15T10:00:00Z', dataSnapshot: 'd' },
    ]);
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['finance.daily_audit']({ tenantId: T, date: '2026-01-15' });

    expect(CryptoService.generateHash).toHaveBeenCalled();
  });
});

// ─── AutoIndexationHandler ────────────────────────────────────────────────────

describe('AutoIndexationHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); AutoIndexationHandler.register(); });

  it('met à jour le statut du document après indexation LightRAG', async () => {
    mockGet.mockResolvedValue({ content: 'Contenu du doc', docType: 'menu' });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['ai.document_uploaded']({
      tenantId: T, documentId: 'doc-1', fileName: 'menu.pdf', uploadedBy: 'admin',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/ai/documents/doc-1`,
      expect.objectContaining({ indexStatus: expect.stringMatching(/^(completed|failed)$/) }),
    );
  });

  it('ignore si isSimulation', async () => {
    vi.clearAllMocks();
    await capturedHandlers['ai.document_uploaded']({
      tenantId: T, documentId: 'x', fileName: 'y', uploadedBy: 'z', isSimulation: true,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── CertExpiryHandler ────────────────────────────────────────────────────────

describe('CertExpiryHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerCertExpiryHandler(); });

  it('persiste la notification d\'expiration de certificat', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['cert.expired']({
      tenantId: T, certId: 'cert-1', certType: 'haccp', entityName: 'Cuisine', expiredAt: '2026-01-01',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/notifications/`),
      expect.objectContaining({ severity: 'critical' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['cert.expired']({
      tenantId: T, certId: 'x', certType: 'y', entityName: 'z', expiredAt: '2026-01-01', isSimulation: true,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
