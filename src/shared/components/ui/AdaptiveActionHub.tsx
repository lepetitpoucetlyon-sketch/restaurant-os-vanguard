"use client";

import React, { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { Lock, ChevronUp, Sparkles } from "lucide-react";

export type ActionHubVariant = "dock" | "bottom-bar" | "speed-dial" | "grid" | "pill-bar";

export interface ActionHubItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  disabledReason?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold";
  badge?: string | number;
  shortcut?: string;
  /** RBAC guard parameters — if provided, automatically wraps with ActionGuard */
  security?: {
    page: string;
    action: string;
    requiresPin?: boolean;
  };
}

export interface AdaptiveActionHubProps {
  items: ActionHubItem[];
  variant?: ActionHubVariant;
  className?: string;
  /** Position on screen (for dock / speed-dial) */
  position?: "bottom-center" | "bottom-right" | "bottom-left" | "top-right" | "inline";
  /** Optional title or context summary (e.g. "Total: 45,00 €") */
  contextSummary?: ReactNode;
  /** Enable keyboard shortcuts auto-listener */
  enableShortcuts?: boolean;
}

export function AdaptiveActionHub({
  items,
  variant = "dock",
  className,
  position = "bottom-center",
  contextSummary,
  enableShortcuts = true,
}: AdaptiveActionHubProps) {
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  // Keyboard shortcut listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enableShortcuts) return;
      for (const item of items) {
        if (!item.shortcut || item.disabled || item.loading) continue;
        const key = item.shortcut.toLowerCase().replace("cmd+", "").replace("ctrl+", "").replace("⌘", "");
        if (e.key.toLowerCase() === key && (e.metaKey || e.ctrlKey || item.shortcut.length === 1)) {
          e.preventDefault();
          item.onClick?.();
          break;
        }
      }
    },
    [items, enableShortcuts]
  );

  useEffect(() => {
    if (!enableShortcuts) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enableShortcuts]);

  const renderItemButton = (item: ActionHubItem, isCompact = false) => {
    const variantStyles = {
      primary: "bg-action-primary text-text-on-primary shadow-lg shadow-action-primary/20 hover:opacity-95",
      secondary: "bg-surface-card border border-border text-text-primary hover:bg-bg-tertiary shadow-sm",
      danger: "bg-status-danger/10 border border-status-danger/30 text-status-danger hover:bg-status-danger/20",
      ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-glass",
      gold: "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold shadow-lg shadow-amber-500/20 hover:brightness-110",
    }[item.variant || "secondary"];

    const buttonContent = (
      <motion.button
        type="button"
        whileHover={{ scale: item.disabled ? 1 : 1.04 }}
        whileTap={{ scale: item.disabled ? 1 : 0.95 }}
        onClick={() => {
          if (!item.disabled && !item.loading) {
            item.onClick?.();
          }
        }}
        disabled={item.disabled || item.loading}
        title={item.disabled && item.disabledReason ? item.disabledReason : item.label}
        className={cn(
          "relative touch-target flex items-center justify-center gap-2 rounded-2xl transition-all select-none min-h-[44px]",
          isCompact ? "px-3.5 py-2 text-xs font-semibold" : "px-5 py-3 text-sm font-semibold",
          variantStyles,
          item.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
        )}
      >
        {item.loading ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          item.icon
        )}

        <span>{item.label}</span>

        {item.badge !== undefined && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-current">
            {item.badge}
          </span>
        )}

        {item.shortcut && (
          <kbd className="hidden sm:inline-block text-[10px] font-mono opacity-60 bg-black/10 dark:bg-white/10 px-1 rounded ml-1">
            {item.shortcut}
          </kbd>
        )}

        {item.disabled && item.disabledReason && (
          <Lock className="w-3 h-3 text-current opacity-70 ml-1" />
        )}
      </motion.button>
    );

    // Auto-wrap in ActionGuard if security config is provided
    if (item.security) {
      return (
        <ActionGuard
          key={item.id}
          page={item.security.page}
          action={item.security.action}
          requiresPin={item.security.requiresPin}
          disabledMode="disable"
          disabledReason={item.disabledReason || "Action sécurisée"}
        >
          {buttonContent}
        </ActionGuard>
      );
    }

    return <React.Fragment key={item.id}>{buttonContent}</React.Fragment>;
  };

  // 1. Variant: Floating macOS-style Dock
  if (variant === "dock") {
    return (
      <div
        className={cn(
          "fixed z-40 pb-safe pointer-events-none flex justify-center",
          position === "bottom-center" && "bottom-6 inset-x-0",
          position === "bottom-right" && "bottom-6 right-6",
          position === "bottom-left" && "bottom-6 left-6",
          position === "inline" && "relative bottom-auto inset-x-auto",
          className
        )}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto flex items-center gap-2 p-2 rounded-3xl bg-surface-card/90 dark:bg-bg-secondary/90 backdrop-blur-2xl border border-border/80 shadow-2xl shadow-black/20"
        >
          {contextSummary && (
            <div className="px-3.5 py-2 border-r border-border/60 text-xs font-semibold text-text-primary">
              {contextSummary}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {items.map((item) => renderItemButton(item, true))}
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Variant: Bottom Bar (sticky / pinned)
  if (variant === "bottom-bar") {
    return (
      <div
        className={cn(
          "sticky bottom-0 z-30 w-full bg-surface-card/95 dark:bg-bg-secondary/95 backdrop-blur-xl border-t border-border p-3 sm:p-4 pb-safe transition-colors",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {contextSummary && (
            <div className="w-full sm:w-auto text-sm font-medium text-text-primary">
              {contextSummary}
            </div>
          )}
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2.5">
            {items.map((item) => renderItemButton(item))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Variant: Speed Dial (Floating Action Button)
  if (variant === "speed-dial") {
    return (
      <div
        className={cn(
          "fixed bottom-6 right-6 z-40 pb-safe flex flex-col items-end gap-2.5 pointer-events-none",
          className
        )}
      >
        <AnimatePresence>
          {isSpeedDialOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="pointer-events-auto flex flex-col items-end gap-2 p-2 rounded-2xl bg-surface-card/95 backdrop-blur-xl border border-border shadow-xl mb-1"
            >
              {items.map((item) => (
                <div key={item.id} className="w-full">
                  {renderItemButton(item, true)}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
          className="pointer-events-auto touch-target w-14 h-14 rounded-full bg-action-primary text-text-on-primary shadow-xl shadow-action-primary/30 flex items-center justify-center transition-transform"
          title="Actions rapides"
        >
          <motion.div animate={{ rotate: isSpeedDialOpen ? 180 : 0 }}>
            {isSpeedDialOpen ? <ChevronUp className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>
    );
  }

  // 4. Variant: Grid (Matrix)
  if (variant === "grid") {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5", className)}>
        {items.map((item) => renderItemButton(item))}
      </div>
    );
  }

  // 5. Variant: Pill Bar (Compact inline)
  return (
    <div className={cn("flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-bg-tertiary/50 border border-border/50", className)}>
      {items.map((item) => renderItemButton(item, true))}
    </div>
  );
}
