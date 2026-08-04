import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { GoCardlessProvider } from '@/verticals/restaurant/finance/cash/banking/openBanking/GoCardlessProvider';
import { inferPCGAccount } from '@/verticals/restaurant/finance/cash/banking/openBanking/pcgHeuristics';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';

/**
 * GET /api/finance/bank/test-demo
 * Valide la chaîne GoCardlessProvider → PCG heuristics → signature
 * en mode démo (aucune credential GoCardless, aucun Nexus requis).
 * Réservé aux opérateurs MCC (mcc_support minimum).
 */
export async function GET(request: NextRequest) {
    const caller = await requireMccLevel(request, 'mcc_support');
    if (isDenied(caller)) return caller;

    const provider = new GoCardlessProvider();

    if (!provider.isDemoMode()) {
        return NextResponse.json({
            error: 'Cet endpoint ne fonctionne qu\'en mode démo (GOCARDLESS_SECRET_ID non défini).',
        }, { status: 400 });
    }

    const accounts = await provider.getAccounts('demo-token');
    const results = [];

    for (const account of accounts) {
        const transactions = await provider.getTransactions(account.id, 'demo-token');
        const enriched = transactions.map(tx => ({
            date:             tx.date,
            label:            tx.label,
            type:             tx.type,
            amountInCents:    tx.amountInCents,
            amountInEuros:    (tx.amountInCents / 100).toFixed(2),
            amountInMicrounits: tx.amountInCents * 10_000,
            pcg:              inferPCGAccount(tx.label),
            signature:        tx.signature,
        }));

        results.push({
            account: {
                id:       account.id,
                label:    account.label,
                bankName: account.bankName,
                balance:  account.balance,
                currency: account.currency,
            },
            transactions: enriched,
            totals: {
                credits: enriched.filter(t => t.type === 'credit').reduce((s, t) => s + t.amountInCents, 0) / 100,
                debits:  enriched.filter(t => t.type === 'debit').reduce((s, t) => s + t.amountInCents, 0) / 100,
            },
        });
    }

    return NextResponse.json({
        isDemoMode: true,
        provider:   provider.id,
        accounts:   results,
    });
}
