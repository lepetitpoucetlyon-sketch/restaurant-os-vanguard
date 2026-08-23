"use client";

import React from "react";
import { cn } from "@/lib/ui.foundations";

export interface SkeletonListProps {
  count?: number;
  variant?: "list" | "card" | "table" | "stat";
  className?: string;
}

export function SkeletonList({
  count = 4,
  variant = "list",
  className,
}: SkeletonListProps) {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {items.map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-surface-card/40 border border-border-default/60 animate-pulse flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-surface-card/80" />
              <div className="w-16 h-5 rounded-full bg-surface-card/80" />
            </div>
            <div className="space-y-2 mt-2">
              <div className="w-3/4 h-5 rounded-md bg-surface-card/80" />
              <div className="w-1/2 h-3.5 rounded-md bg-surface-card/60" />
            </div>
            <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
              <div className="w-20 h-4 rounded-md bg-surface-card/60" />
              <div className="w-12 h-4 rounded-md bg-surface-card/80" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {items.map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-surface-card/40 border border-border-default/60 animate-pulse flex flex-col gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-surface-card/80" />
            <div className="w-24 h-7 rounded-md bg-surface-card/80" />
            <div className="w-16 h-3 rounded-md bg-surface-card/60" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("rounded-2xl border border-border-default overflow-hidden bg-surface-card/30", className)}>
        <div className="h-12 bg-surface-card/60 border-b border-border-default animate-pulse" />
        {items.map((_, i) => (
          <div
            key={i}
            className="h-16 px-6 border-b border-border-subtle flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-card/80" />
              <div className="space-y-1.5">
                <div className="w-36 h-4 rounded-md bg-surface-card/80" />
                <div className="w-20 h-3 rounded-md bg-surface-card/60" />
              </div>
            </div>
            <div className="w-24 h-4 rounded-md bg-surface-card/70" />
            <div className="w-16 h-6 rounded-full bg-surface-card/80" />
          </div>
        ))}
      </div>
    );
  }

  // Default "list"
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-surface-card/40 border border-border-default/60 animate-pulse flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-card/80 shrink-0" />
            <div className="space-y-2 min-w-0">
              <div className="w-48 h-4 rounded-md bg-surface-card/80" />
              <div className="w-28 h-3 rounded-md bg-surface-card/60" />
            </div>
          </div>
          <div className="w-20 h-6 rounded-full bg-surface-card/70 shrink-0" />
        </div>
      ))}
    </div>
  );
}
