/**
 * CustomerCSVImporter — wid-6
 *
 * Importe un fichier CSV clients (Zenchef / TheFork / tableur maison)
 * et upsert dans la collection Nexus 'customers/' avec dédoublonnage par email.
 *
 * L'ID du document est déterministe : SHA-256 des 16 premiers hex de l'email normalisé,
 * préfixé par 'cust_'. Cela garantit l'idempotence même si l'import est relancé.
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { isMaskedEmail } from './emailFilters';
import { createHash } from 'crypto';
import { toError } from "@/lib/toError";

// ── Types ────────────────────────────────────────────────────────────────────

/** Représente une ligne brute issue du CSV (clés = en-têtes normalisés). */
export interface CustomerCSVRow {
  email?: string;
  prenom?: string;
  first_name?: string;
  nom?: string;
  last_name?: string;
  telephone?: string;
  phone?: string;
  nb_visites?: string;
  derniere_visite?: string;
  last_visit?: string;
  notes?: string;
  anniversaire?: string;
  birthday?: string;
  [key: string]: string | undefined;
}

/** Résultat retourné après un import complet. */
export interface CustomerImportResult {
  imported: number;
  updated: number;
  skipped: number;
  masked: number;
  errors: string[];
}

// ── Helpers internes ─────────────────────────────────────────────────────────

/** Retourne la première valeur non-vide parmi les clés candidates dans la ligne. */
function pick(row: CustomerCSVRow, candidates: string[]): string {
  for (const c of candidates) {
    const val = row[c];
    if (val && val.trim()) return val.trim();
  }
  return '';
}

/** Normalise un numéro de téléphone français. */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s.\-()]/g, '');
  return digits.startsWith('0') ? '+33' + digits.slice(1) : digits;
}

/** Parse une date depuis différents formats et retourne un timestamp ms ou undefined. */
function parseDate(raw: string): number | undefined {
  if (!raw) return undefined;
  // dd/MM/yyyy or d/M/yyyy
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const ts = Date.parse(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`);
    return isNaN(ts) ? undefined : ts;
  }
  const iso = Date.parse(raw);
  return isNaN(iso) ? undefined : iso;
}

/** Génère un identifiant déterministe à partir de l'email. */
function emailToId(email: string): string {
  return 'cust_' + createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
}

interface CustomerRowFields {
  firstName: string; lastName: string; email: string; phone: string;
  visits: number; lastVisitDate?: number; birthdayTs?: number; notes: string;
}

function buildCustomerPayload(f: CustomerRowFields) {
  return {
    firstName:       f.firstName || undefined,
    lastName:        f.lastName  || undefined,
    email:           f.email     || undefined,
    phone:           f.phone     ? normalizePhone(f.phone) : undefined,
    notes:           f.notes     || undefined,
    visitCount:      f.visits,
    lastVisitDate:   f.lastVisitDate ? new Date(f.lastVisitDate).toISOString() : undefined,
    birthDate:       f.birthdayTs   ? new Date(f.birthdayTs).toISOString()   : undefined,
    preferences:     [] as string[],
    tags:            [] as string[],
    totalSpentInCents: 0,
    updatedAt:       new Date().toISOString(),
  };
}

async function persistCustomer(
  email: string,
  payload: ReturnType<typeof buildCustomerPayload>,
  now: string,
): Promise<'imported' | 'updated'> {
  if (!email) {
    const id = 'cust_' + createHash('sha256')
      .update(`${payload.firstName}|${payload.lastName}|${payload.phone}|${Date.now()}`)
      .digest('hex').slice(0, 16);
    await Nexus.adapter.set('customers/' + id, { id, type: 'customer', createdAt: now, ...payload });
    return 'imported';
  }
  const id   = emailToId(email);
  const path = 'customers/' + id;
  const existing = await Nexus.adapter.get<Record<string, unknown>>(path);
  if (existing) {
    await Nexus.adapter.set(path, {
      ...existing, ...payload,
      visitCount: Math.max(payload.visitCount, (existing.visitCount as number) ?? 0),
      updatedAt: now,
    }, { merge: true });
    return 'updated';
  }
  await Nexus.adapter.set(path, { id, type: 'customer', createdAt: now, ...payload });
  return 'imported';
}

// ── Classe principale ─────────────────────────────────────────────────────────

export class CustomerCSVImporter {
  /**
   * Importe le contenu d'un CSV clients dans Nexus.
   * Chaque email connu génère un UPSERT (merge) plutôt qu'une création en double.
   */
  async import(
    csvContent: string,
    _tenantId: string,
    onProgress?: (pct: number) => void,
  ): Promise<CustomerImportResult> {
    const rows = this.parseCSV(csvContent);
    onProgress?.(10);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let masked = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      onProgress?.(10 + Math.round((i / rows.length) * 80));

      const row = rows[i];

      const email = pick(row, ['email', 'mail', 'courriel']).toLowerCase();
      const firstName = pick(row, ['prenom', 'prénom', 'first_name', 'firstname', 'first']);
      const lastName = pick(row, ['nom', 'last_name', 'lastname', 'surname']);
      const phone = pick(row, ['telephone', 'téléphone', 'tel', 'phone', 'mobile', 'portable']);
      const visitsRaw = pick(row, ['nb_visites', 'visits', 'total_visits', 'nbr_visites']);
      const lastVisitRaw = pick(row, ['derniere_visite', 'dernière_visite', 'last_visit', 'last visit']);
      const notes = pick(row, ['notes', 'commentaire', 'remarques', 'note']);
      const birthdayRaw = pick(row, ['anniversaire', 'birthday', 'date_naissance', 'birth_date']);

      // Ignorer les lignes sans aucun identifiant utile
      if (!email && !firstName && !lastName && !phone) {
        skipped++;
        errors.push(`Ligne ${i + 2} — aucun identifiant, ignorée`);
        continue;
      }

      // Filtrer les emails masqués TheFork / LaFourchette / OpenTable
      if (email && isMaskedEmail(email)) {
        masked++;
        continue;
      }

      const now        = new Date().toISOString();
      const visits     = parseInt(visitsRaw) || 0;
      const payload    = buildCustomerPayload({
        firstName, lastName, email, phone, visits,
        lastVisitDate: parseDate(lastVisitRaw),
        birthdayTs:    parseDate(birthdayRaw),
        notes,
      });

      try {
        const outcome = await persistCustomer(email, payload, now);
        if (outcome === 'updated') updated++; else imported++;
      } catch (err) {
        errors.push(`Ligne ${i + 2} — ${toError(err).message}`);
      }
    }

    onProgress?.(100);
    return { imported, updated, skipped, masked, errors };
  }

  /**
   * Parse le contenu d'un CSV.
   * Détecte automatiquement le séparateur (';', '\t' ou ',').
   * Supprime les guillemets entourant les valeurs.
   */
  parseCSV(content: string): CustomerCSVRow[] {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const firstLine = lines[0];
    const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const headers = firstLine
      .split(sep)
      .map(h => h.trim().replace(/^["'﻿]+|["']+$/g, '').toLowerCase());

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        // Gestion basique des valeurs avec guillemets contenant le séparateur
        const values = splitCSVLine(line, sep);
        return Object.fromEntries(
          headers.map((h, i) => [h, (values[i] ?? '').trim().replace(/^["']|["']$/g, '')])
        ) as CustomerCSVRow;
      });
  }
}

/**
 * Split une ligne CSV en respectant les guillemets.
 * Exemple : 'Martin,"Dupont, Jr.",email' → ['Martin', 'Dupont, Jr.', 'email']
 */
function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
