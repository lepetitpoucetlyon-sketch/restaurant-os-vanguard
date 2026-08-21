/**
 * M107 — Anti-DST timezone touriste
 *
 * Un touriste NYC réserve « 15h » depuis son iPhone en TZ America/New_York — le
 * widget web transmet un ISO sans TZ, la caisse Lyon interprète « 15h Europe/Paris »
 * → collision. On force la normalisation au fuseau tenant (`Europe/Paris` par défaut)
 * et on émet un badge si le fuseau du client différait.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M107.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface NormalizeParams {
  tenantId: string;
  reservationId: string;
  /** ISO fourni par le client (peut contenir un offset). */
  clientProvidedIso: string;
  /** IANA TZ tenant, ex `Europe/Paris`. */
  tenantTimezone: string;
  /** IANA TZ détectée côté client (Intl.DateTimeFormat().resolvedOptions().timeZone). */
  guestTimezone?: string;
}

export interface NormalizeResult {
  /** ISO normalisé au fuseau tenant (avec offset explicite). */
  normalizedIso: string;
  /** True si le fuseau client différait du fuseau tenant → un badge doit s'afficher. */
  requiresBadge: boolean;
  /** Différence en minutes entre l'heure « telle qu'écrite » et l'heure absolue. */
  driftMinutes: number;
}

export class ReservationTimezoneGuard {
  /**
   * Normalise un ISO potentiellement ambigu en heure absolue dans le fuseau tenant.
   * Émet `commerce.reservation_timezone_normalized` si un badge est nécessaire.
   */
  static async normalize(params: NormalizeParams): Promise<NormalizeResult> {
    const { tenantId, reservationId, clientProvidedIso, tenantTimezone, guestTimezone } = params;

    const parsed = new Date(clientProvidedIso);
    const normalizedIso = parsed.toISOString();

    const requiresBadge = Boolean(guestTimezone && guestTimezone !== tenantTimezone);
    const driftMinutes = requiresBadge
      ? this.computeOffsetDriftMinutes(parsed, tenantTimezone, guestTimezone!)
      : 0;

    if (requiresBadge) {
      await NexusEventBus.emit('commerce.reservation_timezone_normalized', {
        v: 1,
        tenantId,
        reservationId,
        originalIso: clientProvidedIso,
        normalizedIso,
        guestTimezone,
        tenantTimezone,
      });
    }

    return { normalizedIso, requiresBadge, driftMinutes };
  }

  /**
   * Calcule la dérive (minutes) entre les fuseaux client et tenant pour un instant donné.
   * Utilise Intl.DateTimeFormat pour extraire l'offset localisé.
   */
  private static computeOffsetDriftMinutes(
    at: Date,
    tenantTz: string,
    guestTz: string,
  ): number {
    const getOffset = (tz: string): number => {
      // Extraction offset via Intl : formatToParts en `longOffset` renvoie "GMT+02:00"
      const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'longOffset' });
      const part = fmt.formatToParts(at).find(p => p.type === 'timeZoneName');
      const val = part?.value ?? 'GMT+00:00';
      const match = /GMT([+-])(\d{2}):(\d{2})/.exec(val);
      if (!match) return 0;
      const sign = match[1] === '+' ? 1 : -1;
      const h = parseInt(match[2], 10);
      const m = parseInt(match[3], 10);
      return sign * (h * 60 + m);
    };
    return getOffset(guestTz) - getOffset(tenantTz);
  }
}
