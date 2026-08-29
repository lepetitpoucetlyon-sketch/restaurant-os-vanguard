'use client';

import { Download, Loader2 } from 'lucide-react';
import { PayrollStatusBadge } from './PayrollStatusBadge';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface PayrollCsvTabProps {
    periode: string;
    syncStatus: AsyncStatus;
    onExport: () => void;
}

export function PayrollCsvTab({ periode, syncStatus, onExport }: PayrollCsvTabProps) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-text-secondary">
                Export UTF-8 (séparateur <code>;</code>, compatible Excel FR) — Matricule, Heures normales,
                H.Sup +25%/+50%, Dimanche, Nuit, Fériés, Repas, Absences, CP, Taux, Brut estimé.
            </p>
            <button
                onClick={onExport}
                disabled={syncStatus === 'loading'}
                className="flex items-center gap-2 px-4 py-2 bg-status-info hover:bg-blue-700 disabled:opacity-50 text-text-primary text-sm font-medium rounded-lg transition-colors"
            >
                {syncStatus === 'loading'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />}
                Télécharger prepaie-{periode}.csv
            </button>
            <PayrollStatusBadge status={syncStatus} />
        </div>
    );
}
