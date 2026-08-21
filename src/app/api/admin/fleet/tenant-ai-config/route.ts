/**
 * Tenant AI Config — édition MCC de la configuration IA d'un tenant.
 *
 * GET  /api/admin/fleet/tenant-ai-config?tenantId=xxx
 *   Retourne tenantConfig.aiSettings actuel.
 *
 * POST /api/admin/fleet/tenant-ai-config
 *   Body: { tenantId: string, aiSettings: AISettings }
 *   Merge-patche tenants/{tid}/tenantConfig.aiSettings et invalide le cache TenantAIRegistry.
 *
 * RBAC : mcc_super_admin.
 * ADR-008 — isolation IA par tenant.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { logger } from '@/lib/logger';
import { AISettingsSchema } from '@/modules/system';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

    const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as {
        aiSettings?: unknown;
        ai?: unknown;
        variant?: string;
    } | null;

    return NextResponse.json({
        tenantId,
        variant: config?.variant ?? null,
        aiSettings: config?.aiSettings ?? null,
        legacyAi: config?.ai ?? null,
    });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_super_admin');
    if (isDenied(caller)) return caller as NextResponse;

    let raw: unknown;
    try {
        raw = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = raw as { tenantId?: string; aiSettings?: unknown };
    if (!body.tenantId || typeof body.tenantId !== 'string') {
        return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const parsed = AISettingsSchema.safeParse(body.aiSettings);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'AISettings invalide', details: parsed.error.issues },
            { status: 400 },
        );
    }

    const { tenantId } = body;
    const aiSettings = parsed.data;

    const current = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as {
        aiSettings?: unknown;
    } | null;
    const before = current?.aiSettings ?? null;

    await Nexus.adapter.set(
        `tenants/${tenantId}/tenantConfig`,
        { aiSettings },
        { merge: true },
    );

    // Invalider le cache du registre pour ce tenant (nouvelle config prend effet immédiatement)
    try {
        const { TenantAIRegistry } = await import('@/kernel/ai/tenant');
        TenantAIRegistry.invalidate(tenantId);
    } catch (err) {
        logger.warn('[TenantAIConfig] Cache invalidation failed', { err: err instanceof Error ? err.message : String(err) });
    }

    await ChangelogService.record({
        tenantId,
        action: 'AI_SETTINGS_UPDATED',
        key: 'aiSettings',
        before,
        after: aiSettings,
        description: `AI settings mis à jour par ${caller.uid} (mode=${aiSettings.mode})`,
        appliedBy: caller.uid,
        scope: 'tenant',
    });

    logger.info(`[TenantAIConfig] AI settings mis à jour pour ${tenantId} par ${caller.uid} (mode=${aiSettings.mode})`);
    return NextResponse.json({ success: true, tenantId, aiSettings });
}
