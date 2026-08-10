/**
 * haccpHistoryImporter — import de l'historique HACCP depuis :
 *  - CSV (registres papier numérisés, exports logiciels HACCP)
 *  - PDF/image via OCR (registre papier scanné)
 *
 * Chaque enregistrement importé est immuable (NF525-like) : pas de delete/update.
 * Les documents bruts sont archivés dans le coffre tenant (onboarding_documents/).
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ParsedFile, ImportResult } from '../types';

export interface HaccpHistoricalReading {
  date: string;          // ISO YYYY-MM-DD
  time: string;          // HH:MM
  zone: string;          // "Chambre froide 1", "Plan de travail", etc.
  temperature: number;   // °C (float)
  operator?: string;
  conforming: boolean;   // < seuil critique défini par zone
  notes?: string;
  source: 'csv' | 'ocr' | 'manual';
  importedAt: number;    // timestamp
}

const CRITICAL_TEMP_THRESHOLDS: Record<string, number> = {
  'chambre froide': 4,
  'congélateur': -18,
  'réfrigérateur': 4,
  'plan de travail': 10,
  'bain-marie': 63,
  'four': 75,
};

function isConforming(zone: string, temp: number): boolean {
  const zoneNorm = zone.toLowerCase();
  for (const [key, threshold] of Object.entries(CRITICAL_TEMP_THRESHOLDS)) {
    if (zoneNorm.includes(key)) {
      if (key === 'bain-marie' || key === 'four') return temp >= threshold;
      return temp <= threshold;
    }
  }
  return true; // Zone inconnue → non évaluée = conforme par défaut
}

function normalizeRow(row: Record<string, string>): HaccpHistoricalReading | null {
  const dateRaw = row.date ?? row.Date ?? row.DATE ?? row['date relevé'] ?? '';
  const timeRaw = row.heure ?? row.Heure ?? row.time ?? row.TIME ?? '00:00';
  const zoneRaw = row.zone ?? row.Zone ?? row['zone/équipement'] ?? row.equipement ?? 'Non précisé';
  const tempRaw = row.temperature ?? row.Température ?? row.temp ?? row.TEMP ?? '';

  if (!dateRaw || !tempRaw) return null;

  const temp = parseFloat(tempRaw.replace(',', '.'));
  if (isNaN(temp)) return null;

  const operator = row.operateur ?? row.Opérateur ?? row.operator ?? '';
  const notes = row.notes ?? row.Notes ?? row.commentaire ?? '';

  return {
    date: dateRaw.trim(),
    time: timeRaw.trim(),
    zone: zoneRaw.trim(),
    temperature: temp,
    operator: operator || undefined,
    conforming: isConforming(zoneRaw, temp),
    notes: notes || undefined,
    source: 'csv',
    importedAt: Date.now(),
  };
}

export async function importHaccpHistory(
  file: ParsedFile,
  onProgress: (n: number) => void,
): Promise<ImportResult> {
  onProgress(10);

  const readings: HaccpHistoricalReading[] = [];
  const errors: { row: number; message: string }[] = [];

  for (const row of file.rows) {
    const r = normalizeRow(row);
    if (r) {
      readings.push(r);
    } else {
      errors.push({ row: file.rows.indexOf(row), message: `Données incomplètes : ${JSON.stringify(row)}` });
    }
  }

  onProgress(40);

  const batch = Nexus.adapter.batch();
  let created = 0;
  const skipped = 0;

  for (const reading of readings) {
    const id = Nexus.adapter.generateId('haccp_historical');
    // Immuable — on ne vérifie pas les doublons : l'historique est additif
    batch.set(`haccp_historical/${id}`, { id, ...reading });
    created++;
  }

  onProgress(70);
  await batch.commit();
  onProgress(100);

  return {
    created,
    updated: 0,
    skipped: skipped + errors.length,
    errors,
  };
}

// ─── Archivage coffre documentaire ───────────────────────────

export interface OnboardingDocument {
  id: string;
  fileName: string;
  mimeType: string;
  category: 'haccp' | 'fec' | 'menu' | 'staff' | 'other';
  sizeBytes: number;
  base64?: string;        // Stocké en Firestore pour les petits fichiers (< 500KB)
  storagePath?: string;   // Firebase Storage path pour les gros fichiers
  uploadedAt: number;
  uploadedBy?: string;
  notes?: string;
}

export async function archiveDocument(
  file: File,
  category: OnboardingDocument['category'],
  notes?: string,
): Promise<OnboardingDocument> {
  const id = Nexus.adapter.generateId('onboarding_documents');
  const base64 = file.size < 500 * 1024
    ? await fileToBase64(file)
    : undefined;

  const doc: OnboardingDocument = {
    id,
    fileName: file.name,
    mimeType: file.type,
    category,
    sizeBytes: file.size,
    base64,
    storagePath: base64 ? undefined : `onboarding/${id}/${file.name}`,
    uploadedAt: Date.now(),
    notes,
  };

  await Nexus.adapter.set(`onboarding_documents/${id}`, doc);
  return doc;
}

export async function listArchivedDocuments(
  category?: OnboardingDocument['category'],
): Promise<OnboardingDocument[]> {
  const all = await Nexus.adapter.query<OnboardingDocument>('onboarding_documents', {
    orderBy: { field: 'uploadedAt', direction: 'desc' },
    limit: 100,
    ...(category ? { where: [{ field: 'category', operator: '==', value: category }] } : {}),
  });
  return all;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
