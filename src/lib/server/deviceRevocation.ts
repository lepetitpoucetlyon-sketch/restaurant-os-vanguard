import 'server-only';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export const REVOKED_DEVICES_CACHE = new Set<string>();

/**
 * Vérifie si un identifiant d'appareil est révoqué sans dépendre du module facility.
 */
export async function isDeviceRevoked(deviceId: string, tenantId?: string): Promise<boolean> {
  if (REVOKED_DEVICES_CACHE.has(deviceId)) return true;

  if (tenantId) {
    const device = await Nexus.adapter.get<{ status: string }>(`tenants/${tenantId}/devices/${deviceId}`);
    if (device && device.status === 'revoked') {
      REVOKED_DEVICES_CACHE.add(deviceId);
      return true;
    }
  }
  return false;
}
