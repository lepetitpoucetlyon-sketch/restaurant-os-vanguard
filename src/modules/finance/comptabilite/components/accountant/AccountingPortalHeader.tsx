import React from 'react';
import { Building, Calendar, ShieldCheck } from 'lucide-react';

interface AccountingPortalHeaderProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export function AccountingPortalHeader({ selectedPeriod, onPeriodChange }: AccountingPortalHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border-default">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portail Fiduciaire & Expert-Comptable</h1>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                RBAC 65 • Lecture Seule Fiscale
              </span>
            </div>
            <p className="text-sm text-text-muted mt-0.5">
              Clôtures mensuelles scellées NF525, Fichier FEC DGFiP, Ventilation TVA CA3 et Intégration Silae / Pennylane.
            </p>
          </div>
        </div>
      </div>

      {/* Sélecteur de Période & Statut NF525 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-surface-glass border border-border-default rounded-xl px-3 py-1.5">
          <Calendar className="w-4 h-4 text-amber-400 mr-2" />
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="bg-transparent text-sm text-text-primary font-medium focus:outline-none cursor-pointer"
          >
            <option value="2026-08" className="bg-surface-card text-text-primary">Août 2026</option>
            <option value="2026-07" className="bg-surface-card text-text-primary">Juillet 2026</option>
            <option value="2026-06" className="bg-surface-card text-text-primary">Juin 2026</option>
            <option value="2026-05" className="bg-surface-card text-text-primary">Mai 2026</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>NF525 Certifié</span>
        </div>
      </div>
    </div>
  );
}
