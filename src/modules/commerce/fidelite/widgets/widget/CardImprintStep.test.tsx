import { render, screen } from '@testing-library/react';
import { CardImprintStep } from './CardImprintStep';
import { expect, test, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get: vi.fn(),
      set: vi.fn(),
    }
  }
}));

test('CardImprintStep renders successfully', () => {
  render(<CardImprintStep penalty={10} cardImprintConfig={{} as never} stripeLoading={false} stripeError={null} stripeReady={true} cardMountRef={{ current: null }} submitting={false} btnPrimary="test" btnSecondary="test" onBack={() => {}} onConfirmCard={async () => {}} />);
  const stepElement = screen.getByText(/Garantie de réservation|commerce\.widgets\.reservationGuarantee/i);
  expect(stepElement).toBeDefined();
});
