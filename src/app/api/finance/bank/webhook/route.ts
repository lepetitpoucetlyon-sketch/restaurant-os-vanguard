import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { logger } from '@/lib/axiom';

/**
 * POST /api/finance/bank/webhook
 * Reçoit les notifications de synchronisation de l'agrégateur bancaire
 * (ex: `connection.synced` chez Powens) et vérifie la signature HMAC avant
 * de traiter quoi que ce soit — jamais de confiance dans le payload brut.
 *
 * ⚠️ Le header de signature exact (`x-powens-signature` ou équivalent) et le
 * format du payload dépendent du fournisseur configuré — à revérifier contre
 * la doc de l'agrégateur en vigueur avant activation en prod.
 */
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
    if (!signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
}

export async function POST(request: NextRequest) {
    const secret = process.env.BANKING_WEBHOOK_SECRET;
    if (!secret) {
        logger.error('bank/webhook: BANKING_WEBHOOK_SECRET manquant — webhook désactivé.');
        return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 503 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-powens-signature') ?? request.headers.get('x-webhook-signature');

    if (!verifySignature(rawBody, signature, secret)) {
        logger.warn('bank/webhook: signature invalide, requête rejetée.');
        return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
    }

    let payload: { tenant_id?: string; event?: string };
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
    }

    if (payload.event === 'connection.synced' && payload.tenant_id) {
        logger.info('bank/webhook: connection.synced reçu — déclenchement sync', { tenantId: payload.tenant_id });
        // Déclenchement serveur-à-serveur de la sync bancaire (fin-7)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
        fetch(`${appUrl}/api/finance/bank/sync`, {
            method: 'POST',
            headers: {
                'Content-Type':   'application/json',
                'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
                'x-tenant-id':    payload.tenant_id,
            },
        }).catch(err => logger.error('bank/webhook: sync trigger failed', { err: String(err) }));
    }

    return NextResponse.json({ received: true });
}
