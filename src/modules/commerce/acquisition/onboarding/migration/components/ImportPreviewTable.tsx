'use client';

import { AlertTriangle, XCircle, Info } from 'lucide-react';
import type { ImportCategory, ImportWarning } from '../types';

export function WarningBadge({ w }: { w: ImportWarning }) {
  const map = {
    error:   { cls: 'bg-destructive/10 text-destructive border-destructive/30', Icon: XCircle },
    warning: { cls: 'bg-action-primary/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', Icon: AlertTriangle },
    info:    { cls: 'bg-status-info/10 text-blue-700 dark:text-blue-400 border-blue-500/30', Icon: Info },
  } as const;
  const { cls, Icon } = map[w.severity];
  return (
    <div className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{w.message}</span>
    </div>
  );
}

interface ImportPreviewTableProps {
  rows: Record<string, string>[];
  headers: string[];
  warnings: ImportWarning[];
  extraWarnings: ImportWarning[];
  category: ImportCategory;
  onImport: () => void;
  onBack: () => void;
}

export function ImportPreviewTable({
  rows,
  headers,
  warnings,
  extraWarnings,
  category: _category,
  onImport,
  onBack,
}: ImportPreviewTableProps) {
  const preview = rows.slice(0, 10);
  const allWarnings = [...extraWarnings, ...warnings.slice(0, 5)];
  const hasErrors = allWarnings.some(w => w.severity === 'error');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{rows.length}</span> lignes détectées
          {rows.length > 10 && <span className="text-muted-foreground"> — aperçu des 10 premières</span>}
        </span>
        <span className="text-muted-foreground">{headers.length} colonnes</span>
      </div>

      {allWarnings.length > 0 && (
        <div className="space-y-1.5">
          {allWarnings.map((w, i) => <WarningBadge key={i} w={w} />)}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              {headers.map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {preview.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                {headers.map(h => (
                  <td key={h} className="px-3 py-1.5 whitespace-nowrap max-w-[160px] truncate text-foreground/80">{row[h]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={onImport}
          disabled={hasErrors}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {hasErrors ? 'Corriger les erreurs avant d\'importer' : `Importer ${rows.length} lignes →`}
        </button>
      </div>
    </div>
  );
}
