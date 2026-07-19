import { describe, it, expect } from 'vitest';
import { resolveTenantFromHost } from '@/lib/server/tenantFromHost';
import type { NextRequest } from 'next/server';

function mockRequest(host: string): NextRequest {
  return {
    headers: {
      get: (name: string) => name === 'host' ? host : null,
    },
  } as unknown as NextRequest;
}

describe('resolveTenantFromHost', () => {
  it('extracts tenant from subdomain', () => {
    expect(resolveTenantFromHost(mockRequest('bistroduport.restaurant-os.app'))).toBe('bistroduport');
  });

  it('extracts tenant from subdomain with port', () => {
    expect(resolveTenantFromHost(mockRequest('bistroduport.restaurant-os.app:3000'))).toBe('bistroduport');
  });

  it('returns null for reserved subdomains', () => {
    expect(resolveTenantFromHost(mockRequest('admin.restaurant-os.app'))).toBeNull();
    expect(resolveTenantFromHost(mockRequest('www.restaurant-os.app'))).toBeNull();
    expect(resolveTenantFromHost(mockRequest('api.restaurant-os.app'))).toBeNull();
    expect(resolveTenantFromHost(mockRequest('master.restaurant-os.app'))).toBeNull();
    expect(resolveTenantFromHost(mockRequest('app.restaurant-os.app'))).toBeNull();
  });

  it('returns null for localhost (no subdomain)', () => {
    expect(resolveTenantFromHost(mockRequest('localhost:3000'))).toBeNull();
    expect(resolveTenantFromHost(mockRequest('localhost'))).toBeNull();
  });

  it('handles case insensitivity', () => {
    expect(resolveTenantFromHost(mockRequest('BistroPort.restaurant-os.app'))).toBe('bistroport');
  });

  it('returns null when host header is empty', () => {
    const req = { headers: { get: () => null } } as unknown as NextRequest;
    expect(resolveTenantFromHost(req)).toBeNull();
  });
});
