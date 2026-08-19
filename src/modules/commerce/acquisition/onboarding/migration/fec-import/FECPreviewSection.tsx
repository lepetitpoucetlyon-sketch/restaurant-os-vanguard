import React from 'react';
import { FileText, CheckCircle2, AlertTriangle, X, Eye, ShieldCheck } from 'lucide-react';
import { parseFECAmount, type FECEntry } from "@/modules/finance";
import { formatMicrounits, formatFECDate } from './fecImportTypes';

interface FECPreviewSectionProps {
  file: File;
  preview: FECEntry[];
  warnings: string[];
  isValid: boolean;
  onReset: () => void;
}

export function FECPreviewSection({
  file,
  preview,
  warnings,
  isValid,
  onReset,
}: FECPreviewSectionProps) {
  return (
    <div className="space-y-4">
      {/* Info fichier + badge validité */}
      <div className="rounded-xl border border-border bg-surface-base p-4 flex items-center gap-3">
        <FileText className="w-5 h-5 shrink-0 text-action-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {file.name}
          </p>
          <p className="text-xs text-text-muted">
            {(file.size / 1024).toFixed(1)} Ko
          </p>
        </div>
        {isValid ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> FEC valide
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-status-danger bg-status-danger/10 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Format invalide
          </span>
        )}
        <button
          onClick={onReset}
          className="p-1 rounded-md text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Avertissements de parsing */}
      {warnings.length > 0 && (
        <div className="rounded-lg bg-status-warning/5 border border-status-warning/20 p-3">
          <p className="text-xs font-semibold text-status-warning flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {warnings.length} avertissement(s) de format
          </p>
          <ul className="space-y-0.5 max-h-24 overflow-y-auto">
            {warnings.map((w, i) => (
              <li key={i} className="text-[11px] text-text-muted font-mono">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prévisualisation 5 premières lignes */}
      {preview.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-bg-secondary">
            <Eye className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Prévisualisation — 5 premières écritures
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  {["Journal", "Date", "N° écriture", "Compte", "Libellé", "Débit", "Crédit"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold text-text-muted whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((entry, i) => (
                  <tr key={i} className="hover:bg-bg-secondary/40 transition">
                    <td className="px-3 py-2 font-mono text-text-primary whitespace-nowrap">
                      {entry.JournalCode}
                    </td>
                    <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                      {formatFECDate(entry.EcritureDate)}
                    </td>
                    <td className="px-3 py-2 font-mono text-text-muted whitespace-nowrap">
                      {entry.EcritureNum}
                    </td>
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      <span className="text-action-primary">{entry.CompteNum}</span>{" "}
                      <span className="text-text-muted">{entry.CompteLib}</span>
                    </td>
                    <td className="px-3 py-2 text-text-primary max-w-[160px] truncate">
                      {entry.EcritureLib}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary whitespace-nowrap">
                      {entry.Debit ? formatMicrounits(parseFECAmount(entry.Debit)) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary whitespace-nowrap">
                      {entry.Credit ? formatMicrounits(parseFECAmount(entry.Credit)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rappel immuabilité */}
      <p className="text-[11px] text-text-muted bg-bg-secondary rounded-lg px-3 py-2 flex items-start gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-action-primary shrink-0 mt-0.5" />
        Ces écritures seront marquées{" "}
        <strong className="text-text-primary">historical</strong> et immuables.
        Elles n'alimentent PAS la chaîne de scellage NF525 active.
      </p>
    </div>
  );
}
