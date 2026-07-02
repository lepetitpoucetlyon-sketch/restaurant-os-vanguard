import 'server-only';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { logger } from '@/lib/logger';

/**
 * 🛡️ Garde d'authentification des routes /api/admin.
 *
 * Vérifie réellement le JWT Firebase (signature + expiration) et le rôle
 * porté par les custom claims. Remplace le « Hidden Door Pattern » qui ne
 * contrôlait que la présence des headers.
 *
 * Sémantique conservée : tout refus répond 404 (pas 401/403) pour ne pas
 * révéler l'existence des endpoints d'administration.
 */

export interface AdminCaller {
  uid: string;
  role: string;
  /** tenantId porté par les claims — absent pour un fleet_admin global. */
  tenantId?: string;
}

// 'SUPER_ADMIN' : convention historique (SovereignModuleGate) conservée en compat.
const FLEET_ROLES = ['fleet_admin', 'SUPER_ADMIN'] as const;
const TENANT_ADMIN_ROLES = ['fleet_admin', 'SUPER_ADMIN', 'admin', 'manager'] as const;

function hiddenDoor(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

async function verifyCaller(request: Request): Promise<AdminCaller | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    initFirebaseAdmin();
    const decoded = await getAuth().verifyIdToken(authHeader.slice('Bearer '.length));
    // `clientId` : alias historique de tenantId (SovereignModuleGate) — compat.
    const tenantId = typeof decoded.tenantId === 'string' ? decoded.tenantId
      : typeof decoded.clientId === 'string' ? decoded.clientId : undefined;
    return {
      uid: decoded.uid,
      role: typeof decoded.role === 'string' ? decoded.role : '',
      tenantId,
    };
  } catch (err) {
    logger.warn('[adminAuth] Token verification failed', String(err));
    return null;
  }
}

/**
 * Exige un opérateur flotte (MCC). Retourne le caller vérifié,
 * ou une NextResponse 404 à renvoyer telle quelle.
 */
export async function requireFleetAdmin(request: Request): Promise<AdminCaller | NextResponse> {
  const caller = await verifyCaller(request);
  if (!caller || !(FLEET_ROLES as readonly string[]).includes(caller.role)) return hiddenDoor();
  return caller;
}

/**
 * Exige un admin/manager de tenant (ou un fleet_admin).
 * Le tenant effectif vient TOUJOURS du token — jamais d'un header client.
 * Un fleet_admin peut cibler un tenant explicite via `x-nexus-tenant-id`.
 */
export async function requireTenantAdmin(request: Request): Promise<(AdminCaller & { tenantId: string }) | NextResponse> {
  const caller = await verifyCaller(request);
  if (!caller || !(TENANT_ADMIN_ROLES as readonly string[]).includes(caller.role)) return hiddenDoor();

  const isFleet = (FLEET_ROLES as readonly string[]).includes(caller.role);
  const headerTenant = request.headers.get('x-nexus-tenant-id') ?? undefined;
  const tenantId = isFleet ? (headerTenant ?? caller.tenantId) : caller.tenantId;

  if (!tenantId) return hiddenDoor();
  if (!isFleet && headerTenant && headerTenant !== tenantId) {
    logger.warn(`[adminAuth] Cross-tenant attempt blocked: uid=${caller.uid} claims=${tenantId} header=${headerTenant}`);
    return hiddenDoor();
  }
  return { ...caller, tenantId };
}

/** Type guard pratique côté route. */
export function isDenied(result: AdminCaller | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
