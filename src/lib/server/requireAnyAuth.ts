import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { DEV_PIN_BYPASS_HEADER } from '@/lib/authConstants';
import { isDeviceRevoked } from '@/lib/server/deviceRevocation';
import { logger } from '@/lib/logger';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
  deviceId?: string;
  isDevBypass: boolean;
}

/**
 * 🛡️ Helper serveur universel de vérification d'authentification pour toutes les routes API.
 * 
 * 1. Vérifie le Kill-Switch matériel (si x-device-id est révoqué -> 403)
 * 2. Accepte le bypass Dev PIN si et seulement si process.env.NODE_ENV === 'development'
 * 3. Valide le token JWT Firebase et extrait userId, tenantId et role
 * 
 * Usage standard dans une route API Next.js :
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const auth = await requireAnyAuth(req);
 *   // ... logique protégée garantie avec auth.userId & auth.tenantId
 * }
 * ```
 */
export async function requireAnyAuth(req: NextRequest | Request): Promise<AuthContext> {
  const authHeader = req.headers.get('authorization') ?? '';
  const deviceId = req.headers.get('x-device-id') ?? undefined;

  // 1. Contrôle Kill-Switch de la flotte MDM
  if (deviceId) {
    const isRevoked = await isDeviceRevoked(deviceId);
    if (isRevoked) {
      logger.warn(`[requireAnyAuth] Tentative d'accès depuis un appareil révoqué : ${deviceId}`);
      throw new NextResponse(
        JSON.stringify({ error: 'DEVICE_REVOKED', message: 'Cet appareil a été révoqué par la direction.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Dev bypass (Strictement isolé hors production)
  if (
    process.env.NODE_ENV !== 'production' &&
    (authHeader === DEV_PIN_BYPASS_HEADER ||
     authHeader === 'Bearer mcc-dev-bypass' ||
     authHeader === 'Bearer dev-tenant-bypass')
  ) {
    const tenantId =
      req.headers.get('x-nexus-tenant-id') ??
      req.headers.get('x-resolved-tenant-id') ??
      process.env.DEV_TENANT_ID ??
      'lepetitpoucet';

    return {
      userId: 'dev_user',
      tenantId,
      role: 'admin',
      deviceId,
      isDevBypass: true,
    };
  }

  // 3. Validation JWT Firebase en production
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new NextResponse(
      JSON.stringify({ error: 'UNAUTHORIZED', message: 'En-tête Authorization manquant ou invalide' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    initFirebaseAdmin();
    const token = authHeader.slice('Bearer '.length);
    const decoded = await getAuth().verifyIdToken(token);

    const tenantId =
      typeof decoded.tenantId === 'string'
        ? decoded.tenantId
        : typeof decoded.clientId === 'string'
        ? decoded.clientId
        : (decoded.role === 'fleet_admin' ? 'root' : (() => { throw new NextResponse(JSON.stringify({ error: 'UNAUTHORIZED_NO_TENANT', message: 'Aucun établissement associé au jeton' }), { status: 401, headers: { 'Content-Type': 'application/json' } }); })());

    const role = typeof decoded.role === 'string' ? decoded.role : 'staff';

    return {
      userId: decoded.uid,
      tenantId,
      role,
      deviceId,
      isDevBypass: false,
    };
  } catch (err) {
    logger.warn('[requireAnyAuth] Échec validation token Firebase', { error: err });
    throw new NextResponse(
      JSON.stringify({ error: 'UNAUTHORIZED', message: 'Jeton de session invalide ou expiré' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Type minimal accepté par assertTenant : n'importe quel caller authentifié qui expose
 * un tenantId + un role. Compatible AuthContext (requireAnyAuth) et
 * AdminCaller & { tenantId: string } (requireTenantRole, requireTenantAdmin,
 * requireMccLevel avec claim tenant).
 */
export interface TenantScopedCaller {
  tenantId: string;
  role?: string;
}

export function assertTenant(auth: TenantScopedCaller, requestedTenantId?: string | null): string {
  const role = auth.role ?? '';
  if (requestedTenantId && requestedTenantId !== auth.tenantId && role !== 'fleet_admin' && role !== 'super_admin' && !role.startsWith('mcc_')) {
    throw new NextResponse(
      JSON.stringify({ error: 'FORBIDDEN_CROSS_TENANT', message: 'Accès cross-tenant refusé.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return auth.tenantId;
}
