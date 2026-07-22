import 'server-only';
import { NextResponse } from 'next/server';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

interface StoredDevice {
    fingerprint: string;
    role: string;
    status: 'active' | 'revoked';
    deviceId: string;
}

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

/**
 * RBAC MCC Interne — trois niveaux d'accès opérateurs.
 *
 * mcc_junior_dev  : lecture seule (telemetry, status). Aucune action destructive.
 * mcc_support     : +reset PIN, demande/status support access, réindexation RAG.
 * fleet_admin     : accès complet (y compris rôles, commandes, révocation).
 * SUPER_ADMIN     : alias historique fleet_admin.
 */
export type MccRole = 'mcc_junior_dev' | 'mcc_support' | 'fleet_admin' | 'SUPER_ADMIN';

const MCC_ROLE_HIERARCHY: Record<MccRole, number> = {
    mcc_junior_dev: 1,
    mcc_support: 2,
    fleet_admin: 3,
    SUPER_ADMIN: 3,
};

/**
 * Vérifie qu'un opérateur MCC a le niveau minimum requis.
 * Usage : `const caller = await requireMccLevel(req, 'mcc_support'); if (isDenied(caller)) return caller;`
 */
export async function requireMccLevel(
    request: Request,
    minLevel: MccRole,
): Promise<AdminCaller | NextResponse> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return hiddenDoor();

    try {
        initFirebaseAdmin();
        const decoded = await getAuth().verifyIdToken(authHeader.slice('Bearer '.length));
        const role = typeof decoded.role === 'string' ? decoded.role : '';
        const tenantId = typeof decoded.tenantId === 'string' ? decoded.tenantId
            : typeof decoded.clientId === 'string' ? decoded.clientId : undefined;

        const callerLevel = MCC_ROLE_HIERARCHY[role as MccRole] ?? 0;
        const requiredLevel = MCC_ROLE_HIERARCHY[minLevel];

        if (callerLevel < requiredLevel) {
            logger.warn(`[adminAuth] MCC RBAC denied: uid=${decoded.uid} role=${role} needed=${minLevel}`);
            return hiddenDoor();
        }

        // MFA obligatoire pour les fleet_admin (mcc-core-3).
        const isFleetAdmin = callerLevel >= MCC_ROLE_HIERARCHY['fleet_admin'];
        if (isFleetAdmin) {
            const mfaDenied = await checkFleetAdminMFA(decoded.uid, decoded);
            if (mfaDenied) return mfaDenied;
        }

        // Vérification Trusted Device Registry pour les opérateurs non-fleet-admin.
        // fleet_admin/SUPER_ADMIN sont exemptés (ils gèrent le registre).
        if (!isFleetAdmin) {
            const fp = request.headers.get('x-mcc-device-fp');
            if (fp) {
                const denied = await checkDeviceFingerprintInternal(fp, role as MccRole);
                if (denied) {
                    logger.warn(`[adminAuth] Device fingerprint non reconnu ou révoqué: uid=${decoded.uid} fp=${fp.slice(0, 8)}…`);
                    return hiddenDoor();
                }
            } else {
                // Pas de fingerprint — on laisse passer avec un avertissement (migration progressive).
                logger.warn(`[adminAuth] x-mcc-device-fp absent pour uid=${decoded.uid} role=${role} — Device Registry non encore appliqué`);
            }
        }

        return { uid: decoded.uid, role, tenantId };
    } catch (err) {
        logger.warn('[adminAuth] Token verification failed', String(err));
        return hiddenDoor();
    }
}

/**
 * Vérifie qu'un fingerprint est dans le Trusted Device Registry avec un rôle suffisant.
 * Retourne true si le device doit être refusé, false sinon.
 */
async function checkDeviceFingerprintInternal(fingerprint: string, callerRole: MccRole): Promise<boolean> {
    try {
        const devices = await Nexus.adapter.query<StoredDevice>('mcc/trustedDevices');
        const device = devices.find(d => d.fingerprint === fingerprint && d.status === 'active');
        if (!device) return true; // Pas trouvé → refus
        // Le rôle enregistré doit être >= au rôle du caller (pas de dépassement)
        const deviceLevel = MCC_ROLE_HIERARCHY[device.role as MccRole] ?? 0;
        const callerLevel = MCC_ROLE_HIERARCHY[callerRole] ?? 0;
        return deviceLevel < callerLevel; // refus si appareil a moins de droits que demandé
    } catch {
        // En cas d'erreur Firestore, on laisse passer (fail-open en dev, alerter en prod)
        logger.warn('[adminAuth] checkDeviceFingerprint: impossible de lire mcc/trustedDevices');
        return false;
    }
}

function hiddenDoor(): NextResponse {
    return new NextResponse(null, { status: 404 });
}

function mfaError(code: 'MFA_ENROLLMENT_REQUIRED' | 'MFA_REAUTHENTICATION_REQUIRED' | 'MFA_CHECK_FAILED'): NextResponse {
    return new NextResponse(JSON.stringify({ code }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Vérifie que le fleet_admin a bien activé et utilisé le MFA lors de cette session.
 * Retourne une NextResponse 403 si le check échoue, null si tout est OK.
 *
 * Deux scénarios distincts :
 * - MFA_ENROLLMENT_REQUIRED : le compte n'a aucun facteur 2FA enrollé → l'UI doit proposer l'enrollment.
 * - MFA_REAUTHENTICATION_REQUIRED : le MFA est enrollé mais n'a pas été utilisé pour cette session
 *   (session dérobée ou connexion avec mot de passe seul) → l'UI doit redemander l'authentification.
 */
async function checkFleetAdminMFA(
    uid: string,
    decoded: DecodedIdToken,
): Promise<NextResponse | null> {
    try {
        const userRecord = await getAuth().getUser(uid);
        const enrolled = (userRecord.multiFactor?.enrolledFactors?.length ?? 0) > 0;
        if (!enrolled) {
            logger.warn(`[adminAuth] MFA non enrollé pour fleet_admin uid=${uid}`);
            return mfaError('MFA_ENROLLMENT_REQUIRED');
        }
        const usedMFA = !!decoded.firebase?.sign_in_second_factor;
        if (!usedMFA) {
            logger.warn(`[adminAuth] MFA enrollé mais non utilisé cette session uid=${uid}`);
            return mfaError('MFA_REAUTHENTICATION_REQUIRED');
        }
        return null;
    } catch (err) {
        logger.warn('[adminAuth] Erreur lors du check MFA', String(err));
        return mfaError('MFA_CHECK_FAILED');
    }
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
 * ou une NextResponse 404/403 à renvoyer telle quelle.
 *
 * En plus du rôle, enforce le MFA (mcc-core-3) :
 * - 403 { code: 'MFA_ENROLLMENT_REQUIRED' }       → compte sans 2FA
 * - 403 { code: 'MFA_REAUTHENTICATION_REQUIRED' } → session sans 2FA
 */
export async function requireFleetAdmin(request: Request): Promise<AdminCaller | NextResponse> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return hiddenDoor();

    try {
        initFirebaseAdmin();
        const decoded = await getAuth().verifyIdToken(authHeader.slice('Bearer '.length));
        const role = typeof decoded.role === 'string' ? decoded.role : '';
        if (!(FLEET_ROLES as readonly string[]).includes(role)) return hiddenDoor();

        const mfaDenied = await checkFleetAdminMFA(decoded.uid, decoded);
        if (mfaDenied) return mfaDenied;

        const tenantId = typeof decoded.tenantId === 'string' ? decoded.tenantId
            : typeof decoded.clientId === 'string' ? decoded.clientId : undefined;
        return { uid: decoded.uid, role, tenantId };
    } catch (err) {
        logger.warn('[adminAuth] Token verification failed', String(err));
        return hiddenDoor();
    }
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
  // x-resolved-tenant-id is injected by middleware from the request hostname (subdomain routing).
  const hostTenant = request.headers.get('x-resolved-tenant-id') ?? undefined;
  const tenantId = isFleet
    ? (headerTenant ?? caller.tenantId ?? hostTenant)
    : (caller.tenantId ?? hostTenant);

  if (!tenantId) return hiddenDoor();
  if (!isFleet && headerTenant && headerTenant !== tenantId) {
    logger.warn(`[adminAuth] Cross-tenant attempt blocked: uid=${caller.uid} claims=${tenantId} header=${headerTenant}`);
    return hiddenDoor();
  }
  return { ...caller, tenantId };
}

/**
 * Exige un utilisateur authentifié du tenant (n'importe quel rôle).
 * Utilisé pour les endpoints accessibles à tous les employés (oracle, RAG).
 * Le contrôle granulaire est délégué au Sovereign RAG (veto membrane par rôle).
 */
export async function requireTenantUser(
  request: Request,
): Promise<(AdminCaller & { tenantId: string }) | NextResponse> {
  const caller = await verifyCaller(request);
  if (!caller || !caller.role) return hiddenDoor();

  const isFleet = (FLEET_ROLES as readonly string[]).includes(caller.role);
  const hostTenant = request.headers.get('x-resolved-tenant-id') ?? undefined;
  const tenantId = isFleet
    ? (request.headers.get('x-nexus-tenant-id') ?? caller.tenantId ?? hostTenant)
    : (caller.tenantId ?? hostTenant);

  if (!tenantId) return hiddenDoor();
  return { ...caller, tenantId };
}

/** Type guard pratique côté route. */
export function isDenied(result: AdminCaller | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
