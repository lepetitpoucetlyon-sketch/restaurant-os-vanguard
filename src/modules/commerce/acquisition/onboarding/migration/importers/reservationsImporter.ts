import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ParsedFile, ImportResult } from '../types';
import { isMaskedEmail } from '../emailFilters';

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

type CrmRecord = { id: string; email?: string; phone?: string; metrics?: { totalVisits: number; lastVisitDate?: number } };
type AggEntry  = { totalVisits: number; lastVisitDate: number | undefined; visitEntries: { date: number; covers: number; source: string }[] };

function isNewerVisit(lastDate: number | undefined, date: number): boolean {
  return !lastDate || date > lastDate;
}

function findCrmId(email: string, phone: string, emailIndex: Map<string, string>, phoneIndex: Map<string, string>): string | null {
  if (email) return emailIndex.get(email) ?? null;
  if (phone) return phoneIndex.get(phone) ?? null;
  return null;
}

function initAggEntry(crmId: string, crmRecords: CrmRecord[], crmUpdates: Map<string, AggEntry>): void {
  if (crmUpdates.has(crmId)) return;
  const existing = crmRecords.find(r => r.id === crmId);
  crmUpdates.set(crmId, {
    totalVisits:  existing?.metrics?.totalVisits ?? 0,
    lastVisitDate: existing?.metrics?.lastVisitDate,
    visitEntries: [],
  });
}

export async function importReservationHistory(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  const crmRecords = await Nexus.adapter.query<CrmRecord>('crms');
  const emailIndex = new Map<string, string>(
    crmRecords.filter((r): r is typeof r & { email: string } => Boolean(r.email))
              .map(r => [r.email.toLowerCase(), r.id])
  );
  const phoneIndex = new Map<string, string>(
    crmRecords.filter((r): r is typeof r & { phone: string } => Boolean(r.phone))
              .map(r => [r.phone.replace(/\s/g, ''), r.id])
  );
  onProgress(20);

  let updated = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];
  const crmUpdates = new Map<string, AggEntry>();

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(20 + Math.round((i / file.rows.length) * 60));

    const dateRaw  = findCol(row, ['date', 'date réservation', 'date_reservation', 'booking_date', 'jour']);
    const email    = findCol(row, ['email', 'mail', 'customer_email']).toLowerCase().trim();
    const phone    = findCol(row, ['phone', 'telephone', 'téléphone', 'mobile']).replace(/\s/g, '');
    const coversRaw = findCol(row, ['couverts', 'covers', 'party_size', 'pax', 'nb_convives', 'nb couverts']);
    const source   = findCol(row, ['source', 'origin', 'provenance', 'canal']) || file.source;

    const date = parseDate(dateRaw);
    if (!date) { skipped++; continue; }

    if (email && isMaskedEmail(email)) {
      errors.push({ row: i + 2, message: `Email masqué TheFork ignoré (${email})` });
      skipped++;
      continue;
    }

    const crmId = findCrmId(email, phone, emailIndex, phoneIndex);
    if (!crmId) {
      errors.push({ row: i + 2, message: `Pas de client CRM trouvé pour ${email || phone || 'inconnu'} — ligne ignorée` });
      skipped++;
      continue;
    }

    initAggEntry(crmId, crmRecords, crmUpdates);

    const agg = crmUpdates.get(crmId)!;
    agg.totalVisits += 1;
    if (isNewerVisit(agg.lastVisitDate, date)) agg.lastVisitDate = date;
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
