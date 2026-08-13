import type { PrinterDevice, PrintJob, PrintResult, ReceiptTicket, KitchenTicket } from './types';
import { EscPosBuilder } from './EscPosBuilder';
import { printNetworkRaw } from './adapters/NetworkAdapter';
import { printBluetooth } from './adapters/BluetoothAdapter';
import { printUSB } from './adapters/USBAdapter';
import { printSerial } from './adapters/SerialAdapter';
import { printReceiptBrowser, printKitchenBrowser } from './adapters/BrowserAdapter';
import { tenantScopedKey } from '@/lib/storage/tenantScopedKey';

const STORAGE_KEY_BASE = 'ros_printers_v1';
const storageKey = () => tenantScopedKey(STORAGE_KEY_BASE);

export class PrintingService {
  private static _instance: PrintingService;
  private printers: PrinterDevice[] = [];

  static getInstance(): PrintingService {
    if (!this._instance) this._instance = new PrintingService();
    return this._instance;
  }

  constructor() {
    this.load();
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) this.printers = JSON.parse(raw) as PrinterDevice[];
    } catch { /* ignore */ }
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey(), JSON.stringify(this.printers));
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  getAll(): PrinterDevice[] { return [...this.printers]; }

  getByRole(role: PrinterDevice['role']): PrinterDevice[] {
    return this.printers.filter(p => p.role === role && p.enabled);
  }

  getDefault(role: PrinterDevice['role']): PrinterDevice | null {
    return this.printers.find(p => p.role === role && p.isDefault && p.enabled) ?? null;
  }

  add(printer: Omit<PrinterDevice, 'id'>): PrinterDevice {
    const device: PrinterDevice = { ...printer, id: `printer_${Date.now()}` };
    // First of this role → make default
    if (!this.printers.some(p => p.role === device.role)) {
      device.isDefault = true;
    }
    this.printers.push(device);
    this.save();
    return device;
  }

  update(id: string, patch: Partial<PrinterDevice>): void {
    const idx = this.printers.findIndex(p => p.id === id);
    if (idx === -1) return;
    this.printers[idx] = { ...this.printers[idx], ...patch };
    this.save();
  }

  remove(id: string): void {
    this.printers = this.printers.filter(p => p.id !== id);
    this.save();
  }

  setDefault(id: string): void {
    const target = this.printers.find(p => p.id === id);
    if (!target) return;
    // Unset all defaults for this role, set this one
    for (const p of this.printers) {
      if (p.role === target.role) p.isDefault = p.id === id;
    }
    this.save();
  }

  // ─── Print ────────────────────────────────────────────────────────────────

  async print(job: PrintJob, printer: PrinterDevice): Promise<PrintResult> {
    const builder = new EscPosBuilder(printer.paperWidth, printer.hasCutter);

    let data: Uint8Array;
    if (job.type === 'receipt') data = builder.buildReceipt(job.ticket);
    else if (job.type === 'kitchen') data = builder.buildKitchen(job.ticket);
    else data = builder.buildTest();

    const conn = printer.connection;

    switch (conn.type) {
      case 'network':
        return printNetworkRaw(conn, data);

      case 'bluetooth':
        return printBluetooth(conn, data, printer.brand);

      case 'usb':
        return printUSB(conn, data);

      case 'serial':
        return printSerial(conn, data);

      case 'browser':
      default:
        if (job.type === 'receipt') return printReceiptBrowser(job.ticket);
        if (job.type === 'kitchen') return printKitchenBrowser(job.ticket);
        return printReceiptBrowser(buildDummyTestTicket());
    }
  }

  /** Print to the default printer for a role, fallback to browser if none configured */
  async printToRole(role: PrinterDevice['role'], job: PrintJob): Promise<PrintResult> {
    const printer = this.getDefault(role);
    if (!printer) {
      // Browser fallback
      if (job.type === 'receipt') return printReceiptBrowser(job.ticket);
      if (job.type === 'kitchen') return printKitchenBrowser(job.ticket);
      return { success: false, method: 'browser', error: 'Aucune imprimante configurée' };
    }
    return this.print(job, printer);
  }

  async printReceipt(ticket: ReceiptTicket): Promise<PrintResult> {
    return this.printToRole('receipt', { type: 'receipt', ticket });
  }

  async printKitchen(ticket: KitchenTicket): Promise<PrintResult> {
    return this.printToRole('kitchen', { type: 'kitchen', ticket });
  }

  async testPrint(printer: PrinterDevice): Promise<PrintResult> {
    return this.print({ type: 'test' }, printer);
  }

  openCashDrawer(): void {
    const receipt = this.getDefault('receipt');
    if (!receipt) return;
    const bytes = new EscPosBuilder(receipt.paperWidth, receipt.hasCutter).openCashDrawer();
    // Fire and forget
    void this.print({ type: 'test' }, { ...receipt }).then(() => {});
    // Send open drawer command directly if network
    if (receipt.connection.type === 'network') {
      void printNetworkRaw(receipt.connection, bytes);
    }
  }
}

export const printerService = PrintingService.getInstance();

function buildDummyTestTicket(): ReceiptTicket {
  return {
    merchantName: 'TEST',
    ticketNumber: 'TEST-001',
    tvaRatePercent: 10,
    totalInMicrounits: 12_500_000,
    items: [{ name: 'Test impression', qty: 1, priceInMicrounits: 12_500_000 }],
  };
}

// Backward compat — keep EpsonPrinter shape working
export const EpsonPrinter = {
  printReceipt: (ticket: ReceiptTicket) => printerService.printReceipt(ticket),
};
