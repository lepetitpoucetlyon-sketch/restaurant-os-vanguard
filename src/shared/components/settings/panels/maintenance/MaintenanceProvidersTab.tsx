'use client';

import { Phone, Mail } from 'lucide-react';
import { RESTAURANT_ZONE_LABELS, type RestaurantZone, type MaintenanceSettingsConfig } from '@/modules/facility';

export type ExternalMaintenanceProvider = MaintenanceSettingsConfig['externalProviders'][number];

interface MaintenanceProvidersTabProps {
  providers: ExternalMaintenanceProvider[];
}

export function MaintenanceProvidersTab({ providers }: MaintenanceProvidersTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((prov) => (
          <div key={prov.id} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">{prov.name}</h4>
                <p className="text-xs text-emerald-400">{prov.specialty}</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400">
                {prov.contractNumber || 'Contrat Standard'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-white">{prov.phone}</span>
              </div>
              {prov.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prov.email}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-bold">Zones :</span>
              {prov.assignedZones.map((z: RestaurantZone) => (
                <span key={z} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                  {RESTAURANT_ZONE_LABELS[z] || z}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
