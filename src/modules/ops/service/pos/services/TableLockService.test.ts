import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableLockService, TableLockData } from './TableLockService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('🔒 TableLockService — Invariant Concurrence & CAS Lock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 'tenant_bistrot_01';
  const tableId = 'tbl_101';

  it('devrait acquérir un nouveau verrou avec succès sur une table libre', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(null);
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);
    const spyEmit = vi.spyOn(NexusEventBus, 'emit').mockResolvedValueOnce(undefined as never);

    const result = await TableLockService.acquireLock(
      tenantId,
      tableId,
      'srv_antoine',
      'Antoine Serveur',
      'order_in_progress',
      60000
    );

    expect(result.success).toBe(true);
    expect(result.lock).toBeDefined();
    expect(result.lock?.tableId).toBe(tableId);
    expect(result.lock?.lockedBy).toBe('srv_antoine');
    expect(result.lock?.version).toBe(1);

    expect(spySet).toHaveBeenCalledWith(
      `tenants/${tenantId}/tableLocks/${tableId}`,
      expect.objectContaining({
        tableId,
        lockedBy: 'srv_antoine',
        version: 1,
      })
    );

    expect(spyEmit).toHaveBeenCalledWith(
      'table.locked',
      expect.objectContaining({
        tenantId,
        tableId,
        lockedBy: 'srv_antoine',
      })
    );
  });

  it('devrait rejeter l\'acquisition si la table est déjà verrouillée par un autre opérateur', async () => {
    const existingLock: TableLockData = {
      tableId,
      lockedBy: 'srv_marie',
      lockedByName: 'Marie Responsable',
      reason: 'order_in_progress',
      lockedAt: Date.now() - 5000,
      expiresAt: Date.now() + 60000, // Toujours actif
      version: 1,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingLock);

    const result = await TableLockService.acquireLock(
      tenantId,
      tableId,
      'srv_antoine',
      'Antoine Serveur'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('TABLE_LOCKED_BY_OTHER');
    expect(result.holder?.lockedBy).toBe('srv_marie');
  });

  it('devrait permettre de renouveler le verrou si c\'est le même opérateur qui le détient', async () => {
    const existingLock: TableLockData = {
      tableId,
      lockedBy: 'srv_antoine',
      lockedByName: 'Antoine Serveur',
      reason: 'order_in_progress',
      lockedAt: Date.now() - 30000,
      expiresAt: Date.now() + 30000,
      version: 1,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingLock);
    vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);
    vi.spyOn(NexusEventBus, 'emit').mockResolvedValueOnce(undefined as never);

    const result = await TableLockService.acquireLock(
      tenantId,
      tableId,
      'srv_antoine',
      'Antoine Serveur',
      'renewal'
    );

    expect(result.success).toBe(true);
    expect(result.lock?.version).toBe(2);
  });

  it('devrait libérer le verrou si l\'opérateur est le détenteur légitime', async () => {
    const existingLock: TableLockData = {
      tableId,
      lockedBy: 'srv_antoine',
      reason: 'order_in_progress',
      lockedAt: Date.now() - 10000,
      expiresAt: Date.now() + 50000,
      version: 1,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingLock);
    const spyDelete = vi.spyOn(Nexus.adapter, 'delete').mockResolvedValueOnce(undefined);
    const spyEmit = vi.spyOn(NexusEventBus, 'emit').mockResolvedValueOnce(undefined as never);

    const result = await TableLockService.releaseLock(tenantId, tableId, 'srv_antoine');

    expect(result.success).toBe(true);
    expect(spyDelete).toHaveBeenCalledWith(`tenants/${tenantId}/tableLocks/${tableId}`);
    expect(spyEmit).toHaveBeenCalledWith(
      'table.unlocked',
      expect.objectContaining({
        tenantId,
        tableId,
        unlockedBy: 'srv_antoine',
      })
    );
  });

  it('devrait refuser la libération si demandée par un autre opérateur sans force: true', async () => {
    const existingLock: TableLockData = {
      tableId,
      lockedBy: 'srv_antoine',
      reason: 'order_in_progress',
      lockedAt: Date.now() - 10000,
      expiresAt: Date.now() + 50000,
      version: 1,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingLock);

    const result = await TableLockService.releaseLock(tenantId, tableId, 'srv_imposteur', false);

    expect(result.success).toBe(false);
    expect(result.error).toBe('NOT_LOCK_OWNER');
  });

  it('devrait forcer la libération (force: true) par un superviseur', async () => {
    const existingLock: TableLockData = {
      tableId,
      lockedBy: 'srv_antoine',
      reason: 'order_in_progress',
      lockedAt: Date.now() - 10000,
      expiresAt: Date.now() + 50000,
      version: 1,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingLock);
    const spyDelete = vi.spyOn(Nexus.adapter, 'delete').mockResolvedValueOnce(undefined);

    const result = await TableLockService.releaseLock(tenantId, tableId, 'mgr_superviseur', true);

    expect(result.success).toBe(true);
    expect(spyDelete).toHaveBeenCalledWith(`tenants/${tenantId}/tableLocks/${tableId}`);
  });

  it('devrait réussir le heartbeat pour prolonger la durée du verrou', async () => {
    const existingLock: TableLockData = {
      tableId,
      lockedBy: 'srv_antoine',
      reason: 'order_in_progress',
      lockedAt: Date.now() - 10000,
      expiresAt: Date.now() + 50000,
      version: 1,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingLock);
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);

    const success = await TableLockService.heartbeat(tenantId, tableId, 'srv_antoine', 120000);
    expect(success).toBe(true);
    expect(spySet).toHaveBeenCalled();
  });

  it('devrait retourner null pour getLock si le verrou est expiré', async () => {
    const expiredLock: TableLockData = {
      tableId,
      lockedBy: 'srv_antoine',
      reason: 'order_in_progress',
      lockedAt: Date.now() - 120000,
      expiresAt: Date.now() - 1000, // Expiré
      version: 1,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(expiredLock);

    const lock = await TableLockService.getLock(tenantId, tableId);
    expect(lock).toBeNull();
  });
});
