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
