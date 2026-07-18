import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/finance/bank/webview
 * Returns the Powens webview URL for bank connection.
 * The client passes its own origin as a query param so the redirect_uri is correct.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const origin = searchParams.get('origin') ?? '';

        const clientId = process.env.NEXT_PUBLIC_POWENS_CLIENT_ID ?? 'restaurant-os-master';
        const isDemoMode = !clientId || clientId.includes('placeholder') || clientId === 'restaurant-os-master';

        // Generate a temporary token (server-side safe version — no Math.random for security)
        const tokenBytes = new Uint32Array(4);
        crypto.getRandomValues(tokenBytes);
        const tempToken = Array.from(tokenBytes)
            .map(b => b.toString(16).padStart(8, '0'))
            .join('');

        const redirectUri = origin ? encodeURIComponent(`${origin}/finance`) : '';
        const baseUrl = isDemoMode
            ? 'https://restaurant-os-sandbox.biapi.pro/2.0/manage/connect'
            : 'https://sandbox.biapi.pro/2.0/manage/connect';

        const url = `${baseUrl}?client_id=${clientId}&token=${tempToken}${redirectUri ? `&redirect_uri=${redirectUri}` : ''}`;

        return NextResponse.json({ url, isDemoMode });
    } catch (_err) {
        return NextResponse.json({ error: 'Impossible de générer le lien bancaire.' }, { status: 500 });
    }
}
