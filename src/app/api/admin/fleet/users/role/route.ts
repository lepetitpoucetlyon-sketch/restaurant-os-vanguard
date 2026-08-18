/**
 * POST /api/admin/fleet/users/role
 * Modifie le rôle d'un utilisateur tenant depuis le MCC.
 *
 * Body : { tenantId: string, userId: string, newRole: UserRole }
 *
 * Protégé : super_admin / super_admin uniquement.
 * Met à jour Firestore ET les Custom Claims Firebase Auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { getServerAuthProvider } from '@/lib/auth/ServerAuthProvider';
import { ROLE_LABELS } from '@/lib/AccessPolicyManager';
import { toError } from "@/lib/toError";

const VALID_ROLES = Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[];

interface RoleChangeRequest {
    tenantId: string;
    userId: string;
    newRole: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Changement de rôle : super_admin uniquement (niveau max)
    const caller = await requireMccLevel(req, 'mcc_super_admin');
    if (isDenied(caller)) return caller as NextResponse;

    let body: RoleChangeRequest;
    try {
        body = await req.json() as RoleChangeRequest;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { tenantId, userId, newRole } = body;

    if (!tenantId || !userId || !newRole) {
        return NextResponse.json({ error: 'tenantId, userId et newRole sont requis' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(newRole as keyof typeof ROLE_LABELS)) {
        return NextResponse.json({
            error: `Rôle "${newRole}" invalide. Rôles autorisés : ${VALID_ROLES.join(', ')}`,
        }, { status: 400 });
    }

    const userPath = `tenants/${tenantId}/users/${userId}`;
    const existing = await Nexus.adapter.get(userPath) as {
        id?: string;
        email?: string;
        role?: string;
        firebaseUid?: string;
    } | null;

    if (!existing) {
        return NextResponse.json({ error: `Utilisateur "${userId}" introuvable dans le tenant "${tenantId}"` }, { status: 404 });
    }

    const previousRole = existing.role ?? '—';

    // 1. Mise à jour Firestore
    await Nexus.adapter.set(userPath, {
        role: newRole,
        roleUpdatedAt: new Date().toISOString(),
        roleUpdatedByMcc: true,
    }, { merge: true });

    // 2. Mise à jour des Custom Claims (auth-provider agnostique)
    if (existing.firebaseUid) {
        try {
            const authProvider = getServerAuthProvider();
            const existingUser = await authProvider.getUser(existing.firebaseUid);
            const currentClaims = existingUser?.customClaims ?? {};
            await authProvider.setCustomClaims(existing.firebaseUid, { ...currentClaims, role: newRole });
            logger.info(`[MCC/role] Claims auth mis à jour pour uid=${existing.firebaseUid}`);
        } catch (err) {
            // Non-bloquant : les claims auth sont best-effort
            logger.warn(`[MCC/role] Mise à jour claims auth échouée (uid=${existing.firebaseUid}) — ${toError(err).message}`);
        }
    }

    empireAudit.log({
        module: 'fleet',
        action: 'USER_ROLE_CHANGED',
        severity: 'high',
        details: { tenantId, userId, email: existing.email ?? '', previousRole, newRole, changedBy: caller.uid } as Record<string, string>,
        timestamp: new Date(),
    });

    logger.info(`[MCC/role] Rôle modifié : ${userId} (${tenantId}) : ${previousRole} → ${newRole}`);

    return NextResponse.json({
        success: true,
        userId,
        tenantId,
        previousRole,
        newRole,
        roleLabel: ROLE_LABELS[newRole as keyof typeof ROLE_LABELS],
    });
}
