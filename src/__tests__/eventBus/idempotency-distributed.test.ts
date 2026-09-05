import { describe, it, expect, beforeEach } from 'vitest';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';
import { ServerIdempotencyPersistence } from '@/shared/eventBus/ServerIdempotencyPersistence';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('⚡ Distributed Idempotency & Multi-Worker Atomic Leases (Phase 2)', () => {
  beforeEach(() => {
    IdempotencyGuard.clearMemoryCache();
  });

  it('un seul worker acquiert le bail sur 10 exécutions concurrentes du même événement', async () => {
    const tenantId = 'tenant_multi_worker';
    const eventId = 'evt_payment_atomicity_001';
    const handlerId = 'StockDeductionHandler';
    const eventName = 'order.paid';

    let executionCount = 0;
    const sideEffect = async () => {
      executionCount++;
      // Simule un travail de déstockage atomique
      await new Promise((resolve) => setTimeout(resolve, 20));
    };

    const guardedHandler = IdempotencyGuard.withIdempotencyGuard(
      handlerId,
      eventName,
      sideEffect,
    );

    // 10 workers concurrents reçoivent exactement le même payload au même instant
    const payload = {
      orderId: 'ord_123',
      eventId,
      tenantId,
      amountInMicrounits: 25_000_000,
    };

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => guardedHandler(payload)),
    );

    // Tous les workers terminent avec succès (les 9 doublons sont ignorés sans crash)
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);

    // Invariant fondamental : l'effet de bord (déstockage) n'a été exécuté STRICTEMENT qu'une seule fois
    expect(executionCount).toBe(1);

    // Vérification de l'état persisté
    const path = ServerIdempotencyPersistence.getDocumentPath(tenantId, `order.paid:${eventId}`, handlerId);
    const record = await Nexus.adapter.get<any>(path);
    expect(record).toBeDefined();
    expect(record.status).toBe('completed');
  });

  it('rejette immédiatement un rejeu après clôture du bail', async () => {
    const tenantId = 'tenant_replay';
    const eventId = 'evt_loyalty_replay_002';
    const handlerId = 'LoyaltyAccrualHandler';
    const eventName = 'order.paid';

    let pointsAccrued = 0;
    const guardedHandler = IdempotencyGuard.withIdempotencyGuard(
      handlerId,
      eventName,
      async () => {
        pointsAccrued += 100;
      },
    );

    const payload = { eventId, tenantId, orderId: 'ord_replay_1' };

    // Première exécution
    await guardedHandler(payload);
    expect(pointsAccrued).toBe(100);

    // Deuxième exécution (rejeu / retry externe)
    await guardedHandler(payload);
    expect(pointsAccrued).toBe(100); // Pas de points additionnels
  });

  it('autorise la ré-acquisition du bail après expiration de sa durée de vie (crash worker)', async () => {
    const tenantId = 'tenant_crash';
    const eventId = 'evt_crash_003';
    const handlerId = 'TicketZHandler';
    const eventName = 'order.paid';

    // Simulation d'un worker crashé qui a laissé un bail expiré
    const path = ServerIdempotencyPersistence.getDocumentPath(tenantId, eventId, handlerId);
    await Nexus.adapter.set(path, {
      id: `${eventId}_${handlerId}`,
      eventId,
      handlerId,
      eventName,
      tenantId,
      status: 'leased',
      leasedAt: Date.now() - 100_000,
      expiresAt: Date.now() - 40_000, // Expiré il y a 40s
    });

    const result = await ServerIdempotencyPersistence.acquireLease(
      eventId,
      handlerId,
      eventName,
      tenantId,
      60_000,
    );

    expect(result.acquired).toBe(true);
    expect(result.record?.status).toBe('leased');
  });
});
