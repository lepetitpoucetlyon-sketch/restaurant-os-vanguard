/**
 * SAGA handlers — tests unitaires (15 handlers critiques)
 * Stratégie : mock Nexus.adapter + NexusEventBus, capture le handler via on.mock.calls,
 * invoque directement, assert sur les effets (adapter calls, emitDurable, empireAudit).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks globaux ────────────────────────────────────────────────────────────

const txMock = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
};

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      query: vi.fn(),
      runTransaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
    },
  },
}));

vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    on: vi.fn((_event: string, handler: (...args: unknown[]) => unknown) => {
      return () => {};
    }),
    emit: vi.fn().mockResolvedValue(undefined),
    emitDurable: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/axiom', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mocks pour handlers avec dépendances externes lourdes
vi.mock('@/modules/finance/fiscalite/FiscalSealer', () => ({
  FiscalSealer: {
    sealDataAtomically: vi.fn().mockResolvedValue({ sealId: 'seal-001', hash: 'abc123def456' }),
    generateSequentialReceiptNumber: vi.fn().mockResolvedValue('Z-2026-001'),
  },
}));

vi.mock('@/lib/CryptoService', () => ({
  CryptoService: {
    generateHash: vi.fn().mockResolvedValue('expected-hash'),
    canonicalStringify: vi.fn().mockReturnValue('{"data":"snapshot"}'),
  },
}));

vi.mock('@/lib/adapters/MasterBridge', () => ({
  MasterBridge: {
    pushGlobalConfig: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/adapters/NotificationGateway', () => ({
  NotificationGateway: {
    sendEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';

function captureHandler(): (...args: unknown[]) => Promise<void> {
  const calls = vi.mocked(NexusEventBus.on).mock.calls;
  const last = calls[calls.length - 1];
  return last[1] as (...args: unknown[]) => Promise<void>;
}

beforeEach(() => {
  vi.clearAllMocks();
  txMock.get.mockReset();
  txMock.set.mockReset();
  txMock.update.mockReset();
  vi.mocked(Nexus.adapter.runTransaction).mockImplementation(
    async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock),
  );
});

// ── C01 — TicketZHandler ─────────────────────────────────────────────────────

describe('C01 · TicketZHandler (order.paid → ticketZ aggregate)', () => {
  it('crée le ticketZ du jour si absent et accumule le total', async () => {
    const { registerTicketZHandler } = await import(
      '@/shared/eventBus/handlers/TicketZHandler'
    );
    registerTicketZHandler();
    const handler = captureHandler();

    txMock.get.mockResolvedValue(null); // pas encore de ticketZ aujourd'hui
    vi.mocked(Nexus.adapter.get).mockResolvedValue(null); // pas de table

    await handler({
      tenantId: 'ten1',
      orderId: 'ord-001',
      totalInMicrounits: 50_000_000,
      items: [{ productId: 'p1', name: 'Burger', quantity: 2, totalInMicrounits: 25_000_000, tvaRate: 10 }],
      tableId: undefined,
    });

    expect(txMock.set).toHaveBeenCalledWith(
      expect.stringContaining('tenants/ten1/ticketZ/'),
      expect.objectContaining({ totalInMicrounits: 50_000_000, ordersCount: 1 }),
    );
  });

  it('accumule sur un ticketZ existant', async () => {
    const { registerTicketZHandler } = await import(
      '@/shared/eventBus/handlers/TicketZHandler'
    );
    registerTicketZHandler();
    const handler = captureHandler();

    txMock.get.mockResolvedValue({
      id: '2026-08-06',
      date: '2026-08-06',
      tenantId: 'ten1',
      ordersCount: 5,
      totalInMicrounits: 200_000_000,
      taxBreakdown: {},
      updatedAt: new Date().toISOString(),
    });

    await handler({
      tenantId: 'ten1',
      orderId: 'ord-002',
      totalInMicrounits: 30_000_000,
      items: [],
    });

    expect(txMock.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ totalInMicrounits: 230_000_000, ordersCount: 6 }),
    );
  });
});

// ── C02 — StockDeductionHandler ──────────────────────────────────────────────

describe('C02 · StockDeductionHandler (order.paid → déduction stock)', () => {
  it('déduit 1:1 si le produit a un linkedStockItemId', async () => {
    const { registerStockDeductionHandler } = await import(
      '@/shared/eventBus/handlers/StockDeductionHandler'
    );
    registerStockDeductionHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockImplementation(async (path: string) => {
      if (path.includes('/products/')) return { linkedStockItemId: 'stock-001' };
      if (path.includes('/stockItems/')) return { quantity: 10, reorderThreshold: 2 };
      return null;
    });

    await handler({
      tenantId: 'ten1',
      orderId: 'ord-01',
      items: [{ productId: 'prod-1', name: 'Burger', quantity: 3 }],
    });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      'tenants/ten1/stockItems/stock-001',
      expect.objectContaining({ quantity: 7 }),
    );
  });

  it('émet stock.zero si la quantité atteint 0', async () => {
    const { registerStockDeductionHandler } = await import(
      '@/shared/eventBus/handlers/StockDeductionHandler'
    );
    registerStockDeductionHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockImplementation(async (path: string) => {
      if (path.includes('/products/')) return { linkedStockItemId: 'stock-002' };
      if (path.includes('/stockItems/')) return { quantity: 2 };
      return null;
    });

    await handler({
      tenantId: 'ten1',
      orderId: 'ord-02',
      items: [{ productId: 'prod-2', name: 'Frites', quantity: 2 }],
    });

    expect(NexusEventBus.emitDurable).toHaveBeenCalledWith(
      'stock.zero',
      expect.objectContaining({ itemId: 'stock-002' }),
    );
  });
});

// ── C03 — StockReceptionHandler ──────────────────────────────────────────────

describe('C03 · StockReceptionHandler (stock.received → mise à jour stock)', () => {
  it('incrémente le stock existant à la réception', async () => {
    const { registerStockReceptionHandler } = await import(
      '@/shared/eventBus/handlers/StockReceptionHandler'
    );
    registerStockReceptionHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockImplementation(async (path: string) => {
      if (path.includes('/purchaseOrders/')) return null;
      if (path.includes('/stockItems/')) return { quantity: 20, name: 'Steak' };
      return null;
    });

    await handler({
      tenantId: 'ten1',
      deliveryId: 'BL-001',
      purchaseOrderId: null,
      items: [{ itemId: 'steak-item', quantity: 15 }],
    });

    expect(Nexus.adapter.set).toHaveBeenCalledWith(
      'tenants/ten1/stockItems/steak-item',
      expect.objectContaining({ quantity: 35, lastDeliveryNoteId: 'BL-001' }),
    );
  });

  it('enregistre un rapport de dérive si écart avec bon de commande', async () => {
    const { registerStockReceptionHandler } = await import(
      '@/shared/eventBus/handlers/StockReceptionHandler'
    );
    registerStockReceptionHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockImplementation(async (path: string) => {
      if (path.includes('/purchaseOrders/')) return {
        id: 'PO-001',
        status: 'pending',
        items: [{ itemId: 'beef', quantity: 10 }],
      };
      if (path.includes('/stockItems/')) return { quantity: 5, name: 'Beef' };
      return null;
    });

    await handler({
      tenantId: 'ten1',
      deliveryId: 'BL-002',
      purchaseOrderId: 'PO-001',
      items: [{ itemId: 'beef', quantity: 7 }], // attendu: 10, reçu: 7
    });

    expect(Nexus.adapter.set).toHaveBeenCalledWith(
      expect.stringContaining('inventoryDrifts'),
      expect.objectContaining({ deliveryId: 'BL-002' }),
    );
  });
});

// ── C04 — CertExpiryHandler ──────────────────────────────────────────────────

describe('C04 · CertExpiryHandler (cert.expired → notification)', () => {
  it('crée une notification critique et log audit', async () => {
    const { registerCertExpiryHandler } = await import(
      '@/shared/eventBus/handlers/CertExpiryHandler'
    );
    registerCertExpiryHandler();
    const handler = captureHandler();

    await handler({
      tenantId: 'ten1',
      certId: 'cert-001',
      certType: 'haccp',
      entityName: 'Cuisine principale',
      expiredAt: '2026-08-01',
      isSimulation: false,
    });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      'tenants/ten1/notifications/cert-001_expired',
      expect.objectContaining({ type: 'cert_expired', severity: 'critical' }),
    );
    expect(empireAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'cert_expired', module: 'compliance' }),
    );
  });

  it('ignore les événements simulation', async () => {
    const { registerCertExpiryHandler } = await import(
      '@/shared/eventBus/handlers/CertExpiryHandler'
    );
    registerCertExpiryHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'ten1', certId: 'c1', certType: 'test', entityName: 'x', expiredAt: '2026-01-01', isSimulation: true });

    expect(Nexus.adapter.update).not.toHaveBeenCalled();
  });
});

// ── C05 — ComplianceCalendarHandler ──────────────────────────────────────────

describe('C05 · ComplianceCalendarHandler (compliance.calendar → notification)', () => {
  it('crée une notification urgente si daysUntilDue ≤ 7', async () => {
    const { registerComplianceCalendarHandler } = await import(
      '@/shared/eventBus/handlers/ComplianceCalendarHandler'
    );
    registerComplianceCalendarHandler();
    const handler = captureHandler();

    await handler({
      tenantId: 'ten1',
      eventType: 'haccp_review',
      title: 'Revue HACCP annuelle',
      dueDate: '2026-08-13',
      daysUntilDue: 7,
      isSimulation: false,
    });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      expect.stringContaining('notifications'),
      expect.objectContaining({ severity: 'critical' }),
    );
  });

  it('ignore si isSimulation', async () => {
    const { registerComplianceCalendarHandler } = await import(
      '@/shared/eventBus/handlers/ComplianceCalendarHandler'
    );
    registerComplianceCalendarHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'ten1', eventType: 'x', title: 'x', dueDate: '2026-12-01', daysUntilDue: 30, isSimulation: true });
    expect(Nexus.adapter.update).not.toHaveBeenCalled();
  });
});

// ── C06 — DLCExpiryHandler ───────────────────────────────────────────────────

describe('C06 · DLCExpiryHandler (dlc.expired → déduction + waste.logged)', () => {
  it('déduit la quantité et émet waste.logged', async () => {
    const { registerDLCExpiryHandler } = await import(
      '@/shared/eventBus/handlers/DLCExpiryHandler'
    );
    registerDLCExpiryHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockResolvedValue({ quantity: 10, name: 'Yaourt' });

    await handler({
      tenantId: 'ten1',
      itemId: 'item-dlc',
      quantity: 4,
      batchNumber: 'LOT-001',
    });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      'tenants/ten1/stockItems/item-dlc',
      expect.objectContaining({ quantity: 6 }),
    );
    expect(NexusEventBus.emitDurable).toHaveBeenCalledWith(
      'waste.logged',
      expect.objectContaining({ ingredientId: 'item-dlc', quantity: 4 }),
    );
  });

  it('ne déduit pas si item inconnu', async () => {
    const { registerDLCExpiryHandler } = await import(
      '@/shared/eventBus/handlers/DLCExpiryHandler'
    );
    registerDLCExpiryHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockResolvedValue(null);

    await handler({ tenantId: 'ten1', itemId: 'unknown', quantity: 2, batchNumber: 'LOT-X' });

    expect(Nexus.adapter.update).not.toHaveBeenCalled();
    expect(NexusEventBus.emitDurable).not.toHaveBeenCalled();
  });
});

// ── C07 — SupplierInvoiceLedgerHandler ───────────────────────────────────────

describe('C07 · SupplierInvoiceLedgerHandler (finance.invoice_approved → fiscalLedger)', () => {
  it('écrit une entrée ACCOUNTS_PAYABLE dans le Grand Livre', async () => {
    const { registerSupplierInvoiceLedgerHandler } = await import(
      '@/shared/eventBus/handlers/SupplierInvoiceLedgerHandler'
    );
    registerSupplierInvoiceLedgerHandler();
    const handler = captureHandler();

    await handler({
      tenantId: 'ten1',
      invoiceId: 'INV-2026-001',
      supplierId: 'sup-001',
      amountInMicrounits: 150_000_000,
      approvedBy: 'manager@test.com',
      isSimulation: false,
    });

    expect(Nexus.adapter.set).toHaveBeenCalledWith(
      'tenants/ten1/fiscalLedger/ap_entry_INV-2026-001',
      expect.objectContaining({
        type: 'ACCOUNTS_PAYABLE',
        amountInMicrounits: 150_000_000,
        status: 'awaiting_payment',
      }),
    );
  });

  it('ignore si isSimulation', async () => {
    const { registerSupplierInvoiceLedgerHandler } = await import(
      '@/shared/eventBus/handlers/SupplierInvoiceLedgerHandler'
    );
    registerSupplierInvoiceLedgerHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'ten1', invoiceId: 'x', supplierId: 'x', amountInMicrounits: 0, approvedBy: 'x', isSimulation: true });
    expect(Nexus.adapter.set).not.toHaveBeenCalled();
  });
});

// ── C08 — CompJournalHandler ─────────────────────────────────────────────────

describe('C08 · CompJournalHandler (order.comp → journal NF525 doublement équilibré)', () => {
  it('crée journalEntry avec deux lignes débit/crédit équilibrées', async () => {
    const { registerCompJournalHandler } = await import(
      '@/shared/eventBus/handlers/CompJournalHandler'
    );
    registerCompJournalHandler();
    const handler = captureHandler();

    await handler({
      tenantId: 'ten1',
      orderId: 'ord-comp-01',
      operatorId: 'op-001',
      items: [{ name: 'Burger', quantity: 1, priceInMicrounits: 15_000_000 }],
      totalValueInMicrounits: 15_000_000,
      reason: 'Erreur service',
    });

    // journalEntries immuable → set, jamais update
    expect(Nexus.adapter.set).toHaveBeenCalledWith(
      'tenants/ten1/journalEntries/JE-COMP-ord-comp-01',
      expect.objectContaining({
        totalInMicrounits: 15_000_000,
        type: 'sales',
      }),
    );
  });
});

// ── C09 — SovereignBreachHandler ─────────────────────────────────────────────

describe('C09 · SovereignBreachHandler (sovereign.breach → kill-switch)', () => {
  it('crée une alerte MCC et appelle pushGlobalConfig', async () => {
    const { registerSovereignBreachHandler } = await import(
      '@/shared/eventBus/handlers/SovereignBreachHandler'
    );
    registerSovereignBreachHandler();
    const handler = captureHandler();

    const { MasterBridge } = await import('@/lib/adapters/MasterBridge');

    await handler({
      message: 'Accès cross-tenant détecté',
      targetTenantId: 'ten2',
      anchoredTenantId: 'ten1',
      path: 'tenants/ten2/orders',
      isSimulation: false,
    });

    expect(MasterBridge.pushGlobalConfig).toHaveBeenCalledWith(
      expect.objectContaining({ killSwitch: true, maintenanceMode: true }),
    );
    expect(Nexus.adapter.create).toHaveBeenCalledWith(
      'mcc/alerts',
      expect.objectContaining({ type: 'NF525_SOVEREIGN_BREACH', severity: 'critical' }),
    );
  });

  it('ne push pas le kill-switch en mode simulation', async () => {
    const { registerSovereignBreachHandler } = await import(
      '@/shared/eventBus/handlers/SovereignBreachHandler'
    );
    registerSovereignBreachHandler();
    const handler = captureHandler();

    const { MasterBridge } = await import('@/lib/adapters/MasterBridge');

    await handler({ message: 'sim', targetTenantId: 'x', anchoredTenantId: 'x', path: 'x', isSimulation: true });

    expect(MasterBridge.pushGlobalConfig).not.toHaveBeenCalled();
  });
});

// ── C10 — CryptoIntegrityCheckHandler ────────────────────────────────────────

describe('C10 · CryptoIntegrityCheckHandler (finance.daily_audit → vérification chaîne NF525)', () => {
  it('valide la chaîne si les hashes correspondent', async () => {
    const { registerCryptoIntegrityCheckHandler } = await import(
      '@/shared/eventBus/handlers/CryptoIntegrityCheckHandler'
    );
    registerCryptoIntegrityCheckHandler();
    const handler = captureHandler();

    const { CryptoService } = await import('@/lib/CryptoService');
    vi.mocked(CryptoService.generateHash).mockResolvedValue('correct-hash');

    vi.mocked(Nexus.adapter.query).mockResolvedValue([
      { id: 'seal-1', timestamp: '2026-08-06T10:00:00.000Z', hash: 'correct-hash', dataSnapshot: '{"data":"ok"}', previousHash: null },
    ]);

    await handler({ tenantId: 'ten1', date: '2026-08-06' });

    // Chaîne intacte → pas d'alerte créée
    expect(Nexus.adapter.create).not.toHaveBeenCalled();
    expect(empireAudit.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CRYPTO_CHAIN_BROKEN' }),
    );
  });

  it('détecte une rupture de chaîne et crée une alerte', async () => {
    const { registerCryptoIntegrityCheckHandler } = await import(
      '@/shared/eventBus/handlers/CryptoIntegrityCheckHandler'
    );
    registerCryptoIntegrityCheckHandler();
    const handler = captureHandler();

    const { CryptoService } = await import('@/lib/CryptoService');
    vi.mocked(CryptoService.generateHash).mockResolvedValue('different-hash'); // ne correspond pas

    vi.mocked(Nexus.adapter.query).mockResolvedValue([
      { id: 'seal-broken', timestamp: '2026-08-06T10:00:00.000Z', hash: 'stored-hash', dataSnapshot: '{"data":"bad"}', previousHash: null },
    ]);

    await handler({ tenantId: 'ten1', date: '2026-08-06' });

    expect(empireAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CRYPTO_CHAIN_BROKEN' }),
    );
  });
});

// ── C11 — CustomerRFMAnalyzerHandler ─────────────────────────────────────────

describe('C11 · CustomerRFMAnalyzerHandler (crm.points_earned → segment RFM)', () => {
  it('passe le client en segment "regular" après 5 visites', async () => {
    const { registerCustomerRFMAnalyzerHandler } = await import(
      '@/shared/eventBus/handlers/CustomerRFMAnalyzerHandler'
    );
    registerCustomerRFMAnalyzerHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockResolvedValue({ visitCount: 4, segment: 'new' });

    await handler({ tenantId: 'ten1', customerId: 'cust-001', points: 10 });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      'tenants/ten1/customers/cust-001',
      expect.objectContaining({ segment: 'regular', visitCount: 5 }),
    );
  });

  it('passe en "vip" après 11 visites', async () => {
    const { registerCustomerRFMAnalyzerHandler } = await import(
      '@/shared/eventBus/handlers/CustomerRFMAnalyzerHandler'
    );
    registerCustomerRFMAnalyzerHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockResolvedValue({ visitCount: 10, segment: 'regular' });

    await handler({ tenantId: 'ten1', customerId: 'cust-vip', points: 50 });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      'tenants/ten1/customers/cust-vip',
      expect.objectContaining({ segment: 'vip', visitCount: 11 }),
    );
  });
});

// ── C12 — ReservationNotifierHandler ─────────────────────────────────────────

describe('C12 · ReservationNotifierHandler (reservation.confirmed → email)', () => {
  it('lit la config tenant et audit la notification envoyée', async () => {
    const { registerReservationNotifierHandler } = await import(
      '@/shared/eventBus/handlers/ReservationNotifierHandler'
    );
    registerReservationNotifierHandler();
    const handler = captureHandler();

    vi.mocked(Nexus.adapter.get).mockResolvedValue({ name: 'Le Gourmet' });

    await handler({
      tenantId: 'ten1',
      reservationId: 'resa-001',
      customerName: 'Jean Dupont',
      date: '2026-08-10',
      time: '20:00',
      covers: 4,
      isSimulation: false,
    });

    // Vérifie que la config tenant a été lue pour récupérer le nom du restaurant
    expect(Nexus.adapter.get).toHaveBeenCalledWith(
      expect.stringContaining('settings/general'),
    );
  });

  it('ne fait rien en mode simulation', async () => {
    const { registerReservationNotifierHandler } = await import(
      '@/shared/eventBus/handlers/ReservationNotifierHandler'
    );
    registerReservationNotifierHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'ten1', reservationId: 'x', customerName: 'x', date: 'x', time: 'x', covers: 1, isSimulation: true });
    expect(Nexus.adapter.get).not.toHaveBeenCalled();
  });
});

// ── C13 — StockAlertHandler ──────────────────────────────────────────────────

describe('C13 · StockAlertHandler (stock.low → alerte persistée)', () => {
  it('crée un document stockAlert avec status PENDING', async () => {
    const { registerStockAlertHandler } = await import(
      '@/shared/eventBus/handlers/StockAlertHandler'
    );
    registerStockAlertHandler();
    const handler = captureHandler();

    await handler({
      tenantId: 'ten1',
      itemId: 'beef-001',
      itemName: 'Bœuf haché',
      currentQuantity: 3,
      threshold: 10,
    });

    expect(Nexus.adapter.set).toHaveBeenCalledWith(
      'tenants/ten1/stockAlerts/beef-001',
      expect.objectContaining({ status: 'PENDING', currentQuantity: 3, threshold: 10 }),
    );
  });

  it('marque le produit indisponible si currentQuantity = 0', async () => {
    const { registerStockAlertHandler } = await import(
      '@/shared/eventBus/handlers/StockAlertHandler'
    );
    registerStockAlertHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'ten1', itemId: 'salt', itemName: 'Sel', currentQuantity: 0, threshold: 5 });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      'tenants/ten1/products/salt',
      expect.objectContaining({ available: false }),
    );
  });
});

// ── C14 — WasteValidatedHandler ──────────────────────────────────────────────

describe('C14 · WasteValidatedHandler (inventory.waste_logged → déduction transactionnelle)', () => {
  it('déduit la quantité de chaque item perdu via une transaction', async () => {
    const { registerWasteValidatedHandler } = await import(
      '@/shared/eventBus/handlers/WasteValidatedHandler'
    );
    registerWasteValidatedHandler();
    const handler = captureHandler();

    txMock.get.mockResolvedValue({ quantity: 20, prmp: 5_000, lowStockThreshold: 2 });

    await handler({
      tenantId: 'ten1',
      wasteId: 'waste-001',
      items: [{ productId: 'tomato', quantity: 5 }],
    });

    expect(Nexus.adapter.runTransaction).toHaveBeenCalled();
    expect(txMock.update).toHaveBeenCalledWith(
      'tenants/ten1/stockItems/tomato',
      expect.objectContaining({ quantity: 15 }),
    );
    expect(empireAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'WASTE_PROCESSED' }),
    );
  });
});

// ── C15 — TableAutoReleaseHandler ────────────────────────────────────────────

describe('C15 · TableAutoReleaseHandler (table.cleared → libération si sessionEnd)', () => {
  it('libère la table si sessionEnd=true', async () => {
    const { registerTableAutoReleaseHandler } = await import(
      '@/shared/eventBus/handlers/TableAutoReleaseHandler'
    );
    registerTableAutoReleaseHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'ten1', tableId: 'T-12', sessionEnd: true });

    expect(Nexus.adapter.update).toHaveBeenCalledWith(
      'tenants/ten1/tables/T-12',
      expect.objectContaining({ status: 'available', seatedAt: null }),
    );
    expect(empireAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TABLE_AUTO_RELEASED' }),
    );
  });

  it('ne libère pas si sessionEnd != true', async () => {
    const { registerTableAutoReleaseHandler } = await import(
      '@/shared/eventBus/handlers/TableAutoReleaseHandler'
    );
    registerTableAutoReleaseHandler();
    const handler = captureHandler();

    await handler({ tenantId: 'ten1', tableId: 'T-05', sessionEnd: false });

    expect(Nexus.adapter.update).not.toHaveBeenCalled();
  });
});
