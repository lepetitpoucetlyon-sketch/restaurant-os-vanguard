import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { DEFAULT_ONBOARDING_STATE } from '@/shared/nexus/contracts/onboarding.types';
import type { OnboardingState } from '@/shared/nexus/contracts/onboarding.types';

export async function GET(req: NextRequest) {
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    try {
        const config = await Nexus.adapter.get<{ onboarding?: OnboardingState }>(
            `tenants/${caller.tenantId}/tenantConfig`,
        );
        const onboarding = config?.onboarding ?? DEFAULT_ONBOARDING_STATE;

        // Vérification live des readyChecks
        const [tables, products] = await Promise.all([
            Nexus.adapter.query(`tenants/${caller.tenantId}/ops_nodes`).then(r => r.length > 0),
            Nexus.adapter.query(`tenants/${caller.tenantId}/products`).then(r => r.length > 0),
        ]);

        const readyChecks = {
            ...onboarding.readyChecks,
            hasTable:   tables,
            hasProduct: products,
        };
        const readyToOpen = Object.values(readyChecks).every(Boolean);

        return NextResponse.json({ ...onboarding, readyChecks, readyToOpen });
    } catch (err) {
        logger.error('[onboarding/status GET]', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    try {
        const patch = await req.json() as Partial<OnboardingState>;

        await Nexus.adapter.set(
            `tenants/${caller.tenantId}/tenantConfig`,
            { onboarding: patch },
            { merge: true },
        );

        logger.info('[onboarding/status] Mis à jour', { tenantId: caller.tenantId, patch: JSON.stringify(patch) });
        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('[onboarding/status POST]', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
