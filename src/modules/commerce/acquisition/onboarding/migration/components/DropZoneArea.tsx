'use client';

import { useRef, useState, useCallback, type DragEvent } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import type { ImportCategory } from '../types';
import { CATEGORY_CONFIGS } from '../types';

export function PasteZone({ onText }: { onText: (t: string) => void }) {
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

export function DetectingState({ fileName }: { fileName: string }) {
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

interface DropZoneAreaProps {
  category: ImportCategory;
  onFile: (f: File) => void;
  onText: (t: string) => void;
}

export function DropZoneArea({
  category,
  onFile,
  onText,
}: DropZoneAreaProps) {
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
