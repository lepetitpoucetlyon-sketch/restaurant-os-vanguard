"use client";

import React, { type ReactNode } from "react";
import { motion } from "framer-motion";
import { EmptyState, type EmptyStateProps } from "./EmptyState";
import { SkeletonList } from "./SkeletonList";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/ui.foundations";

export type DataViewState = "loading" | "error" | "empty" | "data";

export interface DataViewProps<T = unknown> {
  data?: T[] | null;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  empty?: {
    icon?: EmptyStateProps["icon"];
    emoji?: string;
    title: string;
    description?: string;
    action?: ReactNode;
    variant?: EmptyStateProps["variant"];
  };
  skeleton?: ReactNode;
  skeletonCount?: number;
  skeletonVariant?: "list" | "card" | "table" | "stat";
  children: ReactNode | ((items: T[]) => ReactNode);
  className?: string;
}

export function DataView<T = unknown>({
  data,
  isLoading = false,
  error = null,
  onRetry,
  empty,
  skeleton,
  skeletonCount = 3,
  skeletonVariant = "list",
  children,
  className,
}: DataViewProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        {skeleton || <SkeletonList count={skeletonCount} variant={skeletonVariant} />}
      </div>
    );
  }

  if (error) {
    const errorMsg = typeof error === "string" ? error : error.message || "Une erreur est survenue lors du chargement.";
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center p-8 rounded-2xl bg-status-danger/5 border border-status-danger/20 text-center",
          className
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-status-danger/10 text-status-danger flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-serif font-bold text-sm text-text-primary mb-1">
          Impossible de charger les données
        </h4>
        <p className="text-xs text-text-secondary max-w-sm mb-4 leading-relaxed">
          {errorMsg}
        </p>
        {onRetry && (
          <Button size="sm" variant="default" onClick={onRetry} className="gap-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            Réessayer
          </Button>
        )}
      </motion.div>
    );
  }

  const isEmpty = !data || (Array.isArray(data) && data.length === 0);

  if (isEmpty) {
    if (!empty) {
      return (
        <EmptyState
          title="Aucun élément"
          description="Aucune donnée disponible pour le moment."
          className={className}
        />
      );
    }

    return (
      <EmptyState
        icon={empty.icon}
        emoji={empty.emoji}
        title={empty.title}
        description={empty.description}
        action={empty.action}
        variant={empty.variant}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {typeof children === "function" ? (children as (items: T[]) => ReactNode)(data) : children}
    </div>
  );
}
