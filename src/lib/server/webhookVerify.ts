import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/** HMAC-SHA256 hex du body brut avec le secret donné. */
export function computeHmacHex(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data, 'utf8').digest('hex');
}

/**
 * Comparaison timing-safe de deux chaînes hex de même longueur.
 * Retourne false immédiatement si les longueurs diffèrent (pas de timing leak possible).
 */
export function timingSafeCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

const CONNECTORS_WEBHOOK_SECRET = process.env.CONNECTORS_WEBHOOK_SECRET;

/**
 * Fallback pour les providers sans HMAC propre.
 * Vérifie `Authorization: Bearer <CONNECTORS_WEBHOOK_SECRET>`.
 *
 * - Secret configuré + header correct → true
 * - Secret configuré + header incorrect → false (401)
 * - Secret non configuré → true avec warning (backward compat, migration progressive)
 */
export function checkFallbackWebhookSecret(headers: Headers, providerId: string): boolean {
  if (!CONNECTORS_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  }
  const auth = headers.get('authorization');
  return auth === `Bearer ${CONNECTORS_WEBHOOK_SECRET}`;
}
