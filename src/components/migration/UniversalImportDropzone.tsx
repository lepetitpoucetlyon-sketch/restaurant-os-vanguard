'use client';

import { useRef, useState, useCallback, type DragEvent } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Info, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import type { ImportCategory, ColumnMapping, ImportWarning, TargetField } from './types';
import { CATEGORY_CONFIGS } from './types';
import { useImportPipeline } from './hooks/useImportPipeline';

// ─── Column Mapper ────────────────────────────────────────────────────────────

function ColumnMapperUI({
  mappings,
  targetFields,
  onChange,
  onConfirm,
}: {
  mappings: ColumnMapping[];
  targetFields: TargetField[];
  onChange: (m: ColumnMapping[]) => void;
  onConfirm: () => void;
}) {
  const required = targetFields.filter(f => f.required);
  const mapped = mappings.filter(m => m.targetField !== null).map(m => m.targetField);
  const missingRequired = required.filter(f => !mapped.includes(f.key));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Faites correspondre les colonnes de votre fichier aux champs de Restaurant OS.
      </p>
      <div className="divide-y divide-border rounded-lg border overflow-hidden">
        {mappings.map((m, i) => (
          <div key={m.sourceColumn} className="flex items-center gap-3 px-4 py-2 bg-card text-sm">
            <span className="w-36 truncate font-mono text-xs text-muted-foreground shrink-0">{m.sourceColumn}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
            <select
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={m.targetField ?? ''}
              onChange={e => {
                const next = [...mappings];
                next[i] = { ...m, targetField: e.target.value || null };
                onChange(next);
              }}
            >
              <option value="">— Ignorer —</option>
              {targetFields.map(f => (
                <option key={f.key} value={f.key}>
                  {f.label}{f.required ? ' *' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {missingRequired.length > 0 && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Champs obligatoires non mappés : {missingRequired.map(f => f.label).join(', ')}
        </p>
      )}
      <button
        onClick={onConfirm}
        disabled={missingRequired.length > 0}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        Valider le mapping → Aperçu
      </button>
    </div>
  );
}

// ─── Warning Badge ────────────────────────────────────────────────────────────

function WarningBadge({ w }: { w: ImportWarning }) {
  const map = {
    error:   { cls: 'bg-destructive/10 text-destructive border-destructive/30', Icon: XCircle },
    warning: { cls: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', Icon: AlertTriangle },
    info:    { cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30', Icon: Info },
  } as const;
  const { cls, Icon } = map[w.severity];
  return (
    <div className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{w.message}</span>
    </div>
  );
}

// ─── Preview Table ────────────────────────────────────────────────────────────

function ImportPreviewTable({
  rows,
  headers,
  warnings,
  extraWarnings,
  onImport,
  onBack,
}: {
  rows: Record<string, string>[];
  headers: string[];
  warnings: ImportWarning[];
  extraWarnings: ImportWarning[];
  category: ImportCategory;
  onImport: () => void;
  onBack: () => void;
}) {
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ImportProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-3 py-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Import en cours…
        </span>
        <span className="font-medium tabular-nums">{progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Report ───────────────────────────────────────────────────────────────────

function ImportReport({
  result,
  categoryLabel,
  onReset,
}: {
  result: { created: number; updated: number; skipped: number; errors: { row: number; message: string }[] };
  categoryLabel: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">Import {categoryLabel} terminé</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Créés', value: result.created, cls: 'text-green-600 dark:text-green-400' },
          { label: 'Mis à jour', value: result.updated, cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Ignorés', value: result.skipped, cls: 'text-muted-foreground' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-lg border bg-card p-3 text-center">
            <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      {/* Masked email warning — mig-18 */}
      {(() => {
        const maskedCount = result.errors.filter(e =>
          e.message.toLowerCase().includes('masqué') || e.message.toLowerCase().includes('masked')
        ).length;
        return maskedCount > 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>
              <strong>{maskedCount} contact{maskedCount > 1 ? 's' : ''} TheFork ignoré{maskedCount > 1 ? 's' : ''} (emails masqués)</strong>
              {' — '}récupérez-les via l'export TheFork Pro
            </span>
          </div>
        ) : null;
      })()}
      {result.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-destructive">{result.errors.length} erreur(s) :</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-muted-foreground">Ligne {e.row} : {e.message}</p>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Nouvel import
      </button>
    </div>
  );
}

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
                <span className="rounded bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 text-xs">Latin-1→UTF-8</span>
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
              <div className="rounded-lg border bg-blue-500/10 border-blue-500/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
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
