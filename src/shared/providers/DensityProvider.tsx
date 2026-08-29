'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import {
  type DensityMode,
  type DensityScale,
  DENSITY_SCALES,
  generateDensityCSSVariables,
  resolveDensityFromContext,
} from '@/shared/nexus/tokens/density';

interface DensityContextValue {
  mode: DensityMode;
  scale: DensityScale;
}

const DensityContext = createContext<DensityContextValue>({
  mode: 'comfortable',
  scale: DENSITY_SCALES.comfortable,
});

/**
 * Provides density-aware spacing/sizing tokens as CSS custom properties.
 * Reads the tenant's UXProfile to determine density automatically.
 *
 * Usage:
 *   const { mode, scale } = useDensity();
 *   // scale.minTarget → minimum touch target px
 *   // CSS: gap: var(--density-gap-md);
 */
export function DensityProvider({
  children,
  override,
  pageCategory,
}: {
  children: React.ReactNode;
  override?: DensityMode;
  pageCategory?: 'operations' | 'commerce' | 'management' | 'admin' | 'marketing' | 'public';
}) {
  const variant = useAtomValue(tenantVariantAtom);

  const mode = override ?? resolveDensityFromContext(variant, pageCategory);
  const scale = DENSITY_SCALES[mode];

  useEffect(() => {
    const root = document.documentElement;
    const vars = generateDensityCSSVariables(mode);
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));

    // Expose density mode as data attribute for CSS selectors
    root.setAttribute('data-density', mode);

    return () => {
      Object.keys(vars).forEach(key => root.style.removeProperty(key));
      root.removeAttribute('data-density');
    };
  }, [mode]);

  const value = useMemo(() => ({ mode, scale }), [mode, scale]);

  return (
    <DensityContext.Provider value={value}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity(): DensityContextValue {
  return useContext(DensityContext);
}
