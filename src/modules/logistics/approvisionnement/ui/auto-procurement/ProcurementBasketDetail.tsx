'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { SupplierBasketDraft } from '../../procurement/AutoProcurementEngine';

interface ProcurementBasketDetailProps {
  selectedBasket: SupplierBasketDraft | null | undefined;
  targetDeliveryDate: string;
  setTargetDeliveryDate: (date: string) => void;
}

export function ProcurementBasketDetail({
  selectedBasket,
  targetDeliveryDate,
  setTargetDeliveryDate,
}: ProcurementBasketDetailProps) {
  return (
    <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
      {selectedBasket ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="font-black text-base text-white">{selectedBasket.supplierName}</h4>
              <p className="text-xs text-text-muted">
                {selectedBasket.items.length} article{selectedBasket.items.length > 1 ? 's' : ''} à commander
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Date souhaitée :</span>
              <input
                type="date"
                value={targetDeliveryDate}
                onChange={(e) => setTargetDeliveryDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs px-2.5 py-1 rounded-lg text-white font-medium"
              />
            </div>
          </div>

          {/* Lignes de commande */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {selectedBasket.items.map((item) => (
              <div
                key={item.stockItemId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                      item.urgency === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    )}
                  >
                    {item.urgency}
                  </span>
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-text-muted">
                      Stock actuel: {item.currentQuantity} {item.unit} | Cible: {item.targetQuantity} {item.unit}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-amber-400">
                    {item.recommendedPackagesCount}x {item.packagingLabel}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {(item.totalHtCts / 100).toFixed(2)} € HT
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions de comblement Franco */}
          {selectedBasket.suggestedFrancoFillers.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Suggestion de Comblement Franco
              </div>
              <div className="space-y-1.5">
                {selectedBasket.suggestedFrancoFillers.map((filler) => (
                  <div key={filler.mercurialeItemId} className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{filler.name} ({filler.packagingLabel})</span>
                    <span className="text-[11px] text-emerald-400 font-medium">{filler.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted/80 text-sm">
          Aucun réassort nécessaire pour le moment. Tous les stocks sont au-dessus des seuils de sécurité.
        </div>
      )}
    </div>
  );
}
