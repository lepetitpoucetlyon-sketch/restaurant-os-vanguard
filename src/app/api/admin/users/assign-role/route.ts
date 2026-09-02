/**
 * POST /api/admin/users/assign-role
 * Assigne un rôle (standard ou custom) à un utilisateur du tenant.
 *
 * Protégé : requireTenantAdmin — le tenant est extrait du token,
 * impossible d'assigner un rôle dans un autre tenant.
 *
 * Body : { userId: string; role: string }
 *
 * Étapes :
 *  1. Valider le rôle contre ROLE_LABELS (standards) + customRoles du tenant (Nexus)
 *  2. Écrire via Nexus.adapter (DB-agnostique)
 *  3. Mettre à jour les Custom Claims Firebase Auth (best-effort, non-bloquant)
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { ROLE_LABELS } from '@/lib/AccessPolicyManager';
import { normalizeRbacRole, resolveRoleLevel } from '@/kernel/contracts/rbac';
import { toError } from "@/lib/toError";

const ROLE_PERMISSIONS_PATH = (tenantId: string) =>
    `tenants/${tenantId}/systemConfig/role_permissions`;

interface CustomRole { id: string; label: string }

interface AssignRoleBody {
    userId: string;
    role: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    let body: AssignRoleBody;
    try {
        body = await req.json() as AssignRoleBody;
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const { userId, role: rawRole } = body;
    const { tenantId } = caller;

    if (!userId || !rawRole) {
        return NextResponse.json({ error: 'userId et role sont requis' }, { status: 400 });
    }

    // Normalisation canonique du rôle (traduction auto des alias legacy)
    const normalized = normalizeRbacRole(rawRole);
    const role = normalized || rawRole;

    // ── Validation du rôle ────────────────────────────────────────────────────
    const isStandardRole = !!normalized || Object.keys(ROLE_LABELS).includes(role);
    let isCustomRole = false;

    if (!isStandardRole) {
        // Vérifier dans les rôles custom persistés dans Nexus (DB-agnostique)
        const permsDoc = await Nexus.adapter.get(ROLE_PERMISSIONS_PATH(tenantId)) as {
            customRoles?: CustomRole[];
        } | null;
        const customRoles: CustomRole[] = permsDoc?.customRoles ?? [];
        isCustomRole = customRoles.some(r => r.id === role);

        if (!isCustomRole) {
            return NextResponse.json({
                error: `Rôle "${role}" invalide — non trouvé dans les rôles standards ni dans les rôles custom du tenant.`,
            }, { status: 400 });
        }
    }

    // ── Lecture utilisateur via Nexus ─────────────────────────────────────────
    const userPath = `tenants/${tenantId}/users/${userId}`;
    const existing = await Nexus.adapter.get(userPath) as {
        id?: string;
        email?: string;
        role?: string;
        firebaseUid?: string;
    } | null;

    if (!existing) {
        return NextResponse.json({
            error: `Utilisateur "${userId}" introuvable dans le tenant "${tenantId}"`,
        }, { status: 404 });
    }

    const previousRole = existing.role ?? '—';

    // ── Contrôle Anti-Élévation de Privilèges (Loi 12) ─────────────────────────
    // Règle d'or : un utilisateur ne peut pas attribuer un rôle supérieur ou égal
    // à son propre niveau, ni modifier un utilisateur de rang supérieur ou égal au sien.
    const callerLevel = resolveRoleLevel(caller.role) ?? 0;
    const targetRoleLevel = resolveRoleLevel(role) ?? 0;
    const targetCurrentRoleLevel = existing.role ? (resolveRoleLevel(existing.role) ?? 0) : 0;

    if (caller.role !== 'admin' && caller.role !== 'mcc_super_admin') {
        if (targetRoleLevel >= callerLevel) {
            return NextResponse.json({
                error: `Action non autorisée : votre niveau hiérarchique (${caller.role}: ${callerLevel}) ne vous permet pas d'attribuer un rôle de niveau ${targetRoleLevel} (${role}).`,
            }, { status: 403 });
        }
        if (targetCurrentRoleLevel >= callerLevel) {
            return NextResponse.json({
                error: `Action non autorisée : votre niveau hiérarchique (${caller.role}: ${callerLevel}) ne vous permet pas de modifier un utilisateur de rang supérieur ou égal (${existing.role}: ${targetCurrentRoleLevel}).`,
            }, { status: 403 });
        }
    }

    // ── Écriture Nexus (DB-agnostique) ────────────────────────────────────────
    await Nexus.adapter.set(userPath, {
        role,
        roleUpdatedAt: new Date().toISOString(),
        roleUpdatedByAdmin: caller.uid,
    }, { merge: true });

    // ── Custom Claims Firebase Auth (best-effort, non-bloquant) ──────────────
    // Compatible avec le pattern DB-agnostique : on essaie si firebaseUid est
    // présent, on loggue et on continue sinon (Simulacra / adapters non-Firebase).
    if (existing.firebaseUid) {
        try {
            const { getServerAuthProvider } = await import('@/lib/auth/ServerAuthProvider');
            const authProvider = getServerAuthProvider();
            const existingUser = await authProvider.getUser(existing.firebaseUid);
            const currentClaims = existingUser?.customClaims ?? {};
            await authProvider.setCustomClaims(existing.firebaseUid, { ...currentClaims, role, tenantId });
            logger.info(`[assign-role] Claims auth mis à jour uid=${existing.firebaseUid} role=${role}`);
        } catch (err) {
            logger.warn(`[assign-role] Claims auth échouées (uid=${existing.firebaseUid}) — ${toError(err).message}`);
        }
    }

    logger.info(`[assign-role] ${userId} (${tenantId}) : ${previousRole} → ${role} par admin ${caller.uid}`);

    return NextResponse.json({
        success: true,
        userId,
        tenantId,
        previousRole,
        newRole: role,
        roleLabel: ROLE_LABELS[role] ?? role,
        isCustomRole,
    });
}
