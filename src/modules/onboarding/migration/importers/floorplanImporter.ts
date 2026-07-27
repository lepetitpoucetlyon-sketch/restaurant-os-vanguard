import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ParsedFile, ImportResult } from '../types';

// Cross-impact:
// - tables/ collection is read by: reservations engine, POS table selector, KDS routing, floor plan editor
// - Must not create duplicates with existing table numbers in the same zone
// - Table number + zone = unique key

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().replace(/[_\s]/g, '').includes(c.toLowerCase().replace(/[_\s]/g, ''))
    );
    if (key) return row[key] ?? '';
  }
  return '';
}

function normalizeShape(raw: string): 'round' | 'rect' {
  return raw.toLowerCase().includes('rond') || raw.toLowerCase().includes('round') || raw.toLowerCase().includes('circle')
    ? 'round'
    : 'rect';
}

export async function importFloorPlan(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  // Dedup by table number + zone
  const existingTables = await Nexus.adapter.query<{ id: string; number: number; zone?: string }>('tables');
  const tableIndex = new Map<string, string>(
    existingTables.map(t => [`${t.number}::${(t.zone ?? '').toLowerCase()}`, t.id])
  );
  onProgress(20);

  const batch = Nexus.adapter.batch();
  let created = 0, updated = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];

  // Handle JSON layout format (from advanced floor plan tools)
  if (file.format === 'json' && file.rows.length > 0 && 'x' in file.rows[0]) {
    // Full layout object — trust as-is
    for (const row of file.rows) {
      const id = Nexus.adapter.generateId('tables');
      batch.set(`tables/${id}`, { id, ...row, createdAt: Date.now() });
      created++;
    }
    await batch.commit();
    onProgress(100);
    return { created, updated: 0, skipped: 0, errors: [] };
  }

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(20 + Math.round((i / file.rows.length) * 65));

    const numberRaw = findCol(row, ['numero', 'numéro', 'number', 'table', 'num', 'n°', 'no']);
    const capacityRaw = findCol(row, ['capacite', 'capacité', 'capacity', 'couverts', 'places', 'pax', 'seats']);
    const zone = findCol(row, ['zone', 'salle', 'room', 'section', 'espace', 'area']).trim() || 'Salle principale';
    const shapeRaw = findCol(row, ['forme', 'shape', 'type table']);

    const tableNumber = parseInt(numberRaw);
    if (isNaN(tableNumber) || tableNumber < 1) {
      errors.push({ row: i + 2, message: `Numéro de table invalide : "${numberRaw}"` });
      skipped++;
      continue;
    }

    const capacity = parseInt(capacityRaw) || 4;
    const shape = normalizeShape(shapeRaw);
    const key = `${tableNumber}::${zone.toLowerCase()}`;

    const payload = {
      number: tableNumber,
      capacity,
      zone,
      shape,
      status: 'available',
      updatedAt: Date.now(),
    };

    if (tableIndex.has(key)) {
      batch.update(`tables/${tableIndex.get(key)!}`, payload);
      updated++;
    } else {
      const id = Nexus.adapter.generateId('tables');
      batch.set(`tables/${id}`, { id, type: 'table', ...payload, createdAt: Date.now() });
      tableIndex.set(key, id);
      created++;
    }
  }

  await batch.commit();
  onProgress(100);
  return { created, updated, skipped, errors };
}
