"use client";

import React, { type ReactNode } from "react";
import { useBreakpoint } from "@/shared/hooks/useBreakpoint";
import { useKioskMode } from "@/shared/hooks/useKioskMode";
import { cn } from "@/lib/ui.foundations";

export interface ResponsiveShellProps {
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop: ReactNode;
  kiosk?: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function ResponsiveShell({
  mobile,
  tablet,
  desktop,
  kiosk,
  fallback,
  className,
}: ResponsiveShellProps) {
  const { isMobile, isTablet, isKiosk: bpKiosk } = useBreakpoint();
  const { isKiosk: manualKiosk } = useKioskMode();

  const activeKiosk = manualKiosk || bpKiosk;

  let activeView: ReactNode = desktop;

  if (activeKiosk && kiosk) {
    activeView = kiosk;
  } else if (isMobile && mobile) {
    activeView = mobile;
  } else if (isTablet && (tablet || mobile)) {
    activeView = tablet ?? mobile;
  } else {
    activeView = desktop ?? fallback ?? null;
  }

  return <div className={cn("w-full h-full min-h-0 flex-1 flex flex-col", className)}>{activeView}</div>;
}
