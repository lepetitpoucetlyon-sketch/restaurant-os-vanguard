/**
 * ReservationHistoryImporter — mig-12
 *
 * Importe les réservations historiques (CSV Zenchef / TheFork) vers visitHistory CRM.
 *
 * Règles critiques :
 * - Les données vont dans le champ `visitHistory` des documents CRM, PAS dans
 *   la collection `reservations/` (pour ne pas créer de fausses réservations actives).
 * - Emails TheFork masqués (@thefork.com) → marqués 'masked_email', non liés au CRM.
 * - Dédoublonnage par email, fallback sur téléphone.
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { isMaskedEmail } from '@/modules/onboarding';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReservationCSVRow {
  date: string;           // "2024-01-15" (TheFork) ou "15/01/2024" (Zenchef)
  covers: number;
  client_email?: string;
  client_name?: string;
  client_phone?: string;
  notes?: string;
  status?: string;        // "confirmed" | "no_show" | "cancelled"
}

export interface VisitEntry {
  date: number;           // timestamp ms
  covers: number;
  source: string;
  status: string;
  notes?: string;
}

export interface ImportReservationResult {
  imported: number;
  errors: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parsing des deux formats de date :
 *  - DD/MM/YYYY  (Zenchef)
 *  - YYYY-MM-DD  (TheFork / ISO)
 */
function parseReservationDate(raw: string): number | undefined {
  if (!raw) return undefined;

  // DD/MM/YYYY ou DD-MM-YYYY
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const ts = new Date(
      `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
    ).getTime();
    return isNaN(ts) ? undefined : ts;
  }

  // ISO / YYYY-MM-DD
  const ts = Date.parse(raw);
  return isNaN(ts) ? undefined : ts;
}

/** Hash SHA-256 déterministe d'un email pour clé Nexus. */
async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-.()+]/g, '');
}

// ── Parsing CSV ────────────────────────────────────────────────────────────────

/**
 * Parse un contenu CSV brut en tableau de ReservationCSVRow.
 * Supporte le séparateur virgule et point-virgule, et les guillemets RFC 4180.
 */
export function parseReservationCSV(csvContent: string): ReservationCSVRow[] {
  const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  // Détection auto du séparateur
  const headerLine = lines[0];
  const sep = headerLine.includes(';') ? ';' : ',';

  function parseLine(line: string): string[] {
    const cells: string[] = [];
    let inQuote = false;
    let cell = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cell += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === sep && !inQuote) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    return cells;
  }

  const headers = parseLine(headerLine).map(h => h.toLowerCase().replace(/["\s]/g, ''));
  const rows: ReservationCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = parseLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => { raw[h] = cells[idx] ?? ''; });

    // Normalisation des colonnes selon les deux sources
    const date =
      raw['date'] ?? raw['datereservation'] ?? raw['date_reservation'] ??
      raw['bookingdate'] ?? raw['booking_date'] ?? raw['jour'] ?? '';

    const coversRaw =
      raw['couverts'] ?? raw['covers'] ?? raw['partysize'] ?? raw['party_size'] ??
      raw['pax'] ?? raw['nbcouverts'] ?? raw['nb_couverts'] ?? raw['nb convives'] ?? '2';

    rows.push({
      date,
      covers: parseInt(coversRaw, 10) || 2,
      client_email:
        raw['email'] ?? raw['client_email'] ?? raw['mail'] ?? raw['customeremail'] ?? '',
      client_name:
        raw['name'] ?? raw['client_name'] ?? raw['nom'] ?? raw['customername'] ?? '',
      client_phone:
        raw['phone'] ?? raw['client_phone'] ?? raw['telephone'] ?? raw['tel'] ??
        raw['mobile'] ?? raw['customerphone'] ?? '',
      notes:
        raw['notes'] ?? raw['comment'] ?? raw['commentaire'] ?? raw['remarque'] ?? '',
      status:
        raw['status'] ?? raw['statut'] ?? raw['etat'] ?? 'confirmed',
    });
  }

  return rows;
}

// ── Row processing ────────────────────────────────────────────────────────────

type CRMRecord = {
  id: string;
  email?: string;
  phone?: string;
  visitHistory?: VisitEntry[];
  metrics?: { totalVisits?: number; lastVisitDate?: number };
};

type AggEntry = {
  existingVisitHistory: VisitEntry[];
  newEntries: VisitEntry[];
  existingMetrics: { totalVisits: number; lastVisitDate?: number };
};

async function resolveCrmId(
  rawEmail: string, rawPhone: string, row: ReservationCSVRow,
  source: string, tenantId: string,
  emailIndex: Map<string, string>, crmRecords: CRMRecord[]
): Promise<string | null> {
  if (!rawEmail || !rawEmail.includes('@')) return null;
  const newId = await hashEmail(rawEmail);
  const existing = await Nexus.adapter.get<CRMRecord>(`crms/${newId}`).catch(() => null);
  if (!existing) {
    const nameParts = (row.client_name ?? '').trim().split(/\s+/);
    await Nexus.adapter.set(`crms/${newId}`, {
      id: newId, type: 'crm', email: rawEmail, phone: rawPhone || undefined,
      firstName: nameParts[0] ?? '', lastName: nameParts.slice(1).join(' ') || '',
      visitHistory: [], metrics: { totalVisits: 0 }, createdAt: Date.now(),
      source: `import_${source}`, tenantId,
    });
    emailIndex.set(rawEmail, newId);
    crmRecords.push({ id: newId, email: rawEmail, phone: rawPhone || undefined, visitHistory: [], metrics: {} });
  }
  return newId;
}

function ensureAggEntry(crmId: string, updates: Map<string, AggEntry>, crmRecords: CRMRecord[]) {
  if (!updates.has(crmId)) {
    const existing = crmRecords.find(r => r.id === crmId);
    updates.set(crmId, {
      existingVisitHistory: existing?.visitHistory ?? [],
      newEntries: [],
      existingMetrics: { totalVisits: existing?.metrics?.totalVisits ?? 0, lastVisitDate: existing?.metrics?.lastVisitDate },
    });
  }
}

async function processImportRow(
  row: ReservationCSVRow, lineNum: number, source: string, tenantId: string,
  emailIndex: Map<string, string>, phoneIndex: Map<string, string>,
  crmRecords: CRMRecord[], updates: Map<string, AggEntry>
): Promise<{ error?: string }> {
  const date = parseReservationDate(row.date);
  if (!date) return { error: `Ligne ${lineNum} : date invalide "${row.date}"` };

  const rawEmail = (row.client_email ?? '').toLowerCase().trim();
  const rawPhone = normalizePhone(row.client_phone ?? '');

  if (rawEmail && isMaskedEmail(rawEmail)) return { error: `Ligne ${lineNum} : email masqué TheFork ignoré (${rawEmail})` };

  let crmId = (rawEmail && emailIndex.get(rawEmail)) ?? (rawPhone && phoneIndex.get(rawPhone)) ?? null;
  if (!crmId) crmId = await resolveCrmId(rawEmail, rawPhone, row, source, tenantId, emailIndex, crmRecords);
  if (!crmId) return { error: `Ligne ${lineNum} : aucun client CRM trouvé pour "${rawEmail || rawPhone || 'inconnu'}"` };

  ensureAggEntry(crmId, updates, crmRecords);
  const agg = updates.get(crmId)!;
  agg.newEntries.push({ date, covers: row.covers, source, status: row.status ?? 'confirmed', ...(row.notes ? { notes: row.notes } : {}) });
  agg.existingMetrics.totalVisits += 1;
  if (!agg.existingMetrics.lastVisitDate || date > agg.existingMetrics.lastVisitDate) agg.existingMetrics.lastVisitDate = date;
  return {};
}

// ── Importer ───────────────────────────────────────────────────────────────────

export class ReservationHistoryImporter {
  /**
   * Importe un CSV de réservations historiques vers visitHistory CRM.
   *
   * @param csvContent  - Contenu brut du fichier CSV
   * @param tenantId    - Identifiant du tenant actif
   * @param source      - Source du fichier ('zenchef' | 'thefork' | 'generic')
   * @returns           { imported, errors }
   */
  async importCSV(
    csvContent: string,
    tenantId: string,
    source = 'generic'
  ): Promise<ImportReservationResult> {
    const rows = parseReservationCSV(csvContent);
    if (rows.length === 0) {
      return { imported: 0, errors: ['Fichier CSV vide ou non lisible'] };
    }

    const errors: string[] = [];

    const crmRecords = await Nexus.adapter.query<CRMRecord>('crms');
    const emailIndex = new Map<string, string>(
      crmRecords.filter(r => r.email).map(r => [r.email!.toLowerCase().trim(), r.id])
    );
    const phoneIndex = new Map<string, string>(
      crmRecords.filter(r => r.phone).map(r => [normalizePhone(r.phone!), r.id])
    );

    const updates = new Map<string, AggEntry>();

    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const result = await processImportRow(rows[i], i + 2, source, tenantId, emailIndex, phoneIndex, crmRecords, updates);
      if (result.error) { errors.push(result.error); continue; }
      imported++;
    }

    // Écriture batch
    if (updates.size > 0) {
      const batch = Nexus.adapter.batch();
      for (const [crmId, agg] of updates) {
        const mergedHistory: VisitEntry[] = [
          ...agg.existingVisitHistory,
          ...agg.newEntries,
        ].sort((a, b) => b.date - a.date);

        batch.update(`crms/${crmId}`, {
          visitHistory: mergedHistory,
          'metrics.totalVisits': agg.existingMetrics.totalVisits,
          'metrics.lastVisitDate': agg.existingMetrics.lastVisitDate,
          updatedAt: Date.now(),
        });
      }
      await batch.commit();
    }

    return { imported, errors };
  }
}
