'use client';

import { Check } from 'lucide-react';

import { useLanguage } from "@/shared/hooks";
interface FloorPlanDoneViewProps {
  tablesCount: number;
  zonesCount: number;
  onReset: () => void;
}

export function FloorPlanDoneView({
  tablesCount,
  zonesCount,
  onReset,
}: FloorPlanDoneViewProps) {
    const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-status-success/15 flex items-center justify-center">
        <Check className="w-8 h-8 text-status-success" />
      </div>
      <h2 className="text-xl font-semibold text-text-primary">{t('commerce.floorPlan.saved')}</h2>
      <p className="text-sm text-text-muted max-w-sm">
        {tablesCount} table(s) créées dans {zonesCount} zone(s).
        Elles sont maintenant disponibles dans le module Réservations et le POS.
      </p>
      <button
        onClick={onReset}
        className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:border-accent/40 transition-colors"
      >
        Recommencer
      </button>
    </div>
  );
}
