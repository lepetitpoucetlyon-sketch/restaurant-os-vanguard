import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/admin/system/health/route';

vi.mock('@/infrastructure/services/ArchitecturalHealthService', () => ({
  ArchitecturalHealthService: {
    generateReport: vi.fn().mockResolvedValue({
      grade: 'X',
      timestamp: '2026-07-19T10:00:00Z',
      modules: [],
    }),
  },
}));

vi.mock('@/domain/services/NexusTelemetryService', () => ({
  NexusTelemetryService: {
    emitAuditPulse: vi.fn(),
  },
}));

vi.mock('@/lib/server/adminAuthGuard', () => ({
  requireFleetAdmin: vi.fn().mockResolvedValue({ uid: 'admin_1', role: 'fleet_admin' }),
  isDenied: vi.fn((caller) => caller && caller.status), // Rough mock
}));

describe('Health Route (GET)', () => {
  it('returns a 200 health report', async () => {
    const request = new Request('http://localhost/api/admin/system/health');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.grade).toBe('X');
    expect(body.metadata.version).toBe('v2');
  });
});
