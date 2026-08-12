"use client";

/**
 * CustomerImportPanel — wid-6
 *
 * Outil d'import CSV clients (migration depuis Zenchef / TheFork / tableur maison).
 * - Drop zone (glisser-déposer ou clic)
 * - Prévisualisation des 5 premières lignes avec détection automatique des colonnes
 * - Avertissement si des emails masqués TheFork sont détectés
 * - Barre de progression pendant l'import
 * - Résumé final : importés / mis à jour / ignorés (masqués) / erreurs
 * - Bouton de téléchargement du template CSV clients
 */

import { useCallback, useState } from "react";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Download,
  EyeOff,
  Info,
} from "lucide-react";

import { CustomerCSVImporter } from './CustomerCSVImporter';
import type { CustomerImportResult, CustomerCSVRow } from './CustomerCSVImporter';
import { downloadCSVTemplate } from './csvTemplates';
import { useTenant } from "@/kernel/hooks";
import { toError } from "@/lib/toError";

// ── Types locaux ──────────────────────────────────────────────────────────────

type PanelPhase =
  | { phase: "idle" }
  | { phase: "ready"; file: File; rows: CustomerCSVRow[]; maskedCount: number }
  | { phase: "importing"; progress: number }
  | { phase: "done"; result: CustomerImportResult; fileName: string }
  | { phase: "error"; message: string };

// ── Constantes ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"];

/** Colonnes cibles connues — pour l'affichage du mapping auto-détecté. */
const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  prenom: "Prénom", first_name: "Prénom", firstname: "Prénom",
  nom: "Nom", last_name: "Nom", lastname: "Nom",
  telephone: "Téléphone", téléphone: "Téléphone", tel: "Téléphone", phone: "Téléphone",
  nb_visites: "Nb visites", visits: "Nb visites",
  derniere_visite: "Dernière visite", last_visit: "Dernière visite",
  notes: "Notes", commentaire: "Notes",
  anniversaire: "Anniversaire", birthday: "Anniversaire",
};

// ── Composant ─────────────────────────────────────────────────────────────────

export function CustomerImportPanel() {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId ?? "default";
  const [state, setState] = useState<PanelPhase>({ phase: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);

  const importer = new CustomerCSVImporter();

  // ── Lecture du fichier ─────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".csv")) {
        setState({ phase: "error", message: "Seuls les fichiers CSV sont acceptés." });
        return;
      }

      try {
        const text = await file.text();
        const rows = importer.parseCSV(text);

        // Compter les emails masqués dans l'aperçu (toutes lignes)
        const maskedCount = rows.filter(
          (r) => r.email && /(@thefork|@lafourchette|@opentable|@resy)\./i.test(r.email)
        ).length;

        setState({ phase: "ready", file, rows, maskedCount });
      } catch (err) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "Impossible de lire le fichier.",
        });
      }
    },
     
    []
  );

  // ── Drag & drop ────────────────────────────────────────────────────────────

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

  // ── Import ─────────────────────────────────────────────────────────────────

  const runImport = useCallback(async () => {
    if (state.phase !== "ready") return;
    const { file } = state;

    setState({ phase: "importing", progress: 5 });

    try {
      const csvContent = await file.text();
      const result = await importer.import(csvContent, tenantId, (pct) => {
        setState({ phase: "importing", progress: pct });
      });
      setState({ phase: "done", result, fileName: file.name });
    } catch (err) {
      setState({
        phase: "error",
        message: toError(err).message,
      });
    }
     
  }, [state, tenantId]);

  const reset = () => setState({ phase: "idle" });

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-2xl">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-action-primary" />
            Import clients CSV
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Compatible Zenchef, TheFork, Excel maison. Dédoublonnage automatique par email.
          </p>
        </div>

        {/* Télécharger le template */}
        <button
          onClick={() => downloadCSVTemplate("crm")}
          className="flex items-center gap-1.5 text-xs font-medium text-action-primary border border-action-primary/30 rounded-lg px-3 py-1.5 hover:bg-action-primary/5 transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          Template CSV
        </button>
      </div>

      {/* ── Dropzone (idle) ──────────────────────────────────────────────── */}
      {state.phase === "idle" && (
        <label
          className={[
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all",
            isDragOver
              ? "border-action-primary bg-action-primary/5"
              : "border-border hover:border-action-primary/40 hover:bg-bg-secondary",
          ].join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
        >
          <Upload className="w-8 h-8 text-text-muted" />
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              Glisser-déposer un fichier CSV
            </p>
            <p className="text-xs text-text-muted mt-1">
              ou cliquer pour parcourir · séparateur auto-détecté ( , ; tab )
            </p>
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={onInputChange}
          />
        </label>
      )}

      {/* ── Aperçu (ready) ───────────────────────────────────────────────── */}
      {state.phase === "ready" && (
        <div className="space-y-4">
          {/* Fichier sélectionné */}
          <div className="rounded-xl border border-border bg-surface-base p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 shrink-0 text-action-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{state.file.name}</p>
              <p className="text-xs text-text-muted">
                {(state.file.size / 1024).toFixed(1)} Ko · {state.rows.length} ligne(s) détectée(s)
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

          {/* Avertissement emails masqués */}
          {state.maskedCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/5 px-3 py-2.5">
              <EyeOff className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
              <p className="text-xs text-text-primary">
                <span className="font-semibold text-status-warning">{state.maskedCount} email(s) masqué(s)</span>{" "}
                TheFork / LaFourchette détecté(s) — ces lignes seront ignorées pour protéger le CRM.
              </p>
            </div>
          )}

          {/* Mapping colonnes auto-détectées */}
          {state.rows.length > 0 && (
            <div className="rounded-xl border border-border bg-bg-secondary p-3 space-y-2">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Colonnes détectées
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(state.rows[0]).map((col) => (
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
          {state.rows.length > 0 && (
            <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide px-3 pt-2.5 pb-1.5">
                Aperçu — 5 premières lignes
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      {Object.keys(state.rows[0]).slice(0, 8).map((col) => (
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
                    {state.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Object.keys(state.rows[0]).slice(0, 8).map((col) => (
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
              {state.rows.length > 5 && (
                <p className="text-[10px] text-text-muted px-3 py-2 border-t border-border">
                  + {state.rows.length - 5} ligne(s) supplémentaire(s)
                </p>
              )}
            </div>
          )}

          {/* Bouton import */}
          <button
            onClick={runImport}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-action-primary text-text-primary text-sm font-semibold py-2.5 px-4 hover:opacity-90 active:scale-[0.98] transition"
          >
            <Upload className="w-4 h-4" />
            Importer {state.rows.length} client(s)
          </button>
        </div>
      )}

      {/* ── Progression (importing) ──────────────────────────────────────── */}
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
          <p className="text-[11px] text-text-muted">
            Dédoublonnage par email — veuillez patienter.
          </p>
        </div>
      )}

      {/* ── Résumé final (done) ──────────────────────────────────────────── */}
      {state.phase === "done" && (
        <div className="rounded-xl border border-status-success/30 bg-status-success/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Import terminé — {state.fileName}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Importés", value: state.result.imported, color: "text-status-success" },
              { label: "Mis à jour", value: state.result.updated, color: "text-action-primary" },
              { label: "Masqués ignorés", value: state.result.masked, color: "text-status-warning" },
              { label: "Ignorés / Erreurs", value: state.result.skipped + state.result.errors.length, color: "text-text-muted" },
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

      {/* ── Erreur ───────────────────────────────────────────────────────── */}
      {state.phase === "error" && (
        <div className="rounded-xl border border-status-danger/30 bg-status-danger/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-status-danger">Erreur d'import</p>
            <p className="text-xs text-text-muted mt-1 font-mono break-words">{state.message}</p>
          </div>
          <button
            onClick={reset}
            className="p-1 rounded-md text-text-muted hover:text-status-danger transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
