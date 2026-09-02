'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, ChefHat, Sparkles, Utensils } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { formatMu } from '@/lib/formatters';

export type LiveOrderStatus = 'RECEIVED' | 'IN_PREPARATION' | 'PLATING' | 'READY' | 'SERVED';

interface LiveOrderTrackerProps {
  orderId: string;
  tenantId: string;
  tableNumber?: string | null;
  initialStatus?: LiveOrderStatus;
  itemsCount?: number;
  totalInMicrounits?: number;
  onOrderCompleted?: () => void;
  /** Intervalle de rafraîchissement du statut (ms). */
  pollIntervalMs?: number;
}

const UI_STRINGS = {
  kicker: "Suivi en direct",
  tablePrefix: "Table",
  orderFallback: "Votre commande",
  orderSuffix: "article(s) en cuisine",
  totalPrefix: "Total :",
  timePrefix: "~",
  minSuffix: "min",
  offline: "Reconnexion…",
} as const;

const STEPS: Array<{ id: LiveOrderStatus; label: string; sublabel: string; icon: React.ElementType }> = [
  { id: 'RECEIVED', label: 'Commande reçue', sublabel: 'Transmise au KDS en cuisine', icon: CheckCircle2 },
  { id: 'IN_PREPARATION', label: 'En préparation', sublabel: 'Le chef prépare vos plats', icon: ChefHat },
  { id: 'PLATING', label: 'Dressage & contrôle', sublabel: 'Finition et contrôle qualité', icon: Sparkles },
  { id: 'READY', label: 'Prête', sublabel: 'En route vers votre table', icon: Utensils },
  { id: 'SERVED', label: 'Servie', sublabel: 'Bon appétit !', icon: Utensils },
];

/** Statuts bruts `ops_flows` → étape d'affichage convive. */
const STATUS_MAP: Record<string, LiveOrderStatus> = {
  pending: 'RECEIVED',
  received: 'RECEIVED',
  confirmed: 'RECEIVED',
  preparing: 'IN_PREPARATION',
  in_preparation: 'IN_PREPARATION',
  cooking: 'IN_PREPARATION',
  fired: 'IN_PREPARATION',
  plating: 'PLATING',
  quality_check: 'PLATING',
  ready: 'READY',
  ready_to_serve: 'READY',
  served: 'SERVED',
  delivered: 'SERVED',
  completed: 'SERVED',
  paid: 'SERVED',
};

const ETA_BY_STATUS: Record<LiveOrderStatus, number> = {
  RECEIVED: 14,
  IN_PREPARATION: 9,
  PLATING: 3,
  READY: 1,
  SERVED: 0,
};

export function LiveOrderTracker({
  orderId,
  tenantId,
  tableNumber,
  initialStatus = 'RECEIVED',
  itemsCount = 1,
  totalInMicrounits = 0,
  onOrderCompleted,
  pollIntervalMs = 8000,
}: LiveOrderTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState<LiveOrderStatus>(initialStatus);
  const [liveItemsCount, setLiveItemsCount] = useState(itemsCount);
  const [liveTotalInMicrounits, setLiveTotalInMicrounits] = useState(totalInMicrounits);
  const [stale, setStale] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!orderId || !tenantId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/v1/orders/${encodeURIComponent(orderId)}?tenantId=${encodeURIComponent(tenantId)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;

        setStale(false);
        const mapped = STATUS_MAP[String(data.status ?? '').toLowerCase()] ?? 'RECEIVED';
        setCurrentStatus(mapped);
        if (typeof data.itemsCount === 'number') setLiveItemsCount(data.itemsCount);
        if (typeof data.totalInMicrounits === 'number') setLiveTotalInMicrounits(data.totalInMicrounits);

        if ((mapped === 'SERVED') && !completedRef.current) {
          completedRef.current = true;
          onOrderCompleted?.();
        }
      } catch {
        if (!cancelled) setStale(true);
      } finally {
        if (!cancelled && !completedRef.current) timer = setTimeout(poll, pollIntervalMs);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, tenantId, pollIntervalMs, onOrderCompleted]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStatus);
  const estimatedMinutes = ETA_BY_STATUS[currentStatus];

  return (
    <div className="w-full bg-surface-card border border-border-default rounded-3xl p-6 shadow-xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-action-primary">
            {UI_STRINGS.kicker}
          </span>
          <h2 className="text-lg font-bold text-text-primary">
            {tableNumber ? `${UI_STRINGS.tablePrefix} ${tableNumber}` : UI_STRINGS.orderFallback}
          </h2>
          <p className="text-xs text-text-muted font-mono">#{orderId.slice(-6).toUpperCase()}</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-subtle border border-border-default">
          <Clock className={cn('w-3.5 h-3.5 text-action-primary', !stale && estimatedMinutes > 0 && 'animate-pulse')} />
          <span className="text-xs font-bold text-text-primary">
            {stale
              ? UI_STRINGS.offline
              : estimatedMinutes > 0
              ? `${UI_STRINGS.timePrefix} ${estimatedMinutes} ${UI_STRINGS.minSuffix}`
              : STEPS[STEPS.length - 1].label}
          </span>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 pl-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute left-4.5 top-9 w-0.5 h-8 -ml-[1px] transition-colors duration-500',
                    isDone ? 'bg-emerald-500' : 'bg-border-subtle',
                  )}
                />
              )}

              <div
                className={cn(
                  'relative z-10 size-9 rounded-full flex items-center justify-center transition-all duration-300',
                  isDone
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-action-primary text-text-on-primary ring-4 ring-action-primary/20 scale-110'
                    : 'bg-surface-subtle border border-border-default text-text-muted',
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-xs font-bold transition-colors',
                    isCurrent
                      ? 'text-text-primary font-extrabold text-sm'
                      : isDone
                      ? 'text-text-secondary'
                      : 'text-text-muted',
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-text-muted">{step.sublabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
        <span>{liveItemsCount} {UI_STRINGS.orderSuffix}</span>
        {liveTotalInMicrounits > 0 && (
          <span className="font-bold text-text-primary">
            {UI_STRINGS.totalPrefix} {formatMu(liveTotalInMicrounits)}
          </span>
        )}
      </div>
    </div>
  );
}
