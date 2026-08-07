/**
 * 🔄 reset-demo.ts
 *
 * Réinitialise un ou plusieurs tenants DEMO à leur état initial :
 *  1. Supprime les collections mutables (orders, reservations, users non-admin, quotes…)
 *  2. Re-sème les données fictives enrichies via seed-demo-data.ts
 *
 * Usage :
 *   npx tsx scripts/reset-demo.ts                     # toutes les verticales
 *   npx tsx scripts/reset-demo.ts --variant restaurant
 *
 * ⚠️ N'efface PAS : tenantConfig, brandingTokens, categories, products, floors, zones, tables
 *    (structure permanente du DEMO, clonée depuis REFERENCE)
 */

import 'dotenv/config';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PLATFORM_VARIANTS } from '@/domain/schemas/tenant';
import { getSystemTenantId } from '@/lib/mcc/SystemTenantRegistry';
import type { PlatformVariant } from '@/domain/schemas/tenant';

const variantArg = process.argv.find(a => a.startsWith('--variant='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--variant') + 1];

const variantsToReset: readonly PlatformVariant[] = variantArg
    ? [variantArg as PlatformVariant]
    : PLATFORM_VARIANTS;

/** Collections réinitialisées à chaque reset (données prospect) */
const RESETTABLE_COLLECTIONS = [
    'orders',
    'reservations',
    'quotes',
    'haccpLogs',    // pas d'immuabilité sur le tenant DEMO (fictif)
    'analytics',
];

async function clearCollection(tenantId: string, collection: string) {
    const items = await Nexus.adapter.query(`tenants/${tenantId}/${collection}`);
    if (items.length === 0) return;
    await Promise.all(
        items.map((item: { id: string }) =>
            Nexus.adapter.delete(`tenants/${tenantId}/${collection}/${item.id}`).catch(() => {})
        )
    );
    console.log(`    🗑️  ${collection} : ${items.length} items effacés`);
}

async function resetVariant(variant: PlatformVariant) {
    const tenantId = getSystemTenantId(variant, 'DEMO');
    console.log(`\n  ▶ Reset ${tenantId}...`);

    // 1. Purge des collections mutables
    for (const col of RESETTABLE_COLLECTIONS) {
        await clearCollection(tenantId, col);
    }
    // Purge staff (sauf l'admin système)
    const users = await Nexus.adapter.query(`tenants/${tenantId}/users`);
    for (const user of users as Array<{ id: string; role?: string }>) {
        if (user.role !== 'OWNER' && user.id !== 'system') {
            await Nexus.adapter.delete(`tenants/${tenantId}/users/${user.id}`).catch(() => {});
        }
    }
    console.log(`    🗑️  users : ${users.length - 1} effacés (OWNER conservé)`);

    // 2. Re-seed des données enrichies
    const { execSync } = await import('child_process');
    execSync(`npx tsx scripts/seed-demo-data.ts --variant ${variant}`, { stdio: 'inherit' });

    console.log(`    ✅ ${variant} réinitialisé`);
}

async function main() {
    console.log('🔄 Reset tenants DEMO\n');
    ensureServerNexus();

    for (const variant of variantsToReset) {
        await resetVariant(variant);
    }

    console.log('\n🏁 Reset terminé.');
}

main().catch(err => {
    console.error('[reset-demo] ❌ Erreur fatale:', err);
    process.exit(1);
});
