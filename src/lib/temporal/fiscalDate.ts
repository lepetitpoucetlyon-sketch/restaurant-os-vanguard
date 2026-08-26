/**
 * 🏛️ Fiscal & Temporal Date Engine — Restaurant OS Core
 * 
 * Standard de gestion des journées fiscales et des vacations nocturnes.
 * Résout le problème des services nocturnes (ex: 23h58 vs 00h02 du même shift)
 * et garantit l'alignement comptable des clôtures Z, écritures FEC et scellements NF525.
 */

export interface FiscalDateOptions {
  /** Fuseau horaire de l'établissement (ex: 'Europe/Paris'). Défaut: 'Europe/Paris' */
  timeZone?: string;
  /** Heure de coupure de service (0..23). Avant cette heure, l'opération est rattachée à la veille. Défaut: 5 (5h00) */
  cutoffHour?: number;
}

export const DEFAULT_FISCAL_TIMEZONE = 'Europe/Paris';
export const DEFAULT_FISCAL_CUTOFF_HOUR = 5; // 05:00 du matin

/**
 * Retourne la date/heure actuelle qualifiée en Date standard.
 */
export function fiscalNow(): Date {
  return new Date();
}

/**
 * Détermine si une heure donnée correspond à un service de nuit (entre minuit et l'heure de coupure).
 */
export function isNightService(date: Date | string | number = new Date(), options?: FiscalDateOptions): boolean {
  const d = new Date(date);
  const timeZone = options?.timeZone || DEFAULT_FISCAL_TIMEZONE;
  const cutoffHour = options?.cutoffHour ?? DEFAULT_FISCAL_CUTOFF_HOUR;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  });

  const hour = parseInt(formatter.format(d), 10);
  return hour >= 0 && hour < cutoffHour;
}

/**
 * Calcule la clé de journée fiscale YYYY-MM-DD pour un horodatage donné.
 * Si l'événement a lieu avant l'heure de coupure (ex: 01h30 du matin),
 * il est rattaché à la date civile de la veille (journée fiscale du shift précédent).
 */
export function fiscalDayOf(date: Date | string | number = new Date(), options?: FiscalDateOptions): string {
  const d = new Date(date);
  const timeZone = options?.timeZone || DEFAULT_FISCAL_TIMEZONE;
  const cutoffHour = options?.cutoffHour ?? DEFAULT_FISCAL_CUTOFF_HOUR;

  // Format date parts in the tenant timezone
  const formatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year')?.value || '1970';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);

  if (hour >= 0 && hour < cutoffHour) {
    // Événement nocturne avant coupure : rattachement à J-1
    const shiftDate = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10) - 1));
    const prevYear = shiftDate.getUTCFullYear();
    const prevMonth = String(shiftDate.getUTCMonth() + 1).padStart(2, '0');
    const prevDay = String(shiftDate.getUTCDate()).padStart(2, '0');
    return `${prevYear}-${prevMonth}-${prevDay}`;
  }

  return `${year}-${month}-${day}`;
}

/**
 * Formate un horodatage avec fuseau horaire explicite.
 */
export function formatFiscalTimestamp(date: Date | string | number = new Date(), timeZone: string = DEFAULT_FISCAL_TIMEZONE): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}
