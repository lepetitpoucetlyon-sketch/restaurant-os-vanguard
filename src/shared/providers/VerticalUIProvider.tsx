'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { usePathname } from 'next/navigation';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { VerticalUIRegistry } from '@/shared/plugins/VerticalUIRegistry';
import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

// ── Context ───────────────────────────────────────────────────────────────────

const VerticalUIContext = createContext<IVerticalUIPlugin | null>(null);

/**
 * VerticalUIProvider
 *
 * - Résout le plugin UI du tenant courant via VerticalUIRegistry.
 * - Injecte les scopedTokens de la route courante sur le wrapper DOM (pas sur :root).
 *   → les tokens ne contaminent pas les autres routes ni les autres verticales.
 * - Expose l'IVerticalUIPlugin via useVerticalUI().
 *
 * Monté après AuthGate — le variant est garanti résolu à ce stade.
 */
export function VerticalUIProvider({ children }: { children: React.ReactNode }) {
  const variant    = useAtomValue(tenantVariantAtom);
  const pathname   = usePathname();
  const plugin     = VerticalUIRegistry.resolve(variant);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Nettoyer tous les scoped tokens précédents
    el.removeAttribute('style');

    if (!plugin?.scopedTokens) return;

    // Route la plus précise qui match le pathname (most specific wins)
    const matchedRoute = Object.keys(plugin.scopedTokens)
      .filter(route => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0];

    if (matchedRoute) {
      const tokens = plugin.scopedTokens[matchedRoute];
      Object.entries(tokens).forEach(([key, val]) => el.style.setProperty(key, val));
    }
  }, [pathname, plugin]);

  return (
    <VerticalUIContext.Provider value={plugin}>
      {/*
        `contents` = pas de boîte CSS supplémentaire.
        data-vertical-scope permet aux DevTools de distinguer le wrapper.
      */}
      <div ref={wrapperRef} data-vertical-scope={variant} className="contents">
        {children}
      </div>
    </VerticalUIContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Retourne le plugin UI du vertical courant, ou null si non enregistré.
 * Peut être appelé dans n'importe quel composant enfant de VerticalUIProvider.
 */
export function useVerticalUI(): IVerticalUIPlugin | null {
  return useContext(VerticalUIContext);
}
