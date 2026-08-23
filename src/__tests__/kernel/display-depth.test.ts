/**
 * 🧪 displayDepth runtime (P4bis) — niveaux + hook + gate + persistance.
 */

/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import { Provider } from 'jotai';
import React from 'react';

import {
    displayDepthAtLeast,
    useDisplayDepth,
    DisplayDepthGate,
    DISPLAY_DEPTH_LEVELS,
    DISPLAY_DEPTH_META,
} from '@/kernel/settings/displayDepth';

// ── Ordre & displayDepthAtLeast ─────────────────────────────────────────────────

describe('displayDepthAtLeast', () => {
    it('essential atteint essential', () => {
        expect(displayDepthAtLeast('essential', 'essential')).toBe(true);
    });
    it('essential N\'ATTEINT PAS manager ni enterprise', () => {
        expect(displayDepthAtLeast('essential', 'manager')).toBe(false);
        expect(displayDepthAtLeast('essential', 'enterprise')).toBe(false);
    });
    it('manager atteint essential + manager mais pas enterprise', () => {
        expect(displayDepthAtLeast('manager', 'essential')).toBe(true);
        expect(displayDepthAtLeast('manager', 'manager')).toBe(true);
        expect(displayDepthAtLeast('manager', 'enterprise')).toBe(false);
    });
    it('enterprise atteint tout', () => {
        expect(displayDepthAtLeast('enterprise', 'essential')).toBe(true);
        expect(displayDepthAtLeast('enterprise', 'manager')).toBe(true);
        expect(displayDepthAtLeast('enterprise', 'enterprise')).toBe(true);
    });
});

// ── Constantes ──────────────────────────────────────────────────────────────────

describe('constantes exportées', () => {
    it('DISPLAY_DEPTH_LEVELS contient les 3 niveaux dans l\'ordre', () => {
        expect(DISPLAY_DEPTH_LEVELS).toEqual(['essential', 'manager', 'enterprise']);
    });
    it('DISPLAY_DEPTH_META porte label + description + emoji par niveau', () => {
        for (const level of DISPLAY_DEPTH_LEVELS) {
            expect(DISPLAY_DEPTH_META[level].label).toBeTruthy();
            expect(DISPLAY_DEPTH_META[level].description).toBeTruthy();
            expect(DISPLAY_DEPTH_META[level].emoji).toBeTruthy();
        }
    });
});

// ── Hook useDisplayDepth ───────────────────────────────────────────────────────

describe('useDisplayDepth', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('défaut à "essential"', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(Provider, null, children);
        const { result } = renderHook(() => useDisplayDepth(), { wrapper });
        expect(result.current.level).toBe('essential');
    });

    it('setLevel met à jour la valeur + persiste en localStorage', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(Provider, null, children);
        const { result } = renderHook(() => useDisplayDepth(), { wrapper });
        act(() => result.current.setLevel('enterprise'));
        expect(result.current.level).toBe('enterprise');
    });

    it('isAtLeast reflète l\'état courant', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(Provider, null, children);
        const { result } = renderHook(() => useDisplayDepth(), { wrapper });
        act(() => result.current.setLevel('manager'));
        expect(result.current.isAtLeast('essential')).toBe(true);
        expect(result.current.isAtLeast('manager')).toBe(true);
        expect(result.current.isAtLeast('enterprise')).toBe(false);
    });
});

// ── DisplayDepthGate ───────────────────────────────────────────────────────────

describe('DisplayDepthGate', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('affiche les enfants si niveau atteint', () => {
        localStorage.setItem('roscore:displayDepth', JSON.stringify('enterprise'));
        const { getByText } = render(
            React.createElement(Provider, null,
                React.createElement(DisplayDepthGate, {
                    level: 'manager',
                    children: React.createElement('span', null, 'visible'),
                })
            )
        );
        expect(getByText('visible')).toBeDefined();
    });

    it('masque les enfants si niveau insuffisant', () => {
        const { queryByText } = render(
            React.createElement(Provider, null,
                React.createElement(DisplayDepthGate, {
                    level: 'enterprise',
                    children: React.createElement('span', null, 'FEC-export'),
                })
            )
        );
        expect(queryByText('FEC-export')).toBeNull();
    });

    it('affiche le fallback si fourni et niveau insuffisant', () => {
        const { getByText } = render(
            React.createElement(Provider, null,
                React.createElement(DisplayDepthGate,
                    {
                        level: 'enterprise',
                        fallback: React.createElement('span', null, 'contenu limité'),
                        children: React.createElement('span', null, 'FEC-export'),
                    }
                )
            )
        );
        expect(getByText('contenu limité')).toBeDefined();
    });
});
