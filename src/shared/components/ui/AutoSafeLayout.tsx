"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/ui.foundations";
import { DataView, type DataViewState } from "./DataView";
import { AdaptiveActionHub, type ActionHubItem, type ActionHubVariant } from "./AdaptiveActionHub";
import { useIsMobile } from "@/shared/hooks/useIsMobile";

export type LayoutSkin = "default" | "apple-glass" | "cyber-gold" | "bistro-warm" | "compact-pro";

export interface AutoSafeLayoutProps {
  /** Page header slot */
  header?: ReactNode;
  /** Sidebar / secondary column slot */
  sidebar?: ReactNode;
  /** Action hub items or custom action bar */
  actions?: ActionHubItem[];
  /** Action hub rendering style */
  actionVariant?: ActionHubVariant;
  /** Data view lifecycle state (loading / empty / error / data) */
  dataState?: DataViewState;
  empty?: {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
      variant?: "primary" | "secondary";
    };
  };
  error?: {
    title?: string;
    message?: string;
    onRetry?: () => void;
  };
  skeleton?: ReactNode;
  /** Design system skin preset */
  skin?: LayoutSkin;
  /** Container width format */
  container?: "fluid" | "contained" | "split" | "cinema";
  className?: string;
  children: ReactNode;
}

export function AutoSafeLayout({
  header,
  sidebar,
  actions,
  actionVariant = "dock",
  dataState = "data",
  empty,
  error,
  skeleton,
  skin = "default",
  container = "fluid",
  className,
  children,
}: AutoSafeLayoutProps) {
  const isMobile = useIsMobile();

  const skinClasses = {
    default: "",
    "apple-glass": "bg-gradient-to-b from-bg-primary via-surface-card/40 to-bg-primary backdrop-blur-3xl",
    "cyber-gold": "bg-[#090A0F] text-amber-100 border-amber-500/20",
    "bistro-warm": "bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5",
    "compact-pro": "text-xs p-1 gap-1.5",
  }[skin];

  const containerClasses = {
    fluid: "w-full px-4 sm:px-6 lg:px-8",
    contained: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    split: "w-full grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6",
    cinema: "w-full max-w-[1800px] mx-auto px-4 sm:px-6",
  }[container];

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-bg-primary text-text-primary pt-safe pb-safe transition-colors duration-200",
        skinClasses,
        className
      )}
    >
      {/* Header Slot */}
      {header && (
        <header className="sticky top-0 z-30 w-full bg-surface-card/80 dark:bg-bg-secondary/80 backdrop-blur-xl border-b border-border transition-colors">
          {header}
        </header>
      )}

      {/* Main Body */}
      <main className={cn("flex-1 py-4 sm:py-6", containerClasses)}>
        {container === "split" && sidebar ? (
          <>
            <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
              {sidebar}
            </aside>
            <section className="lg:col-span-8 xl:col-span-9 space-y-6">
              <DataView
                data={dataState === "empty" ? [] : [true]}
                isLoading={dataState === "loading"}
                error={dataState === "error" ? (error?.message || "Erreur de chargement") : null}
                onRetry={error?.onRetry}
                empty={empty ? {
                  icon: empty.icon as any,
                  title: empty.title || "Aucun élément",
                  description: empty.description,
                  action: empty.action ? (
                    <button
                      type="button"
                      onClick={empty.action.onClick}
                      aria-label={empty.action.label}
                      className="px-4 py-2 rounded-xl bg-action-primary text-text-on-primary text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer"
                    >
                      {empty.action.label}
                    </button>
                  ) : undefined,
                } : undefined}
                skeleton={skeleton}
              >
                {children}
              </DataView>
            </section>
          </>
        ) : (
          <div className="space-y-6">
            {sidebar && <div className="mb-4">{sidebar}</div>}
            <DataView
              data={dataState === "empty" ? [] : [true]}
              isLoading={dataState === "loading"}
              error={dataState === "error" ? (error?.message || "Erreur de chargement") : null}
              onRetry={error?.onRetry}
              empty={empty ? {
                icon: empty.icon as any,
                title: empty.title || "Aucun élément",
                description: empty.description,
                action: empty.action ? (
                  <button
                    type="button"
                    onClick={empty.action.onClick}
                    aria-label={empty.action.label}
                    className="px-4 py-2 rounded-xl bg-action-primary text-text-on-primary text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer"
                  >
                    {empty.action.label}
                  </button>
                ) : undefined,
              } : undefined}
              skeleton={skeleton}
            >
              {children}
            </DataView>
          </div>
        )}
      </main>

      {/* Adaptive Action Hub */}
      {actions && actions.length > 0 && (
        <AdaptiveActionHub
          items={actions}
          variant={isMobile && actionVariant === "dock" ? "bottom-bar" : actionVariant}
        />
      )}
    </div>
  );
}
