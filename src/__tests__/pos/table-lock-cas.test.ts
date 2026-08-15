import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TableLockService } from '@/modules/ops/service/pos/services/TableLockService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { registerTableLockHandler } from '@/shared/eventBus/handlers/TableLockHandler';

describe('Invariant #2 & #3 : Verrouillage CAS des Tables (Concurrence POS)', () => {
  let unbindHandlers: () => void;

  beforeEach(async () => {
    vi.clearAllMocks();
    unbindHandlers = registerTableLockHandler();
    // Nettoyer les locks
    await Nexus.adapter.delete('tenants/bistro-paris/tableLocks/tbl-4');
  });

  it('devrait permettre au premier opérateur d acquérir le verrou avec succès', async () => {
    const res = await TableLockService.acquireLock(
      'bistro-paris',
      'tbl-4',
      'op-sarah',
      'Sarah (Serveuse)',
      'taking_order'
    );

    expect(res.success).toBe(true);
    expect(res.lock?.lockedBy).toBe('op-sarah');
    expect(res.lock?.version).toBe(1);
  });

  it('devrait rejeter l acquisition par un second opérateur si le verrou est actif', async () => {
    // 1. Sarah prend la table 4
    await TableLockService.acquireLock(
      'bistro-paris',
      'tbl-4',
      'op-sarah',
      'Sarah (Serveuse)'
    );

    // 2. Thomas tente d ouvrir la même table 4 en même temps
    const conflictRes = await TableLockService.acquireLock(
      'bistro-paris',
      'tbl-4',
      'op-thomas',
      'Thomas (Chef de rang)'
    );

    expect(conflictRes.success).toBe(false);
    expect(conflictRes.error).toBe('TABLE_LOCKED_BY_OTHER');
    expect(conflictRes.holder?.lockedBy).toBe('op-sarah');
  });

  it('devrait empêcher un autre opérateur de libérer le verrou sauf en cas de force (superviseur)', async () => {
    // Sarah verrouille
    await TableLockService.acquireLock('bistro-paris', 'tbl-4', 'op-sarah');

    // Thomas essaie de libérer sans force
    const failRelease = await TableLockService.releaseLock(
      'bistro-paris',
      'tbl-4',
      'op-thomas',
      false
    );
    expect(failRelease.success).toBe(false);
    expect(failRelease.error).toBe('NOT_LOCK_OWNER');

    // Le manager force le déverrouillage
    const forceRelease = await TableLockService.releaseLock(
      'bistro-paris',
      'tbl-4',
      'op-manager',
      true,
      'supervisor_override'
    );
    expect(forceRelease.success).toBe(true);

    // La table est maintenant libre pour Thomas
    const thomasRes = await TableLockService.acquireLock('bistro-paris', 'tbl-4', 'op-thomas');
    expect(thomasRes.success).toBe(true);
  });

  it('devrait permettre la réacquisition si le verrou précédent a expiré (TTL dépassé)', async () => {
    const expiredTime = Date.now() - 1000;
    // Simuler un verrou expiré laissé par une tablette crashée
    await Nexus.adapter.set('tenants/bistro-paris/tableLocks/tbl-4', {
      tableId: 'tbl-4',
      lockedBy: 'op-sarah',
      lockedAt: expiredTime - 60000,
      expiresAt: expiredTime,
      version: 1,
    });

    // Thomas prend la table sans blocage
    const res = await TableLockService.acquireLock('bistro-paris', 'tbl-4', 'op-thomas');
    expect(res.success).toBe(true);
    expect(res.lock?.lockedBy).toBe('op-thomas');
    expect(res.lock?.version).toBe(2);
  });
});
