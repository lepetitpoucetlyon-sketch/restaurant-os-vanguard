'use client';

import { Building2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { AutoProcurementAnalysisResult } from '../../procurement/AutoProcurementEngine';

interface ProcurementSupplierListProps {
  analysis: AutoProcurementAnalysisResult;
  activeSupplierId: string | null;
  setActiveSupplierId: (id: string) => void;
}

export function ProcurementSupplierList({
  analysis,
  activeSupplierId,
  setActiveSupplierId,
}: ProcurementSupplierListProps) {
  return (
    <div className="w-full md:w-1/3 space-y-2">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
        Paniers par Grossiste ({analysis.supplierBaskets.length})
      </div>
      <div className="space-y-2">
        {analysis.supplierBaskets.map((basket) => {
          const isSelected = basket.supplierId === activeSupplierId;
          const progressPct = Math.min(100, Math.round((basket.basketTotalHtCts / basket.francoCts) * 100));

          return (
            <div
              key={basket.supplierId}
              onClick={() => setActiveSupplierId(basket.supplierId)}
              className={cn(
                'p-4 rounded-2xl border transition cursor-pointer',
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  {basket.supplierName}
                </div>
                <span className="text-xs font-bold text-slate-300">
                  {(basket.basketTotalHtCts / 100).toFixed(2)} €
                </span>
              </div>

              {/* Barre de Progression Franco */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Franco : {(basket.francoCts / 100).toFixed(2)} €</span>
                  <span className={basket.isFrancoReached ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {basket.isFrancoReached ? 'Franco Atteint ✨' : `Manque ${(basket.amountToFrancoCts / 100).toFixed(2)} €`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      basket.isFrancoReached ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'
                    )}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
