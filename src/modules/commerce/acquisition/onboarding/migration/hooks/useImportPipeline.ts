'use client';

import { useState, useCallback, useRef } from 'react';
import type { ImportCategory, ImportStage, ParsedFile, ColumnMapping, ImportResult, ImportWarning } from '../types';
import { CATEGORY_CONFIGS } from '../types';
import { parseFile } from '../parsers/fileDetector';
import { runImporter } from '../importers';

export interface PipelineState {
  stage: ImportStage;
  file: ParsedFile | null;
  rawFile: File | null;
  mappings: ColumnMapping[];
  progress: number;
  result: ImportResult | null;
  error: string | null;
  extraWarnings: ImportWarning[];
}

const INITIAL_STATE: PipelineState = {
  stage: 'idle',
  file: null,
  rawFile: null,
  mappings: [],
  progress: 0,
  result: null,
  error: null,
  extraWarnings: [],
};

type CategoryConfig = typeof CATEGORY_CONFIGS[ImportCategory];

function buildAutoMappings(file: ParsedFile, config: CategoryConfig): ColumnMapping[] {
  return file.headers.map(sourceColumn => {
    const lower = sourceColumn.toLowerCase().replace(/[_\s]/g, '');
    const match = config.targetFields.find(tf => {
      const tfKey = tf.key.toLowerCase();
      const tfLabel = tf.label.toLowerCase().replace(/[_\s\(\)]/g, '');
      return lower.includes(tfKey) || lower.includes(tfLabel) || tfKey.includes(lower);
    });
    return { sourceColumn, targetField: match?.key ?? null };
  });
}

function buildExtraWarnings(file: ParsedFile, category: ImportCategory, config: CategoryConfig): ImportWarning[] {
  const warnings: ImportWarning[] = [...file.warnings];
  if (file.source === 'thefork') {
    warnings.push({ row: 0, field: 'email', message: 'TheFork : emails masqués (@thefork.com) détectés — ils seront importés mais marqués comme non-contactables', severity: 'warning' });
  }
  if (file.source === 'thefork' && file.encoding === 'iso-8859-1') {
    warnings.push({ row: 0, field: 'encoding', message: 'Encodage Latin-1 détecté (TheFork) → converti en UTF-8 automatiquement', severity: 'info' });
  }
  if (file.source === 'laddition' || file.source === 'zelty') {
    warnings.push({ row: 0, field: 'price', message: `${file.source === 'laddition' ? "L'Addition" : 'Zelty'} : prix en centimes détectés → conversion automatique en euros`, severity: 'info' });
  }
  if (category === 'staff') {
    warnings.push({ row: 0, field: 'pin', message: 'Les PINs absents seront générés aléatoirement — les employés devront les changer à la première connexion', severity: 'info' });
  }
  if (category === 'reservations') {
    warnings.push({ row: 0, field: '', message: "Les réservations historiques iront dans l'historique CRM uniquement — elles n'apparaîtront pas dans le planning actif", severity: 'info' });
  }
  if (category === 'fec') {
    warnings.push({ row: 0, field: '', message: 'Les écritures FEC importées sont immuables (NF525) — elles seront scellées SHA-256 et ne pourront plus être modifiées ou supprimées', severity: 'warning' });
  }
  if (config.requiresOrder && config.requiresOrder.length > 0) {
    warnings.push({ row: 0, field: '', message: `Conseil : importer d'abord ${config.requiresOrder.map(c => CATEGORY_CONFIGS[c].label).join(', ')} pour les liaisons optimales`, severity: 'info' });
  }
  return warnings;
}

export function useImportPipeline(category: ImportCategory) {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const config = CATEGORY_CONFIGS[category];
  // Keep a stable ref for the raw file to pass to the importer
  const rawFileRef = useRef<File | null>(null);

  const updateProgress = (progress: number) => setState(s => ({ ...s, progress }));

  const handleFile = useCallback(async (incomingFile: File) => {
    setState(s => ({ ...s, stage: 'reading', rawFile: incomingFile, error: null, result: null, progress: 0 }));
    rawFileRef.current = incomingFile;

    try {
      setState(s => ({ ...s, stage: 'detecting' }));
      const parsed = await parseFile(incomingFile);

      // PDF / image → skip column mapping, go straight to import via AI
      if (parsed.format === 'pdf' || parsed.format === 'image') {
        const extraWarnings = buildExtraWarnings(parsed, category, config);
        setState(s => ({
          ...s,
          stage: 'previewing',
          file: parsed,
          mappings: [],
          extraWarnings,
          progress: 0,
        }));
        return;
      }

      const mappings = buildAutoMappings(parsed, config);
      const hasUnmapped = mappings.some(m => m.targetField === null);
      const extraWarnings = buildExtraWarnings(parsed, category, config);

      setState(s => ({
        ...s,
        stage: hasUnmapped ? 'mapping' : 'previewing',
        file: parsed,
        mappings,
        extraWarnings,
        progress: 0,
      }));
    } catch (e) {
      setState(s => ({ ...s, stage: 'error', error: (e as Error).message }));
    }
  }, [category]);

  const handleText = useCallback(async (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'paste.txt', { type: 'text/plain' });
    await handleFile(file);
  }, [handleFile]);

  const confirmMappings = useCallback((mappings: ColumnMapping[]) => {
    setState(s => ({ ...s, stage: 'previewing', mappings }));
  }, []);

  const startImport = useCallback(async () => {
    const { file, rawFile } = state;
    if (!file || !rawFile) return;

    setState(s => ({ ...s, stage: 'importing', progress: 0 }));
    try {
      const result = await runImporter(category, file, rawFile, updateProgress);
      setState(s => ({ ...s, stage: 'done', result, progress: 100 }));
    } catch (e) {
      setState(s => ({ ...s, stage: 'error', error: (e as Error).message }));
    }
  }, [state, category]);

  const reset = useCallback(() => {
    rawFileRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  return { state, config, handleFile, handleText, confirmMappings, startImport, reset };
}
