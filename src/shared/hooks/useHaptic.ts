'use client';

/**
 * 🎯 useHaptic — Retour haptique natif pour terminaux tactiles.
 *
 * Fournit 4 patterns de vibration adaptés aux interactions métier :
 * - tap      : confirmation légère (bouton, sélection de catégorie)
 * - success  : validation d'encaissement, clôture de commande
 * - warning  : alerte stock critique, erreur de saisie
 * - celebrate: clôture Ticket Z, objectif CA atteint, nouveau record
 *
 * Sur les navigateurs qui ne supportent pas `navigator.vibrate()` (Safari iOS),
 * les appels sont des no-ops silencieux — aucune erreur n'est levée.
 *
 * Module FEUILLE : aucune dépendance interne. Pas de cycle d'import.
 */

import { useCallback, useMemo } from 'react';

interface HapticActions {
    /** Vibration courte (10ms) — confirmation de clic. */
    tap: () => void;
    /** Vibration moyenne (50ms) — succès d'une action. */
    success: () => void;
    /** Pattern d'alerte [30, 50, 30] — avertissement. */
    warning: () => void;
    /** Pattern de célébration [50, 50, 100, 50, 150] — récompense. */
    celebrate: () => void;
    /** Pattern personnalisé — pour les cas métier spécifiques. */
    custom: (pattern: number | number[]) => void;
    /** Indique si le navigateur supporte les vibrations. */
    isSupported: boolean;
}

function vibrate(pattern: number | number[]): void {
    try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    } catch {
        // Silencieux — certains navigateurs lèvent une exception en contexte restreint
    }
}

export function useHaptic(): HapticActions {
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    const tap       = useCallback(() => vibrate(10), []);
    const success   = useCallback(() => vibrate(50), []);
    const warning   = useCallback(() => vibrate([30, 50, 30]), []);
    const celebrate = useCallback(() => vibrate([50, 50, 100, 50, 150]), []);
    const custom    = useCallback((pattern: number | number[]) => vibrate(pattern), []);

    return useMemo(() => ({
        tap,
        success,
        warning,
        celebrate,
        custom,
        isSupported,
    }), [tap, success, warning, celebrate, custom, isSupported]);
}
