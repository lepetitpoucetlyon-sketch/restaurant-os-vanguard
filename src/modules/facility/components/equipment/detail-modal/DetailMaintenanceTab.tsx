'use client';

import React from 'react';
import { Wrench, Calendar } from 'lucide-react';
import type { EquipmentAsset } from '../../../assets/domain/schemas/equipment';

interface DetailMaintenanceTabProps {
  asset: EquipmentAsset;
  onOpenTroubleshoot: () => void;
}

export function DetailMaintenanceTab({ asset, onOpenTroubleshoot }: DetailMaintenanceTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Un dysfonctionnement sur cet appareil ?</h4>
          <p className="text-xs text-slate-300">
            Lancez l assistant de diagnostic pas-à-pas ou déclarez une panne d urgence.
          </p>
        </div>
        <button
          onClick={onOpenTroubleshoot}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Dépanner / Déclarer</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Prochaine Échéance de Maintenance
        </h4>
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>
            Prévue le {new Date(asset.nextMaintenanceDueAt).toLocaleDateString('fr-FR')} (Révision {asset.maintenanceFrequencyDays}j)
          </span>
        </div>
      </div>
    </div>
  );
}
