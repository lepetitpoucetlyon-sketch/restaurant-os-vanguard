"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/ui.foundations";

export interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const columnClasses: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

const gapClasses = {
  sm: "gap-3",
  md: "gap-4 lg:gap-6",
  lg: "gap-6 lg:gap-8",
};

export function StatGrid({
  children,
  columns = 4,
  gap = "md",
  className,
}: StatGridProps) {
  return (
    <div className={cn("grid w-full", columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}
