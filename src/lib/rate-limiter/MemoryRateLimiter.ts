import type { IRateLimiter, RateLimitResult } from './RateLimiter';

export class MemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }
    entry.count++;
    if (entry.count > limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  }
}
