import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider, getDefaultStore } from 'jotai';
import PosError from '@/app/(client)/(ops)/pos/error';
import { activeCartAtom } from '@/modules/ops';
import { toMicrounits } from '@/shared/schemas/primitives';

describe('PosError — POS Error Boundary & Cart Preservation', () => {
    const store = getDefaultStore();

    beforeEach(() => {
        store.set(activeCartAtom, null);
    });

    it('renders empty cart message when no cart is in progress', () => {
        render(
            <Provider store={store}>
                <PosError error={new Error('Test error')} reset={() => {}} />
            </Provider>
        );

        expect(screen.getByText(/Incident d'affichage de caisse/i)).toBeDefined();
        expect(screen.getByText(/Aucun panier actif/i)).toBeDefined();
    });

    it('displays preserved cart contents and allows recovery via reset()', () => {
        store.set(activeCartAtom, {
            items: [
                {
                    id: 'item-1',
                    productId: 'prod-burger',
                    name: 'Burger Signature',
                    quantity: 2,
                    unitPriceInMicrounits: toMicrounits(15_000_000), // 15.00 €
                    taxRate: 10,
                    discountInMicrounits: toMicrounits(0),
                    modifiers: [],
                } as never,
                {
                    id: 'item-2',
                    productId: 'prod-coca',
                    name: 'Coca Cola 33cl',
                    quantity: 1,
                    unitPriceInMicrounits: toMicrounits(4_500_000), // 4.50 €
                    taxRate: 10,
                    discountInMicrounits: toMicrounits(0),
                    modifiers: [],
                } as never,
            ],
        });

        let resetCalled = false;
        render(
            <Provider store={store}>
                <PosError error={new Error('Crash in Cart render')} reset={() => { resetCalled = true; }} />
            </Provider>
        );

        expect(screen.getByText(/Panier & Session Préservés/i)).toBeDefined();
        expect(screen.getByText(/Burger Signature/i)).toBeDefined();
        expect(screen.getByText(/Coca Cola 33cl/i)).toBeDefined();
        expect(screen.getByText(/Commande en cours \(3 articles\)/i)).toBeDefined();

        const resumeButton = screen.getByText(/Reprendre la commande/i);
        fireEvent.click(resumeButton);
        expect(resetCalled).toBe(true);
    });
});
