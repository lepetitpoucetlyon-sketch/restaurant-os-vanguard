"use client";

import React, { useState } from 'react';
import { AlertCircle, BookOpen, Clock, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

export interface FlexibilityAlert {
  id: string;
  type: 'negative_stock' | 'pending_recipe' | 'quarantined_sync' | 'retroactive_shift';
  title: string;
  count?: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface FlexibilityAlertBannerProps {
  alerts: FlexibilityAlert[];
  className?: string;
  onDismissAlert?: (id: string) => void;
}

export const FlexibilityAlertBanner: React.FC<FlexibilityAlertBannerProps> = ({
  alerts,
  className,
  onDismissAlert,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  if (activeAlerts.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    onDismissAlert?.(id);
  };

  const getIcon = (type: FlexibilityAlert['type']) => {
    switch (type) {
      case 'negative_stock':
        return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'pending_recipe':
        return <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'retroactive_shift':
        return <Clock className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'quarantined_sync':
      default:
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
    }
  };

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs backdrop-blur-md border transition-all duration-200',
            alert.type === 'negative_stock' && 'bg-amber-950/40 border-amber-500/30 text-amber-200',
            alert.type === 'pending_recipe' && 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200',
            alert.type === 'quarantined_sync' && 'bg-red-950/40 border-red-500/30 text-red-200',
            alert.type === 'retroactive_shift' && 'bg-purple-950/40 border-purple-500/30 text-purple-200'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {getIcon(alert.type)}
            <span className="font-semibold shrink-0">{alert.title}</span>
            {alert.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-md bg-surface-elevated/60 text-[10px] font-mono font-bold">
                {alert.count}
              </span>
            )}
            <span className="truncate opacity-85 hidden sm:inline">{alert.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {alert.actionLabel && alert.onAction && (
              <button
                type="button"
                onClick={alert.onAction}
                className="flex items-center gap-1 font-medium hover:underline text-current cursor-pointer"
              >
                <span>{alert.actionLabel}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDismiss(alert.id)}
              className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Fermer l'alerte"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
