import type { IRateLimiter, RateLimitResult } from './RateLimiter';
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

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
      // Rate-limit dans le chemin chaud auth — timeout serré (2s) : mieux vaut
      // fail-open (catch en bas) qu'attendre Upstash sur un problème réseau.
      const res = await fetchWithTimeout(`${this.url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSec, 'NX'],
        ]),
      }, 2_000);
      const data = (await res.json()) as [{ result: number }, { result: number }];
      const count = data[0].result;
      const allowed = count <= limit;
      const resetAt = Date.now() + windowMs;
      return { allowed, remaining: Math.max(0, limit - count), resetAt };
    } catch {
      // Si Upstash down → fail open (allowed) pour ne pas bloquer les vrais utilisateurs
      return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
    }
  }
}
