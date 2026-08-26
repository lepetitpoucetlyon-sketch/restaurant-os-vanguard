'use client';

import { AlertTriangle, Layers, TrendingDown } from 'lucide-react';
import type { AutoProcurementAnalysisResult } from '../../procurement/AutoProcurementEngine';

interface ProcurementMetricsCardsProps {
  analysis: AutoProcurementAnalysisResult;
}

export function ProcurementMetricsCards({ analysis }: ProcurementMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-2xl bg-surface-glass border border-border-default">
        <div className="text-micro font-bold text-text-muted uppercase">Articles Scannés</div>
        <div className="text-2xl font-black text-text-primary mt-1">{analysis.totalItemsScanned}</div>
        <div className="text-micro text-text-muted mt-0.5">Sur tout le stock restaurant</div>
      </div>

      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
        <div className="text-micro font-bold text-rose-400 uppercase flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Stock Critique
        </div>
        <div className="text-2xl font-black text-rose-400 mt-1">{analysis.criticalItemsCount}</div>
        <div className="text-micro text-rose-400/70 mt-0.5">Rupture immédiate sous 24h</div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <div className="text-micro font-bold text-amber-400 uppercase flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Stock Bas
        </div>
        <div className="text-2xl font-black text-amber-400 mt-1">{analysis.lowStockItemsCount}</div>
        <div className="text-micro text-amber-400/70 mt-0.5">Sous le seuil d'alerte</div>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="text-micro font-bold text-emerald-400 uppercase flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5" /> Économies Franco
        </div>
        <div className="text-2xl font-black text-emerald-400 mt-1">
          {(analysis.estimatedShippingSavingsCts / 100).toFixed(2)} €
        </div>
        <div className="text-micro text-emerald-400/70 mt-0.5">Frais de port neutralisés</div>
      </div>
    </div>
  );
}
