import { NextRequest, NextResponse } from 'next/server';
import { OpenBankingProviderFactory, BankConnectionStore, verifyBankConnectState } from '@/modules/finance/banking/openBanking';

/**
 * GET /api/finance/bank/callback
 * Point de retour de la webview de connexion bancaire (navigation top-level, pas de Bearer token).
 * Le tenant est authentifié via le `state` signé émis par /webview — jamais un paramètre client brut.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    // 'code' = Powens/Tink, 'ref' = GoCardless
    const code = searchParams.get('code') ?? searchParams.get('ref');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.redirect(new URL('/finance?bank_connect=missing_params', request.url));
    }

    try {
        const tenantId = verifyBankConnectState(state);
        const provider = OpenBankingProviderFactory.get();
        const { userToken } = await provider.exchangeCode(code);
        await BankConnectionStore.saveUserToken(tenantId, provider.id, userToken);
        return NextResponse.redirect(new URL('/finance?bank_connect=success', request.url));
    } catch {
        return NextResponse.redirect(new URL('/finance?bank_connect=error', request.url));
    }
}
