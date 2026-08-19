import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { FECImportResult } from "@/modules/finance";

interface FECDoneSectionProps {
  exercice: string;
  result: FECImportResult;
  onReset: () => void;
}

export function FECDoneSection({ exercice, result, onReset }: FECDoneSectionProps) {
  return (
    <div className="rounded-xl border border-status-success/30 bg-status-success/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-text-primary">
            FEC importé — exercice {exercice}
          </p>
          <div className="flex gap-4 mt-1 text-xs text-text-muted">
            <span>
              <strong className="text-status-success">{result.imported}</strong> écriture(s) importée(s)
            </span>
            {result.skipped > 0 && (
              <span>
                <strong className="text-status-warning">{result.skipped}</strong> ignorée(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {result.errors.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-1.5 text-xs font-medium text-status-warning cursor-pointer list-none">
            <AlertTriangle className="w-3.5 h-3.5" />
            {result.errors.length} avertissement(s) — cliquer pour voir
          </summary>
          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {result.errors.map((err, i) => (
              <li
                key={i}
                className="text-[11px] text-text-muted font-mono bg-bg-secondary rounded px-2 py-1"
              >
                {err}
              </li>
            ))}
          </ul>
        </details>
      )}

      <button onClick={onReset} className="text-xs text-action-primary hover:underline">
        Importer un autre FEC
      </button>
    </div>
  );
}
