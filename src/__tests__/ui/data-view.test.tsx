import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataView } from '@/shared/components/ui/DataView';
import { Package } from 'lucide-react';

describe('DataView Component', () => {
  it('renders skeleton when isLoading is true', () => {
    const { container } = render(
      <DataView isLoading={true} data={[]}>
        <div>Data content</div>
      </DataView>
    );

    expect(screen.queryByText('Data content')).toBeNull();
    expect(container.querySelector('.animate-pulse') || container.firstChild).toBeDefined();
  });

  it('renders error state with retry button when error is provided', () => {
    const onRetry = vi.fn();
    render(
      <DataView
        error={new Error('Réseau indisponible')}
        onRetry={onRetry}
        data={[]}
      >
        <div>Data content</div>
      </DataView>
    );

    expect(screen.getByText('Impossible de charger les données')).toBeDefined();
    expect(screen.getByText('Réseau indisponible')).toBeDefined();

    const retryBtn = screen.getByRole('button', { name: /Réessayer/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders configured EmptyState when data array is empty', () => {
    render(
      <DataView
        data={[]}
        empty={{
          icon: Package,
          title: 'Aucun produit',
          description: 'Votre catalogue est actuellement vide.',
          action: <button>Créer un produit</button>,
        }}
      >
        <div>Data content</div>
      </DataView>
    );

    expect(screen.getByText('Aucun produit')).toBeDefined();
    expect(screen.getByText('Votre catalogue est actuellement vide.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Créer un produit' })).toBeDefined();
    expect(screen.queryByText('Data content')).toBeNull();
  });

  it('renders children when data is populated', () => {
    const items = ['Burger', 'Frites', 'Boisson'];
    render(
      <DataView data={items}>
        {(list) => (
          <ul>
            {list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </DataView>
    );

    expect(screen.getByText('Burger')).toBeDefined();
    expect(screen.getByText('Frites')).toBeDefined();
    expect(screen.getByText('Boisson')).toBeDefined();
  });
});
