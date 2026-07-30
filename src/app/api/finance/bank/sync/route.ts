import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import {
    OpenBankingProviderFactory,
    BankConnectionStore,
    inferPCGAccount,
} from '@/modules/finance/banking/openBanking';
import { FiscalEngine } from '@/infrastructure/adapters/FiscalAdapter';
import { CryptoService } from '@domain/services/CryptoService';
import type { FiscalSeal } from '@nexus/contracts';

async function resolveTenantId(request: NextRequest): Promise<{ tenantId: string } | NextResponse> {
    const internalSecret   = request.headers.get('x-internal-secret');
    const internalTenantId = request.headers.get('x-tenant-id');
    if (internalSecret && internalTenantId) {
        const expectedSecret = process.env.INTERNAL_API_SECRET;
        if (!expectedSecret) return NextResponse.json({ error: 'INTERNAL_API_SECRET manquant.' }, { status: 503 });
        const secretBuf   = Buffer.from(internalSecret);
        const expectedBuf = Buffer.from(expectedSecret);
        if (secretBuf.length !== expectedBuf.length || !timingSafeEqual(secretBuf, expectedBuf)) {
            return NextResponse.json({ error: 'Secret interne invalide.' }, { status: 401 });
        }
        return { tenantId: internalTenantId };
    }
    const caller = await requireTenantAdmin(request);
    if (isDenied(caller)) return caller;
    return { tenantId: caller.tenantId };
}

/**
 * POST /api/finance/bank/sync
 * Déclenche une synchronisation bancaire pour le tenant authentifié.
 * Auth : admin/manager du tenant (ou fleet_admin) — le tenant vient du token.
 * Aucun secret global n'est utilisé pour rafraîchir un compte : uniquement
 * le jeton utilisateur propre à CE tenant, chargé depuis sa connexion persistée.
 */
export async function POST(request: NextRequest) {
    try {
        const resolved = await resolveTenantId(request);
        if (resolved instanceof NextResponse) return resolved;
        const { tenantId } = resolved;

        // Rate limiting : max 10 syncs/heure par tenant (manuel ou webhook)
        const rl = await getRateLimiter().check(`bank:sync:${tenantId}`, 10, 60 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Trop de synchronisations — réessayez dans 1h.' }, { status: 429 });
        }

        // Charger la connexion une seule fois — le provider est lu depuis connection.provider
        const connection = await BankConnectionStore.get(tenantId);
        const provider   = OpenBankingProviderFactory.get(connection?.provider);

        if (!provider.isDemoMode()) {
            if (!connection || connection.status !== 'active') {
                return NextResponse.json({ error: 'Aucune connexion bancaire active pour ce restaurant.' }, { status: 400 });
            }
            const userToken = BankConnectionStore.decryptToken(connection);
            await provider.refreshConnection(userToken);
        }

        const userToken = provider.isDemoMode() ? 'demo-user-token' : BankConnectionStore.decryptToken(connection!);
        const accounts = await provider.getAccounts(userToken);
        const fromDate = connection?.lastSyncAt
            ? connection.lastSyncAt.slice(0, 10)
            : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const existing = await Nexus.adapter.query<{ id: string; signature?: string }>(
            `tenants/${tenantId}/bankTransactions`
        );
        const knownSignatures = new Set(existing.map((e) => e.signature).filter(Boolean));

        const batch = Nexus.adapter.batch();
        let created = 0;

        // Charger le dernier seal pour chaîner les entrées (fin-6)
        const existingSeals = await Nexus.adapter.query<FiscalSeal>(
            `tenants/${tenantId}/fiscalSeals`
        );
        let lastSeal: FiscalSeal | undefined = existingSeals.sort(
            (a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
        )[0];

        for (const account of accounts) {
            const transactions = await provider.getTransactions(account.id, userToken, fromDate);
            for (const tx of transactions) {
                if (tx.signature && knownSignatures.has(tx.signature)) continue;
                const txId  = Nexus.adapter.generateId(`tenants/${tenantId}/bankTransactions`);
                const pcg   = inferPCGAccount(tx.label);

                // fin-6 : JournalEntry NF525
                const jeId = Nexus.adapter.generateId(`tenants/${tenantId}/journalEntries`);
                const journalEntry = {
                    id:              jeId,
                    date:            tx.date,
                    label:           tx.label,
                    amountInMicrounits: tx.amountInCents * 10_000,
                    type:            tx.type,
                    pcgAccount:      pcg?.account ?? '512',
                    pcgLabel:        pcg?.label ?? 'Banque',
                    source:          'bank_sync' as const,
                    bankTransactionId: txId,
                    createdAt:       new Date().toISOString(),
                };
                batch.set(`tenants/${tenantId}/journalEntries/${jeId}`, journalEntry);

                // fin-6 : scellement NF525
                const dataSnapshot = CryptoService.canonicalStringify(
                    journalEntry as unknown as import('@/shared/nexus-contract').SovereignData
                );
                const seal = await FiscalEngine.sealEntry(jeId, journalEntry as Record<string, string | number | boolean | null | undefined | object>, { lastSeal });
                batch.set(`tenants/${tenantId}/fiscalSeals/${seal.id}`, {
                    ...seal, dataSnapshot,
                });
                lastSeal = seal;

                batch.set(`tenants/${tenantId}/bankTransactions/${txId}`, {
                    id: txId,
                    ...tx,
                    accountId: account.id,
                    pcgAccount: pcg?.account,
                    pcgLabel: pcg?.label,
                    journalEntryId: jeId,
                    importedAt: Date.now(),
                    source: provider.id,
                });
                created++;
            }
        }

        await batch.commit();
        if (!provider.isDemoMode()) {
            await BankConnectionStore.markSynced(tenantId);
        }

        return NextResponse.json({
            success: true,
            isDemoMode: provider.isDemoMode(),
            synced: created,
            syncedAt: new Date().toISOString(),
        });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur interne lors de la synchronisation.' },
            { status: 500 }
        );
    }
}
