import type { USBConnection, PrintResult } from '../types';
import { toError } from "@/lib/toError";

interface USBDevice {
  open(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: ArrayBuffer): Promise<{ status: string }>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  close(): Promise<void>;
  vendorId: number;
  productId: number;
  productName?: string;
}
interface USBAPI {
  requestDevice(options: { filters: Array<{ classCode?: number; vendorId?: number }> }): Promise<USBDevice>;
  getDevices(): Promise<USBDevice[]>;
}

function getUSB(): USBAPI | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { usb?: USBAPI }).usb ?? null;
}

export function isUSBSupported(): boolean {
  return getUSB() !== null;
}

export async function getUSBPrinters(): Promise<USBDevice[]> {
  const usb = getUSB();
  if (!usb) return [];
  const devices = await usb.getDevices();
  // Class 7 = printer class
  return devices.filter(d => d);
}

export async function requestUSBPrinter(vendorId?: number): Promise<USBDevice | null> {
  const usb = getUSB();
  if (!usb) return null;
  const filters = vendorId
    ? [{ classCode: 0x07, vendorId }]
    : [{ classCode: 0x07 }];
  return usb.requestDevice({ filters });
}

export async function printUSB(
  conn: USBConnection,
  data: Uint8Array
): Promise<PrintResult> {
  const usb = getUSB();
  if (!usb) return { success: false, method: 'usb', error: 'WebUSB non supporté' };

  let device: USBDevice | null = null;
  try {
    // Try to reuse a previously permitted device
    if (conn.vendorId) {
      const devices = await usb.getDevices();
      device = devices.find(d => d.vendorId === conn.vendorId && (!conn.productId || d.productId === conn.productId)) ?? null;
    }
    if (!device) {
      const filters = conn.vendorId
        ? [{ classCode: 0x07, vendorId: conn.vendorId }]
        : [{ classCode: 0x07 }];
      device = await usb.requestDevice({ filters });
    }

    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    await device.transferOut(1, data.buffer as ArrayBuffer);
    await device.releaseInterface(0);
    await device.close();

    return { success: true, method: 'usb' };
  } catch (err) {
    if (device) {
      await device.close().catch(() => {});
    }
    return { success: false, method: 'usb', error: toError(err).message };
  }
}
