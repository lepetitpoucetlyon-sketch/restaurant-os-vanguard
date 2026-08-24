'use client';

import { FileText, CheckCircle2, Clock, Plus } from 'lucide-react';
import type { ContractRecord } from '../../services/SovereignSignatureEngine';

interface MCCStatsCardsProps {
  contracts: ContractRecord[];
  onOpenCreateModal: () => void;
}

export function MCCStatsCards({ contracts, onOpenCreateModal }: MCCStatsCardsProps) {
  const signedCount = contracts.filter((c) => c.status === 'SIGNED').length;
  const pendingCount = contracts.filter((c) => c.status === 'SENT' || c.status === 'VIEWED').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center justify-between text-text-muted mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold">Total Contrats</span>
          <FileText className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-3xl font-bold text-white">{contracts.length}</p>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center justify-between text-text-muted mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold">Signés & Actifs</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-3xl font-bold text-emerald-400">{signedCount}</p>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center justify-between text-text-muted mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold">En Attente Signature</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl flex flex-col justify-center">
        <button
          onClick={onOpenCreateModal}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Émettre un Contrat SaaS
        </button>
      </div>
    </div>
  );
}
