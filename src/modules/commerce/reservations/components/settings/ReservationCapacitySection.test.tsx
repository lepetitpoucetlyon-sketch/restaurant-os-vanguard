import { render, screen } from '@testing-library/react';
import { ReservationCapacitySection } from './ReservationCapacitySection';
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

test('ReservationCapacitySection renders successfully', () => {
  render(<ReservationCapacitySection />);
  // Verifying the component mounts and shows title/content
  const sectionElement = screen.getByTestId('reservation-capacity-section');
  expect(sectionElement).toBeDefined();
});
