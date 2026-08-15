'use client';
import React, { useState, useCallback } from 'react';
import type { ImportCategory } from '@/modules/commerce/acquisition/onboarding/migration/types';
import type { ConnectorId, ConnectorCredentials } from '@/modules/commerce/acquisition/onboarding/migration/connectors/types';
import { OCRUploadZone } from './OCRUploadZone';
import { PreviewTable } from './PreviewTable';
import { authedFetch } from '@/lib/client/authedFetch';
import { toError } from "@/lib/toError";

interface ImportCategoryPanelProps {
  category: ImportCategory;
  categoryLabel: string;
  categoryIcon: string;
  connectorId?: ConnectorId;
  connectorCredentials?: ConnectorCredentials;
  onImported: (result: { created: number; snapshotId?: string }) => void;
}

type PanelState = 'idle' | 'preview' | 'importing' | 'done' | 'error';

interface PreviewData {
  rows: Record<string, string>[];
  confidence: 'high' | 'medium' | 'low';
  source: 'ocr' | 'api';
  fileName?: string;
}

export function ImportCategoryPanel({
  category,
  categoryLabel,
  categoryIcon,
  connectorId,
  connectorCredentials,
  onImported,
}: ImportCategoryPanelProps) {
  const [state, setState] = useState<PanelState>('idle');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  const handleOcrResult = useCallback((result: { rows: Record<string, string>[]; confidence: 'high' | 'medium' | 'low'; fileName: string }) => {
    setRows(result.rows);
    setPreview({ rows: result.rows, confidence: result.confidence, source: 'ocr', fileName: result.fileName });
    setState('preview');
  }, []);

  const pullFromConnector = useCallback(async () => {
    if (!connectorId || !connectorCredentials) return;
    setState('importing');
    setProgress(10);
    try {
      const res = await authedFetch('/api/tenant/onboarding/connector/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: connectorId, category, credentials: connectorCredentials, autoImport: false }),
      });
      const json = await res.json() as { preview?: Record<string, string>[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur API');
      setRows(json.preview ?? []);
      setPreview({ rows: json.preview ?? [], confidence: 'high', source: 'api' });
      setProgress(40);
      setState('preview');
    } catch (err) {
      setErrorMsg(toError(err).message);
      setState('error');
    }
  }, [connectorId, connectorCredentials, category]);

  const confirmImport = useCallback(async () => {
    setState('importing');
    setProgress(0);
    try {
      const formData = new FormData();
      const csvContent = [
        Object.keys(rows[0] ?? {}).join(','),
        ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, `${category}_import.csv`);
      formData.append('category', category);

      const interval = setInterval(() => setProgress(p => Math.min(p + 5, 85)), 500);
      const res = await authedFetch('/api/tenant/onboarding/ocr', { method: 'POST', body: formData });
      clearInterval(interval);

      const json = await res.json() as { snapshotId?: string; created?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur import');

      setProgress(100);
      setState('done');
      onImported({ created: json.created ?? rows.length, snapshotId: json.snapshotId });
    } catch (err) {
      setErrorMsg(toError(err).message);
      setState('error');
    }
  }, [rows, category, onImported]);

  const confidenceColor = {
    high: 'text-emerald-600',
    medium: 'text-amber-600',
    low: 'text-red-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{categoryIcon}</span>
        <h3 className="font-semibold text-gray-900">{categoryLabel}</h3>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          {connectorId && connectorCredentials && (
            <button
              onClick={pullFromConnector}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>🔗</span> Importer depuis le connecteur
            </button>
          )}
          <div className="relative">
            {connectorId && <div className="text-xs text-center text-gray-400 mb-3">— ou glissez un fichier —</div>}
            <OCRUploadZone
              category={category}
              onResult={handleOcrResult}
              onError={(msg) => { setErrorMsg(msg); setState('error'); }}
            />
          </div>
        </div>
      )}

      {state === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{rows.length} lignes</span> détectées —{' '}
              <span className={`font-medium ${confidenceColor[preview.confidence]}`}>
                confiance {preview.confidence === 'high' ? 'haute' : preview.confidence === 'medium' ? 'moyenne' : 'faible'}
              </span>
            </div>
            {preview.confidence === 'low' && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">Vérifiez les données</span>
            )}
          </div>

          <PreviewTable
            rows={rows}
            onRowChange={(idx, updated) => {
              setRows(r => r.map((row, i) => i === idx ? updated : row));
            }}
          />

          <div className="flex gap-3">
            <button
              onClick={() => { setState('idle'); setPreview(null); }}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              ← Recommencer
            </button>
            <button
              onClick={confirmImport}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              ✓ Confirmer et importer
            </button>
          </div>
        </div>
      )}

      {state === 'importing' && (
        <div className="space-y-3 py-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center text-gray-500">Import en cours… {progress}%</p>
        </div>
      )}

      {state === 'done' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <p className="font-medium text-emerald-800">Import terminé</p>
          <p className="text-sm text-emerald-600 mt-1">{rows.length} enregistrements importés</p>
          <button
            onClick={() => setState('idle')}
            className="mt-3 text-xs text-emerald-700 underline"
          >
            Importer d&apos;autres données
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-3">
          <div className="text-2xl">❌</div>
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button
            onClick={() => { setState('idle'); setErrorMsg(null); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
