/**
 * POST /api/push/internal
 * Route interne pour les handlers NexusEventBus (navigateur → serveur push).
 * Auth par cookie de session (pas de X-Push-Secret nécessaire).
 * Body : { tenantId, role?, userId?, title, body, url? }
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { WebPushService } from '@/lib/push/webPushService';
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
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { tenantId, role, userId, title, body, url } = parsed.data;
    const payload = { title, body, url };

    if (userId) {
        await WebPushService.sendToUser(tenantId, userId, payload);
    } else if (role) {
        await WebPushService.sendToRole(tenantId, role, payload);
    }

    return NextResponse.json({ sent: true });
}
