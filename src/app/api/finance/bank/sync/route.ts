import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import {
    OpenBankingProviderFactory,
    BankConnectionStore,
    inferPCGAccount,
} from '@/domain/finance/banking/openBanking';
import { FiscalEngine } from '@/infrastructure/adapters/FiscalAdapter';
import { CryptoService } from '@domain/services/CryptoService';
import type { FiscalSeal } from '@nexus/contracts';

/**
 * POST /api/finance/bank/sync
 * Déclenche une synchronisation bancaire pour le tenant authentifié.
 * Auth : admin/manager du tenant (ou fleet_admin) — le tenant vient du token.
 * Aucun secret global n'est utilisé pour rafraîchir un compte : uniquement
 * le jeton utilisateur propre à CE tenant, chargé depuis sa connexion persistée.
 */
export async function POST(request: NextRequest) {
    try {
        const caller = await requireTenantAdmin(request);
        if (isDenied(caller)) return caller;
        const { tenantId } = caller;

        const provider = OpenBankingProviderFactory.get();

        if (provider.isDemoMode()) {
            return NextResponse.json({
                success: true,
                isDemoMode: true,
                syncedAt: new Date().toISOString(),
                message: 'Mode démonstration : synchronisation simulée.',
            });
        }

        const connection = await BankConnectionStore.get(tenantId);
        if (!connection || connection.status !== 'active') {
            return NextResponse.json({ error: 'Aucune connexion bancaire active pour ce restaurant.' }, { status: 400 });
        }

        const userToken = BankConnectionStore.decryptToken(connection);
        await provider.refreshConnection(userToken);

        const accounts = await provider.getAccounts(userToken);
        const fromDate = connection.lastSyncAt
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
                    amountInMicrounits: tx.amountInCents * 10,
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
        await BankConnectionStore.markSynced(tenantId);

        return NextResponse.json({ success: true, synced: created, syncedAt: new Date().toISOString() });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur interne lors de la synchronisation.' },
            { status: 500 }
        );
    }
}
