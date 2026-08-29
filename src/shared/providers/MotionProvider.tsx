'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import {
  type MotionProfile,
  type MotionIntensity,
  resolveMotionProfile,
  resolveMotionIntensityFromProfile,
} from '@/shared/nexus/tokens/motion';

const MotionContext = createContext<MotionProfile>(
  resolveMotionProfile(5, false)
);

/**
 * Provides a centralized motion configuration to the entire app.
 * Automatically respects prefers-reduced-motion (WCAG 2.3.3).
 *
 * Usage:
 *   const motion = useMotionConfig();
 *   // motion.tapScale → 0.97
 *   // motion.duration.fast → 120ms
 *   // motion.prefersReduced → boolean
 */
export function MotionProvider({
  children,
  intensityOverride,
}: {
  children: React.ReactNode;
  intensityOverride?: MotionIntensity;
}) {
  const variant = useAtomValue(tenantVariantAtom);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const intensity = intensityOverride ?? resolveMotionIntensityFromProfile(variant);

  const profile = useMemo(
    () => resolveMotionProfile(intensity, prefersReduced),
    [intensity, prefersReduced],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--motion-duration-instant', `${profile.duration.instant}ms`);
    root.style.setProperty('--motion-duration-fast',    `${profile.duration.fast}ms`);
    root.style.setProperty('--motion-duration-normal',  `${profile.duration.normal}ms`);
    root.style.setProperty('--motion-duration-slow',    `${profile.duration.slow}ms`);
    root.style.setProperty('--motion-easing-smooth',    profile.easing.smooth);
    root.style.setProperty('--motion-easing-bounce',    profile.easing.bounce);
    root.style.setProperty('--motion-tap-scale',        String(profile.tapScale));
    root.style.setProperty('--motion-hover-lift',       profile.hoverLift);

    root.setAttribute('data-motion', prefersReduced ? 'reduced' : 'full');

    return () => {
      root.removeAttribute('data-motion');
    };
  }, [profile, prefersReduced]);

  return (
    <MotionContext.Provider value={profile}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotionConfig(): MotionProfile {
  return useContext(MotionContext);
}
