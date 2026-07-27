export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface IRateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}
