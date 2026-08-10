'use client';

import { useRef, useState, useCallback, type DragEvent } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Info, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import type { ImportCategory, ColumnMapping, ImportWarning, TargetField } from './types';
import { CATEGORY_CONFIGS } from './types';
import { useImportPipeline } from './hooks/useImportPipeline';
import { ColumnMapperUI } from './components/ColumnMapperUI';
import { ImportPreviewTable, WarningBadge } from './components/ImportPreviewTable';
import { ImportReport } from './components/ImportReport';


// ─── Paste Zone ───────────────────────────────────────────────────────────────

function PasteZone({ onText }: { onText: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
    >
      Ou coller du texte directement (carte, liste…)
    </button>
  );
  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        rows={5}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring font-mono"
        placeholder="Coller ici le texte de votre carte, liste de plats, équipe…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={() => { setOpen(false); setText(''); }} className="text-xs text-muted-foreground hover:text-foreground">Annuler</button>
        <button
          disabled={!text.trim()}
          onClick={() => onText(text)}
          className="flex-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          Analyser avec l'IA →
        </button>
      </div>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZoneArea({
  category,
  onFile,
  onText,
}: {
  category: ImportCategory;
  onFile: (f: File) => void;
  onText: (t: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = CATEGORY_CONFIGS[category];

  const ACCEPT_MIME: Record<string, string> = {
    csv: '.csv', xlsx: '.xlsx,.xls', pdf: '.pdf',
    image: '.jpg,.jpeg,.png,.webp', json: '.json',
    text: '.txt', fec: '.txt,.fec',
  };
  const accept = config.acceptedFormats.map(f => ACCEPT_MIME[f]).join(',');

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-10 px-6',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
        ].join(' ')}
      >
        <div className={`rounded-full p-3 transition-colors ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
          <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            {isDragging ? 'Déposer ici' : 'Glisser-déposer un fichier'}
          </p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          <p className="text-xs text-muted-foreground/60">
            {config.acceptedFormats.map(f => f.toUpperCase()).join(' · ')} — Détection auto logiciel source
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </div>

      {config.acceptsPaste && <PasteZone onText={onText} />}
    </div>
  );
}

// ─── Detecting / Reading Spinner ──────────────────────────────────────────────

function DetectingState({ fileName }: { fileName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <div className="text-center space-y-0.5">
        <p className="text-sm font-medium">Analyse du fichier…</p>
        <p className="text-xs text-muted-foreground font-mono">{fileName}</p>
        <p className="text-xs text-muted-foreground">Détection format · encodage · logiciel source</p>
      </div>
    </div>
  );
}

// ─── Source Badge ─────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  zenchef: 'Zenchef', thefork: 'TheFork', laddition: "L'Addition",
  zelty: 'Zelty', lightspeed: 'Lightspeed', generic: 'Fichier générique',
};

// ─── Main Component ───────────────────────────────────────────────────────────

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
