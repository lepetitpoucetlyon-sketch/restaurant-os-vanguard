"use client";

import { useCallback, useState } from "react";
import { Upload, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { FECImporter } from "@/modules/finance";
import { useTenant } from "@/shared/hooks";
import { toError } from "@/lib/toError";
import type { PanelState } from './fec-import/fecImportTypes';
import { CURRENT_YEAR } from './fec-import/fecImportTypes';
import { FECDropzone } from './fec-import/FECDropzone';
import { FECPreviewSection } from './fec-import/FECPreviewSection';
import { FECDoneSection } from './fec-import/FECDoneSection';

export function FECImportPanel() {
  const { activeTenantId } = useTenant();
  const tenantId = activeTenantId ?? 'default';
  const [state, setState] = useState<PanelState>({ phase: "idle" });
  const [exercice, setExercice] = useState<string>(String(CURRENT_YEAR - 1));
  const [isDragOver, setIsDragOver] = useState(false);

  const importer = new FECImporter();

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const content = await file.text();
        const { entries, warnings, isValid } = importer.preview(content);
        setState({ phase: "ready", file, preview: entries, warnings, isValid });
      } catch (err) {
        setState({
          phase: "error",
          message: toError(err).message,
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
        message: toError(err).message,
      });
    }
  }, [state, tenantId, exercice]);

  const reset = () => setState({ phase: "idle" });

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

      {/* Phase idle : dropzone */}
      {state.phase === "idle" && (
        <FECDropzone
          isDragOver={isDragOver}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          onInputChange={onInputChange}
        />
      )}

      {/* Phase ready : validation + preview */}
      {state.phase === "ready" && (
        <FECPreviewSection
          file={state.file}
          preview={state.preview}
          warnings={state.warnings}
          isValid={state.isValid}
          onReset={reset}
        />
      )}

      {/* Phase importing */}
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

      {/* Phase done */}
      {state.phase === "done" && (
        <FECDoneSection
          exercice={state.exercice}
          result={state.result}
          onReset={reset}
        />
      )}

      {/* Phase error */}
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
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-action-primary text-text-primary text-sm font-semibold py-2.5 px-4 hover:opacity-90 active:scale-[0.98] transition"
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
