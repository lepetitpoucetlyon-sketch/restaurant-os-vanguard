import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CashCounterModal } from '@/modules/ops/service/pos/components/CashCounterModal';
import { PlaceholderView } from '@/modules/finance/components/accounting/PlaceholderView';
import { StorageMapBoard } from '@/modules/logistics/stock/inventory/components/storage-map/StorageMapBoard';
import { FileText } from 'lucide-react';
import type { StorageLocation, StockItem } from '@nexus/contracts';

describe('V3-REMED: Remediated Components UI & Accessibility Tests', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('CashCounterModal', () => {
    it('renders with denominations and validates counted amount in microunits', async () => {
      const onValidate = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <CashCounterModal
          isOpen={true}
          onClose={onClose}
          expectedAmountInMicrounits={150_000_000} // 150 €
          onValidate={onValidate}
          type="EOD_CLOSE"
        />
      );

      expect(screen.getByText(/Comptage Tiroir Caisse/i)).toBeDefined();
      expect(screen.getByText('50 €')).toBeDefined();
      expect(screen.getByText('1 €')).toBeDefined();

      // Find input for 50 € (value = 50_000_000) and type 3
      const inputs = screen.getAllByRole('spinbutton');
      // The 4th input corresponds to 50€ bill
      fireEvent.change(inputs[3], { target: { value: '3' } }); // 3 * 50€ = 150€

      // Click Valider
      const validateButton = screen.getByRole('button', { name: /Valider/i });
      fireEvent.click(validateButton);

      expect(onValidate).toHaveBeenCalledWith(150_000_000, 0);
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <CashCounterModal
          isOpen={false}
          onClose={() => {}}
          expectedAmountInMicrounits={100_000_000}
          onValidate={vi.fn()}
          type="SKIM"
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('PlaceholderView', () => {
    it('renders title, description and calls onConfigure when button is clicked', () => {
      const onConfigure = vi.fn();
      render(
        <PlaceholderView
          title="Module Trésorerie"
          description="Gestion prévisionnelle du cash flow"
          icon={FileText}
          onConfigure={onConfigure}
        />
      );

      expect(screen.getByText('Module Trésorerie')).toBeDefined();
      expect(screen.getByText('Gestion prévisionnelle du cash flow')).toBeDefined();

      const configButton = screen.getByRole('button', { name: /Configurer le Module/i });
      fireEvent.click(configButton);

      expect(onConfigure).toHaveBeenCalledTimes(1);
    });
  });

  describe('StorageMapBoard', () => {
    const mockLocations: StorageLocation[] = [
      { id: 'loc-1', name: 'Chambre Froide Positive', type: 'fridge', isActive: true },
      { id: 'loc-2', name: 'Réserve Sèche', type: 'dry_storage', isActive: true },
    ];

    const mockStockItems = [
      { id: 'item-1', name: 'Saumon Frais', locationId: 'loc-1', currentStock: 10, unit: 'kg' },
      { id: 'item-2', name: 'Riz Basmati', locationId: 'loc-2', currentStock: 25, unit: 'kg' },
    ] as unknown as StockItem[];

    it('renders all storage locations and searches correctly', () => {
      render(
        <StorageMapBoard
          locations={mockLocations}
          stockItems={mockStockItems}
        />
      );

      expect(screen.getByText('Chambre Froide Positive')).toBeDefined();
      expect(screen.getByText('Réserve Sèche')).toBeDefined();

      // Search
      const searchInput = screen.getByPlaceholderText(/Rechercher une zone/i);
      fireEvent.change(searchInput, { target: { value: 'Froide' } });

      expect(screen.getByText('Chambre Froide Positive')).toBeDefined();
      expect(screen.queryByText('Réserve Sèche')).toBeNull();
    });
  });
});
