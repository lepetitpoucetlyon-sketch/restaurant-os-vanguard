"use client";

import { useCallback, useState } from "react";
import { FileText, Download, AlertTriangle, X } from "lucide-react";
import { CustomerCSVImporter } from './CustomerCSVImporter';
import { downloadCSVTemplate } from './csvTemplates';
import { useTenant } from "@/shared/hooks";
import { toError } from "@/lib/toError";
import type { PanelPhase } from './customer-import/customerImportTypes';
import { ACCEPTED_TYPES } from './customer-import/customerImportTypes';
import { CustomerImportDropzone } from './customer-import/CustomerImportDropzone';
import { CustomerImportPreview } from './customer-import/CustomerImportPreview';
import { CustomerImportDone } from './customer-import/CustomerImportDone';

export function CustomerImportPanel() {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId ?? "default";
  const [state, setState] = useState<PanelPhase>({ phase: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);

  const importer = new CustomerCSVImporter();

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".csv")) {
        setState({ phase: "error", message: "Seuls les fichiers CSV sont acceptés." });
        return;
      }

      try {
        const text = await file.text();
        const rows = importer.parseCSV(text);

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

        <button
          onClick={() => downloadCSVTemplate("crm")}
          className="flex items-center gap-1.5 text-xs font-medium text-action-primary border border-action-primary/30 rounded-lg px-3 py-1.5 hover:bg-action-primary/5 transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          Template CSV
        </button>
      </div>

      {/* Dropzone (idle) */}
      {state.phase === "idle" && (
        <CustomerImportDropzone
          isDragOver={isDragOver}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          onInputChange={onInputChange}
        />
      )}

      {/* Aperçu (ready) */}
      {state.phase === "ready" && (
        <CustomerImportPreview
          file={state.file}
          rows={state.rows}
          maskedCount={state.maskedCount}
          onReset={reset}
          onRunImport={runImport}
        />
      )}

      {/* Progression (importing) */}
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

      {/* Résumé final (done) */}
      {state.phase === "done" && (
        <CustomerImportDone
          fileName={state.fileName}
          result={state.result}
          onReset={reset}
        />
      )}

      {/* Erreur */}
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
