'use client';

import React from 'react';
import { RefreshCw, Save, Building2, Flame, Snowflake, Coffee, Monitor, Sparkles, Layers, Zap } from 'lucide-react';
import { type RestaurantZone, RESTAURANT_ZONE_LABELS } from '@/modules/facility';

export const ZONE_ICONS: Record<RestaurantZone, React.ReactNode> = {
  ALL: <Building2 className="w-4 h-4 text-emerald-400" />,
  KITCHEN_HOT: <Flame className="w-4 h-4 text-amber-400" />,
  KITCHEN_COLD: <Snowflake className="w-4 h-4 text-cyan-400" />,
  BAR_BEVERAGE: <Coffee className="w-4 h-4 text-orange-400" />,
  DINING_ROOM_POS: <Monitor className="w-4 h-4 text-indigo-400" />,
  DISHWASHING_HYGIENE: <Sparkles className="w-4 h-4 text-blue-400" />,
  STORAGE_CELLAR: <Layers className="w-4 h-4 text-purple-400" />,
  HVAC_FACILITY: <Zap className="w-4 h-4 text-rose-400" />,
  TERRACE_OUTDOOR: <Building2 className="w-4 h-4 text-teal-400" />,
};

interface MaintenanceHeaderProps {
  selectedZone: RestaurantZone;
  setSelectedZone: (zone: RestaurantZone) => void;
  loading: boolean;
  saving: boolean;
  onRefresh: () => void;
  onSave: () => void;
}

export function MaintenanceHeader({
  selectedZone,
  setSelectedZone,
  loading,
  saving,
  onRefresh,
  onSave,
}: MaintenanceHeaderProps) {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
              GMAO & Maintenance Intelligente
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              Pilier 8 Facility
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Paramètres de Maintenance & Routage des Alertes
          </h2>
          <p className="text-xs text-slate-400">
            Définissez les règles de déclenchement, les canaux de notification (In-app, SMS, Email) et qui reçoit les alertes par zone du restaurant.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Périmètre & Zone d Établissement :</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {(Object.keys(RESTAURANT_ZONE_LABELS) as RestaurantZone[]).map((zoneKey) => {
            const isSelected = selectedZone === zoneKey;
            return (
              <button
                key={zoneKey}
                onClick={() => setSelectedZone(zoneKey)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {ZONE_ICONS[zoneKey]}
                <span>{RESTAURANT_ZONE_LABELS[zoneKey]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
