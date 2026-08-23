'use client';

/**
 * 🖐️ useSwipeAction — Gesture de swipe horizontal pour les listes métier.
 *
 * Fournit des handlers Framer Motion `drag="x"` pour déclencher des actions
 * au seuil configuré. Utilisé par :
 * - KDS : swipe une commande pour la marquer prête
 * - POS : swipe un article du panier pour le supprimer
 * - HR  : swipe un pointage pour le valider
 *
 * Intègre optionnellement le retour haptique (useHaptic.tap au seuil).
 *
 * Module FEUILLE : dépend uniquement de React et Framer Motion (déjà dans le bundle).
 */

import { useState, useCallback, useRef } from 'react';
import { useHaptic } from './useHaptic';

export type SwipeState = 'idle' | 'dragging' | 'triggered-left' | 'triggered-right';

interface SwipeActionOptions {
    /** Callback déclenché au swipe vers la gauche (ex: annuler, supprimer). */
    onSwipeLeft?: () => void;
    /** Callback déclenché au swipe vers la droite (ex: valider, servir). */
    onSwipeRight?: () => void;
    /** Seuil de déclenchement en pixels (défaut: 100). */
    threshold?: number;
    /** Activer le retour haptique au seuil (défaut: true). */
    hapticOnTrigger?: boolean;
    /** Désactiver le swipe (utile pour les slots verrouillés NF525). */
    disabled?: boolean;
}

interface SwipeActionReturn {
    /** État courant de la gesture. */
    swipeState: SwipeState;
    /** Offset X courant en pixels (pour animer la translation). */
    offsetX: number;
    /** Handlers pour l'élément draggable. */
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
        onPointerCancel: (e: React.PointerEvent) => void;
    };
    /** Réinitialiser la gesture manuellement. */
    reset: () => void;
}

export function useSwipeAction(options: SwipeActionOptions = {}): SwipeActionReturn {
    const {
        onSwipeLeft,
        onSwipeRight,
        threshold = 100,
        hapticOnTrigger = true,
        disabled = false,
    } = options;

    const [swipeState, setSwipeState] = useState<SwipeState>('idle');
    const [offsetX, setOffsetX] = useState(0);
    const startXRef = useRef<number | null>(null);
    const triggeredRef = useRef(false);
    const haptic = useHaptic();

    const reset = useCallback(() => {
        setSwipeState('idle');
        setOffsetX(0);
        startXRef.current = null;
        triggeredRef.current = false;
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if (disabled) return;
        startXRef.current = e.clientX;
        triggeredRef.current = false;
        setSwipeState('dragging');
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [disabled]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (startXRef.current === null || disabled) return;
        const delta = e.clientX - startXRef.current;
        setOffsetX(delta);

        // Déclencher le feedback haptique au seuil (une seule fois)
        if (!triggeredRef.current && Math.abs(delta) >= threshold) {
            triggeredRef.current = true;
            if (hapticOnTrigger) haptic.tap();
            setSwipeState(delta < 0 ? 'triggered-left' : 'triggered-right');
        }
    }, [disabled, threshold, hapticOnTrigger, haptic]);

    const onPointerUp = useCallback(() => {
        if (startXRef.current === null) return;
        
        if (triggeredRef.current) {
            if (offsetX < -threshold && onSwipeLeft) {
                if (hapticOnTrigger) haptic.success();
                onSwipeLeft();
            } else if (offsetX > threshold && onSwipeRight) {
                if (hapticOnTrigger) haptic.success();
                onSwipeRight();
            }
        }
        
        reset();
    }, [offsetX, threshold, onSwipeLeft, onSwipeRight, hapticOnTrigger, haptic, reset]);

    const onPointerCancel = useCallback(() => {
        reset();
    }, [reset]);

    return {
        swipeState,
        offsetX,
        handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
        reset,
    };
}
