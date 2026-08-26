import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallPrompt } from '@/shared/components/InstallPrompt';
import { ActionBar, BottomSheet, Modal } from '@/shared/components/ui';

describe('Layout & PWA Mobile Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('InstallPrompt PWA Component', () => {
    it('renders installation prompt on beforeinstallprompt event', async () => {
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

      render(<InstallPrompt />);

      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      Object.assign(beforeInstallPromptEvent, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      await React.act(async () => {
        window.dispatchEvent(beforeInstallPromptEvent);
      });

      expect(await screen.findByText(/Installer Restaurant OS/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Installer l'Application/i })).toBeDefined();
    });

    it('persists dismissal in localStorage when user clicks "Plus tard"', async () => {
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

      render(<InstallPrompt />);

      const event = new Event('beforeinstallprompt');
      Object.assign(event, {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      });

      await React.act(async () => {
        window.dispatchEvent(event);
      });

      const dismissBtn = await screen.findByRole('button', { name: /Plus tard/i });
      await React.act(async () => {
        fireEvent.click(dismissBtn);
      });

      expect(localStorage.getItem('nexus_pwa_install_dismissed')).toBeTruthy();
    });
  });

  describe('ActionBar Safe-Area & Variants', () => {
    it('applies safe-area-inset-bottom styling on floating variant', () => {
      const { container } = render(
        <ActionBar variant="floating">
          <button>Valider</button>
        </ActionBar>
      );

      const bar = container.firstChild as HTMLElement;
      expect(bar.className).toContain('safe-area-inset-bottom');
      expect(bar.className).toContain('fixed');
    });

    it('applies safe-area-inset-bottom styling on sticky-bottom variant', () => {
      const { container } = render(
        <ActionBar variant="sticky-bottom">
          <button>Enregistrer</button>
        </ActionBar>
      );

      const bar = container.firstChild as HTMLElement;
      expect(bar.className).toContain('safe-area-inset-bottom');
      expect(bar.className).toContain('sticky');
    });
  });

  describe('BottomSheet & Modal Safe-Area Support', () => {
    it('renders BottomSheet with pb-safe content container', () => {
      render(
        <BottomSheet isOpen={true} onClose={() => {}} title="Test Sheet">
          <div>Sheet Content</div>
        </BottomSheet>
      );

      expect(screen.getByText("Test Sheet")).toBeDefined();
      expect(screen.getByText("Sheet Content")).toBeDefined();
      const contentEl = screen.getByText("Sheet Content").parentElement;
      expect(contentEl?.className).toContain('pb-safe');
    });

    it('renders Modal with pb-safe support', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );

      expect(screen.getByText("Test Modal")).toBeDefined();
      expect(screen.getByText("Modal Content")).toBeDefined();
      const modalContent = screen.getByText("Modal Content").parentElement;
      expect(modalContent?.className).toContain('pb-safe');
    });
  });
});
