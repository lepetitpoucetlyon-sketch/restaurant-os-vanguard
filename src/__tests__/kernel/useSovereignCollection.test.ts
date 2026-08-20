import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

describe('useSovereignCollection — Hook Universel Data Layer', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    it('bloque formellement toute tentative d\'accès aux collections fiscales NF525 immuables', () => {
        expect(() => {
            renderHook(() => useSovereignCollection('journalEntries', { tenantId: 'test-resto' }));
        }).toThrow(/VIOLATION NF525/);

        expect(() => {
            renderHook(() => useSovereignCollection('fiscalSeals', { tenantId: 'test-resto' }));
        }).toThrow(/VIOLATION NF525/);
    });

    it('permet de charger, ajouter et synchroniser des entités standards (ex: reservations)', async () => {
        // Pré-charger une réservation
        await mockAdapter.set('tenants/test-resto/reservations/res-1', {
            id: 'res-1',
            guestName: 'Jean Dupont',
            seats: 4,
        });

        const { result } = renderHook(() =>
            useSovereignCollection<{ id: string; guestName: string; seats: number }>('reservations', {
                tenantId: 'test-resto',
            })
        );

        // Attendre le chargement initial
        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.data.length).toBe(1);
        expect(result.current.data[0].guestName).toBe('Jean Dupont');

        // Ajouter une nouvelle réservation
        await act(async () => {
            await result.current.set({
                id: 'res-2',
                guestName: 'Marie Curie',
                seats: 2,
            });
        });

        expect(result.current.data.length).toBe(2);
        expect(result.current.data.some(r => r.guestName === 'Marie Curie')).toBe(true);

        // Mettre à jour une réservation
        await act(async () => {
            await result.current.update('res-2', { seats: 3 });
        });

        expect(result.current.data.find(r => r.id === 'res-2')?.seats).toBe(3);

        // Supprimer une réservation
        await act(async () => {
            await result.current.delete('res-1');
        });

        expect(result.current.data.length).toBe(1);
        expect(result.current.data[0].id).toBe('res-2');
    });
});
