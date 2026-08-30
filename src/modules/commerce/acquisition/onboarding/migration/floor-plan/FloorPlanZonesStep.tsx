'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from "@/shared/components/ui/Button";

export const AVAILABLE_ZONES = ['Salle', 'Terrasse', 'Bar', 'Salon privé'] as const;
export type ZoneName = (typeof AVAILABLE_ZONES)[number];

interface FloorPlanZonesStepProps {
  selectedZones: ZoneName[];
  toggleZone: (zone: ZoneName) => void;
  onNext: () => void;
}

export function FloorPlanZonesStep({
  selectedZones,
  toggleZone,
  onNext,
}: FloorPlanZonesStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">Sélectionnez les zones que possède votre établissement :</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AVAILABLE_ZONES.map(zone => {
          const selected = selectedZones.includes(zone);
          return (
            <Button variant="ghost"
              key={zone}
              onClick={() => toggleZone(zone)}
              className={[
                'rounded-xl border-2 p-4 text-sm font-medium transition-all',
                selected
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-secondary text-text-muted hover:border-accent/40 hover:text-text-primary',
              ].join(' ')}
            >
              {zone}
            </Button>
          );
        })}
      </div>
      {selectedZones.length === 0 && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400">Sélectionnez au moins une zone.</p>
      )}
      <div className="flex justify-end pt-2">
        <Button variant="ghost"
          onClick={onNext}
          disabled={selectedZones.length === 0}
          className="flex items-center gap-2 rounded-lg bg-text-primary text-bg-primary px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Suivant <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
