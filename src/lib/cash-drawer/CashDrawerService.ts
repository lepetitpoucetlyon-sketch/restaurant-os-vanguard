/**
 * CashDrawerService
 *
 * Adapter pattern pour le tiroir-caisse.
 * 4 modes supportés :
 *   printer-kick  — ESC/POS via l'imprimante de ticket (DK port RJ11/RJ12)
 *   serial        — Port série RS-232 direct (Web Serial API)
 *   network       — Tiroir réseau IP (TCP proxy via /api/print/network)
 *   manual        — Pas de kick physique, l'opérateur ouvre manuellement
 */

import { tenantScopedKey } from '@/lib/storage/tenantScopedKey';

const ESC = 0x1b;
const DRAWER_CMD = new Uint8Array([ESC, 0x40, ESC, 0x70, 0x00, 0x19, 0xfa]);

const STORAGE_KEY_BASE = 'ros_drawer_v1';
const storageKey = () => tenantScopedKey(STORAGE_KEY_BASE);

export type DrawerMode = 'printer-kick' | 'serial' | 'network' | 'manual';

export interface DrawerConfig {
  mode: DrawerMode;
  /** Network mode: IP du tiroir (ex: 192.168.1.55) */
  networkIp?: string;
  /** Network mode: port TCP (défaut 9100) */
  networkPort?: number;
  /** Serial mode: baud rate (défaut 9600) */
  baudRate?: number;
}

// ── Serial helpers ────────────────────────────────────────────────────────────

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: { getWriter(): WritableStreamDefaultWriter<Uint8Array> } | null;
}

function getSerial() {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { serial?: { requestPort(): Promise<SerialPortLike>; getPorts(): Promise<SerialPortLike[]> } }).serial ?? null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class CashDrawerService {
  private static _instance: CashDrawerService;
  private _config: DrawerConfig = { mode: 'printer-kick' };

  static getInstance(): CashDrawerService {
    if (!this._instance) this._instance = new CashDrawerService();
    return this._instance;
  }

  constructor() { this._load(); }

  // ─── Config ────────────────────────────────────────────────────────────────

  private _load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) this._config = JSON.parse(raw) as DrawerConfig;
    } catch { /* ignore */ }
  }

  getConfig(): DrawerConfig { return { ...this._config }; }

  save(config: DrawerConfig): void {
    this._config = config;
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey(), JSON.stringify(config));
    }
  }

  // ─── Kick ─────────────────────────────────────────────────────────────────

  async kick(): Promise<{ ok: boolean; error?: string }> {
    switch (this._config.mode) {
      case 'printer-kick': return this._kickViaPrinter();
      case 'serial':       return this._kickViaSerial();
      case 'network':      return this._kickViaNetwork();
      case 'manual':       return { ok: true };
    }
  }

  // ─── Adapters ──────────────────────────────────────────────────────────────

  private async _kickViaPrinter(): Promise<{ ok: boolean; error?: string }> {
    try {
      // Dynamic import to avoid loading PrintingService in all contexts
      const { printerService } = await import('@/lib/printing/PrintingService');
      printerService.openCashDrawer();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Erreur imprimante' };
    }
  }

  private async _kickViaSerial(): Promise<{ ok: boolean; error?: string }> {
    const serial = getSerial();
    if (!serial) return { ok: false, error: 'Web Serial API non supporté sur ce navigateur' };

    let port: SerialPortLike | null = null;
    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    try {
      const ports = await serial.getPorts();
      port = ports[0] ?? await serial.requestPort();
      await port.open({ baudRate: this._config.baudRate ?? 9600 });
      writer = port.writable?.getWriter() ?? null;
      if (!writer) throw new Error('Port série non disponible en écriture');
      await writer.write(DRAWER_CMD);
      writer.releaseLock();
      await port.close();
      return { ok: true };
    } catch (err) {
      writer?.releaseLock();
      await port?.close().catch(() => {});
      return { ok: false, error: err instanceof Error ? err.message : 'Erreur série' };
    }
  }

  private async _kickViaNetwork(): Promise<{ ok: boolean; error?: string }> {
    const ip = this._config.networkIp;
    if (!ip) return { ok: false, error: 'Adresse IP du tiroir non configurée' };
    const port = this._config.networkPort ?? 9100;

    try {
      const res = await fetch('/api/print/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port, data: Array.from(DRAWER_CMD) }),
      });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' };
    }
  }
}

export const cashDrawerService = CashDrawerService.getInstance();
