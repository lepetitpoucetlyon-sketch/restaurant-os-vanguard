/**
 * QuietHoursPolicy — heures calmes & gating par sévérité (kernel, pur).
 *
 * Branche les réglages `NotificationsConfig` (doNotDisturb, dndStartTime,
 * dndEndTime) qui étaient déclarés mais lus par personne (audit alertes.md N8).
 *
 * Règle : une alerte CRITIQUE traverse toujours (sécurité sanitaire/fiscale/légale) ;
 * une alerte HAUTE est différée (pas de push) pendant les heures calmes — elle
 * reste visible dans le centre de notifications, elle n'interrompt simplement pas.
 *
 * Aucune dépendance vers modules/ — testable en isolation.
 */

export type PushSeverity = 'CRITICAL' | 'HIGH';

export interface QuietHoursConfig {
  doNotDisturb?: boolean;
  dndStartTime?: string; // 'HH:MM'
  dndEndTime?: string;   // 'HH:MM'
}

export type QuietVerdict = 'DELIVER' | 'SUPPRESS_QUIET_HOURS';

/** Convertit 'HH:MM' en minutes depuis minuit, ou null si invalide. */
function toMinutes(hhmm: string | undefined): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Vrai si `now` tombe dans la fenêtre [start, end), en gérant le passage de
 * minuit (ex. 22:00 → 08:00). Fenêtre vide/invalide → false.
 */
export function isWithinQuietWindow(now: Date, startHHMM?: string, endHHMM?: string): boolean {
  const start = toMinutes(startHHMM);
  const end = toMinutes(endHHMM);
  if (start === null || end === null || start === end) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  if (start < end) {
    // Même jour : ex. 01:00 → 06:00
    return cur >= start && cur < end;
  }
  // Fenêtre de nuit qui enjambe minuit : ex. 22:00 → 08:00
  return cur >= start || cur < end;
}

/**
 * Décide si un push doit partir maintenant.
 * @param severity  CRITICAL (traverse tout) ou HIGH (respecte les heures calmes).
 * @param cfg       réglages de notification du tenant.
 * @param now       instant d'évaluation (injecté pour la testabilité).
 */
export function evaluatePush(
  severity: PushSeverity,
  cfg: QuietHoursConfig | null | undefined,
  now: Date = new Date(),
): QuietVerdict {
  // Une alerte critique ne se tait jamais.
  if (severity === 'CRITICAL') return 'DELIVER';

  const config = cfg ?? {};
  // Mode silencieux permanent activé → on diffère.
  if (config.doNotDisturb === true) return 'SUPPRESS_QUIET_HOURS';
  // Fenêtre horaire de calme.
  if (isWithinQuietWindow(now, config.dndStartTime, config.dndEndTime)) {
    return 'SUPPRESS_QUIET_HOURS';
  }
  return 'DELIVER';
}
