import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from './types';
import { ManualAdapter } from './adapters/ManualAdapter';
import { tenantScopedKey } from '@/infrastructure/services/storage/tenantScopedKey';
import { buildAdapter } from './_TerminalAdapterFactory';

const STORAGE_KEY_BASE = 'ros_terminals_v1';
const storageKey = () => tenantScopedKey(STORAGE_KEY_BASE);

// ── Singleton ─────────────────────────────────────────────────────────────────

export class PaymentTerminalService {
  private static _instance: PaymentTerminalService;
  private devices: TerminalDevice[] = [];
  private adapters = new Map<string, IPaymentTerminalAdapter>();

  static getInstance(): PaymentTerminalService {
    if (!this._instance) this._instance = new PaymentTerminalService();
    return this._instance;
  }

  constructor() { this.load(); }

  // ─── Persistence ────────────────────────────────────────────────────────────

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) this.devices = JSON.parse(raw) as TerminalDevice[];
    } catch { /* ignore */ }
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey(), JSON.stringify(this.devices));
  }

  // ─── Device management ───────────────────────────────────────────────────────

  getAll(): TerminalDevice[] { return [...this.devices]; }

  getDefault(): TerminalDevice | null {
    return this.devices.find(d => d.isDefault && d.enabled) ?? this.devices.find(d => d.enabled) ?? null;
  }

  add(device: Omit<TerminalDevice, 'id'>): TerminalDevice {
    const d: TerminalDevice = { ...device, id: `tpe_${Date.now()}` };
    if (!this.devices.some(x => x.isDefault)) d.isDefault = true;
    this.devices.push(d);
    this.save();
    return d;
  }

  update(id: string, patch: Partial<TerminalDevice>): void {
    const idx = this.devices.findIndex(d => d.id === id);
    if (idx === -1) return;
    this.devices[idx] = { ...this.devices[idx], ...patch };
    this.save();
  }

  remove(id: string): void {
    this.adapters.get(id)?.disconnect().catch(() => {});
    this.adapters.delete(id);
    this.devices = this.devices.filter(d => d.id !== id);
    this.save();
  }

  setDefault(id: string): void {
    for (const d of this.devices) d.isDefault = d.id === id;
    this.save();
  }

  // ─── Adapter lifecycle ───────────────────────────────────────────────────────

  async connect(deviceId: string): Promise<void> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) throw new Error(`Terminal ${deviceId} inconnu`);
    const adapter = await buildAdapter(device.adapter);
    await adapter.connect(device);
    this.adapters.set(deviceId, adapter);
  }

  async disconnect(deviceId: string): Promise<void> {
    await this.adapters.get(deviceId)?.disconnect();
    this.adapters.delete(deviceId);
  }

  getStatus(deviceId: string): TerminalStatus {
    return this.adapters.get(deviceId)?.getStatus() ?? 'disconnected';
  }

  // ─── Payment ─────────────────────────────────────────────────────────────────

  /**
   * Charge using the default terminal.
   * Falls back to ManualAdapter if no terminal is connected.
   */
  async charge(request: PaymentRequest): Promise<PaymentResult> {
    const device = this.getDefault();
    if (!device) {
      // No terminal configured — use manual fallback
      const manual = new ManualAdapter();
      await manual.connect({ id: 'fallback', name: 'Manuel', adapter: 'manual', connection: 'lan', isDefault: true, enabled: true });
      return manual.charge(request);
    }

    let adapter = this.adapters.get(device.id);
    if (!adapter || adapter.getStatus() === 'disconnected') {
      await this.connect(device.id);
      adapter = this.adapters.get(device.id)!;
    }

    return adapter.charge(request);
  }

  async chargeWith(deviceId: string, request: PaymentRequest): Promise<PaymentResult> {
    const adapter = this.adapters.get(deviceId);
    if (!adapter) throw new Error('Terminal non connecté');
    return adapter.charge(request);
  }

  async refund(deviceId: string, request: RefundRequest): Promise<RefundResult> {
    const adapter = this.adapters.get(deviceId);
    if (!adapter) throw new Error('Terminal non connecté');
    return adapter.refund(request);
  }

  async cancelCurrent(deviceId: string): Promise<void> {
    await this.adapters.get(deviceId)?.cancelCurrent();
  }

  /** Expose the ManualAdapter for the UI to call confirmPayment() */
  getManualAdapter(deviceId: string): ManualAdapter | null {
    const a = this.adapters.get(deviceId);
    return a instanceof ManualAdapter ? a : null;
  }
}

export const terminalService = PaymentTerminalService.getInstance();
