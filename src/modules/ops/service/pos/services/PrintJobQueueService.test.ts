import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrintJobQueueService } from './PrintJobQueueService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getDefaultStore } from 'jotai';
import { pageSettingsAtom } from '@/store/settingsAtoms';

describe('🖨️ PrintJobQueueService — Résilience d\'impression et file d\'attente', () => {
  const store = getDefaultStore();

  beforeEach(() => {
    PrintJobQueueService.clearQueue();
    store.set(pageSettingsAtom, {});
    vi.restoreAllMocks();
  });

  it('queues a print job when all printers fail and emits facility.hardware_fault', async () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});

    const resolution = await PrintJobQueueService.handlePrintFailure({
      tenantId: 'tenant_123',
      orderId: 'order_456',
      targetPrinterId: 'printer_kitchen_1',
      payload: { items: ['Pizza Margherita'], total: 12.5 },
    });

    expect(resolution.status).toBe('QUEUED');
    expect(resolution.actionTaken).toBe('queue_and_alert');
    expect(PrintJobQueueService.getPendingJobs('tenant_123')).toHaveLength(1);

    expect(emitSpy).toHaveBeenCalledWith('facility.hardware_fault', expect.objectContaining({
      tenantId: 'tenant_123',
      deviceId: 'printer_kitchen_1',
      deviceType: 'printer',
      faultCode: 'CONNECTION_LOST',
    }));

    expect(emitSpy).toHaveBeenCalledWith('notification.urgent', expect.objectContaining({
      tenantId: 'tenant_123',
      priority: 'HIGH',
    }));
  });

  it('generates digital QR receipt fallback when on_print_failure is configured to digital_receipt_qr', async () => {
    store.set(pageSettingsAtom, {
      pos: {
        on_print_failure: 'digital_receipt_qr',
      },
    });

    const resolution = await PrintJobQueueService.handlePrintFailure({
      tenantId: 'tenant_123',
      orderId: 'order_456',
      targetPrinterId: 'printer_receipt_1',
      payload: { items: ['Café Gourmand'], total: 8.0 },
    });

    expect(resolution.status).toBe('FALLBACK_GENERATED');
    expect(resolution.actionTaken).toBe('digital_receipt_qr');
    expect(resolution.digitalReceiptUrl).toBe('/receipt/tenant_123/order_456');
  });

  it('marks job as printed when successfully retried', async () => {
    const resolution = await PrintJobQueueService.handlePrintFailure({
      tenantId: 'tenant_123',
      orderId: 'order_456',
      targetPrinterId: 'printer_1',
      payload: {},
    });

    expect(PrintJobQueueService.getPendingJobs('tenant_123')).toHaveLength(1);
    const marked = PrintJobQueueService.markJobPrinted(resolution.queueId);
    expect(marked).toBe(true);
    expect(PrintJobQueueService.getPendingJobs('tenant_123')).toHaveLength(0);
  });
});
