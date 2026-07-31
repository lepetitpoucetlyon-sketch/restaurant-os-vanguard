import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { POST } from '@/app/api/timeclock/verify-pin/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/server/adminAuthGuard', () => ({
  requireTenantUser: vi.fn().mockResolvedValue({ tenantId: 'test-tenant' }),
  isDenied: vi.fn().mockReturnValue(false)
}));

vi.mock('@/lib/server/PinHashService', () => ({
  PinHashService: {
    verify: vi.fn().mockReturnValue(false) // Always fail to trigger rate limit
  }
}));

describe('verify-pin API - Rate Limiting (P09-H)', () => {
  beforeEach(async () => {
    // Clear the Nexus store before each test
    await Nexus.adapter.delete('tenants/test-tenant/pinRateLimits/term-1');
  });

  it('should persist rate limit across multiple calls and lock out after 5 attempts', async () => {
    const createReq = () => new NextRequest('http://localhost/api/timeclock/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234', terminalId: 'term-1' }),
      headers: { 'Content-Type': 'application/json' }
    });

    // 1 to 4 attempts should return 401 (PIN incorrect)
    for (let i = 0; i < 4; i++) {
      const res = await POST(createReq());
      expect(res.status).toBe(401);
    }

    // 5th attempt should still be 401 but set the lockout
    const res5 = await POST(createReq());
    expect(res5.status).toBe(401);

    // 6th attempt should be 429 (Too Many Requests / Locked out)
    const res6 = await POST(createReq());
    expect(res6.status).toBe(429);
    
    // Verify Nexus state explicitly
    const rate = await Nexus.adapter.get<{ attempts: number, lockedUntil?: number }>('tenants/test-tenant/pinRateLimits/term-1');
    expect(rate).toBeDefined();
    expect(rate!.attempts).toBe(5);
    expect(rate!.lockedUntil).toBeGreaterThan(Date.now());
  });
});
