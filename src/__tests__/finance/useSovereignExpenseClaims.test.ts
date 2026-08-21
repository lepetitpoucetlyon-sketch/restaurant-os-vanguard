/**
 * useSovereignExpenseClaims — Tests de l'adapter du pilier finance.
 * ADR-009 Phase 1 — preuve end-to-end que expenseClaims transite bien par la stack
 * offline-first (Nexus + Outbox) sans violer NF525.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSovereignExpenseClaims } from '@/modules/finance/hooks/useSovereignExpenseClaims';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { db } from '@/lib/offline/offline-store';

const TENANT = 'tenant_test_expense';
const SUBMITTER = '11111111-1111-4111-8111-111111111111';
const APPROVER = '22222222-2222-4222-8222-222222222222';

describe('useSovereignExpenseClaims — Adapter souverain (pilier finance)', () => {
    let mockAdapter: MockAdapter;

    beforeEach(async () => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        await db.syncQueue.clear();
        vi.restoreAllMocks();
    });

    // ─── Garde NF525 ────────────────────────────────────────────────────────

    it('n\'importe PAS une collection immuable NF525 (expenseClaims est bien mutable)', () => {
        expect(() =>
            renderHook(() =>
                useSovereignExpenseClaims({ tenantId: TENANT, autoSync: false }),
            ),
        ).not.toThrow();
    });

    // ─── Cycle de vie complet ───────────────────────────────────────────────

    it('submit() ajoute une note de frais en status pending avec ID généré', async () => {
        const { result } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: TENANT, autoSync: false }),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let newId = '';
        await act(async () => {
            newId = await result.current.submit({
                submittedBy: SUBMITTER,
                amountInMicrounits: 12_500_000, // 12,50 €
                category: 'food',
                description: 'Déjeuner client',
            });
        });

        expect(newId).toMatch(/^exp_/);
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data[0].status).toBe('pending');
        expect(result.current.data[0].amountInMicrounits).toBe(12_500_000);
        expect(result.current.data[0].category).toBe('food');
    });

    it('approve() change status en approved + trace approvedBy + processedAt', async () => {
        const { result } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.submit({
                submittedBy: SUBMITTER,
                amountInMicrounits: 5_000_000,
                category: 'travel',
                description: 'Taxi retour',
            });
        });

        await act(async () => {
            await result.current.approve(id, APPROVER);
        });

        const claim = result.current.data.find(c => c.id === id);
        expect(claim?.status).toBe('approved');
        expect(claim?.approvedBy).toBe(APPROVER);
        expect(claim?.processedAt).toBeDefined();
    });

    it('reject() change status en rejected avec approvedBy et processedAt', async () => {
        const { result } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.submit({
                submittedBy: SUBMITTER,
                amountInMicrounits: 999_000_000,
                category: 'other',
                description: 'Dépense suspecte',
            });
        });

        await act(async () => {
            await result.current.reject(id, APPROVER);
        });

        const claim = result.current.data.find(c => c.id === id);
        expect(claim?.status).toBe('rejected');
        expect(claim?.approvedBy).toBe(APPROVER);
    });

    it('reimburse() marque status reimbursed', async () => {
        const { result } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.submit({
                submittedBy: SUBMITTER,
                amountInMicrounits: 25_000_000,
                category: 'equipment',
                description: 'Nouvelle poêle',
            });
            await result.current.approve(id, APPROVER);
            await result.current.reimburse(id);
        });

        const claim = result.current.data.find(c => c.id === id);
        expect(claim?.status).toBe('reimbursed');
    });

    it('remove() supprime la note de la liste', async () => {
        const { result } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: TENANT, autoSync: false }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let id = '';
        await act(async () => {
            id = await result.current.submit({
                submittedBy: SUBMITTER,
                amountInMicrounits: 1_000_000,
                category: 'other',
                description: 'À supprimer',
            });
        });

        expect(result.current.data).toHaveLength(1);

        await act(async () => {
            await result.current.remove(id);
        });

        expect(result.current.data.find(c => c.id === id)).toBeUndefined();
    });

    // ─── Filtrage ───────────────────────────────────────────────────────────

    it("statusFilter='pending' au chargement ne retourne que les notes pending", async () => {
        // Pré-remplir Nexus directement (bypass Outbox pour tester le filtre initial)
        await mockAdapter.set(`tenants/${TENANT}/expenseClaims/exp_seed_1`, {
            id: 'exp_seed_1', status: 'pending', amountInMicrounits: 1_000_000,
            category: 'food', description: 'Reste pending', submittedBy: SUBMITTER,
            submittedAt: new Date().toISOString(), userName: 'x', userRole: 'employee',
        });
        await mockAdapter.set(`tenants/${TENANT}/expenseClaims/exp_seed_2`, {
            id: 'exp_seed_2', status: 'approved', amountInMicrounits: 2_000_000,
            category: 'food', description: 'Déjà approuvée', submittedBy: SUBMITTER,
            approvedBy: APPROVER, submittedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(), userName: 'x', userRole: 'employee',
        });

        const { result: filtered } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: TENANT, statusFilter: 'pending', autoSync: false }),
        );
        await waitFor(() => expect(filtered.current.isLoading).toBe(false));

        const ids = filtered.current.data.map(c => c.id);
        expect(ids).toContain('exp_seed_1');
        expect(ids).not.toContain('exp_seed_2');
    });

    // ─── Isolation par tenant ────────────────────────────────────────────────

    it('deux tenants voient leurs propres notes de frais, jamais les autres', async () => {
        const { result: r1 } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: 'tenant_A', autoSync: false }),
        );
        const { result: r2 } = renderHook(() =>
            useSovereignExpenseClaims({ tenantId: 'tenant_B', autoSync: false }),
        );

        await waitFor(() => {
            expect(r1.current.isLoading).toBe(false);
            expect(r2.current.isLoading).toBe(false);
        });

        await act(async () => {
            await r1.current.submit({
                submittedBy: SUBMITTER, amountInMicrounits: 5_000_000,
                category: 'food', description: 'Note tenant A',
            });
        });

        await act(async () => {
            await r2.current.refresh();
        });

        expect(r1.current.data).toHaveLength(1);
        expect(r2.current.data).toHaveLength(0);
    });
});
