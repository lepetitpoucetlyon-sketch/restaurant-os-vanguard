import React from 'react';
import { Globe, Palette, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { WizardStep } from './brandWizardTypes';

const STEPS: { id: WizardStep; label: string; icon: typeof Globe }[] = [
  { id: 'source',  label: 'Source',    icon: Globe },
  { id: 'preview', label: 'Aperçu',    icon: Palette },
  { id: 'confirm', label: 'Confirmer', icon: CheckCircle2 },
];

interface StepIndicatorProps {
  current: WizardStep;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIdx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
              done   && "bg-status-success border-status-success text-white",
              active && "border-action-primary text-action-primary bg-action-primary/10",
              !done && !active && "border-border-default text-text-muted"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={cn(
              "text-xs font-semibold uppercase tracking-widest",
              active ? "text-action-primary" : done ? "text-status-success" : "text-text-muted"
            )}>
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-text-muted mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
