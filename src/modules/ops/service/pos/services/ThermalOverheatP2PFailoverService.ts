import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface DeviceTelemetryState {
  tenantId: string;
  deviceId: string;
  deviceModel: string;
  batteryTempCelsius: number;
  cpuTempCelsius: number;
  activeOrderId?: string;
  backupDeviceId?: string;
}

export interface OverheatFailoverResult {
  isOverheated: boolean;
  maxTempCelsius: number;
  failoverTriggered: boolean;
  failoverQrPayload?: string;
  instructionText: string;
}

/**
 * ThermalOverheatP2PFailoverService — Angle mort L45.
 * Détecte la surchauffe thermique (>50°C) des iPads/tablettes en terrasse en plein été et génère un QR de bascule instantanée P2P vers un appareil relais.
 */
export class ThermalOverheatP2PFailoverService {
  public static readonly CRITICAL_TEMP_THRESHOLD_CELSIUS = 50.0;

  static async evaluateThermalState(state: DeviceTelemetryState): Promise<OverheatFailoverResult> {
    const maxTemp = Math.max(state.batteryTempCelsius, state.cpuTempCelsius);
    const isOverheated = maxTemp >= this.CRITICAL_TEMP_THRESHOLD_CELSIUS;

    if (isOverheated) {
      const targetId = state.backupDeviceId || 'BACKUP_FLOOR_TERMINAL';
      const qrPayload = JSON.stringify({
        sourceDevice: state.deviceId,
        targetDevice: targetId,
        activeOrderId: state.activeOrderId,
        failoverTs: Date.now(),
      });

      NexusEventBus.emit('facility.device_overheated', {
        v: 1,
        tenantId: state.tenantId,
        deviceId: state.deviceId,
        temperatureCelsius: maxTemp,
        targetFailoverTerminalId: targetId,
        failoverAt: Date.now(),
      });

      await AuditLogger.logAction({
        adminId: 'SYSTEM_HARDWARE',
        action: 'DEVICE_OVERHEAT_FAILOVER',
        targetId: state.deviceId,
        ipAddress: '127.0.0.1',
        metadata: {
          maxTemp,
          targetId,
          activeOrderId: state.activeOrderId,
        },
      });

      return {
        isOverheated: true,
        maxTempCelsius: maxTemp,
        failoverTriggered: true,
        failoverQrPayload: qrPayload,
        instructionText: `🚨 ALERTE SURCHAUFFE (${maxTemp}°C) : Tablette en sécurité. Flashez le QR depuis le terminal de secours pour reprendre la table.`,
      };
    }

    return {
      isOverheated: false,
      maxTempCelsius: maxTemp,
      failoverTriggered: false,
      instructionText: 'Température normale.',
    };
  }
}
