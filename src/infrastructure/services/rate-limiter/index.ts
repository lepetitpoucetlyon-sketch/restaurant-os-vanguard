import type { IRateLimiter } from './RateLimiter';

let _instance: IRateLimiter | null = null;

export function getRateLimiter(): IRateLimiter {
  if (_instance) return _instance;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { UpstashRateLimiter } = require('./UpstashRateLimiter') as typeof import('./UpstashRateLimiter');
    _instance = new UpstashRateLimiter(url, token);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MemoryRateLimiter } = require('./MemoryRateLimiter') as typeof import('./MemoryRateLimiter');
    _instance = new MemoryRateLimiter();
  }
  return _instance;
}
