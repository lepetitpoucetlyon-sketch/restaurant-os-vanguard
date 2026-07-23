/**
 * Migration: cashDrawerSessions cents → microunits
 *
 * Converts *InCents fields to *InMicrounits (×10 000).
 * Idempotent: skips documents that already have *InMicrounits fields.
 * Gated behind MUNITS_CASH feature flag.
 *
 * Usage:
 *   NEXT_PUBLIC_MUNITS_CASH=enforce npx tsx scripts/migrations/2026-cash-cents-to-munits.ts
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';

const CENTS_TO_MU = 10_000;

interface LegacySession {
    id: string;
    openingAmountInCents?: number;
    closingAmountInCents?: number;
    cashCollectedInCents?: number;
    changeGivenInCents?: number;
    openingInMicrounits?: number;
    closingInMicrounits?: number;
    collectedInMicrounits?: number;
    changeGivenInMicrounits?: number;
    [key: string]: unknown;
}

async function migrate() {
    const flag = process.env.NEXT_PUBLIC_MUNITS_CASH;
    if (flag !== 'enforce' && flag !== 'warn') {
        console.log('[migration] NEXT_PUBLIC_MUNITS_CASH not set — aborting.');
        process.exit(0);
    }

    const tenants = await Nexus.adapter.query<{ id: string }>('tenants');
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrored = 0;

    for (const tenant of tenants) {
        const path = `tenants/${tenant.id}/cashDrawerSessions`;
        const sessions = await Nexus.adapter.query<LegacySession>(path);

        for (const session of sessions) {
            if (session.openingInMicrounits !== undefined) {
                totalSkipped++;
                continue;
            }

            if (session.openingAmountInCents === undefined) {
                totalSkipped++;
                continue;
            }

            try {
                const migrated: Record<string, unknown> = {
                    ...session,
                    openingInMicrounits: session.openingAmountInCents * CENTS_TO_MU,
                    collectedInMicrounits: (session.cashCollectedInCents ?? 0) * CENTS_TO_MU,
                    changeGivenInMicrounits: (session.changeGivenInCents ?? 0) * CENTS_TO_MU,
                };

                if (session.closingAmountInCents !== undefined) {
                    migrated.closingInMicrounits = session.closingAmountInCents * CENTS_TO_MU;
                }

                // Keep legacy fields for rollback safety
                await Nexus.adapter.set(`${path}/${session.id}`, migrated);
                totalMigrated++;
                console.log(`  [OK] ${tenant.id}/${session.id}`);
            } catch (err) {
                totalErrored++;
                console.error(`  [ERR] ${tenant.id}/${session.id}:`, err);
            }
        }
    }

    console.log('\n=== Migration Report ===');
    console.log(`Migrated: ${totalMigrated}`);
    console.log(`Skipped (already migrated or no cents data): ${totalSkipped}`);
    console.log(`Errors: ${totalErrored}`);
    console.log(`Reconciliation: totalMigrated + totalSkipped + totalErrored = ${totalMigrated + totalSkipped + totalErrored}`);
}

migrate().catch(err => {
    console.error('[migration] Fatal error:', err);
    process.exit(1);
});
