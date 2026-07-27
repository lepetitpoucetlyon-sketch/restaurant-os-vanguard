import 'server-only';
import { logger } from '@/lib/logger';

const BASE_URL = 'https://businessapi.mosyle.com/v1';

export interface MosyleDevice {
  serialNumber: string;
  deviceName: string;
  model: string;
  status: 'online' | 'offline';
  lastSeen: string;
  osVersion: string;
  batteryLevel: number;
}

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.MOSYLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export const MosyleClient = {
  async listDevices(): Promise<MosyleDevice[]> {
    const res = await fetch(`${BASE_URL}/listdevices`, {
      headers: getHeaders(),
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      logger.warn(`[Mosyle] listDevices error ${res.status}`);
      throw new Error(`Mosyle API ${res.status}`);
    }
    const data = await res.json() as { devices?: MosyleDevice[] };
    return data.devices ?? [];
  },

  async lockDevice(serialNumber: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/mdm/${serialNumber}/lock`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) {
      logger.warn(`[Mosyle] lock ${serialNumber} error ${res.status}`);
      throw new Error(`Mosyle lock error ${res.status}`);
    }
  },

  async eraseDevice(serialNumber: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/mdm/${serialNumber}/erase`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) {
      logger.warn(`[Mosyle] erase ${serialNumber} error ${res.status}`);
      throw new Error(`Mosyle erase error ${res.status}`);
    }
  },
};
