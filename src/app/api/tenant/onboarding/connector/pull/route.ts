/**
 * POST /api/tenant/onboarding/connector/pull
 * Body: { provider: ConnectorId, category: ImportCategory, credentials: ConnectorCredentials }
 * → Pull les données depuis le concurrent et retourne un ParsedFile compatible.
 *
 * Note : les credentials ne sont JAMAIS persistés côté serveur ici.
 * Ils transitent uniquement en mémoire pour le pull.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import { ConnectorRegistry, runImporter } from '@/modules/commerce';
import type { ConnectorId, ConnectorCredentials, ImportCategory } from '@nexus/contracts';
import { toError } from "@/lib/toError";

export async function POST(req: NextRequest) {
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    try {
        const { provider, category, credentials, autoImport } = await req.json() as {
            provider:    ConnectorId;
            category:    ImportCategory;
            credentials: ConnectorCredentials;
            autoImport?: boolean;
        };

        if (!provider || !category || !credentials) {
            return NextResponse.json({ error: 'provider, category et credentials sont requis' }, { status: 400 });
        }

        logger.info('[onboarding/connector/pull]', { tenantId: caller.tenantId, provider, category });

        const connector = ConnectorRegistry.get(provider);
        const parsedFile = await connector.pull(category, credentials);

        // Mode preview (défaut) : retourne les données sans importer
        if (!autoImport) {
            return NextResponse.json({
                ok: true,
                preview: {
                    headers:  parsedFile.headers,
                    rowCount: parsedFile.rows.length,
                    sample:   parsedFile.rows.slice(0, 5),
                    source:   parsedFile.source,
                    warnings: parsedFile.warnings,
                },
            });
        }

        // Mode autoImport : injecte directement en DB
        const rawFile = new File(
            [JSON.stringify(parsedFile.rows)],
            `${provider}-${category}.json`,
            { type: 'application/json' },
        );

        const progress: number[] = [];
        const result = await runImporter(category, parsedFile, rawFile, p => progress.push(p));

        return NextResponse.json({ ok: true, result });
    } catch (err) {
        logger.error('[onboarding/connector/pull]', err);
        return NextResponse.json({ ok: false, error: toError(err).message }, { status: 500 });
    }
}
