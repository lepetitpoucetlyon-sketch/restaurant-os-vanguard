'use client';

import React from 'react';
import { PhoneCall } from 'lucide-react';
import type { EquipmentAsset } from '../../../assets/domain/schemas/equipment';

interface DetailMachineTabProps {
  asset: EquipmentAsset;
}

export function DetailMachineTab({ asset }: DetailMachineTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 bg-surface-glass p-4 rounded-2xl border border-border-default">
        <div>
          <span className="text-text-muted text-xs block font-semibold">Nom Machine</span>
          <span className="text-text-primary font-medium text-sm">{asset.name}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs block font-semibold">Catégorie</span>
          <span className="text-text-primary font-medium text-sm">{asset.category}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs block font-semibold">Marque & Modèle</span>
          <span className="text-text-primary font-medium text-sm">{asset.brand} - {asset.model}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs block font-semibold">Numéro de Série</span>
          <span className="text-text-primary font-mono font-medium text-sm">{asset.serialNumber}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs block font-semibold">Zone / Emplacement</span>
          <span className="text-text-primary font-medium text-sm">{asset.location}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs block font-semibold">Fréquence de Révision</span>
          <span className="text-text-primary font-medium text-sm">Tous les {asset.maintenanceFrequencyDays} jours</span>
        </div>
      </div>

      {/* SAV & Dépannage Contact */}
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl space-y-2">
        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-blue-400" />
          <span>Support Constructeur & Prestataire SAV Dédié</span>
        </h4>
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-text-primary font-semibold text-sm block">
              {asset.supportContact?.companyName || asset.brand + ' Service Après-Vente'}
            </span>
            <span className="text-xs text-text-secondary">
              {asset.supportContact?.phone || 'Numéro direct non renseigné'}
            </span>
          </div>
          {asset.supportContact?.phone && (
            <a
              href={`tel:${asset.supportContact.phone}`}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-colors"
            >
              Appeler le SAV
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
