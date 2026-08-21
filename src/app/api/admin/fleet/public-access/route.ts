/**
 * Public Access Toggle — MCC kill-switch pour landing / signup public.
 *
 * GET  /api/admin/fleet/public-access
 *   Retourne la config actuelle. Route PUBLIQUE (les pages publiques
 *   fetchent ceci pour décider quoi afficher) — aucune donnée sensible.
 *
 * POST /api/admin/fleet/public-access
 *   Body: PublicAccessConfig partiel
 *   RBAC : mcc_super_admin
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { logger } from '@/lib/logger';
import {
    PublicAccessConfigSchema,
    DEFAULT_PUBLIC_ACCESS,
    PUBLIC_ACCESS_CONFIG_PATH,
    getPublicAccessConfig,
    invalidatePublicAccessCache,
    type PublicAccessConfig,
} from '@/lib/mcc/PublicAccessConfig';

export async function GET(): Promise<NextResponse> {
    const config = await getPublicAccessConfig();
    return NextResponse.json({ config });
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

    // Merge avec la config existante pour permettre les patches partiels
    const current = await getPublicAccessConfig();
    const merged = { ...current, ...(raw as Partial<PublicAccessConfig>) };
    const parsed = PublicAccessConfigSchema.safeParse(merged);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Config invalide', details: parsed.error.issues },
            { status: 400 },
        );
    }

    const next: PublicAccessConfig = {
        ...parsed.data,
        updatedAt: new Date().toISOString(),
        updatedBy: caller.uid,
    };

    await Nexus.adapter.set(PUBLIC_ACCESS_CONFIG_PATH, next);
    invalidatePublicAccessCache();

    await ChangelogService.record({
        tenantId: '__mcc__',
        action: 'PUBLIC_ACCESS_UPDATED',
        key: 'mcc.publicAccess',
        before: current,
        after: next,
        description: `Landing=${next.landingEnabled} Signup=${next.signupEnabled}`,
        appliedBy: caller.uid,
        scope: 'fleet',
    });

    logger.info(
        `[PublicAccess] Config mise à jour par ${caller.uid} — landing=${next.landingEnabled} signup=${next.signupEnabled}`,
    );

    return NextResponse.json({ success: true, config: next });
}

// Fallback pour tests
export const _DEFAULT = DEFAULT_PUBLIC_ACCESS;
