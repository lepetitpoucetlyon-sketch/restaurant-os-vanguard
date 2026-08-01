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
  render(<ReservationCapacitySection config={{} as any} setConfig={() => {}} slots={{ slotDuration: 15, intervalBetweenSlots: 15, maxCoversPerSlot: 10 } as any} setSlots={() => {}} />);
  const sectionElement = screen.getByText(/Capacity Matrix/i);
  expect(sectionElement).toBeDefined();
});
