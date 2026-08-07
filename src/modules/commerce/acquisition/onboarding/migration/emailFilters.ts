/**
 * emailFilters — mig-18
 *
 * Filtre les emails masqués injectés par les plateformes de réservation
 * (TheFork, LaFourchette, OpenTable, Resy) pour éviter de polluer la base CRM.
 */

export const MASKED_DOMAINS = [
  'thefork.com',
  'theforkmanager.com',
  'lafourchette.com',
  'opentable.com',
  'resy.com',
];

/**
 * Retourne true si l'email appartient à un domaine de masquage connu.
 */
export function isMaskedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return MASKED_DOMAINS.some(d => lower.endsWith('@' + d));
}

/**
 * Classifie un email en 'real', 'masked' ou 'invalid'.
 */
export function classifyEmail(email: string): 'real' | 'masked' | 'invalid' {
  if (!email || !email.includes('@')) return 'invalid';
  if (isMaskedEmail(email)) return 'masked';
  return 'real';
}

/**
 * Filtre une liste de lignes avec un champ email optionnel.
 * Les lignes sans email restent dans `real` (elles ne sont pas masquées).
 */
export function filterMaskedEmails<T extends { email?: string }>(rows: T[]): {
  real: T[];
  masked: T[];
  stats: { total: number; real: number; masked: number };
} {
  const real = rows.filter(r => !r.email || classifyEmail(r.email) !== 'masked');
  const masked = rows.filter(r => !!r.email && classifyEmail(r.email) === 'masked');
  return {
    real,
    masked,
    stats: { total: rows.length, real: real.length, masked: masked.length },
  };
}
