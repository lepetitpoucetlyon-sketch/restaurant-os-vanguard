import { useCallback, useRef, useEffect, type KeyboardEvent, type RefObject } from 'react';

export function useArrowNav(containerRef: RefObject<HTMLElement | null>) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const container = containerRef.current;
        if (!container) return;

        const focusable = Array.from(
            container.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href], input:not([disabled])'
            )
        );

        const idx = focusable.indexOf(document.activeElement as HTMLElement);
        if (idx === -1) return;

        let next: HTMLElement | undefined;

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                next = focusable[(idx + 1) % focusable.length];
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                next = focusable[(idx - 1 + focusable.length) % focusable.length];
                break;
            case 'Home':
                e.preventDefault();
                next = focusable[0];
                break;
            case 'End':
                e.preventDefault();
                next = focusable[focusable.length - 1];
                break;
        }

        next?.focus();
    }, [containerRef]);

    return { onKeyDown: handleKeyDown };
}

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
    useEffect(() => {
        if (!active) return;
        const container = containerRef.current;
        if (!container) return;

        const handler = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusable = container.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [containerRef, active]);
}

export function useAnnounce() {
    const regionRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (regionRef.current) return;
        const el = document.createElement('div');
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        document.body.appendChild(el);
        regionRef.current = el;
        return () => { el.remove(); regionRef.current = null; };
    }, []);

    return useCallback((message: string) => {
        if (regionRef.current) {
            regionRef.current.textContent = '';
            requestAnimationFrame(() => {
                if (regionRef.current) regionRef.current.textContent = message;
            });
        }
    }, []);
}
