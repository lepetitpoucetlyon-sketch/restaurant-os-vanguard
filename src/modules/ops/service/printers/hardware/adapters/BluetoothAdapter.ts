import type { BluetoothConnection, PrinterBrand, PrintResult } from '../types';
import { BLE_SERVICES, BLE_CHARACTERISTICS } from '../types';
import { toError } from "@/lib/toError";

// Web Bluetooth API types (not in TS lib by default)
interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: ArrayBuffer): Promise<void>;
  writeValueWithoutResponse(value: ArrayBuffer): Promise<void>;
}
interface BluetoothRemoteGATTService {
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
}
interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
}
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}
interface BluetoothAPI {
  requestDevice(options: {
    filters?: Array<{ services?: string[]; namePrefix?: string }>;
    acceptAllDevices?: boolean;
    optionalServices?: string[];
  }): Promise<BluetoothDevice>;
  getDevices?(): Promise<BluetoothDevice[]>;
}

function getBluetooth(): BluetoothAPI | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { bluetooth?: BluetoothAPI }).bluetooth ?? null;
}

export function isBluetoothSupported(): boolean {
  return getBluetooth() !== null;
}

export async function scanBluetoothPrinters(brand: PrinterBrand): Promise<BluetoothDevice | null> {
  const bt = getBluetooth();
  if (!bt) throw new Error('Web Bluetooth non supporté sur ce navigateur');

  const serviceUuid = BLE_SERVICES[brand] ?? BLE_SERVICES.generic;
  const namePrefix = brand === 'epson' ? 'EPSON'
    : brand === 'star' ? 'Star'
    : brand === 'bixolon' ? 'SPP'
    : undefined;

  const filters = namePrefix
    ? [{ services: [serviceUuid] }, { namePrefix }]
    : [{ services: [serviceUuid] }];

  const device = await bt.requestDevice({ filters, optionalServices: [serviceUuid] });
  return device;
}

const CHUNK_SIZE = 512; // BLE MTU safe size

export async function printBluetooth(
  conn: BluetoothConnection,
  data: Uint8Array,
  brand: PrinterBrand
): Promise<PrintResult> {
  const bt = getBluetooth();
  if (!bt) return { success: false, method: 'bluetooth', error: 'Web Bluetooth non supporté' };

  try {
    const serviceUuid = BLE_SERVICES[brand] ?? BLE_SERVICES.generic;
    const charUuid    = BLE_CHARACTERISTICS[brand] ?? BLE_CHARACTERISTICS.generic;

    // Try to reuse a previously paired device by ID
    let device: BluetoothDevice | null = null;
    if (conn.deviceId && bt.getDevices) {
      const paired = await bt.getDevices();
      device = paired.find(d => d.id === conn.deviceId) ?? null;
    }

    if (!device) {
      device = await bt.requestDevice({
        filters: [{ services: [serviceUuid] }],
        optionalServices: [serviceUuid],
      });
    }

    if (!device.gatt) throw new Error('GATT non disponible');

    const server = device.gatt.connected
      ? device.gatt
      : await device.gatt.connect();

    const service = await server.getPrimaryService(serviceUuid);
    const char    = await service.getCharacteristic(charUuid);

    // Send in chunks to avoid BLE MTU limit
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      try {
        await char.writeValueWithoutResponse(chunk.buffer);
      } catch (_noResponseErr) {
        // writeValueWithoutResponse non supporté → fallback BLE compatible
        await char.writeValue(chunk.buffer);
      }
      // Small delay between chunks to avoid BLE congestion
      if (offset + CHUNK_SIZE < data.length) {
        await new Promise(r => setTimeout(r, 20));
      }
    }

    return { success: true, method: 'bluetooth' };
  } catch (err) {
    return { success: false, method: 'bluetooth', error: toError(err).message };
  }
}
