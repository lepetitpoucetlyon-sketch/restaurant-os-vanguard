import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ParsedFile, ImportResult } from '../types';
import { isMaskedEmail } from '../emailFilters';

function parseDate(raw: string): number | undefined {
  if (!raw) return undefined;
  // dd/MM/yyyy or d/M/yyyy
  const dmyMatch = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmyMatch) return new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`).getTime();
  // ISO yyyy-MM-dd
  const iso = Date.parse(raw);
  return isNaN(iso) ? undefined : iso;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, '').replace(/^0/, '+33');
}

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(k => k.toLowerCase().replace(/[_\s]/g, '').includes(c.toLowerCase().replace(/[_\s]/g, '')));
    if (key) return row[key] ?? '';
  }
  return '';
}

interface CrmRowFields {
  firstName: string; lastName: string; email: string; emailMasked: boolean;
  phone: string; visitsRaw: string; lastVisitRaw: string; notes: string;
  optoutRaw: string; source: string;
}

function buildCrmPayload(f: CrmRowFields) {
  return {
    firstName: f.firstName || undefined,
    lastName:  f.lastName  || undefined,
    email:     f.email     || undefined,
    emailMasked: f.emailMasked,
    phone:     f.phone ? normalizePhone(f.phone) : undefined,
    status:    'active' as const,
    metrics: {
      totalVisits:   parseInt(f.visitsRaw) || 0,
      totalSpent:    0,
      noShows:       0,
      lastVisitDate: parseDate(f.lastVisitRaw),
    },
    tags:             [],
    notes:            f.notes || undefined,
    optoutMarketing:  ['oui', 'yes', '1', 'true'].includes(f.optoutRaw.toLowerCase()),
    importedFrom:     f.source,
    updatedAt:        Date.now(),
  };
}

export async function importCRM(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);
  let created = 0, updated = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];

  // Build email → existing doc map for dedup
  const existing = await Nexus.adapter.query<{ id: string; email?: string }>('crms');
  const emailIndex = new Map<string, string>(
    existing.filter((r): r is typeof r & { email: string } => Boolean(r.email))
            .map(r => [r.email.toLowerCase(), r.id])
  );
  onProgress(20);

  const batch = Nexus.adapter.batch();

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(20 + Math.round((i / file.rows.length) * 65));

    const firstName  = findCol(row, ['prenom', 'prénom', 'firstname', 'first name', 'first']);
    const lastName   = findCol(row, ['nom', 'lastname', 'last name', 'surname', 'name']);
    const email      = findCol(row, ['email', 'mail', 'courriel']).toLowerCase().trim();
    const phone      = findCol(row, ['telephone', 'téléphone', 'phone', 'tel', 'mobile', 'portable']);
    const visitsRaw  = findCol(row, ['visites', 'nb_visites', 'visits', 'total_visits', 'nbre visite']);
    const lastVisitRaw = findCol(row, ['derniere_visite', 'dernière visite', 'last_visit', 'last visit', 'date derniere']);
    const notes      = findCol(row, ['notes', 'commentaire', 'remarque', 'note', 'observation']);
    const optoutRaw  = findCol(row, ['optout', 'opt_out', 'desinscrit', 'desabonne', 'no_marketing']);

    if (!firstName && !lastName && !email && !phone) {
      errors.push({ row: i + 2, message: 'Ligne sans identifiant — ignorée' });
      skipped++;
      continue;
    }

    const emailMasked = email ? isMaskedEmail(email) : false;
    const payload = buildCrmPayload({ firstName, lastName, email, emailMasked, phone, visitsRaw, lastVisitRaw, notes, optoutRaw, source: file.source });

    if (email && !emailMasked && emailIndex.has(email)) {
      const existingId = emailIndex.get(email)!;
      batch.update(`crms/${existingId}`, {
        ...payload,
        'metrics.totalVisits':   payload.metrics.totalVisits || undefined,
        'metrics.lastVisitDate': payload.metrics.lastVisitDate || undefined,
      });
      updated++;
    } else {
      const id = Nexus.adapter.generateId('crms');
      batch.set(`crms/${id}`, { id, type: 'customer', ...payload, createdAt: Date.now() });
      created++;
    }
  }

  await batch.commit();
  onProgress(100);
  return { created, updated, skipped, errors };
}
