import { render, screen } from '@testing-library/react';
import { AddPrinterWizard } from './AddPrinterWizard';
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

test('AddPrinterWizard renders successfully', () => {
  render(<AddPrinterWizard onClose={() => {}} onAdded={() => {}} />);
  // Verifying the component mounts and shows title/content
  const wizardElement = screen.getByText(/Nouvelle imprimante/i);
  expect(wizardElement).toBeDefined();
});
