import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/shared/components/ui/Modal';

describe('V3-A11Y-09: Modal Dialog Accessibility & ARIA Attributes', () => {
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

  it('renders with role="dialog", aria-modal="true" and connects title via aria-labelledby', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Options du profil">
        <div>Contenu modal</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const titleElement = screen.getByText('Options du profil');
    expect(titleElement.id).toBeTruthy();
    expect(dialog.getAttribute('aria-labelledby')).toBe(titleElement.id);
  });

  it('renders close button with explicit accessible aria-label', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Fermeture test">
        <div>Contenu</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /fermer la boîte de dialogue/i });
    expect(closeButton).toBeDefined();

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when pressing Escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape test">
        <div>Contenu</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
