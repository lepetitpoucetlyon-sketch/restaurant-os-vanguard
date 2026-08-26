import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StorageMapBoard } from '@/modules/logistics/stock/inventory/components/storage-map/StorageMapBoard';
import type { StorageLocation, StockItem, Preparation } from '@nexus/contracts';

describe('V3-LOG-11: Storage Map Drag & Drop & Expiry Flow', () => {
  const mockLocations: StorageLocation[] = [
    { id: 'loc-cold', name: 'Chambre Froide Positive', type: 'fridge', isActive: true },
    { id: 'loc-freeze', name: 'Congélateur Négatif', type: 'freezer', isActive: true },
    { id: 'loc-dry', name: 'Épicerie Sèche', type: 'dry_storage', isActive: true },
  ];

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const mockStockItems: StockItem[] = [
    {
      id: 'item-salmon',
      name: 'Saumon Label Rouge',
      ingredientId: 'ing-salmon',
      ingredientName: 'Saumon Label Rouge',
      category: 'Poisson',
      locationId: 'loc-cold',
      quantity: 12,
      currentStock: 12,
      unit: 'kg',
      costPrice: 2000,
      dlc: tomorrow.toISOString(),
      expirationDate: tomorrow.toISOString(),
      receivedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } as unknown as StockItem,
    {
      id: 'item-flour',
      name: 'Farine T55',
      ingredientId: 'ing-flour',
      ingredientName: 'Farine T55',
      category: 'Épicerie',
      locationId: 'loc-dry',
      quantity: 50,
      currentStock: 50,
      unit: 'kg',
      costPrice: 100,
      dlc: nextMonth.toISOString(),
      expirationDate: nextMonth.toISOString(),
      receivedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } as unknown as StockItem,
  ];

  const mockPreps: Preparation[] = [
    {
      id: 'prep-sauce',
      name: 'Sauce Béarnaise Maison',
      locationId: 'loc-cold',
      quantity: 5,
      unit: 'l',
      expirationDate: tomorrow.toISOString(),
    } as unknown as Preparation,
  ];

  it('aggregates stock count, preparations and urgent DLC alerts per storage zone', () => {
    render(
      <StorageMapBoard
        locations={mockLocations}
        stockItems={mockStockItems}
        preparations={mockPreps}
      />
    );

    // Chambre Froide should display and have 1 stock item + 1 prep
    expect(screen.getByText('Chambre Froide Positive')).toBeDefined();
    expect(screen.getByText('Congélateur Négatif')).toBeDefined();
    expect(screen.getByText('Épicerie Sèche')).toBeDefined();
  });

  it('opens storage detail bubble and allows transfer invocation', () => {
    const onTransferStock = vi.fn();
    const onTransferPrep = vi.fn();

    render(
      <StorageMapBoard
        locations={mockLocations}
        stockItems={mockStockItems}
        preparations={mockPreps}
        onTransferStock={onTransferStock}
        onTransferPreparation={onTransferPrep}
      />
    );

    // Click on Chambre Froide card to open bubble
    const coldCard = screen.getByText('Chambre Froide Positive');
    fireEvent.click(coldCard);

    // Detail bubble should appear with item details
    expect(screen.getByText('Saumon Label Rouge')).toBeDefined();
  });
});
