import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CustomerImportResult } from '../CustomerCSVImporter';

interface CustomerImportDoneProps {
  fileName: string;
  result: CustomerImportResult;
  onReset: () => void;
}

export function CustomerImportDone({
  fileName,
  result,
  onReset,
}: CustomerImportDoneProps) {
  return (
    <div className="rounded-xl border border-status-success/30 bg-status-success/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Import terminé — {fileName}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Importés", value: result.imported, color: "text-status-success" },
          { label: "Mis à jour", value: result.updated, color: "text-action-primary" },
          { label: "Masqués ignorés", value: result.masked, color: "text-status-warning" },
          { label: "Ignorés / Erreurs", value: result.skipped + result.errors.length, color: "text-text-muted" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-surface-base px-3 py-2 text-center"
          >
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Détail erreurs */}
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

      <button
        onClick={onReset}
        className="text-xs text-action-primary hover:underline"
      >
        Importer un autre fichier
      </button>
    </div>
  );
}
