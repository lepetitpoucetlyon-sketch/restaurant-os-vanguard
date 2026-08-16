import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusPayrollEngine } from './NexusPayrollEngine';
import { NexusTransaction } from '@/lib/adapters/NexusTransaction';
import { FiscalEngine } from '@/modules/finance';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('🎖️ NexusPayrollEngine — Pointage Salarié & Scellement RH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = { id: 'usr_sarah', name: 'Sarah Chef de Rang' };

  it('devrait pointer une arrivée (CLOCK_IN) et générer un scellement inaltérable', async () => {
    vi.spyOn(Nexus.adapter, 'query').mockResolvedValueOnce([]); // Pas de seal précédent
    vi.spyOn(FiscalEngine, 'sealEntry').mockResolvedValueOnce({
      hash: 'HASH_HR_CLOCK_IN_001',
      sequence: 1,
      timestamp: new Date().toISOString(),
      previousHash: 'GENESIS_HR',
      signature: 'SIG_001',
      updatedAt: new Date().toISOString(),
    });

    vi.spyOn(NexusTransaction, 'run').mockImplementation(async (_opts, callback) => {
      const mockTx = {
        set: vi.fn(),
      };
      return await callback(mockTx as never);
    });

    const result = await NexusPayrollEngine.clockIn(mockUser, 'POS_TERMINAL_01');

    expect(result.id).toBeDefined();
    expect(result.sealHash).toBe('HASH_HR_CLOCK_IN_001');
  });

  it('devrait pointer un départ (CLOCK_OUT) avec chaînage du dernier hash', async () => {
    const lastSeal = {
      hash: 'HASH_HR_CLOCK_IN_001',
      sequence: 1,
      timestamp: new Date().toISOString(),
      previousHash: 'GENESIS_HR',
      signature: 'SIG_001',
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(Nexus.adapter, 'query').mockResolvedValueOnce([{ fiscalSeal: lastSeal }]);
    vi.spyOn(FiscalEngine, 'sealEntry').mockResolvedValueOnce({
      hash: 'HASH_HR_CLOCK_OUT_002',
      sequence: 2,
      timestamp: new Date().toISOString(),
      previousHash: 'HASH_HR_CLOCK_IN_001',
      signature: 'SIG_002',
      updatedAt: new Date().toISOString(),
    });

    vi.spyOn(NexusTransaction, 'run').mockImplementation(async (_opts, callback) => {
      const mockTx = {
        set: vi.fn(),
      };
      return await callback(mockTx as never);
    });

    const result = await NexusPayrollEngine.clockOut(mockUser, 'POS_TERMINAL_01');

    expect(result.id).toBeDefined();
    expect(result.sealHash).toBe('HASH_HR_CLOCK_OUT_002');
  });

  it('devrait agréger les statistiques de shift sur une période mensuelle', async () => {
    const stats = await NexusPayrollEngine.aggregatePeriodStats('usr_sarah', '2026-08');

    expect(stats.totalHours).toBe(160);
    expect(stats.validatedEntries).toBe(32);
    expect(stats.isViable).toBe(true);
    expect(stats.simulationReport).toContain('usr_sarah');
  });
});
