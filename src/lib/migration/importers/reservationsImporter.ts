import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ParsedFile, ImportResult } from '../types';
import { isMaskedEmail } from '@/lib/migration/emailFilters';

// Cross-impact: historical reservations go to CRM.visitHistory ONLY.
// They must NOT be injected into reservations/ collection (would appear as active bookings).
// Requires CRM to be imported first (requiresOrder: ['crm'])

function parseDate(raw: string): number | undefined {
  if (!raw) return undefined;
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`).getTime();
  const ts = Date.parse(raw);
  return isNaN(ts) ? undefined : ts;
}

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().replace(/[_\s]/g, '').includes(c.toLowerCase().replace(/[_\s]/g, ''))
    );
    if (key) return row[key] ?? '';
  }
  return '';
}

export async function importReservationHistory(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  // Build CRM email and phone indexes for matching
  const crmRecords = await Nexus.adapter.query<{ id: string; email?: string; phone?: string; metrics?: { totalVisits: number; lastVisitDate?: number } }>('crms');
  const emailIndex = new Map<string, string>(crmRecords.filter(r => r.email).map(r => [r.email!.toLowerCase(), r.id]));
  const phoneIndex = new Map<string, string>(
    crmRecords.filter(r => r.phone).map(r => [r.phone!.replace(/\s/g, ''), r.id])
  );
  onProgress(20);

  let updated = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];
  // Aggregate per CRM: { crmId → { totalVisits, lastVisitDate } }
  const crmUpdates = new Map<string, { totalVisits: number; lastVisitDate: number | undefined; visitEntries: { date: number; covers: number; source: string }[] }>();

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(20 + Math.round((i / file.rows.length) * 60));

    const dateRaw = findCol(row, ['date', 'date réservation', 'date_reservation', 'booking_date', 'jour']);
    const email = findCol(row, ['email', 'mail', 'customer_email']).toLowerCase().trim();
    const phone = findCol(row, ['phone', 'telephone', 'téléphone', 'mobile']).replace(/\s/g, '');
    const coversRaw = findCol(row, ['couverts', 'covers', 'party_size', 'pax', 'nb_convives', 'nb couverts']);
    const source = findCol(row, ['source', 'origin', 'provenance', 'canal']) || file.source;

    const date = parseDate(dateRaw);
    if (!date) { skipped++; continue; }

    // Emails masqués TheFork → non liables au CRM
    if (email && isMaskedEmail(email)) {
      errors.push({ row: i + 2, message: `Email masqué TheFork ignoré (${email})` });
      skipped++;
      continue;
    }

    // Find matching CRM record
    const crmId = (email && emailIndex.get(email)) ?? (phone && phoneIndex.get(phone)) ?? null;
    if (!crmId) {
      // No matching CRM — skip (don't create ghost CRM records from reservation data)
      errors.push({ row: i + 2, message: `Pas de client CRM trouvé pour ${email || phone || 'inconnu'} — ligne ignorée` });
      skipped++;
      continue;
    }

    if (!crmUpdates.has(crmId)) {
      const existing = crmRecords.find(r => r.id === crmId);
      crmUpdates.set(crmId, {
        totalVisits: existing?.metrics?.totalVisits ?? 0,
        lastVisitDate: existing?.metrics?.lastVisitDate,
        visitEntries: [],
      });
    }

    const agg = crmUpdates.get(crmId)!;
    agg.totalVisits += 1;
    if (!agg.lastVisitDate || date > agg.lastVisitDate) agg.lastVisitDate = date;
    agg.visitEntries.push({ date, covers: parseInt(coversRaw) || 2, source });
    updated++;
  }

  onProgress(80);
  const batch = Nexus.adapter.batch();
  for (const [crmId, agg] of crmUpdates) {
    batch.update(`crms/${crmId}`, {
      'metrics.totalVisits': agg.totalVisits,
      'metrics.lastVisitDate': agg.lastVisitDate,
      visitHistory: agg.visitEntries,
      updatedAt: Date.now(),
    });
  }

  await batch.commit();
  onProgress(100);
  return { created: 0, updated, skipped, errors };
}
