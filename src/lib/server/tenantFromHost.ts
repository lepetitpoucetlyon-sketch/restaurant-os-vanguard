import type { NextRequest } from 'next/server';

const RESERVED = new Set(['admin', 'master', 'www', 'localhost', 'api', 'app']);

/**
 * Extracts the tenantId from the request hostname.
 * bistroduport.restaurant-os.app → 'bistroduport'
 * admin.restaurant-os.app        → null (reserved subdomain)
 * localhost:3000                  → null (no subdomain)
 */
export function resolveTenantFromHost(request: NextRequest): string | null {
  const host = (request.headers.get('host') ?? '').split(':')[0];
  const parts = host.split('.');
  if (parts.length < 2) return null;
  const sub = parts[0].toLowerCase();
  return RESERVED.has(sub) ? null : sub;
}
