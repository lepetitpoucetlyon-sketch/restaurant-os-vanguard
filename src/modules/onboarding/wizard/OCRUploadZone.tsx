'use client';
import React, { useCallback, useRef, useState } from 'react';
import type { ImportCategory } from '@/modules/onboarding/migration/types';

interface OcrResult {
  rows: Record<string, string>[];
  confidence: 'high' | 'medium' | 'low';
  rawText?: string;
}

interface OCRUploadZoneProps {
  category: ImportCategory;
  onResult: (result: OcrResult & { fileName: string }) => void;
  onError?: (msg: string) => void;
}

export function OCRUploadZone({ category, onResult, onError }: OCRUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);

      const res = await fetch('/api/tenant/onboarding/ocr', { method: 'POST', body: fd });
      const json = await res.json() as { rows?: Record<string, string>[]; confidence?: string; rawText?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur OCR');
      onResult({
        rows: json.rows ?? [],
        confidence: (json.confidence ?? 'low') as OcrResult['confidence'],
        rawText: json.rawText,
        fileName: file.name,
      });
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [category, onResult, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }, [upload]);

  const confidenceBadge = (c: 'high' | 'medium' | 'low') => ({
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
  }[c]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
        dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50',
      ].join(' ')}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.xls"
        onChange={handleChange}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Analyse OCR en cours…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">📄</div>
          <div>
            <p className="font-medium text-gray-700">
              {fileName ? `✓ ${fileName}` : 'Déposez un fichier ici'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, image (JPG/PNG), CSV ou Excel — max 10 Mo</p>
          </div>
          {!fileName && (
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
              Parcourir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
