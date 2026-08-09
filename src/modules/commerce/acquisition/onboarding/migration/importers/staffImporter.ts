import { randomBytes } from 'crypto';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import { PERMISSION_ROLE_LEVELS } from '@/shared/nexus/contracts/permissions.types';
import type { ParsedFile, ImportResult } from '../types';
import { validatePin } from '@/lib/auth/validatePin';

// Cross-impact: UserSchema requires pin to be /^[0-9]{4}$/ — never use Math.random()
function generateSecurePin(): string {
  let pin: string;
  do {
    pin = String(1000 + (randomBytes(2).readUInt16BE(0) % 9000));
  } while (!validatePin(pin).valid);
  return pin;
}

// Maps any known alias (FR, EN, slang) → internal PermissionRole
const ROLE_ALIASES: Record<string, PermissionRole> = {
  // Serveur
  serveur: 'serveur', server: 'serveur', waiter: 'serveur', waitress: 'serveur',
  garçon: 'serveur', 'serveur(se)': 'serveur',
  // Cuisinier
  cuisinier: 'cuisinier', cook: 'cuisinier', chef: 'cuisinier',
  kitchen: 'cuisinier', kitchen_line: 'cuisinier', 'commis de cuisine': 'cuisinier',
  cuistot: 'cuisinier', cuisinière: 'cuisinier',
  // Chef cuisinier
  chef_cuisinier: 'chef_cuisinier', 'chef cuisinier': 'chef_cuisinier',
  'head chef': 'chef_cuisinier', 'executive chef': 'chef_cuisinier',
  // Chef de rang
  chef_rang: 'chef_rang', 'chef de rang': 'chef_rang',
  maître: 'chef_rang',
  // Manager
  manager: 'manager', 'floor manager': 'manager', responsable: 'manager',
  superviseur: 'manager', supervisor: 'manager',
  // Directeur
  directeur: 'directeur', director: 'directeur', gérant: 'directeur',
  owner: 'directeur', patron: 'directeur', 'directrice': 'directeur',
  // Barman
  barman: 'barman', bartender: 'barman', barmaid: 'barman', bar: 'barman',
  // Hôtesse
  hotesse: 'hotesse', hôtesse: 'hotesse', hostess: 'hotesse', host: 'hotesse',
  accueil: 'hotesse',
  // Plongeur
  plongeur: 'plongeur', dishwasher: 'plongeur', plonge: 'plongeur',
  // Comptable
  comptable: 'comptable', accountant: 'comptable',
};

function normalizeRole(raw: string): PermissionRole {
  const key = raw.toLowerCase().trim().replace(/_/g, ' ');
  return ROLE_ALIASES[key] ?? ROLE_ALIASES[raw.toLowerCase().trim()] ?? 'serveur';
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, '').replace(/^0/, '+33');
}

function parseHourlyRate(raw: string): number {
  const val = parseFloat(raw.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
  return toMicrounits(Math.round(val * 1_000_000));
}

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(k => k.toLowerCase().replace(/_/g, ' ').includes(c.toLowerCase()));
    if (key) return row[key] ?? '';
  }
  return '';
}

export async function importStaff(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);
  const batch = Nexus.adapter.batch();
  let created = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(5 + Math.round((i / file.rows.length) * 80));

    // Column detection — handles both FR (Nom, Prénom) and EN (Name, FirstName)
    const firstName = findCol(row, ['prénom', 'prenom', 'firstname', 'first name', 'first_name']);
    const lastName = findCol(row, ['nom', 'lastname', 'last name', 'last_name', 'surname']);
    const name = findCol(row, ['nom complet', 'name', 'fullname', 'full name']) || [firstName, lastName].filter(Boolean).join(' ');

    if (!name.trim()) {
      errors.push({ row: i + 2, message: 'Nom manquant — ligne ignorée' });
      skipped++;
      continue;
    }

    const roleRaw = findCol(row, ['role', 'rôle', 'poste', 'fonction', 'position', 'job']);
    const role = normalizeRole(roleRaw || 'serveur');

    const pinRaw = findCol(row, ['pin', 'code', 'mot de passe', 'password']);
    const pin = validatePin(pinRaw).valid ? pinRaw : generateSecurePin();

    const email = findCol(row, ['email', 'mail', 'courriel']).toLowerCase() || undefined;
    const phone = findCol(row, ['telephone', 'téléphone', 'phone', 'tel', 'mobile']);
    const hourlyRateRaw = findCol(row, ['taux', 'hourly', 'salaire', 'rate', 'rémunération']);

    const id = Nexus.adapter.generateId('users');
    batch.set(`users/${id}`, {
      id,
      type: 'user',
      name: name.trim(),
      role,
      email,
      phone: phone ? normalizePhone(phone) : undefined,
      pin,
      pinMustChange: !pinRaw, // force PIN change if auto-generated
      status: 'active',
      accessLevel: PERMISSION_ROLE_LEVELS[role] ?? 40,
      hourlyRateInMicrounits: hourlyRateRaw ? parseHourlyRate(hourlyRateRaw) : undefined,
      schemaVersion: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    created++;
  }

  await batch.commit();
  onProgress(100);
  return { created, updated: 0, skipped, errors };
}
