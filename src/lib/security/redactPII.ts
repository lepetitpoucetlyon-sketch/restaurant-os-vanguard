/**
 * 🛡️ redactPII - Middleware de Masquage Automatique des Données Personnelles (PII)
 *
 * Protège les logs applicatifs (Console, Axiom, Sentry, Cloud Logging) contre les fuites
 * d'informations sensibles (RGPD & PCI-DSS) : emails, téléphones, numéros CB, IBAN, tokens, mots de passe.
 */

const EMAIL_REGEX = /([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g;
const CARD_PAN_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const IBAN_REGEX = /\b([A-Z]{2}\d{2})[A-Z0-9]{10,30}([A-Z0-9]{3})\b/g;
const PHONE_REGEX = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g;

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'bearer',
  'pin',
  'cvv',
  'cvc',
  'cardnumber',
  'card_number',
  'pan',
  'access_token',
  'refresh_token',
  'privatekey',
  'private_key',
]);

/**
 * Masque une chaîne de caractères contenant des PII.
 */
export function redactStringPII(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    // 1. Email : j***@domain.com
    .replace(EMAIL_REGEX, (_match, firstChar, domain) => `${firstChar}***@${domain}`)
    // 2. Carte bancaire : ****-****-****-1234
    .replace(CARD_PAN_REGEX, (match) => {
      const cleanDigits = match.replace(/[\s-]/g, '');
      if (cleanDigits.length < 13 || cleanDigits.length > 19) return match;
      const last4 = cleanDigits.slice(-4);
      return `****-****-****-${last4}`;
    })
    // 3. IBAN : FR76 **** 123
    .replace(IBAN_REGEX, (_match, start, end) => `${start} **** ${end}`)
    // 4. Téléphone FR : 06 ** ** ** 12
    .replace(PHONE_REGEX, (match) => {
      const clean = match.replace(/[\s.-]/g, '');
      const last2 = clean.slice(-2);
      return `${clean.slice(0, 2)} ** ** ** ${last2}`;
    });
}

/**
 * Parcourt récursivement un objet, tableau ou valeur primitive pour masquer les PII et secrets.
 */
export function redactPII<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return redactStringPII(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactPII(item)) as unknown as T;
  }

  if (input instanceof Error) {
    const redactedError = new Error(redactStringPII(input.message));
    redactedError.stack = input.stack ? redactStringPII(input.stack) : undefined;
    return redactedError as unknown as T;
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase().replace(/[-_]/g, '');
      if (SENSITIVE_KEYS.has(lowerKey)) {
        result[key] = '[REDACTED_SECRET]';
      } else {
        result[key] = redactPII(value);
      }
    }
    return result as unknown as T;
  }

  return input;
}
