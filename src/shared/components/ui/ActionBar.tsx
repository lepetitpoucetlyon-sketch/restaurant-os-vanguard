"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/ui.foundations";

export interface ActionBarProps {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  children?: ReactNode;
  variant?: "default" | "floating" | "sticky-bottom" | "inline";
  className?: string;
}

export function ActionBar({
  leftSlot,
  rightSlot,
  children,
  variant = "default",
  className,
}: ActionBarProps) {
  const isFloating = variant === "floating";
  const isStickyBottom = variant === "sticky-bottom";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 transition-all",
        isFloating &&
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-card/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl px-5 py-3 max-w-[90vw]",
        isStickyBottom &&
          "sticky bottom-0 z-30 bg-surface-card/95 backdrop-blur-xl border-t border-border-default px-6 py-4 -mx-6 -mb-6 mt-6",
        variant === "default" &&
          "bg-surface-card/50 border border-border-default rounded-xl px-4 py-3",
        variant === "inline" && "p-0 bg-transparent border-0",
        className
      )}
    >
      {leftSlot ? (
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">{leftSlot}</div>
      ) : null}

      {children ? (
        <div className="flex items-center gap-2.5 flex-wrap flex-1">{children}</div>
      ) : null}

      {rightSlot ? (
        <div className="flex items-center gap-2.5 flex-wrap ml-auto shrink-0">
          {rightSlot}
        </div>
      ) : null}
    </div>
  );
}
