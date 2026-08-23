"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop" | "kiosk";

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

      if (w <= 640) {
        bp = "mobile";
      } else if (w <= 1024) {
        bp = "tablet";
      } else if (w < 1440) {
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
