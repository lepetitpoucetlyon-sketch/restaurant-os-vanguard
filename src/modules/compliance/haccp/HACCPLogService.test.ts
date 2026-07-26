import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock de l'adapter Nexus ---
const { mockSet, mockGenerateId } = vi.hoisted(() => ({
  mockSet: vi.fn().mockResolvedValue(undefined),
  mockGenerateId: vi.fn((path: string) => `${path.split('/').pop()}-id`),
}));

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { set: mockSet, generateId: mockGenerateId } },
}));

import { HACCPLogService } from './HACCPLogService';
import type { SensorReading } from './iot/IoTSensorService';

const reading: SensorReading = {
  sensorId: 'frigo-1',
  tenantId: 't1',
  temperature: 11,
  humidity: 60,
  battery: 90,
  timestamp: 1_700_000_000_000,
  source: 'push',
};

describe('🌡️ HACCPLogService — registre sanitaire', () => {
  beforeEach(() => vi.clearAllMocks());

  it("appendTemperatureHistory écrit dans iotHistory (append-only, clé sensorId_ts)", async () => {
    await HACCPLogService.appendTemperatureHistory(reading, 'NON_CONFORM');
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [path, data] = mockSet.mock.calls[0];
    expect(path).toBe('tenants/t1/iotHistory/frigo-1_1700000000000');
    expect(data).toMatchObject({ temperature: 11, status: 'NON_CONFORM', sensorId: 'frigo-1' });
  });

  it("recordNonConformity écrit un haccpLog IMMUABLE + un dossier nonConformities", async () => {
    const ncId = await HACCPLogService.recordNonConformity({
      tenantId: 't1',
      ncType: 'température hors norme',
      severity: 'critical',
      description: 'Frigo 1 à +11°C',
      sensorId: 'frigo-1',
      temperature: 11,
      source: 'push',
    });

    const paths = mockSet.mock.calls.map((c) => c[0] as string);
    // 1. journal immuable
    expect(paths.some((p) => p.startsWith('tenants/t1/haccpLogs/'))).toBe(true);
    // 2. dossier de suivi (même collection que le formulaire manager)
    expect(paths.some((p) => p.startsWith('tenants/t1/nonConformities/'))).toBe(true);

    const haccpLog = mockSet.mock.calls.find((c) => (c[0] as string).includes('/haccpLogs/'))?.[1];
    expect(haccpLog).toMatchObject({ type: 'NON_CONFORMITY', status: 'NON_CONFORM', severity: 'critical' });

    const nc = mockSet.mock.calls.find((c) => (c[0] as string).includes('/nonConformities/'))?.[1] as Record<string, unknown>;
    // Forme compatible NonConformityForm : type / description / correctiveAction / responsible / status / createdAt.
    expect(nc.status).toBe('open');
    expect(nc.type).toBe('température hors norme');
    expect(nc.correctiveAction).toBeTruthy();
    expect(typeof nc.createdAt).toBe('number');
    expect(nc.haccpLogId).toBeTruthy();

    expect(ncId).toBeTruthy();
  });
});
