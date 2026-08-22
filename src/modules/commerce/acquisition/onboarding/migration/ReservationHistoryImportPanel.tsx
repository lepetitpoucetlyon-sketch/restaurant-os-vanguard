/* eslint-disable no-restricted-imports */
 
"use client";

/**
 * ReservationHistoryImportPanel — mig-12
 *
 * Dropzone CSV + barre de progression + résumé des erreurs.
 * Alimente visitHistory CRM uniquement (jamais les réservations actives).
 */

import { useCallback, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, FileText, X } from "lucide-react";
import {
  ReservationHistoryImporter,
  type ImportReservationResult,
} from "@/modules/commerce/relation/reservations/migration";
import { useTenant } from "@/shared/hooks";
import { toError } from "@/lib/toError";

// ── Types locaux ────────────────────────────────────────────────────────────────

type PanelState =
  | { phase: "idle" }
  | { phase: "ready"; file: File }
  | { phase: "importing"; progress: number }
  | { phase: "done"; result: ImportReservationResult; fileName: string }
  | { phase: "error"; message: string };

// ── Constantes ─────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
];

const SOURCE_OPTIONS = [
  { value: "zenchef", label: "Zenchef (DD/MM/YYYY)" },
  { value: "thefork", label: "TheFork (YYYY-MM-DD)" },
  { value: "generic", label: "Autre (détection auto)" },
] as const;

type Source = (typeof SOURCE_OPTIONS)[number]["value"];

// ── Composant ──────────────────────────────────────────────────────────────────

export function ReservationHistoryImportPanel() {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId ?? 'default';
  const [state, setState] = useState<PanelState>({ phase: "idle" });
  const [source, setSource] = useState<Source>("zenchef");
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Dropzone ────────────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith(".csv")) {
      setState({ phase: "error", message: "Seuls les fichiers CSV sont acceptés." });
      return;
    }
    setState({ phase: "ready", file });
  }, []);

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
    if (state.phase !== "ready") return;
    const { file } = state;

    setState({ phase: "importing", progress: 5 });

    try {
      const csvContent = await file.text();

      // Simulation progress (l'importer n'expose pas de callback ici)
      setState({ phase: "importing", progress: 30 });
      const importer = new ReservationHistoryImporter();
      setState({ phase: "importing", progress: 60 });

      const result = await importer.importCSV(csvContent, tenantId, source);

      setState({ phase: "done", result, fileName: file.name });
    } catch (err) {
      setState({
        phase: "error",
        message: toError(err).message,
      });
    }
  }, [state, tenantId, source]);

  const reset = () => setState({ phase: "idle" });

  // ── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-action-primary" />
          Import réservations historiques
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Exporte Zenchef / TheFork — alimente uniquement{" "}
          <strong>visitHistory</strong> CRM (jamais les réservations actives).
        </p>
      </div>

      {/* Sélection de la source */}
      {(state.phase === "idle" || state.phase === "ready") && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-text-muted whitespace-nowrap">
            Format source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as Source)}
            className="flex-1 text-sm rounded-lg border border-border bg-surface-base px-3 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary/40"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
              Glisser-déposer un fichier CSV
            </p>
            <p className="text-xs text-text-muted mt-1">ou cliquer pour parcourir</p>
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={onInputChange}
          />
        </label>
      )}

      {/* ── Phase ready : fichier sélectionné ────────────────────────────── */}
      {state.phase === "ready" && (
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
          <button
            onClick={reset}
            className="p-1 rounded-md text-text-muted hover:text-status-danger hover:bg-status-danger/10 transition"
            title="Supprimer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Phase importing : progress bar ───────────────────────────────── */}
      {state.phase === "importing" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Import en cours…</span>
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

      {/* ── Phase done : résumé ───────────────────────────────────────────── */}
      {state.phase === "done" && (
        <div className="rounded-xl border border-status-success/30 bg-status-success/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Import terminé — {state.fileName}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                <strong className="text-status-success">{state.result.imported}</strong>{" "}
                visite(s) importée(s) dans visitHistory CRM
              </p>
            </div>
          </div>

          {/* Erreurs / avertissements */}
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

          <button
            onClick={reset}
            className="text-xs text-action-primary hover:underline"
          >
            Importer un autre fichier
          </button>
        </div>
      )}

      {/* ── Phase error ───────────────────────────────────────────────────── */}
      {state.phase === "error" && (
        <div className="rounded-xl border border-status-danger/30 bg-status-danger/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-status-danger">Erreur d'import</p>
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
      {state.phase === "ready" && (
        <button
          onClick={runImport}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-action-primary text-text-primary text-sm font-semibold py-2.5 px-4 hover:opacity-90 active:scale-[0.98] transition"
        >
          <Upload className="w-4 h-4" />
          Importer les réservations
        </button>
      )}
    </div>
  );
}
