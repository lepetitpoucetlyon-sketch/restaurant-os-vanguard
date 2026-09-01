/**
 * M103 + M105 — SMS Silent Drop + GSM-7 vs UCS-2 sanitizer
 *
 * M103 : validation stricte E.164 avant envoi. Si échec, event `system.sms_delivery_failed`
 *        avec `fallbackUsed: 'email'` pour permettre au CustomerNotificationRouter d'utiliser
 *        l'email comme rail de secours.
 * M105 : détection GSM-7 vs UCS-2, comptage segments, sanitisation optionnelle des emojis
 *        pour éviter facture ×4 silencieuse (1 emoji = passage en UCS-2 = 70 chars / segment
 *        au lieu de 160).
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M103, M105.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

// Alphabet GSM-7 canonique (3GPP TS 23.038). Approximation utile — les extensions ^{}\\[~]|€ comptent double.
const GSM7_BASE = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'.split(''),
);
const GSM7_EXTENDED = new Set('^{}\\[~]|€'.split(''));

export type SmsEncoding = 'GSM-7' | 'UCS-2';

export interface SmsAnalysis {
  encoding: SmsEncoding;
  segments: number;
  segmentSize: number;
  strippedChars: string[];
  sanitized: string;
}

export class SmsSanitizerService {
  /** Validation stricte E.164 : + suivi de 8 à 15 chiffres. */
  static isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  }

  /** Analyse un texte SMS : encodage, segments, chars problématiques. */
  static analyze(text: string): SmsAnalysis {
    let needsUcs2 = false;
    const stripped: string[] = [];
    let sanitized = '';

    for (const ch of text) {
      if (GSM7_BASE.has(ch)) {
        sanitized += ch;
      } else if (GSM7_EXTENDED.has(ch)) {
        sanitized += ch;
      } else {
        needsUcs2 = true;
        stripped.push(ch);
        sanitized += this.fallbackChar(ch);
      }
    }

    const encoding: SmsEncoding = needsUcs2 ? 'UCS-2' : 'GSM-7';
    // Tailles de segment : 1er segment concaténé = 153 (GSM-7) / 67 (UCS-2), sinon 160 / 70.
    const singleMax = encoding === 'GSM-7' ? 160 : 70;
    const multiSize = encoding === 'GSM-7' ? 153 : 67;

    let effectiveLen = 0;
    for (const ch of text) {
      effectiveLen += GSM7_EXTENDED.has(ch) ? 2 : 1;
    }
    const segments =
      effectiveLen <= singleMax
        ? 1
        : Math.ceil(effectiveLen / multiSize);

    return {
      encoding,
      segments,
      segmentSize: segments <= 1 ? singleMax : multiSize,
      strippedChars: stripped,
      sanitized,
    };
  }

  /** Remplace un caractère hors GSM-7 par son fallback ASCII le plus proche. */
  private static fallbackChar(ch: string): string {
    // Emoji et symboles → espace (évite tokens ambigus).
    if (/\p{Emoji}/u.test(ch)) return ' ';
    // Guillemets typographiques → ASCII.
    if (['«', '»', '"', '"'].includes(ch)) return '"';
    if (["'", "'"].includes(ch)) return "'";
    // Tirets typographiques → -.
    if (['—', '–', '−'].includes(ch)) return '-';
    return '?';
  }

  /**
   * Émet l'event de saturation SMS (M105) si le texte forcerait un passage UCS-2
   * ou dépasse le nombre max de segments configuré.
   */
  static async warnIfSegmentBudget(
    tenantId: string,
    recipientPhone: string,
    text: string,
    maxSegments: number,
  ): Promise<SmsAnalysis> {
    const analysis = this.analyze(text);
    if (analysis.segments > maxSegments || analysis.strippedChars.length > 0) {
      await NexusEventBus.emit('system.sms_segment_warning', {
        v: 1,
        tenantId,
        recipientPhone,
        originalLength: text.length,
        sanitizedLength: analysis.sanitized.length,
        encoding: analysis.encoding,
        segments: analysis.segments,
        strippedChars: analysis.strippedChars,
      });
    }
    return analysis;
  }

  /**
   * Émet l'event M103 quand un envoi SMS échoue et qu'un fallback email est déclenché.
   */
  static async reportDeliveryFailure(params: {
    tenantId: string;
    recipientPhone: string;
    provider: string;
    error: string;
    fallbackUsed: 'email' | 'none';
    failedAt?: number;
  }): Promise<void> {
    await NexusEventBus.emit('system.sms_delivery_failed', {
      v: 1,
      tenantId: params.tenantId,
      recipientPhone: params.recipientPhone,
      provider: params.provider,
      error: params.error,
      fallbackUsed: params.fallbackUsed,
      failedAt: params.failedAt ?? Date.now(),
    });
  }
}
