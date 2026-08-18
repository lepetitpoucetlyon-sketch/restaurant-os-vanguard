import type { IRateLimiter } from './RateLimiter';
import { MemoryRateLimiter } from './MemoryRateLimiter';
import { UpstashRateLimiter } from './UpstashRateLimiter';

export * from './RateLimiter';
export * from './MemoryRateLimiter';
export * from './UpstashRateLimiter';

let _instance: IRateLimiter | null = null;

export function getRateLimiter(): IRateLimiter {
  if (_instance) return _instance;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    _instance = new UpstashRateLimiter(url, token);
  } else {
    _instance = new MemoryRateLimiter();
  }
  return _instance;
}
