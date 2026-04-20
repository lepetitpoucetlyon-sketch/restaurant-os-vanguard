"use client";

import { useEffect, useRef, RefObject } from "react";

/**
 * Hook pour détecter les clics en dehors d'un élément.
 * 
 * @example
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useClickOutside(dropdownRef, () => setIsOpen(false));
 */
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T>,
    handler: (event: MouseEvent | TouchEvent) => void,
    enabled: boolean = true
): void {
    useEffect(() => {
        if (!enabled) return;

        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref.current;
            if (!el || el.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);

        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler, enabled]);
}

/**
 * Hook pour détecter la touche Escape.
 * 
 * @example
 * useEscapeKey(() => closeModal());
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true): void {
    useEffect(() => {
        if (!enabled) return;

        const listener = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handler();
            }
        };

        document.addEventListener("keydown", listener);

        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, [handler, enabled]);
}
