import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { KDSPacingBanner } from '@/modules/ops/production/kds/components/KDSPacingBanner';
import { RecipeCostSummary } from '@/modules/ops/production/kitchen/components/recipe-detail/RecipeCostSummary';
import { TableActionsMenu } from '@/modules/ops';
import type { KDSPacingStatus } from '@/modules/ops/production/kds/services/KDSPacingEngine';
import type { Recipe } from '@nexus/contracts';

const throttled: KDSPacingStatus = {
    tenantId: 't1', averageDelayMinutes: 24, isThrottled: true,
    maxOrdersPerWindow: 5, throttleDurationSeconds: 600,
};
const calm: KDSPacingStatus = { ...throttled, isThrottled: false, averageDelayMinutes: 4 };

describe('KDSPacingBanner', () => {
    it('reste caché quand la cuisine n\'est pas en surchauffe', () => {
        const { container } = render(<KDSPacingBanner status={calm} />);
        expect(container.firstChild).toBeNull();
    });

    it('affiche le bandeau de surchauffe avec le retard moyen et le bridage', () => {
        render(<KDSPacingBanner status={throttled} />);
        expect(screen.getByText(/Cuisine en surchauffe/i)).toBeTruthy();
        expect(screen.getByText(/retard moyen 24 min/i)).toBeTruthy();
        expect(screen.getByText(/5\/10 min/)).toBeTruthy();
    });

    it('déclenche onRecoverStation au clic sur "Resynchroniser le poste"', () => {
        const onRecover = vi.fn();
        render(<KDSPacingBanner status={throttled} onRecoverStation={onRecover} />);
        fireEvent.click(screen.getByText(/Resynchroniser le poste/i));
        expect(onRecover).toHaveBeenCalledTimes(1);
    });
});

describe('RecipeCostSummary', () => {
    const recipe = {
        id: 'r1',
        name: 'Burger Charolais',
        portions: 1,
        sellingPriceInMicrounits: 18_000_000, // 18 € TTC
        ingredients: [
            { id: 'i1', ingredientId: 'boeuf', name: 'Bœuf haché', quantity: 0.18, unit: 'kg', costInCents: 0, costInMicrounits: 15_000_000 },
            { id: 'i2', ingredientId: 'bun', name: 'Pain', quantity: 1, unit: 'u', costInCents: 0, costInMicrounits: 400_000 },
        ],
    } as unknown as Recipe;

    it('affiche coût matière, marge et ratio food-cost', () => {
        render(<RecipeCostSummary recipe={recipe} currentPortions={1} />);
        // coût = 0.18*15 000 000 + 1*400 000 = 3 100 000 µ = 3,10 €
        expect(screen.getByText('3.10 €')).toBeTruthy();
        expect(screen.getByText(/Ratio food-cost/i)).toBeTruthy();
    });

    it('indique l\'absence de prix de vente', () => {
        const noPrice = { ...recipe, sellingPriceInMicrounits: 0, sellingPriceInCents: 0 } as unknown as Recipe;
        render(<RecipeCostSummary recipe={noPrice} currentPortions={1} />);
        expect(screen.getByText(/Prix de vente non renseigné/i)).toBeTruthy();
    });
});

describe('TableActionsMenu', () => {
    const table = { id: 'tbl-12', number: 12, activeOrderId: 'ord-9' };

    it('ouvre le menu et propose les 4 actions', () => {
        render(
            <TableActionsMenu
                currentTable={table}
                allTables={[table, { id: 'tbl-14', number: 14 }]}
                onTransferTable={vi.fn()}
                onMergeTable={vi.fn()}
                onHandoffTable={vi.fn()}
                onScanDineAndDash={vi.fn(async () => [])}
            />,
        );
        fireEvent.click(screen.getByLabelText('Actions de table'));
        expect(screen.getByText('Transférer la table')).toBeTruthy();
        expect(screen.getByText('Fusionner avec…')).toBeTruthy();
        expect(screen.getByText('Passer le rang')).toBeTruthy();
        expect(screen.getByText(/Contrôle départs sans paiement/i)).toBeTruthy();
    });

    it('appelle onTransferTable avec la table cible et l\'orderId courant', () => {
        const onTransfer = vi.fn(async () => {});
        render(
            <TableActionsMenu
                currentTable={table}
                allTables={[table, { id: 'tbl-14', number: 14 }]}
                onTransferTable={onTransfer}
                onMergeTable={vi.fn()}
                onHandoffTable={vi.fn()}
                onScanDineAndDash={vi.fn(async () => [])}
            />,
        );
        fireEvent.click(screen.getByLabelText('Actions de table'));
        fireEvent.click(screen.getByText('Transférer la table'));
        fireEvent.click(screen.getByText('Table 14'));
        expect(onTransfer).toHaveBeenCalledWith('tbl-14', 'ord-9');
    });
});
