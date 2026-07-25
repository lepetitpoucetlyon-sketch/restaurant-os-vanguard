import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { OpenBankingProviderFactory } from '@/modules/finance/banking/openBanking';
import { signBankConnectState } from '@/modules/finance/banking/openBanking/tokenCipher';

/**
 * GET /api/finance/bank/webview
 * Retourne l'URL de connexion bancaire (webview de l'agrégateur configuré pour le tenant).
 * Auth : admin/manager du tenant (ou fleet_admin). Le tenant vient toujours du token.
 * Le redirect_uri est dérivé de l'origine réelle de la requête — jamais d'un paramètre client.
 */
export async function GET(request: NextRequest) {
    try {
        const caller = await requireTenantAdmin(request);
        if (isDenied(caller)) return caller;
        const { tenantId } = caller;

        // Respecte OPEN_BANKING_DEFAULT_PROVIDER ou la préférence tenant via tenantConfig.openBankingProvider
        const tenantConfig = await (await import('@/lib/nexus/NexusAdapter')).Nexus.adapter.get(
            `tenants/${tenantId}/tenantConfig`
        ) as { openBankingProvider?: string } | null;
        const provider = OpenBankingProviderFactory.get(tenantConfig?.openBankingProvider);
        const { token } = await provider.createConnectionToken(tenantId);
        const redirectUri = `${request.nextUrl.origin}/api/finance/bank/callback`;
        const state = signBankConnectState(tenantId);
        const url = await provider.getConnectionUrl(token, redirectUri, state);

        return NextResponse.json({ url, isDemoMode: provider.isDemoMode() });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Impossible de générer le lien bancaire.' },
            { status: 500 }
        );
    }
}
