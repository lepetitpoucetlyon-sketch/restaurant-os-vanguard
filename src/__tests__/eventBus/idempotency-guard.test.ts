import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus, IdempotencyGuard } from '@/shared/eventBus/NexusEventBus';
import { db } from '@/lib/offline/offline-store';

describe('Invariant #1 : Idempotence de l EventBus & De-duplication Log', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        IdempotencyGuard.clearMemoryCache();
        try {
            await db.processedEvents.clear();
        } catch {
            // Environnement sans IndexedDB
        }
    });

    it('devrait bloquer la double exécution d un handler pour un même eventId', async () => {
        const handlerFn = vi.fn();

        NexusEventBus.on('order.paid', handlerFn, {
            id: 'stock-deduction-handler',
            priority: 'HIGH',
            idempotent: true,
        });

        const payload1 = {
            eventId: 'evt-order-1001',
            tenantId: 'bistro-parisien',
            orderId: 'ord-1001',
            tableId: 'tbl-4',
            items: [] as unknown[],
            amountInCents: 5000,
            paymentMethod: 'card',
        };

        // 1. Première émission
        await NexusEventBus.emit('order.paid', payload1 as never);
        expect(handlerFn).toHaveBeenCalledTimes(1);

        // 2. Re-jeu de l'événement (retry réseau ou webhook répété)
        await NexusEventBus.emit('order.paid', payload1 as never);
        expect(handlerFn).toHaveBeenCalledTimes(1); // Ne doit PAS être ré-exécuté

        // 3. Émission d'un nouvel événement avec un eventId différent
        const payload2 = {
            ...payload1,
            eventId: 'evt-order-1002',
            orderId: 'ord-1002',
        };

        await NexusEventBus.emit('order.paid', payload2 as never);
        expect(handlerFn).toHaveBeenCalledTimes(2);
    });

    it('devrait permettre à deux handlers différents d exécuter chacun leur tâche une seule fois pour le même eventId', async () => {
        const stockHandler = vi.fn();
        const loyaltyHandler = vi.fn();

        NexusEventBus.on('order.paid', stockHandler, {
            id: 'stock-handler-01',
            idempotent: true,
        });

        NexusEventBus.on('order.paid', loyaltyHandler, {
            id: 'loyalty-handler-01',
            idempotent: true,
        });

        const payload = {
            eventId: 'evt-order-2001',
            tenantId: 'bistro-parisien',
            orderId: 'ord-2001',
            tableId: 'tbl-2',
            items: [],
            amountInCents: 3000,
            paymentMethod: 'cash',
        } as never;

        // Premier passage : les 2 handlers tournent
        await NexusEventBus.emit('order.paid', payload);
        expect(stockHandler).toHaveBeenCalledTimes(1);
        expect(loyaltyHandler).toHaveBeenCalledTimes(1);

        // Deuxième passage (doublon) : aucun handler ne tourne
        await NexusEventBus.emit('order.paid', payload);
        expect(stockHandler).toHaveBeenCalledTimes(1);
        expect(loyaltyHandler).toHaveBeenCalledTimes(1);
    });

    it('devrait laisser passer normalement les événements sans eventId si non spécifié', async () => {
        const simpleHandler = vi.fn();

        NexusEventBus.on('order.paid', simpleHandler, {
            id: 'simple-handler-no-id',
            idempotent: true,
        });

        const legacyPayload = {
            tenantId: 'bistro-parisien',
            orderId: 'ord-legacy',
            tableId: 'tbl-1',
            items: [],
            amountInCents: 1000,
            paymentMethod: 'card',
        } as never;

        await NexusEventBus.emit('order.paid', legacyPayload);
        await NexusEventBus.emit('order.paid', legacyPayload);

        expect(simpleHandler).toHaveBeenCalledTimes(2);
    });
});
