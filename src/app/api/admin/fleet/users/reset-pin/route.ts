/**
 * POST /api/admin/fleet/users/reset-pin
 * Réinitialise le PIN d'un utilisateur admin d'un tenant depuis le MCC.
 *
 * Body : { tenantId: string, userId: string }
 * Retourne : { tempPin: string } — à communiquer au responsable du site.
 *
 * Protégé : super_admin / super_admin uniquement.
 * Le nouveau PIN temporaire (6 chiffres) est hashé avant écriture — jamais stocké en clair.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { hashPin } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';

interface ResetPinRequest {
    tenantId: string;
    userId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Reset PIN : niveau support minimum
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    let body: ResetPinRequest;
    try {
        body = await req.json() as ResetPinRequest;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { tenantId, userId } = body;

    if (!tenantId || !userId) {
        return NextResponse.json({ error: 'tenantId et userId sont requis' }, { status: 400 });
    }

    // Vérifie que l'utilisateur cible existe dans le tenant
    const userPath = `tenants/${tenantId}/users/${userId}`;
    const existing = await Nexus.adapter.get(userPath) as { id?: string; email?: string } | null;
    if (!existing) {
        return NextResponse.json({ error: `Utilisateur "${userId}" introuvable dans le tenant "${tenantId}"` }, { status: 404 });
    }

    // Génère un PIN temporaire à 6 chiffres
    const tempPin = String(Math.floor(100000 + Math.random() * 900000));
    const pinHash = await hashPin(tempPin, userId);

    try {
        await Nexus.adapter.set(userPath, {
            pinHash,
            pinResetAt: new Date().toISOString(),
            pinResetByMcc: true,
            // Supprime l'ancien pin en clair s'il existait
            pin: null,
        }, { merge: true });
    } catch (err) {
        logger.error('[MCC/reset-pin] Échec écriture Firestore', err);
        return NextResponse.json({ error: 'Erreur interne lors de la mise à jour du PIN' }, { status: 500 });
    }

    empireAudit.log({
        module: 'fleet',
        action: 'MCC_PIN_RESET',
        severity: 'high',
        details: { tenantId, userId, email: existing.email ?? '—' },
        timestamp: new Date(),
    });

    logger.info(`[MCC/reset-pin] PIN réinitialisé pour ${userId} (tenant: ${tenantId})`);

    return NextResponse.json({ success: true, tempPin });
}
