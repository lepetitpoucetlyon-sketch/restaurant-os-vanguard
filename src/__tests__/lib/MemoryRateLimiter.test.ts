import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRateLimiter } from '@/lib/rate-limiter/MemoryRateLimiter';

describe('MemoryRateLimiter', () => {
  let limiter: MemoryRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new MemoryRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request', async () => {
    const result = await limiter.check('ip_1', 3, 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('allows subsequent requests up to the limit', async () => {
    await limiter.check('ip_1', 3, 1000);
    const result2 = await limiter.check('ip_1', 3, 1000);
    const result3 = await limiter.check('ip_1', 3, 1000);
    
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('blocks requests after the limit is reached', async () => {
    await limiter.check('ip_1', 2, 1000);
    await limiter.check('ip_1', 2, 1000);
    const result = await limiter.check('ip_1', 2, 1000);
    
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets the limit after the window expires', async () => {
    await limiter.check('ip_1', 1, 1000);
    
    // Blocked immediately
    expect((await limiter.check('ip_1', 1, 1000)).allowed).toBe(false);

    // Fast-forward time past the window
    vi.advanceTimersByTime(1001);

    // Allowed again
    const result = await limiter.check('ip_1', 1, 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('isolates different keys', async () => {
    await limiter.check('ip_1', 1, 1000);
    
    // ip_2 should not be affected by ip_1's limit
    const result = await limiter.check('ip_2', 1, 1000);
    expect(result.allowed).toBe(true);
  });
});
