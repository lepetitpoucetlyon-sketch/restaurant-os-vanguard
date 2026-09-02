import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const eightysixMock = vi.fn(async () => ({ ingredientId: 'tomate', ingredientName: 'Tomate', affectedDishes: [{ dishId: 'd1', name: 'Salade' }], blockedAt: 0 }));

const useRecipesMock = vi.fn();

vi.mock('@/modules/ops/production/kds/services/EightysixtService', () => ({
    EightysixtService: { eightysix: (...a: unknown[]) => eightysixMock(...(a as [])) },
}));
vi.mock('@/infrastructure/auth/hooks/useAuth', () => ({ useAuth: () => ({ currentUser: { id: 'chef-1' } }) }));
vi.mock('@/modules/ops/providers/hooks/kitchenHooks', () => ({ useRecipes: () => useRecipesMock() }));

import { KDSEightysixPanel } from '@/modules/ops/production/kds/components/KDSEightysixPanel';
import { KDSTicketTimers } from '@/modules/ops/production/kds/components/kds-ticket/KDSTicketTimers';
import type { Order } from '@nexus/contracts';

beforeEach(() => {
    eightysixMock.mockClear();
    useRecipesMock.mockReturnValue({
        data: [
            { id: 'r1', name: 'Salade', ingredients: [{ ingredientId: 'tomate', name: 'Tomate', quantity: 2, unit: 'u' }] },
            { id: 'r2', name: 'Pizza', ingredients: [{ ingredientId: 'tomate', name: 'Tomate', quantity: 1, unit: 'u' }, { ingredientId: 'mozza', name: 'Mozzarella', quantity: 0.1, unit: 'kg' }] },
        ],
    });
});

describe('KDSEightysixPanel', () => {
    it('liste les ingrédients dédupliqués avec le nombre de plats', () => {
        render(<KDSEightysixPanel open onClose={vi.fn()} tenantId="t1" />);
        expect(screen.getByText('Tomate')).toBeTruthy();
        expect(screen.getByText('Mozzarella')).toBeTruthy();
        expect(screen.getByText('2 plat(s)')).toBeTruthy(); // tomate dans 2 recettes
    });

    it('appelle EightysixtService.eightysix au clic sur un ingrédient', async () => {
        const onClose = vi.fn();
        render(<KDSEightysixPanel open onClose={onClose} tenantId="t1" />);
        fireEvent.click(screen.getByText('Tomate'));
        await waitFor(() => expect(eightysixMock).toHaveBeenCalledWith(
            expect.objectContaining({ tenantId: 't1', ingredientId: 'tomate', ingredientName: 'Tomate', blockedBy: 'chef-1' }),
        ));
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('ne rend rien quand open=false', () => {
        const { container } = render(<KDSEightysixPanel open={false} onClose={vi.fn()} tenantId="t1" />);
        expect(container.firstChild).toBeNull();
    });
});

describe('KDSTicketTimers', () => {
    const meatTicket = (status: string) => ({
        id: 'o1', status, tableNumber: '7', serverName: 'Léa',
        updatedAt: Date.now(),
        items: [{ id: 'it1', name: 'Entrecôte 300g', quantity: 1, modifiers: ['saignant'] }],
    }) as unknown as Order;

    it('ne rend rien tant que le ticket n\'est ni en cuisson ni prêt', () => {
        const { container } = render(<KDSTicketTimers ticket={meatTicket('new')} tenantId="t1" />);
        expect(container.firstChild).toBeNull();
    });

    it('affiche le minuteur de repos viande quand le ticket passe "ready"', async () => {
        render(<KDSTicketTimers ticket={meatTicket('ready')} tenantId="t1" />);
        await waitFor(() => expect(screen.getByText(/Repos Entrecôte 300g/i)).toBeTruthy());
    });
});
