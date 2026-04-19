"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
    freezeOnceVisible?: boolean;
}

/**
 * Hook pour détecter quand un élément entre dans le viewport.
 * Utile pour le lazy loading et les animations au scroll.
 * 
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 * 
 * <div ref={ref}>
 *   {isVisible && <HeavyComponent />}
 * </div>
 */
export function useIntersectionObserver<T extends HTMLElement>(
    options: UseIntersectionObserverOptions = {}
): [React.RefCallback<T>, boolean, IntersectionObserverEntry | undefined] {
    const { threshold = 0, root = null, rootMargin = "0px", freezeOnceVisible = false } = options;

    const [entry, setEntry] = useState<IntersectionObserverEntry>();
    const [node, setNode] = useState<T | null>(null);

    const frozen = entry?.isIntersecting && freezeOnceVisible;

    const updateEntry = useCallback(([entry]: IntersectionObserverEntry[]) => {
        setEntry(entry);
    }, []);

    useEffect(() => {
        if (!node) return;
        if (frozen) return;

        const observer = new IntersectionObserver(updateEntry, {
            threshold,
            root,
            rootMargin,
        });

        observer.observe(node);

        return () => observer.disconnect();
    }, [node, threshold, root, rootMargin, frozen, updateEntry]);

    const ref = useCallback((node: T | null) => {
        setNode(node);
    }, []);

    return [ref, !!entry?.isIntersecting, entry];
}

/**
 * Hook pour le lazy loading d'images.
 * 
 * @example
 * const { ref, isLoaded, src } = useLazyImage({
 *   src: '/large-image.jpg',
 *   placeholder: '/placeholder.jpg'
 * });
 * 
 * <img ref={ref} src={src} />
 */
export function useLazyImage(options: {
    src: string;
    placeholder?: string;
    rootMargin?: string;
}) {
    const { src, placeholder = "", rootMargin = "100px" } = options;
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(placeholder);

    const [ref, isVisible] = useIntersectionObserver<HTMLImageElement>({
        rootMargin,
        freezeOnceVisible: true,
    });

    useEffect(() => {
        if (!isVisible) return;

        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
        };
    }, [isVisible, src]);

    return { ref, isLoaded, src: currentSrc };
}
