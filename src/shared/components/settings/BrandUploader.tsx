'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@ui/Toast';
import { useBrandEditor } from '@/shared/hooks/useBrandEditor';

interface BrandUploaderProps {
  slot: 'logo' | 'favicon' | 'banner';
  label: string;
  currentUrl?: string | null;
  hint?: string;
}

/**
 * Zone de dépôt + prévisualisation pour logo, favicon ou bannière.
 * Upload → Firebase Storage → URL sauvegardée dans BrandTokens Firestore.
 * Le BrandingProvider applique instantanément via useFirestoreBrand.
 */
export function BrandUploader({ slot, label, currentUrl, hint }: BrandUploaderProps) {
  const { uploadAndSave, isUploading } = useBrandEditor();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Fichier non supporté — image uniquement', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Fichier trop lourd — max 5 Mo', 'error');
      return;
    }

    // Prévisualisation locale immédiate
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      await uploadAndSave(file, slot);
      showToast(`${label} mis à jour — appliqué en temps réel`, 'success');
    } catch (err) {
      showToast(`Erreur upload : ${err instanceof Error ? err.message : 'inconnue'}`, 'error');
      setPreview(currentUrl ?? null);
    }
  }, [slot, label, currentUrl, uploadAndSave, showToast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold uppercase tracking-widest text-text-primary">{label}</label>
        {preview && (
          <button
            onClick={() => setPreview(null)}
            className="text-text-muted hover:text-status-danger transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`
          relative border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-200 overflow-hidden
          ${isDragging
            ? 'border-action-primary bg-action-primary/5 scale-[1.01]'
            : 'border-border hover:border-action-primary/50 hover:bg-bg-secondary'
          }
          ${preview ? 'h-40' : 'h-32'}
        `}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-contain p-4"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full">
                Remplacer
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted">
            {isUploading
              ? <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
              : <ImageIcon className="w-8 h-8" />
            }
            <span className="text-xs font-semibold">
              {isUploading ? 'Upload en cours...' : 'Déposer ou cliquer'}
            </span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-bg-primary/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-text-muted">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
