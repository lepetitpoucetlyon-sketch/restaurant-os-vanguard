'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ChefHat, Sparkles, Utensils } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { formatCurrency } from '@/lib/formatters';

export type LiveOrderStatus = 'RECEIVED' | 'IN_PREPARATION' | 'PLATING' | 'READY' | 'SERVED';

interface LiveOrderTrackerProps {
  orderId: string;
  tenantId: string;
  tableNumber?: string | null;
  initialStatus?: LiveOrderStatus;
  itemsCount?: number;
  totalInMicrounits?: number;
  onOrderCompleted?: () => void;
}

const UI_STRINGS = {
  kicker: "Suivi en direct",
  tablePrefix: "Table",
  orderFallback: "Votre commande",
  orderSuffix: "article(s) en cuisine",
  totalPrefix: "Total :",
  timePrefix: "~",
  minSuffix: "min",
};

const STEPS: Array<{
  id: LiveOrderStatus;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}> = [
  { id: 'RECEIVED', label: 'Commande reçue', sublabel: 'Transmise au KDS en cuisine', icon: CheckCircle2 },
  { id: 'IN_PREPARATION', label: 'En préparation', sublabel: 'Le chef prépare vos plats', icon: ChefHat },
  { id: 'PLATING', label: 'Dressage & Contrôle', sublabel: 'Finition et contrôle qualité', icon: Sparkles },
  { id: 'SERVED', label: 'Servie à table', sublabel: 'Bon appétit !', icon: Utensils },
];

export function LiveOrderTracker({
  orderId,
  tableNumber,
  initialStatus = 'IN_PREPARATION',
  itemsCount = 1,
  totalInMicrounits = 0,
}: LiveOrderTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState<LiveOrderStatus>(initialStatus);
  const [estimatedMinutes, setEstimatedMinutes] = useState(12);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStatus('IN_PREPARATION');
      setEstimatedMinutes(8);
    }, 4000);

    const timer2 = setTimeout(() => {
      setCurrentStatus('PLATING');
      setEstimatedMinutes(2);
    }, 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStatus);

  return (
    <div className="w-full bg-surface-card border border-border-default rounded-3xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header Statut */}
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
          <Clock className="w-3.5 h-3.5 text-action-primary animate-pulse" />
          <span className="text-xs font-bold text-text-primary">
            {UI_STRINGS.timePrefix} {estimatedMinutes} {UI_STRINGS.minSuffix}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
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
                    "absolute left-4 top-8 w-0.5 h-8 -ml-[1px] transition-colors duration-500",
                    isDone ? "bg-emerald-500" : "bg-border-subtle"
                  )}
                />
              )}

              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  isDone
                    ? "bg-emerald-500 text-white shadow-sm"
                    : isCurrent
                    ? "bg-action-primary text-text-on-primary ring-4 ring-action-primary/20 scale-110"
                    : "bg-surface-subtle border border-border-default text-text-muted"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-xs font-bold transition-colors",
                    isCurrent
                      ? "text-text-primary font-extrabold text-sm"
                      : isDone
                      ? "text-text-secondary"
                      : "text-text-muted"
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

      {/* Résumé bas de page */}
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
        <span>{itemsCount} {UI_STRINGS.orderSuffix}</span>
        {totalInMicrounits > 0 && (
          <span className="font-bold text-text-primary">
            {UI_STRINGS.totalPrefix} {formatCurrency(totalInMicrounits / 10_000 / 100)}
          </span>
        )}
      </div>
    </div>
  );
}
