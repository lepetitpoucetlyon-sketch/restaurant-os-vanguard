import 'server-only';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const ITERATIONS = 100_000;
const KEYLEN = 32;
const DIGEST = 'sha256';

export const PinHashService = {
  hash(pin: string): { pinHash: string; pinSalt: string } {
    const pinSalt = randomBytes(16).toString('hex');
    const pinHash = pbkdf2Sync(pin, pinSalt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    return { pinHash, pinSalt };
  },

  verify(pin: string, pinHash: string, pinSalt: string): boolean {
    const candidate = pbkdf2Sync(pin, pinSalt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    const a = Buffer.from(candidate, 'hex');
    const b = Buffer.from(pinHash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  },
};
