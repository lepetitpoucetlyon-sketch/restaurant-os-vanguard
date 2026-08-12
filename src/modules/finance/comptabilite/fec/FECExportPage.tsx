'use client';

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { FileSpreadsheet, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { activeTenantIdAtom } from '@/store/pillars/sovereign';
import { logger } from '@/lib/logger';

export function FECExportPage() {
  const tenantId = useAtomValue(activeTenantIdAtom) ?? 'main';
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [lastExportMessage, setLastExportMessage] = useState<string | null>(null);

  const handleExportMonth = async () => {
    setStatus('processing');
    try {
      logger.info(`[FECExportPage] Clôture mensuelle & export FEC pour ${month} (tenant: ${tenantId})`);
      
      await NexusEventBus.emitDurable('finance.month_closed', {
        v: 1,
        tenantId,
        month,
      });

      setStatus('done');
      setLastExportMessage(`L'export FEC pour le mois ${month} a été initié avec succès.`);
    } catch (err) {
      logger.error(`[FECExportPage] Échec de la clôture ${month}`, err);
      setStatus('idle');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            Conformité Fiscale NF525 & Export FEC
          </h1>
          <p className="text-sm text-neutral-500">
            Génération du Fichier des Écritures Comptables (FEC) conforme aux exigences de la DGFIP.
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-amber-400" />
          Clôture Mensuelle & Génération FEC
        </h2>

        <div className="flex items-center gap-4 pt-2">
          <label className="text-sm font-medium text-neutral-300">
            Mois de clôture :
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="ml-3 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>

          <button
            onClick={handleExportMonth}
            disabled={status === 'processing'}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {status === 'processing' ? (
              'Génération en cours…'
            ) : (
              <>
                <Download className="h-4 w-4" />
                Générer & Clôturer le mois
              </>
            )}
          </button>
        </div>

        {status === 'done' && (
          <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-lg p-4 flex items-center gap-3 text-emerald-300 text-sm">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{lastExportMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
