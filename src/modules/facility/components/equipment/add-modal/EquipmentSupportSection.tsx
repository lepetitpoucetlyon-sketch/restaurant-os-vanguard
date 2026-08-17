'use client';

import { ShieldCheck } from 'lucide-react';

interface EquipmentSupportSectionProps {
  supportCompany: string;
  setSupportCompany: (v: string) => void;
  supportPhone: string;
  setSupportPhone: (v: string) => void;
}

export function EquipmentSupportSection({
  supportCompany,
  setSupportCompany,
  supportPhone,
  setSupportPhone,
}: EquipmentSupportSectionProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-800">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
        <span>Assistance & Contact SAV</span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Prestataire SAV / Dépannage
          </label>
          <input
            type="text"
            value={supportCompany}
            onChange={(e) => setSupportCompany(e.target.value)}
            placeholder="Ex: Froid Froid Express SAV"
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Téléphone d Urgence SAV
          </label>
          <input
            type="tel"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            placeholder="Ex: 01 44 00 00 00"
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
