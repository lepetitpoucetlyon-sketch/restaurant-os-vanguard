import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface GreaseTrapTelemetry {
  trapId: string;
  location: string;
  fatLayerThicknessCm: number;
  totalDepthCm: number;
  lastEmptiedDateIso: string;
}

export interface GreaseTrapStatus {
  trapId: string;
  saturationPct: number;
  requiresEmptying: boolean;
  isCriticalOverflow: boolean;
  alertBanner?: string;
}

/**
 * GreaseTrapSaturationSensorService — Angle mort L63.
 * Surveille le niveau de saturation du bac à graisse et déclenche l'alerte vidange dès 80% pour éviter l'engorgement des canalisations et pollution réseau public.
 */
export class GreaseTrapSaturationSensorService {
  public static readonly WARNING_THRESHOLD_PCT = 80.0;
  public static readonly CRITICAL_THRESHOLD_PCT = 95.0;

  static evaluateSaturation(
    tenantId: string,
    adminId: string,
    telemetry: GreaseTrapTelemetry
  ): GreaseTrapStatus {
    const saturationPct = Math.round((telemetry.fatLayerThicknessCm / telemetry.totalDepthCm) * 1000) / 10;
    const requiresEmptying = saturationPct >= this.WARNING_THRESHOLD_PCT;
    const isCriticalOverflow = saturationPct >= this.CRITICAL_THRESHOLD_PCT;

    if (requiresEmptying) {
      NexusEventBus.emit('compliance.grease_trap_alert', {
        v: 1,
        tenantId,
        trapId: telemetry.trapId,
        saturationPct,
        requiresEmptying,
        detectedAt: Date.now(),
      });

      AuditLogger.logAction({
        adminId,
        action: 'GREASE_TRAP_SATURATION_ALERT',
        targetId: telemetry.trapId,
        ipAddress: '127.0.0.1',
        metadata: {
          saturationPct,
          isCriticalOverflow,
        },
      });
    }

    return {
      trapId: telemetry.trapId,
      saturationPct,
      requiresEmptying,
      isCriticalOverflow,
      alertBanner: requiresEmptying
        ? `⚠️ BAC À GRAISSE SATURÉ (${saturationPct}%) : Vidange par collecteur agréé obligatoire.`
        : undefined,
    };
  }
}
