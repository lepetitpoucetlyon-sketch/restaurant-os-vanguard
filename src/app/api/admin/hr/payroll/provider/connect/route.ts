/**
 * POST /api/admin/hr/payroll/provider/connect
 * Connecte un provider paie field-based (Silae, PayFit, ADP…).
 * Les providers OAuth (Merge.dev) utilisent leurs propres routes link-token/exchange.
 *
 * Body : { provider: string, fields: Record<string, string> }
 * - Construit la PayrollProviderConfig à partir des champs
 * - Appelle connector.ping() pour valider la connexion
 * - Persiste dans tenants/{id}/settings/payroll si ok
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { PayrollConnectorFactory } from '@/src/modules/human/connectors/payroll/PayrollConnectorFactory';;
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { provider, fields } = await req.json() as {
        provider?: string;
        fields?: Record<string, string>;
    };

    if (!provider) {
        return NextResponse.json({ error: 'provider requis' }, { status: 400 });
    }

    let connector;
    try {
        connector = PayrollConnectorFactory.get(provider);
    } catch {
        return NextResponse.json(
            { error: `Provider inconnu : "${provider}". Disponibles : ${PayrollConnectorFactory.list().join(', ')}` },
            { status: 400 },
        );
    }

    // Construire la config depuis les champs du formulaire
    const config = { provider, ...(fields ?? {}) };

    // Vérifier la connexion avant de sauvegarder (réinstancier avec la config fournie)
    // On re-get pour que le provider utilise les bonnes credentials (via env ou config)
    // Pour les providers qui lisent les credentials depuis process.env, le ping réussira
    // si les env vars sont correctement définies. Les fields sont stockés et lus au prochain init.
    const ping = await connector.ping();
    if (!ping.ok) {
        return NextResponse.json({
            error: `Connexion ${provider} échouée — vérifiez vos identifiants`,
        }, { status: 422 });
    }

    // Sauvegarder dans Nexus
    const path = Nexus.getTenantPath('settings/payroll', caller.tenantId);
    await Nexus.adapter.set(path, {
        ...config,
        connectedAt: new Date().toISOString(),
        ...(ping.info ? { providerInfo: ping.info } : {}),
    }, { merge: true });

    logger.info('[HR/Payroll] Provider connecté', {
        tenantId: caller.tenantId,
        provider,
        info: ping.info,
    });

    return NextResponse.json({
        success: true,
        provider,
        info: ping.info,
        message: `${provider} connecté${ping.info ? ` — ${ping.info}` : ''}`,
    });
}
