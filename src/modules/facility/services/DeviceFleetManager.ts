import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type DeviceType =
  | 'pos_fixed'
  | 'kds_kitchen'
  | 'tpe_handheld'
  | 'kiosk_totem'
  | 'mobile_staff'
  | 'laptop_manager';

export type DeviceStatus = 'active' | 'revoked' | 'pending';

export interface DeviceRecord {
  deviceId: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  deviceName: string;
  deviceType: DeviceType;
  os?: string;
  browser?: string;
  lastIp?: string;
  lastWifiBssid?: string;
  lastActiveAt: string;
  pairedAt: string;
  passkeyId?: string;
  status: DeviceStatus;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

// Cache local en mémoire pour vérification ultra-rapide (< 1ms) sur chaque requête API
const REVOKED_DEVICES_CACHE = new Set<string>();

export class DeviceFleetManager {
  /**
   * Enregistre un nouvel appareil ou met à jour son horodatage de présence.
   */
  static async registerOrHeartbeat(
    tenantId: string,
    device: Partial<DeviceRecord> & { deviceId: string; deviceName: string; deviceType: DeviceType }
  ): Promise<DeviceRecord> {
    const existing = await this.getDevice(tenantId, device.deviceId);

    if (existing && existing.status === 'revoked') {
      REVOKED_DEVICES_CACHE.add(device.deviceId);
      throw new Error(`[DeviceFleetManager] Appareil ${device.deviceId} révoqué — connexion refusée.`);
    }

    const now = new Date().toISOString();
    const record: DeviceRecord = {
      deviceId: device.deviceId,
      tenantId,
      userId: device.userId ?? existing?.userId,
      userName: device.userName ?? existing?.userName,
      deviceName: device.deviceName || existing?.deviceName || 'Terminal sans nom',
      deviceType: device.deviceType || existing?.deviceType || 'pos_fixed',
      os: device.os ?? existing?.os,
      browser: device.browser ?? existing?.browser,
      lastIp: device.lastIp ?? existing?.lastIp,
      lastWifiBssid: device.lastWifiBssid ?? existing?.lastWifiBssid,
      lastActiveAt: now,
      pairedAt: existing?.pairedAt ?? now,
      passkeyId: device.passkeyId ?? existing?.passkeyId,
      status: 'active',
    };

    await Nexus.adapter.set(`tenants/${tenantId}/devices/${device.deviceId}`, record);
    return record;
  }

  /**
   * Récupère la liste de tous les terminaux de l'établissement.
   */
  static async listDevices(tenantId: string): Promise<DeviceRecord[]> {
    try {
      return await Nexus.adapter.query<DeviceRecord>(`tenants/${tenantId}/devices`, {});
    } catch (err) {
      logger.warn(`[DeviceFleetManager] Échec récupération liste terminaux pour tenant ${tenantId}`, { error: err });
      return [];
    }
  }

  /**
   * Récupère les détails d'un terminal spécifique.
   */
  static async getDevice(tenantId: string, deviceId: string): Promise<DeviceRecord | null> {
    try {
      const results = await Nexus.adapter.query<DeviceRecord>(`tenants/${tenantId}/devices`, {
        where: [{ field: 'deviceId', operator: '==', value: deviceId }],
      });
      return results[0] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si un identifiant d'appareil est révoqué.
   */
  static async isDeviceRevoked(deviceId: string, tenantId?: string): Promise<boolean> {
    if (REVOKED_DEVICES_CACHE.has(deviceId)) return true;

    if (tenantId) {
      const device = await this.getDevice(tenantId, deviceId);
      if (device && device.status === 'revoked') {
        REVOKED_DEVICES_CACHE.add(deviceId);
        return true;
      }
    }
    return false;
  }

  /**
   * 🚨 KILL-SWITCH : Révoque un appareil à distance, annule sa session et émet l'ordre de Remote Wipe.
   */
  static async revokeDevice(
    tenantId: string,
    deviceId: string,
    revokedBy: string,
    reason: string = 'Vol, perte ou fin de contrat'
  ): Promise<void> {
    const now = new Date().toISOString();
    REVOKED_DEVICES_CACHE.add(deviceId);

    await Nexus.adapter.update(`tenants/${tenantId}/devices/${deviceId}`, {
      status: 'revoked',
      revokedAt: now,
      revokedBy,
      revocationReason: reason,
    });

    // Émettre l'événement de Remote Wipe pour vider le cache déconnecté du terminal
    try {
      await NexusEventBus.emit('security.device_remote_wipe', {
        tenantId,
        deviceId,
        revokedAt: now,
        revokedBy,
      });
    } catch (err) {
      logger.warn('[DeviceFleetManager] Erreur émission security.device_remote_wipe', { error: err });
    }

    logger.warn(`[DeviceFleetManager] 🚨 Appareil révoqué : ${deviceId} (Tenant: ${tenantId}, Par: ${revokedBy}, Motif: ${reason})`);
  }
}
