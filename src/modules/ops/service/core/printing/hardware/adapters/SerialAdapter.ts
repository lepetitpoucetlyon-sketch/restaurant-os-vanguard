import type { SerialConnection, PrintResult } from '../types';
import { toError } from "@/lib/toError";

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: { getWriter(): WritableStreamDefaultWriter<Uint8Array> } | null;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
}
interface SerialAPI {
  requestPort(options?: { filters?: Array<{ usbVendorId?: number }> }): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

function getSerial(): SerialAPI | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { serial?: SerialAPI }).serial ?? null;
}

export function isSerialSupported(): boolean {
  return getSerial() !== null;
}

export async function requestSerialPrinter(): Promise<SerialPort | null> {
  const serial = getSerial();
  if (!serial) return null;
  return serial.requestPort();
}

export async function printSerial(
  conn: SerialConnection,
  data: Uint8Array
): Promise<PrintResult> {
  const serial = getSerial();
  if (!serial) return { success: false, method: 'serial', error: 'Web Serial non supporté' };

  let port: SerialPort | null = null;
  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  try {
    const ports = await serial.getPorts();
    port = ports[0] ?? await serial.requestPort();

    await port.open({ baudRate: conn.baudRate });
    if (!port.writable) throw new Error('Port série non accessible en écriture');

    writer = port.writable.getWriter();
    await writer.write(data);
    await writer.releaseLock();
    await port.close();

    return { success: true, method: 'serial' };
  } catch (err) {
    if (writer) { try { writer.releaseLock(); } catch { /* ignore */ } }
    if (port) { await port.close().catch(() => {}); }
    return { success: false, method: 'serial', error: toError(err).message };
  }
}
