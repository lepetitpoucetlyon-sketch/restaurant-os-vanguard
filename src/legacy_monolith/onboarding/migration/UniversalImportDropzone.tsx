'use client';

import { useState } from 'react';
import { FileText, RotateCcw, Info, XCircle } from 'lucide-react';
import type { ImportCategory, ColumnMapping } from './types';
import { useImportPipeline } from './hooks/useImportPipeline';
import { 
  ColumnMapperUI, 
  ImportPreviewTable, 
  ImportProgress, 
  ImportReport, 
  DropZoneArea, 
  DetectingState, 
  WarningBadge,
  SOURCE_LABELS
} from './UniversalImportDropzoneUI';

interface Props {
  category: ImportCategory;
  onComplete?: (result: { created: number; updated: number; skipped: number; errors: { row: number; message: string }[] }) => void;
  compact?: boolean;
}

export function UniversalImportDropzone({ category, onComplete, compact = false }: Props) {
  const { state, config, handleFile, handleText, confirmMappings, startImport, reset } = useImportPipeline(category);
  const [localMappings, setLocalMappings] = useState<ColumnMapping[]>([]);

  const handleMappingConfirm = () => {
    confirmMappings(localMappings.length ? localMappings : state.mappings);
  };

  const handleStartImport = async () => {
    await startImport();
    if (state.result) onComplete?.(state.result);
  };

  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden>{config.icon}</span>
        <div>
          <h3 className="text-sm font-semibold">{config.label}</h3>
          {state.file && state.stage !== 'idle' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <FileText className="w-3 h-3" />
              {state.rawFile?.name}
              {state.file.source !== 'generic' && (
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-medium text-xs">
                  {SOURCE_LABELS[state.file.source]}
                </span>
              )}
              {state.file.encoding === 'iso-8859-1' && (
                <span className="rounded bg-action-primary/10 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 text-xs">Latin-1→UTF-8</span>
              )}
            </p>
          )}
        </div>
        {state.stage !== 'idle' && state.stage !== 'done' && state.stage !== 'error' && (
          <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Recommencer
          </button>
        )}
      </div>

      {/* Stage Router */}
      {state.stage === 'idle' && (
        <DropZoneArea category={category} onFile={handleFile} onText={handleText} />
      )}

      {(state.stage === 'reading' || state.stage === 'detecting') && (
        <DetectingState fileName={state.rawFile?.name ?? '…'} />
      )}

      {state.stage === 'mapping' && state.file && (
        <ColumnMapperUI
          mappings={localMappings.length ? localMappings : state.mappings}
          targetFields={config.targetFields}
          onChange={setLocalMappings}
          onConfirm={handleMappingConfirm}
        />
      )}

      {state.stage === 'previewing' && state.file && (
        state.file.format === 'pdf' || state.file.format === 'image'
          ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-status-info/10 border-blue-500/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Format {state.file.format.toUpperCase()} détecté — Gemini Vision va extraire les données. Aucun aperçu possible avant l'analyse IA.</span>
              </div>
              {state.extraWarnings.map((w, i) => <WarningBadge key={i} w={w} />)}
              <div className="flex gap-3">
                <button onClick={reset} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">Retour</button>
                <button onClick={handleStartImport} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                  Analyser avec l'IA →
                </button>
              </div>
            </div>
          )
          : (
            <ImportPreviewTable
              rows={state.file.rows}
              headers={state.file.headers}
              warnings={state.file.warnings}
              extraWarnings={state.extraWarnings}
              category={category}
              onImport={handleStartImport}
              onBack={reset}
            />
          )
      )}

      {state.stage === 'importing' && (
        <ImportProgress progress={state.progress} />
      )}

      {state.stage === 'done' && state.result && (
        <ImportReport
          result={state.result}
          categoryLabel={config.label}
          onReset={reset}
        />
      )}

      {state.stage === 'error' && (
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{state.error ?? 'Erreur inconnue'}</span>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
