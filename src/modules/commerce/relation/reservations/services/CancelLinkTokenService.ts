/**
 * M106 — Anti-bruteforce cancel link HMAC
 *
 * Génération / vérification de tokens de « self-service cancel » signés
 * HMAC-SHA256 avec comparaison **constant-time** pour bloquer le bruteforce
 * concurrentiel (5 SIM prépayées qui annulent 6 tables à 19h58).
 *
 * Format token :
 *   base64url(JSON({r: reservationId, exp: epochMs})).base64url(hmacSha256(payload, secret))
 *
 * Secret : `RESERVATION_CANCEL_HMAC_SECRET` (env). Doit être rotatable via
 * `reservations.regen_token` (Manager) — cf. RBAC map.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M106.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface CancelTokenPayload {
  r: string; // reservationId
  exp: number; // expiration epoch ms
  p?: string; // dernier n° téléphone (4 chiffres) — anti-vol de lien
}

export interface VerifyOptions {
  now?: number;
  requirePhoneLastDigits?: string;
  ipAddress?: string;
  tenantId?: string;
}

export type VerifyResult =
  | { valid: true; payload: CancelTokenPayload }
  | { valid: false; reason: 'invalid_hmac' | 'expired_token' | 'phone_mismatch' | 'malformed' };

function b64urlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + (pad === 4 ? '' : '='.repeat(pad));
  return Buffer.from(b64, 'base64');
}

function hmac(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload, 'utf8').digest();
}

export class CancelLinkTokenService {
  private static getSecret(): string {
    const s = process.env.RESERVATION_CANCEL_HMAC_SECRET;
    if (!s || s.length < 32) {
      throw new Error('RESERVATION_CANCEL_HMAC_SECRET manquant ou < 32 chars');
    }
    return s;
  }

  static generate(
    reservationId: string,
    validityHours: number,
    phoneLastDigits?: string,
    now: number = Date.now(),
  ): string {
    const payload: CancelTokenPayload = {
      r: reservationId,
      exp: now + validityHours * 3600 * 1000,
      ...(phoneLastDigits ? { p: phoneLastDigits } : {}),
    };
    const encodedPayload = b64urlEncode(JSON.stringify(payload));
    const sig = b64urlEncode(hmac(encodedPayload, this.getSecret()));
    return `${encodedPayload}.${sig}`;
  }

  static async verify(token: string, options: VerifyOptions = {}): Promise<VerifyResult> {
    const now = options.now ?? Date.now();
    const parts = token.split('.');
    if (parts.length !== 2) {
      await this.emitUnauthorized('malformed', options);
      return { valid: false, reason: 'malformed' };
    }

    const [encodedPayload, providedSig] = parts;
    const expectedSig = b64urlEncode(hmac(encodedPayload, this.getSecret()));

    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await this.emitUnauthorized('invalid_hmac', options);
      return { valid: false, reason: 'invalid_hmac' };
    }

    let payload: CancelTokenPayload;
    try {
      payload = JSON.parse(b64urlDecode(encodedPayload).toString('utf8')) as CancelTokenPayload;
    } catch {
      await this.emitUnauthorized('malformed', options);
      return { valid: false, reason: 'malformed' };
    }

    if (payload.exp <= now) {
      await this.emitUnauthorized('expired_token', options);
      return { valid: false, reason: 'expired_token' };
    }

    if (options.requirePhoneLastDigits) {
      if (!payload.p) return { valid: false, reason: 'phone_mismatch' };
      // Comparaison constant-time des 4 derniers chiffres
      const provided = Buffer.from(options.requirePhoneLastDigits, 'utf8');
      const expected = Buffer.from(payload.p, 'utf8');
      if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        return { valid: false, reason: 'phone_mismatch' };
      }
    }

    return { valid: true, payload };
  }

  private static async emitUnauthorized(
    reason: 'invalid_hmac' | 'expired_token' | 'malformed',
    options: VerifyOptions,
  ): Promise<void> {
    if (!options.tenantId) return;
    // 'malformed' est mappé sur invalid_hmac dans le catalogue (pas de sur-catégorisation nécessaire côté observabilité).
    const mapped = reason === 'malformed' ? 'invalid_hmac' : reason;
    try {
      await NexusEventBus.emit('security.unauthorized_access_attempt', {
        v: 1,
        tenantId: options.tenantId,
        resource: 'reservation.cancel',
        ipAddress: options.ipAddress ?? '0.0.0.0',
        reason: mapped,
        attemptedAt: Date.now(),
      });
    } catch {
      /* observabilité non bloquante */
    }
  }
}
