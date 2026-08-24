'use client';

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { FileSpreadsheet, CheckCircle, Download } from 'lucide-react';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
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
      <div className="bg-surface-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-text-primary">
          <FileSpreadsheet className="h-5 w-5 text-accent-gold" />
          Clôture Mensuelle & Génération FEC
        </h2>

        <div className="flex items-center gap-4 pt-2">
          <label className="text-sm font-medium text-text-secondary">
            Mois de clôture :
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="ml-3 bg-surface-glass border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
            />
          </label>

          <button
            onClick={handleExportMonth}
            disabled={status === 'processing'}
            className="flex items-center gap-2 bg-status-success hover:bg-status-success/90 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
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
          <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-4 flex items-center gap-3 text-status-success text-sm">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{lastExportMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
