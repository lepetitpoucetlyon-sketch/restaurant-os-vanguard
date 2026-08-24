import React from 'react';
import { Download, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface MonthlyCloseHeroProps {
  selectedPeriod: string;
  isDownloading: boolean;
  isTransmitting: string | null;
  transmitSuccess: string | null;
  onDownloadPack: () => void;
  onTransmit: (provider: 'pennylane' | 'silae' | 'sage' | 'cegid') => void;
}

export function MonthlyCloseHero({
  selectedPeriod,
  isDownloading,
  isTransmitting,
  transmitSuccess,
  onDownloadPack,
  onTransmit,
}: MonthlyCloseHeroProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Clôture Fiscale Mensuelle en 1 Clic
          </span>
          <h2 className="text-xl lg:text-2xl font-bold text-white">
            Pack Comptable {selectedPeriod} • Prêt pour le Cabinet
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl">
            Contient l'intégralité des pièces légales scellées : FEC DGFiP officiel, Grand Livre des Ventes NF525, 
            ventilations TVA (5.5%, 10%, 20%), variables de paie Silae HCR et lettrage bancaire.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={onDownloadPack}
            disabled={isDownloading}
            className="flex-1 lg:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm"
          >
            <Download className={cn("w-4 h-4", isDownloading && "animate-bounce")} />
            <span>{isDownloading ? "Compilation du Pack..." : "Télécharger Pack Mensuel (ZIP)"}</span>
          </button>
        </div>
      </div>

      {/* Télétransmission Directe API */}
      <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-text-muted font-medium">
          Télétransmission Directe API vers les logiciels comptables français :
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onTransmit('pennylane')}
            disabled={!!isTransmitting}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-text-primary border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-amber-500/40"
          >
            <span>🪙 Pennylane</span>
            <Send className="w-3 h-3 text-text-muted" />
          </button>

          <button
            onClick={() => onTransmit('silae')}
            disabled={!!isTransmitting}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-text-primary border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-indigo-500/40"
          >
            <span>💼 Silae Paie</span>
            <Send className="w-3 h-3 text-text-muted" />
          </button>

          <button
            onClick={() => onTransmit('sage')}
            disabled={!!isTransmitting}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-text-primary border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-emerald-500/40"
          >
            <span>📗 Sage 100</span>
            <Send className="w-3 h-3 text-text-muted" />
          </button>

          <button
            onClick={() => onTransmit('cegid')}
            disabled={!!isTransmitting}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-text-primary border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-blue-500/40"
          >
            <span>📘 Cegid Loop</span>
            <Send className="w-3 h-3 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Toast de succès de transmission */}
      {transmitSuccess && (
        <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Télétransmission réussie vers {transmitSuccess.toUpperCase()} pour la période {selectedPeriod} !</span>
        </div>
      )}
    </div>
  );
}
