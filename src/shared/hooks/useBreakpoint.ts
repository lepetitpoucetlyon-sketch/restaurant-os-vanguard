"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop" | "kiosk";

/**
 * Bornes (en px) des 4 tiers métier. DOIT rester synchronisé avec les tokens
 * `--breakpoint-*` de `src/app/globals.css` (source unique de vérité partagée
 * avec Tailwind v4). Chaque valeur = borne SUPÉRIEURE inclusive du tier :
 *   mobile  ≤ 640  (< sm)
 *   tablet  ≤ 1024 (sm..lg)
 *   desktop ≤ 1440 (lg..xl — poste caisse fixe)
 *   kiosk   > 1440 (xl..2xl — écran mural KDS, drive-thru)
 */
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
} as const;

export interface BreakpointState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isKiosk: boolean;
  width: number;
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>({
    breakpoint: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isKiosk: false,
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const w = window.innerWidth;
      let bp: Breakpoint = "desktop";

      if (w <= BREAKPOINTS.mobile) {
        bp = "mobile";
      } else if (w <= BREAKPOINTS.tablet) {
        bp = "tablet";
      } else if (w <= BREAKPOINTS.desktop) {
        bp = "desktop";
      } else {
        bp = "kiosk";
      }

      setState({
        breakpoint: bp,
        isMobile: bp === "mobile",
        isTablet: bp === "tablet",
        isDesktop: bp === "desktop" || bp === "kiosk",
        isKiosk: bp === "kiosk",
        width: w,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}
