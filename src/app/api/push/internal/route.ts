/**
 * POST /api/push/internal
 * Route interne pour les handlers NexusEventBus (navigateur → serveur push).
 * Auth par cookie de session.
 *
 * Correctif N0-4 — la garde était `requireTenantAdmin` (rôles ≥ 70 uniquement).
 * Conséquence : un serveur (40), un chef (45) ou un barman (35) qui déclenchait
 * une alerte (rupture, frigo…) recevait un 403 avalé par browserPush, et
 * l'alerte n'atteignait le manager que si le manager l'avait lui-même provoquée.
 *
 * Désormais : tout membre authentifié du tenant peut déclencher un push, MAIS
 * strictement dans son propre tenant — `assertTenant` refuse toute cible
 * cross-tenant. La livraison reste bornée au tenant du caller (WebPushService
 * est scopé tenant), et le contenu est limité à un titre + un corps.
 *
 * NB : le modèle cible (dispatch à identité système via AlertBus + ServerEventBus)
 * relève des lots ultérieurs ; ce correctif débloque les 8 rôles sur 11 sans
 * ouvrir de brèche cross-tenant.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAnyAuth, assertTenant } from '@/lib/server/requireAnyAuth';
import { WebPushService } from '@/lib/push/webPushService';
import { normalizeRbacRole } from '@/kernel/contracts/rbac';
import { z } from 'zod';

const Schema = z.object({
    tenantId: z.string().min(1),
    role:     z.string().optional(),
    userId:   z.string().optional(),
    title:    z.string().min(1).max(200),
    body:     z.string().min(1).max(500),
    url:      z.string().optional(),
}).refine(d => d.role !== undefined || d.userId !== undefined, {
    message: 'role ou userId requis',
});

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Authentification : tout membre du tenant (plus seulement les rôles ≥ 70).
    let auth;
    try {
        auth = await requireAnyAuth(req);
    } catch (e) {
        if (e instanceof NextResponse) return e;
        throw e;
    }

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { tenantId: requestedTenantId, role, userId, title, body, url } = parsed.data;

    // Isolation stricte : la cible doit être le tenant du caller.
    let tenantId: string;
    try {
        tenantId = assertTenant(auth, requestedTenantId);
    } catch (e) {
        if (e instanceof NextResponse) return e;
        throw e;
    }

    const payload = { title, body, url };

    if (userId) {
        await WebPushService.sendToUser(tenantId, userId, payload);
    } else if (role) {
        // Défense en profondeur : rôle canonique (le dispatcher normalise déjà en amont).
        const canonical = normalizeRbacRole(role) ?? normalizeRbacRole(role.toLowerCase()) ?? role;
        await WebPushService.sendToRole(tenantId, canonical, payload);
    }

    return NextResponse.json({ sent: true });
}
