/**
 * BusinessClock.ts — Kernel Layer (ADR-015)
 * 
 * Gestionnaire universel du temps métier pour Restaurant OS.
 * Distingue rigoureusement :
 *   1. occurredAt : L'instant réel du fait (figé à l'origine, jamais recalculé)
 *   2. businessDay : La date de la journée de service (ex: 05h-05h locale)
 *   3. recordedAt : L'instant de capture système (traçabilité technique)
 * 
 * Zéro dépendance vers les modules/ (Couche Kernel pure).
 */

export interface TemporalStamp {
  occurredAt: string;   // ISO 8601 complet (ex: 2026-09-02T00:30:00+02:00)
  businessDay: string;  // 'YYYY-MM-DD' — Journée d'exploitation / de service
  recordedAt: string;   // ISO 8601 — Instant d'enregistrement système
}

export interface ServiceDayConfig {
  timezone: string;      // ex: 'Europe/Paris'
  cutoverHour: number;   // ex: 5 (la journée court de 05h00 à 05h00 le lendemain)
}

export const DEFAULT_SERVICE_DAY_CONFIG: ServiceDayConfig = {
  timezone: 'Europe/Paris',
  cutoverHour: 5,
};

/**
 * Extrait les composants de date/heure locale dans le fuseau horaire spécifié.
 */
function getZonedParts(date: Date, timezone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const findPart = (type: string) => {
    const p = parts.find((pt) => pt.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  let hour = findPart('hour');
  if (hour === 24) hour = 0; // standard 24h normalization

  return {
    year: findPart('year'),
    month: findPart('month'),
    day: findPart('day'),
    hour,
    minute: findPart('minute'),
    second: findPart('second'),
  };
}

/**
 * Formate year/month/day en chaîne canonique 'YYYY-MM-DD'.
 */
function formatDayString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export const BusinessClock = {
  /**
   * Estampille un fait métier qui vient de se produire en direct.
   */
  stampNow(cfg: Partial<ServiceDayConfig> = {}): TemporalStamp {
    const nowIso = new Date().toISOString();
    return this.stampAt(nowIso, cfg);
  },

  /**
   * Estampille un fait passé (rejeu hors-ligne, ticket différé, rattrapage).
   * L'instant occurredAt est préservé à l'identique.
   */
  stampAt(occurredAt: string, cfg: Partial<ServiceDayConfig> = {}): TemporalStamp {
    const fullCfg: ServiceDayConfig = {
      timezone: cfg.timezone || DEFAULT_SERVICE_DAY_CONFIG.timezone,
      cutoverHour: cfg.cutoverHour !== undefined ? cfg.cutoverHour : DEFAULT_SERVICE_DAY_CONFIG.cutoverHour,
    };

    const businessDay = this.resolveServiceDay(occurredAt, fullCfg);
    const recordedAt = new Date().toISOString();

    return {
      occurredAt,
      businessDay,
      recordedAt,
    };
  },

  /**
   * Détermine la journée de service (YYYY-MM-DD) correspondant à un instant précis,
   * en appliquant l'heure de bascule (cutoverHour) dans le fuseau du tenant.
   */
  resolveServiceDay(isoOrDate: string | Date, cfg: Partial<ServiceDayConfig> = {}): string {
    const fullCfg: ServiceDayConfig = {
      timezone: cfg.timezone || DEFAULT_SERVICE_DAY_CONFIG.timezone,
      cutoverHour: cfg.cutoverHour !== undefined ? cfg.cutoverHour : DEFAULT_SERVICE_DAY_CONFIG.cutoverHour,
    };

    const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(date.getTime())) {
      throw new Error(`[BusinessClock] Date invalide : ${String(isoOrDate)}`);
    }

    const local = getZonedParts(date, fullCfg.timezone);

    // Si l'heure locale est avant l'heure de bascule, le service appartient à la veille civile
    if (local.hour < fullCfg.cutoverHour) {
      // Décrémenter d'un jour calendaire
      const prevDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
      const prevLocal = getZonedParts(prevDate, fullCfg.timezone);
      return formatDayString(prevLocal.year, prevLocal.month, prevLocal.day);
    }

    return formatDayString(local.year, local.month, local.day);
  },

  /**
   * Calcule le retard en heures entre la survenance d'un fait et son enregistrement.
   */
  lagHours(stamp: { occurredAt: string; recordedAt: string; [key: string]: unknown }): number {
    const occurred = new Date(stamp.occurredAt).getTime();
    const recorded = new Date(stamp.recordedAt).getTime();
    if (isNaN(occurred) || isNaN(recorded)) return 0;
    return Math.max(0, (recorded - occurred) / (1000 * 60 * 60));
  },

  /**
   * Calcule les bornes UTC d'une journée de service donnée (fromIso inclus, toIso exclus).
   */
  serviceDayBounds(dayString: string, cfg: Partial<ServiceDayConfig> = {}): { fromIso: string; toIso: string } {
    const fullCfg: ServiceDayConfig = {
      timezone: cfg.timezone || DEFAULT_SERVICE_DAY_CONFIG.timezone,
      cutoverHour: cfg.cutoverHour !== undefined ? cfg.cutoverHour : DEFAULT_SERVICE_DAY_CONFIG.cutoverHour,
    };

    const [year, month, day] = dayString.split('-').map(Number);
    if (!year || !month || !day) {
      throw new Error(`[BusinessClock] Format de journée invalide (attendu YYYY-MM-DD): ${dayString}`);
    }

    // Heure de début : YYYY-MM-DD à cutoverHour:00:00 locale
    // On estime la date UTC approximative puis on ajuste selon le fuseau
    const guessStart = new Date(Date.UTC(year, month - 1, day, fullCfg.cutoverHour, 0, 0));
    
    // On ajuste pour matcher exactement l'instant où local == cutoverHour
    const startOffset = this._getTzOffsetMs(guessStart, fullCfg.timezone);
    const startUtcMs = Date.UTC(year, month - 1, day, fullCfg.cutoverHour, 0, 0) - startOffset;
    const fromDate = new Date(startUtcMs);

    // Heure de fin : 24 heures plus tard
    const toDate = new Date(startUtcMs + 24 * 60 * 60 * 1000);

    return {
      fromIso: fromDate.toISOString(),
      toIso: toDate.toISOString(),
    };
  },

  /**
   * Calcule l'écart en millisecondes entre le temps local du fuseau et UTC à un instant donné.
   * @internal
   */
  _getTzOffsetMs(date: Date, timezone: string): number {
    const parts = getZonedParts(date, timezone);
    const asUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return asUtcMs - date.getTime();
  },
};
