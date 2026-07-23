"use client";

/**
 * FECImportPanel — mig-13
 *
 * Dropzone FEC pipe-séparé (DGFiP) + validation format + prévisualisation
 * 5 premières lignes + bouton importer.
 *
 * Les entrées importées sont marquées status='historical' et IMMUABLES.
 * Elles ne s'injectent PAS dans la chaîne NF525 active.
 */

import { useCallback, useState } from "react";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Eye,
  ShieldCheck,
} from "lucide-react";
import {
  FECImporter,
  type FECEntry,
  type FECImportResult,
  parseFECAmount,
} from "@/modules/finance/migration/FECImporter";
import { useTenant } from "@/hooks";

// ── Types ──────────────────────────────────────────────────────────────────────

type PanelState =
  | { phase: "idle" }
  | { phase: "ready"; file: File; preview: FECEntry[]; warnings: string[]; isValid: boolean }
  | { phase: "importing"; progress: number }
  | { phase: "done"; result: FECImportResult; fileName: string; exercice: string }
  | { phase: "error"; message: string };

const CURRENT_YEAR = new Date().getFullYear();

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMicrounits(mu: number): string {
  return `${(mu / 1_000_000).toFixed(2)} €`;
}

function formatFECDate(raw: string): string {
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  }
  return raw;
}

// ── Composant ──────────────────────────────────────────────────────────────────

export function FECImportPanel() {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId ?? 'default';
  const [state, setState] = useState<PanelState>({ phase: "idle" });
  const [exercice, setExercice] = useState<string>(String(CURRENT_YEAR - 1));
  const [isDragOver, setIsDragOver] = useState(false);

  const importer = new FECImporter();

  // ── Gestion du fichier ──────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const content = await file.text();
        const { entries, warnings, isValid } = importer.preview(content);
        setState({ phase: "ready", file, preview: entries, warnings, isValid });
      } catch (err) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
     
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Import ──────────────────────────────────────────────────────────────────

  const runImport = useCallback(async () => {
    if (state.phase !== "ready" || !state.isValid) return;
    const { file } = state;

    setState({ phase: "importing", progress: 10 });

    try {
      const content = await file.text();
      setState({ phase: "importing", progress: 40 });

      const result = await importer.importFEC(content, tenantId, exercice);
      setState({ phase: "done", result, fileName: file.name, exercice });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
     
  }, [state, tenantId, exercice]);

  const reset = () => setState({ phase: "idle" });

  // ── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-action-primary" />
          Import FEC exercice précédent
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Fichier DGFiP pipe-séparé fourni par l'expert-comptable.{" "}
          <strong>Lecture seule, immuable</strong> — hors chaîne NF525 active.
        </p>
      </div>

      {/* Sélection exercice */}
      {(state.phase === "idle" || state.phase === "ready") && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-text-muted whitespace-nowrap">
            Exercice
          </label>
          <input
            type="text"
            value={exercice}
            onChange={(e) => setExercice(e.target.value)}
            placeholder="ex : 2024 ou 2023-2024"
            className="flex-1 text-sm rounded-lg border border-border bg-surface-base px-3 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary/40"
          />
        </div>
      )}

      {/* ── Phase idle : dropzone ─────────────────────────────────────────── */}
      {state.phase === "idle" && (
        <label
          className={[
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all",
            isDragOver
              ? "border-action-primary bg-action-primary/5"
              : "border-border hover:border-action-primary/50 hover:bg-bg-secondary",
          ].join(" ")}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
        >
          <Upload className="w-8 h-8 text-text-muted" />
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              Glisser-déposer le fichier FEC
            </p>
            <p className="text-xs text-text-muted mt-1">
              Format pipe-séparé (|) — .txt ou .csv
            </p>
          </div>
          <input
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            className="sr-only"
            onChange={onInputChange}
          />
        </label>
      )}

      {/* ── Phase ready : validation + preview ───────────────────────────── */}
      {state.phase === "ready" && (
        <div className="space-y-4">
          {/* Info fichier + badge validité */}
          <div className="rounded-xl border border-border bg-surface-base p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 shrink-0 text-action-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {state.file.name}
              </p>
              <p className="text-xs text-text-muted">
                {(state.file.size / 1024).toFixed(1)} Ko
              </p>
            </div>
            {state.isValid ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> FEC valide
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-status-danger bg-status-danger/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Format invalide
              </span>
            )}
            <button
              onClick={reset}
              className="p-1 rounded-md text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avertissements de parsing */}
          {state.warnings.length > 0 && (
            <div className="rounded-lg bg-status-warning/5 border border-status-warning/20 p-3">
              <p className="text-xs font-semibold text-status-warning flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {state.warnings.length} avertissement(s) de format
              </p>
              <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                {state.warnings.map((w, i) => (
                  <li key={i} className="text-[11px] text-text-muted font-mono">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prévisualisation 5 premières lignes */}
          {state.preview.length > 0 && (
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
                    {state.preview.map((entry, i) => (
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
      )}

      {/* ── Phase importing ───────────────────────────────────────────────── */}
      {state.phase === "importing" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Import FEC en cours…</span>
            <span>{state.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-action-primary transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Phase done ────────────────────────────────────────────────────── */}
      {state.phase === "done" && (
        <div className="rounded-xl border border-status-success/30 bg-status-success/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                FEC importé — exercice {state.exercice}
              </p>
              <div className="flex gap-4 mt-1 text-xs text-text-muted">
                <span>
                  <strong className="text-status-success">{state.result.imported}</strong> écriture(s) importée(s)
                </span>
                {state.result.skipped > 0 && (
                  <span>
                    <strong className="text-status-warning">{state.result.skipped}</strong> ignorée(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {state.result.errors.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-1.5 text-xs font-medium text-status-warning cursor-pointer list-none">
                <AlertTriangle className="w-3.5 h-3.5" />
                {state.result.errors.length} avertissement(s) — cliquer pour voir
              </summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {state.result.errors.map((err, i) => (
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

          <button onClick={reset} className="text-xs text-action-primary hover:underline">
            Importer un autre FEC
          </button>
        </div>
      )}

      {/* ── Phase error ───────────────────────────────────────────────────── */}
      {state.phase === "error" && (
        <div className="rounded-xl border border-status-danger/30 bg-status-danger/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-status-danger">Erreur</p>
            <p className="text-xs text-text-muted mt-1 font-mono break-words">
              {state.message}
            </p>
          </div>
          <button
            onClick={reset}
            className="p-1 rounded-md text-text-muted hover:text-status-danger transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bouton importer */}
      {state.phase === "ready" && state.isValid && (
        <button
          onClick={runImport}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-action-primary text-white text-sm font-semibold py-2.5 px-4 hover:opacity-90 active:scale-[0.98] transition"
        >
          <Upload className="w-4 h-4" />
          Importer le FEC (exercice {exercice})
        </button>
      )}

      {state.phase === "ready" && !state.isValid && (
        <p className="text-center text-xs text-status-danger">
          Le format FEC n'est pas reconnu. Vérifiez que le fichier utilise le séparateur
          pipe (|) et contient les champs DGFiP obligatoires.
        </p>
      )}
    </div>
  );
}
