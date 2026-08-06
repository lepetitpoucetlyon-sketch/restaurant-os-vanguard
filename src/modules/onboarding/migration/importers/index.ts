import type { ImportCategory, ParsedFile, ImportResult } from '../types';
import { importMenuFromRows, importMenuFromAI } from './menuImporter';
import { importStaff } from './staffImporter';
import { importCRM } from './crmImporter';
import { importSuppliers } from './suppliersImporter';
import { importInventory } from './inventoryImporter';
import { importRecipesFromRows, importRecipesFromAI } from './recipesImporter';
import { importReservationHistory } from './reservationsImporter';
import { importStatements } from './statementsImporter';
import { importFEC } from './fecImporter';
import { importFloorPlan } from './floorplanImporter';
import { ImportSnapshotService } from '../ImportSnapshotService';
import { importHaccpHistory } from './haccpHistoryImporter';
export { importHaccpHistory } from './haccpHistoryImporter';
export { archiveDocument, listArchivedDocuments } from './haccpHistoryImporter';
export type { HaccpHistoricalReading, OnboardingDocument } from './haccpHistoryImporter';

export type ImporterFn = (
  file: ParsedFile,
  rawFile: File,
  onProgress: (n: number) => void
) => Promise<ImportResult>;

export const IMPORTERS: Record<ImportCategory, ImporterFn> = {
  menu: (file, rawFile, onProgress) => {
    if (file.format === 'pdf' || file.format === 'image' || file.format === 'text') {
      return rawFile.text().then(text => importMenuFromAI(text, onProgress));
    }
    return importMenuFromRows(file, onProgress);
  },

  staff: (file, _rawFile, onProgress) => importStaff(file, onProgress),

  crm: (file, _rawFile, onProgress) => importCRM(file, onProgress),

  suppliers: (file, _rawFile, onProgress) => importSuppliers(file, onProgress),

  inventory: (file, _rawFile, onProgress) => importInventory(file, onProgress),

  recipes: (file, rawFile, onProgress) => {
    if (file.format === 'pdf' || file.format === 'image' || file.format === 'text') {
      return rawFile.text().then(text => importRecipesFromAI(text, onProgress));
    }
    return importRecipesFromRows(file, onProgress);
  },

  reservations: (file, _rawFile, onProgress) => importReservationHistory(file, onProgress),

  statements: (file, rawFile, onProgress) => importStatements(file, rawFile, onProgress),

  fec: (file, _rawFile, onProgress) => importFEC(file, onProgress),

  floorplan: (file, _rawFile, onProgress) => importFloorPlan(file, onProgress),

  haccp_history: (file, _rawFile, onProgress) => importHaccpHistory(file, onProgress),
};

export async function runImporter(
  category: ImportCategory,
  file: ParsedFile,
  rawFile: File,
  onProgress: (n: number) => void
): Promise<ImportResult> {
  const importer = IMPORTERS[category];
  if (!importer) throw new Error(`Aucun importeur pour la catégorie : ${category}`);
  return importer(file, rawFile, onProgress);
}

export interface ImportResultWithSnapshot extends ImportResult {
  snapshotId?: string;
}

export async function runImporterWithSnapshot(
  category: ImportCategory,
  file: ParsedFile,
  rawFile: File,
  tenantId: string,
  onProgress: (n: number) => void,
): Promise<ImportResultWithSnapshot> {
  const snapshot = await ImportSnapshotService.take(tenantId, category);
  onProgress(5);

  try {
    const result = await runImporter(category, file, rawFile, (p) => onProgress(5 + Math.round(p * 0.95)));
    return { ...result, snapshotId: snapshot.id };
  } catch (err) {
    await ImportSnapshotService.restore(snapshot.id).catch(() => null);
    throw err;
  }
}
