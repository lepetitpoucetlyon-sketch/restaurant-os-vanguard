import React from 'react';
import { FileText, X, EyeOff, Info, Upload } from 'lucide-react';
import type { CustomerCSVRow } from '../CustomerCSVImporter';
import { FIELD_LABELS } from './customerImportTypes';

interface CustomerImportPreviewProps {
  file: File;
  rows: CustomerCSVRow[];
  maskedCount: number;
  onReset: () => void;
  onRunImport: () => void;
}

export function CustomerImportPreview({
  file,
  rows,
  maskedCount,
  onReset,
  onRunImport,
}: CustomerImportPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Fichier sélectionné */}
      <div className="rounded-xl border border-border bg-surface-base p-4 flex items-center gap-3">
        <FileText className="w-5 h-5 shrink-0 text-action-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
          <p className="text-xs text-text-muted">
            {(file.size / 1024).toFixed(1)} Ko · {rows.length} ligne(s) détectée(s)
          </p>
        </div>
        <button
          onClick={onReset}
          className="p-1 rounded-md text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition"
          title="Supprimer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Avertissement emails masqués */}
      {maskedCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/5 px-3 py-2.5">
          <EyeOff className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <p className="text-xs text-text-primary">
            <span className="font-semibold text-status-warning">{maskedCount} email(s) masqué(s)</span>{" "}
            TheFork / LaFourchette détecté(s) — ces lignes seront ignorées pour protéger le CRM.
          </p>
        </div>
      )}

      {/* Mapping colonnes auto-détectées */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-secondary p-3 space-y-2">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Colonnes détectées
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(rows[0]).map((col) => (
              <span
                key={col}
                className={[
                  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border",
                  FIELD_LABELS[col]
                    ? "bg-action-primary/10 border-action-primary/30 text-action-primary"
                    : "bg-bg-tertiary border-border text-text-muted",
                ].join(" ")}
              >
                {col}
                {FIELD_LABELS[col] && (
                  <span className="font-sans not-italic text-[10px] opacity-70">
                    → {FIELD_LABELS[col]}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prévisualisation des 5 premières lignes */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide px-3 pt-2.5 pb-1.5">
            Aperçu — 5 premières lignes
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border">
                  {Object.keys(rows[0]).slice(0, 8).map((col) => (
                    <th
                      key={col}
                      className="px-3 py-1.5 text-left font-medium text-text-muted font-mono whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Object.keys(rows[0]).slice(0, 8).map((col) => (
                      <td
                        key={col}
                        className="px-3 py-1.5 text-text-primary truncate max-w-[120px]"
                        title={row[col] ?? ""}
                      >
                        {row[col] || (
                          <span className="text-text-muted italic">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 5 && (
            <p className="text-[10px] text-text-muted px-3 py-2 border-t border-border">
              + {rows.length - 5} ligne(s) supplémentaire(s)
            </p>
          )}
        </div>
      )}

      {/* Bouton import */}
      <button
        onClick={onRunImport}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-action-primary text-text-primary text-sm font-semibold py-2.5 px-4 hover:opacity-90 active:scale-[0.98] transition"
      >
        <Upload className="w-4 h-4" />
        Importer {rows.length} client(s)
      </button>
    </div>
  );
}
