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
  render(<CardImprintStep />);
  // Verifying the component mounts
  const stepElement = screen.getByTestId('card-imprint-step');
  expect(stepElement).toBeDefined();
});
