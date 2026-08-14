import type { IRateLimiter, RateLimitResult } from './RateLimiter';

// Utilise l'API REST Upstash (fetch natif — pas de SDK requis)
export class UpstashRateLimiter implements IRateLimiter {
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const windowSec = Math.ceil(windowMs / 1000);
    try {
      // INCR + EXPIRE via pipeline
      const res = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSec, 'NX'],
        ]),
      });
      const data = (await res.json()) as [{ result: number }, { result: number }];
      const count = data[0].result;
      const allowed = count <= limit;
      const resetAt = Date.now() + windowMs;
      return { allowed, remaining: Math.max(0, limit - count), resetAt };
    } catch (err) {
      // Si Upstash down → fail open (allowed) pour ne pas bloquer les vrais utilisateurs
      // eslint-disable-next-line no-console
      console.warn('[UpstashRateLimiter] Upstash injoignable — fail open', { key, error: String(err) });
      return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
    }
  }
}
