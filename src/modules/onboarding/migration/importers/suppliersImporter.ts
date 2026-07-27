import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ParsedFile, ImportResult } from '../types';

// Cross-impact: ProcurementService currently uses DEFAULT_SUPPLIER hardcoded.
// After this import, it should query suppliers/ collection instead.
// See: src/modules/logistics/procurement/ProcurementService.ts

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().replace(/[_\s]/g, '').includes(c.toLowerCase().replace(/[_\s]/g, ''))
    );
    if (key) return row[key] ?? '';
  }
  return '';
}

function normalizeDeliveryDays(raw: string): number {
  const n = parseInt(raw);
  return isNaN(n) ? 2 : Math.max(1, Math.min(30, n));
}

export async function importSuppliers(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  // Dedup by name (case-insensitive)
  const existing = await Nexus.adapter.query<{ id: string; name: string }>('suppliers');
  const nameIndex = new Map<string, string>(
    existing.map(s => [s.name.toLowerCase().trim(), s.id])
  );
  onProgress(20);

  const batch = Nexus.adapter.batch();
  let created = 0, updated = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(20 + Math.round((i / file.rows.length) * 65));

    const name = findCol(row, ['nom', 'name', 'fournisseur', 'supplier', 'raison sociale', 'entreprise']).trim();
    if (!name) {
      errors.push({ row: i + 2, message: 'Nom fournisseur manquant — ignoré' });
      skipped++;
      continue;
    }

    const email = findCol(row, ['email', 'mail', 'courriel', 'contact email']).toLowerCase().trim() || undefined;
    const phone = findCol(row, ['telephone', 'téléphone', 'phone', 'tel']).replace(/[\s.\-()]/g, '') || undefined;
    const deliveryDaysRaw = findCol(row, ['delai', 'délai', 'delivery', 'livraison', 'jour']);
    const paymentTerms = findCol(row, ['paiement', 'payment', 'condition', 'terme']) || '30 jours fin de mois';
    const category = findCol(row, ['categorie', 'catégorie', 'type', 'famille', 'category']) || 'général';

    const payload = {
      name,
      email,
      phone,
      deliveryDays: normalizeDeliveryDays(deliveryDaysRaw),
      paymentTerms,
      category,
      status: 'active',
      updatedAt: Date.now(),
    };

    const nameKey = name.toLowerCase();
    if (nameIndex.has(nameKey)) {
      batch.update(`suppliers/${nameIndex.get(nameKey)!}`, payload);
      updated++;
    } else {
      const id = Nexus.adapter.generateId('suppliers');
      batch.set(`suppliers/${id}`, { id, type: 'supplier', ...payload, createdAt: Date.now() });
      nameIndex.set(nameKey, id);
      created++;
    }
  }

  await batch.commit();
  onProgress(100);
  return { created, updated, skipped, errors };
}
