import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrinterFailoverManager, PrinterDevice } from './PrinterFailoverManager';
import { empireAudit } from '@/lib/audit';

describe('🖨️ PrinterFailoverManager — Gestionnaire de Secours Imprimantes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPrinters: PrinterDevice[] = [
    {
      id: 'print_kitchen_main',
      name: 'Imprimante Cuisine Chaud (Principale)',
      ipAddress: '192.168.1.101',
      isOnline: true,
      hasPaper: true,
    },
    {
      id: 'print_kitchen_backup',
      name: 'Imprimante Cuisine Froid (Secours)',
      ipAddress: '192.168.1.102',
      isOnline: true,
      hasPaper: true,
      isBackupPrinter: true,
    },
    {
      id: 'print_bar',
      name: 'Imprimante Bar',
      ipAddress: '192.168.1.103',
      isOnline: false,
      hasPaper: true,
    },
  ];

  it('devrait retourner l\'imprimante cible si elle est en ligne et a du papier', () => {
    const result = PrinterFailoverManager.resolveFallbackPrinter('print_kitchen_main', mockPrinters);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('print_kitchen_main');
    expect(result?.name).toBe('Imprimante Cuisine Chaud (Principale)');
  });

  it('devrait basculer vers l\'imprimante de secours si la cible est hors ligne', () => {
    const offlineTargetPrinters: PrinterDevice[] = [
      { ...mockPrinters[0], isOnline: false },
      mockPrinters[1],
      mockPrinters[2],
    ];

    const spyAudit = vi.spyOn(empireAudit, 'log');
    const result = PrinterFailoverManager.resolveFallbackPrinter('print_kitchen_main', offlineTargetPrinters);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('print_kitchen_backup');
    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'ops',
        action: 'PRINTER_FAILOVER_TRIGGERED',
      })
    );
  });

  it('devrait basculer vers l\'imprimante de secours si la cible n\'a plus de papier', () => {
    const outOfPaperPrinters: PrinterDevice[] = [
      { ...mockPrinters[0], hasPaper: false },
      mockPrinters[1],
    ];

    const result = PrinterFailoverManager.resolveFallbackPrinter('print_kitchen_main', outOfPaperPrinters);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('print_kitchen_backup');
  });

  it('devrait retourner null si aucune imprimante de secours n\'est disponible', () => {
    const allUnavailablePrinters: PrinterDevice[] = [
      { ...mockPrinters[0], isOnline: false },
      { ...mockPrinters[1], hasPaper: false },
      { ...mockPrinters[2], isOnline: false },
    ];

    const result = PrinterFailoverManager.resolveFallbackPrinter('print_kitchen_main', allUnavailablePrinters);
    expect(result).toBeNull();
  });

  it('devrait chercher un secours si l\'ID cible n\'existe pas dans la liste des imprimantes', () => {
    const result = PrinterFailoverManager.resolveFallbackPrinter('print_unknown_id', mockPrinters);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('print_kitchen_main');
  });
});
