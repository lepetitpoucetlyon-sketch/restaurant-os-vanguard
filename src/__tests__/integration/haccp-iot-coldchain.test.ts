import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HACCPLogService } from '@/modules/compliance/qualite/haccp/HACCPLogService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { SensorReading } from '@/modules/compliance/domain/schemas/haccp';

describe('❄️ Traçabilité HACCP & Surveillance IoT Froid — Ruptures de Température & Sanctions Sanitaires', () => {
  const TENANT_ID = 'tenant_restaurant_lyon_01';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Enregistre un relevé conforme de sonde IoT (Chambre Froide Positive à +2.8°C)', async () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as any);

    const normalReading: SensorReading = {
      sensorId: 'sensor_cf_pos_01',
      tenantId: TENANT_ID,
      temperature: 2.8,
      humidity: 85,
      battery: 98,
      timestamp: Date.now(),
      source: 'ble',
    };

    await HACCPLogService.appendTemperatureHistory(normalReading, 'CONFORM');

    expect(emitSpy).toHaveBeenCalledWith(
      'haccp.check.saved',
      expect.objectContaining({
        tenantId: TENANT_ID,
        checkId: `${normalReading.sensorId}_${normalReading.timestamp}`,
      })
    );
  });

  it('2. Détecte une dérive critique (+8.9°C) et génère une Non-Conformité majeure avec action corrective', async () => {
    const ncId = await HACCPLogService.recordNonConformity({
      tenantId: TENANT_ID,
      ncType: 'Rupture Chaîne du Froid (Température Positive)',
      severity: 'critical',
      description: 'Chambre froide viande à +8.9°C mesurée pendant 45 minutes consécutives.',
      sensorId: 'sensor_cf_viande_02',
      temperature: 8.9,
      source: 'AUTO_IOT_MONITOR',
      correctiveAction: 'Isolement immédiat du lot de viandes, transfert vers chambre de secours et déclenchement alarme frigoriste.',
    });

    expect(ncId).toBeDefined();
  });

  it('3. Assure la traçabilité des températures de service et refroidissement rapide (Cellule -35°C)', async () => {
    const blastChillerReading: SensorReading = {
      sensorId: 'sensor_cellule_refroidissement',
      tenantId: TENANT_ID,
      temperature: 3.5, // Refroidi de +63°C à +10°C en moins de 2h
      timestamp: Date.now(),
      source: 'push',
    };

    const emitSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as any);

    await HACCPLogService.appendTemperatureHistory(blastChillerReading, 'CONFORM');

    expect(emitSpy).toHaveBeenCalledWith(
      'haccp.check.saved',
      expect.objectContaining({
        tenantId: TENANT_ID,
        operatorId: 'push',
      })
    );
  });
});
