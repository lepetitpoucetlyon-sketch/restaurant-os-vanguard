/**
 * POST /api/tenant/onboarding/connector/test
 * Body: { provider: ConnectorId, credentials: ConnectorCredentials }
 * → Teste la connexion au concurrent. Retourne ok + accountInfo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import { ConnectorRegistry } from '@/modules/onboarding/migration/connectors/ConnectorRegistry';
import type { ConnectorId, ConnectorCredentials } from '@/modules/onboarding/migration/connectors/types';

export async function POST(req: NextRequest) {
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    try {
        const { provider, credentials } = await req.json() as {
            provider: ConnectorId;
            credentials: ConnectorCredentials;
        };

        if (!provider || !credentials) {
            return NextResponse.json({ error: 'provider et credentials sont requis' }, { status: 400 });
        }

        const connector = ConnectorRegistry.get(provider);
        logger.info('[onboarding/connector/test]', { tenantId: caller.tenantId, provider });

        const result = await connector.testConnection(credentials);
        return NextResponse.json(result);
    } catch (err) {
        logger.error('[onboarding/connector/test]', err);
        return NextResponse.json({ ok: false, error: String(err) });
    }
}
