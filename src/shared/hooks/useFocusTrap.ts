"use client";

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function handleTabCycle(event: KeyboardEvent, container: HTMLElement) {
  if (event.key !== 'Tab') return;

  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  if (elements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = elements[0];
  const lastElement = elements[elements.length - 1];
  const active = document.activeElement;
  const isOutside = !container.contains(active);

  if (event.shiftKey) {
    if (active === firstElement || isOutside) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    if (active === lastElement || isOutside) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/**
 * 🔒 useFocusTrap — Hook d'accessibilité ARIA (WAI-ARIA Dialog Pattern)
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement | null>
) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      container.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => handleTabCycle(e, container);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [isActive, containerRef]);
}
