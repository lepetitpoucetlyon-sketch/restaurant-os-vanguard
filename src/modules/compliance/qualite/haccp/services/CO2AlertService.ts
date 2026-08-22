/**
 * T95 — Asphyxie CO₂ sous-sol (soutireuse tirage bière fuit dans cave).
 *
 * Une fuite de CO₂ dans un sous-sol non ventilé peut atteindre 10 % en volume
 * en quelques minutes (mortelle à 7-10 %). Obligation réglementaire : capteurs
 * CO₂ NDIR dans les locaux avec soutireuses bière + alarme à 5 000 ppm (0,5 %).
 *
 * Ce service traite les alertes capteurs IoT CO₂ et déclenche l'évacuation.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T95 (CRITIQUE — danger mortel).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/lib/audit';

const ALERT_THRESHOLD_PPM = 5000;
const CRITICAL_THRESHOLD_PPM = 30000;

export interface CO2Reading {
  tenantId: string;
  locationId: string;
  ppmLevel: number;
  sensorId?: string;
  operatorId: string;
  now?: number;
}

export interface CO2AlertResult {
  triggered: boolean;
  severity: 'none' | 'warning' | 'critical';
  evacuationRequired: boolean;
}

export class CO2AlertService {
  static classify(ppm: number): { severity: CO2AlertResult['severity']; evacuationRequired: boolean } {
    if (ppm >= CRITICAL_THRESHOLD_PPM) return { severity: 'critical', evacuationRequired: true };
    if (ppm >= ALERT_THRESHOLD_PPM) return { severity: 'warning', evacuationRequired: false };
    return { severity: 'none', evacuationRequired: false };
  }

  static async processReading(reading: CO2Reading): Promise<CO2AlertResult> {
    const now = reading.now ?? Date.now();
    const { severity, evacuationRequired } = this.classify(reading.ppmLevel);

    if (severity === 'none') return { triggered: false, severity: 'none', evacuationRequired: false };

    const alertRecord = {
      id: `co2_${reading.locationId}_${now}`,
      tenantId: reading.tenantId,
      locationId: reading.locationId,
      ppmLevel: reading.ppmLevel,
      severity,
      evacuationRequired,
      threshold: ALERT_THRESHOLD_PPM,
      triggeredAt: now,
    };

    await Nexus.adapter.set(
      `tenants/${reading.tenantId}/safety_alerts/${alertRecord.id}`,
      alertRecord,
    );

    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${reading.tenantId}/safety_alerts`,
      targetId: alertRecord.id,
      priority: OutboxPriority.SANITAIRE,
      payload: alertRecord as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      reading.operatorId,
      'CO2_ALARM_TRIGGERED',
      reading.locationId,
      { ppmLevel: reading.ppmLevel, severity, evacuationRequired },
    ).catch(() => null);

    await NexusEventBus.emit('compliance.co2_alarm_triggered', {
      v: 1,
      tenantId: reading.tenantId,
      locationId: reading.locationId,
      ppmLevel: reading.ppmLevel,
      threshold: ALERT_THRESHOLD_PPM,
      triggeredAt: now,
    });

    return { triggered: true, severity, evacuationRequired };
  }
}
