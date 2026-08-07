/**
 * 🏛️ bootstrap-system-tenants.ts
 *
 * Crée les 24 tenants système (8 verticales × 3 tiers : DEMO/TEST/REFERENCE).
 * Idempotent : ne recréé pas un tenant déjà existant (guard dans TenantSeeder).
 *
 * Prérequis env (dans .env.local ou CI) :
 *   FIREBASE_SERVICE_ACCOUNT_JSON   — compte de service Firebase (JSON stringify)
 *   SYSTEM_ADMIN_PIN                — PIN 4 chiffres distinct du ROOT_ADMIN_PIN
 *
 * Usage :
 *   npx tsx scripts/bootstrap-system-tenants.ts
 *
 * Pour une verticale spécifique :
 *   npx tsx scripts/bootstrap-system-tenants.ts --variant restaurant
 */

import 'dotenv/config';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantSeeder } from '@/lib/TenantSeeder';
import { PLATFORM_VARIANTS } from '@/domain/schemas/tenant';
import { getSystemTenantId, getAllSystemTenantIds } from '@/lib/mcc/SystemTenantRegistry';
import type { PlatformVariant } from '@/domain/schemas/tenant';

// ── Validation de l'environnement ────────────────────────────────────────────

const SYSTEM_ADMIN_PIN = process.env.SYSTEM_ADMIN_PIN;
if (!SYSTEM_ADMIN_PIN) {
    console.error('[bootstrap] ❌ SYSTEM_ADMIN_PIN manquant dans l\'environnement.');
    console.error('  Ajoutez SYSTEM_ADMIN_PIN=xxxx dans .env.local (format: 4 chiffres, pas 0000/1234/9999)');
    process.exit(1);
}
if (!/^\d{4}$/.test(SYSTEM_ADMIN_PIN)) {
    console.error('[bootstrap] ❌ SYSTEM_ADMIN_PIN doit être exactement 4 chiffres.');
    process.exit(1);
}
const WEAK_PINS = new Set(['0000', '1111', '1234', '4321', '9999', '0404']);
if (WEAK_PINS.has(SYSTEM_ADMIN_PIN)) {
    console.error(`[bootstrap] ❌ SYSTEM_ADMIN_PIN "${SYSTEM_ADMIN_PIN}" est trop faible. Choisissez un PIN plus solide.`);
    process.exit(1);
}

// ── Filtrage par --variant (optionnel) ───────────────────────────────────────

const variantArg = process.argv.find(a => a.startsWith('--variant='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--variant') + 1];

const variantsToProcess: readonly PlatformVariant[] = variantArg
    ? (PLATFORM_VARIANTS.includes(variantArg as PlatformVariant)
        ? [variantArg as PlatformVariant]
        : (() => { console.error(`[bootstrap] ❌ Variant inconnu : "${variantArg}". Disponibles : ${PLATFORM_VARIANTS.join(', ')}`); process.exit(1); })())
    : PLATFORM_VARIANTS;

// ── Seed data enrichie pour les tenants DEMO ─────────────────────────────────

async function seedDemoData(variant: PlatformVariant): Promise<void> {
    const tenantId = getSystemTenantId(variant, 'DEMO');
    console.log(`  [demo-data] Injection données enrichies → ${tenantId}`);

    const now = Date.now();
    const day = 86_400_000;

    if (variant === 'restaurant') {
        // 30 commandes POS fictives
        const orderStatuses = ['paid', 'paid', 'paid', 'pending', 'new'];
        for (let i = 0; i < 30; i++) {
            const status = orderStatuses[i % orderStatuses.length];
            await Nexus.adapter.set(`tenants/${tenantId}/orders/order_demo_${i}`, {
                id: `order_demo_${i}`,
                tableId: `table-${(i % 10) + 1}`,
                status,
                totalInMicrounits: (1200 + i * 300) * 1_000_000,
                items: [{ productId: `prod_${i % 5}`, quantity: i % 3 + 1, priceInMicrounits: 1200_000_000 }],
                createdAt: new Date(now - (i * 3_600_000)).toISOString(),
                updatedAt: new Date(now - (i * 3_600_000) + 1_800_000).toISOString(),
            });
        }
        // 10 réservations
        for (let i = 0; i < 10; i++) {
            await Nexus.adapter.set(`tenants/${tenantId}/reservations/res_demo_${i}`, {
                id: `res_demo_${i}`,
                guestName: `Client ${i + 1}`,
                partySize: (i % 4) + 2,
                date: new Date(now + i * day).toISOString().split('T')[0],
                time: `${18 + (i % 4)}:${i % 2 === 0 ? '00' : '30'}`,
                status: i < 8 ? 'confirmed' : 'pending',
                phone: `06${String(10000000 + i).padStart(8, '0')}`,
                createdAt: new Date(now - i * day).toISOString(),
            });
        }
        // Staff fictif (8 personnes)
        const roles = ['MANAGER', 'WAITER', 'COOK', 'CASHIER'];
        for (let i = 0; i < 8; i++) {
            await Nexus.adapter.set(`tenants/${tenantId}/users/staff_demo_${i}`, {
                id: `staff_demo_${i}`,
                name: `Employé Demo ${i + 1}`,
                email: `staff${i + 1}@demo.restaurant-os.internal`,
                role: roles[i % roles.length],
                roleLevel: i === 0 ? 10 : 3,
                createdAt: new Date(now - 30 * day).toISOString(),
            });
        }
        // 3 contrôles HACCP
        for (let i = 0; i < 3; i++) {
            await Nexus.adapter.set(`tenants/${tenantId}/haccpLogs/haccp_demo_${i}`, {
                id: `haccp_demo_${i}`,
                type: 'temperature',
                value: 3.5 + i * 0.5,
                unit: '°C',
                zone: `Zone ${i + 1}`,
                status: 'compliant',
                recordedAt: new Date(now - i * 4 * 3_600_000).toISOString(),
                operatorId: 'staff_demo_0',
            });
        }
    }
    // Pour les autres verticales : données minimales (plan de salle + quelques records)
    // Extension verticale future : ajouter un cas par variant ici
}

// ── Main bootstrap ────────────────────────────────────────────────────────────

async function main() {
    console.log('🏛️  Bootstrap tenants système DEMO/TEST/REFERENCE');
    console.log(`   Verticales : ${variantsToProcess.join(', ')}`);
    console.log(`   Total à créer : ${variantsToProcess.length * 3} tenants\n`);

    // Initialiser le server adapter AVANT tout appel Nexus
    ensureServerNexus();
    console.log('✅ Server Nexus initialisé\n');

    const results: Array<{ tenantId: string; success: boolean; error?: string }> = [];

    for (const variant of variantsToProcess) {
        const adminEmail = 'system@restaurantos.internal';

        for (const tier of ['REFERENCE', 'TEST', 'DEMO'] as const) {
            const tenantId = getSystemTenantId(variant, tier);
            const name = `${variant.charAt(0).toUpperCase() + variant.slice(1)} ${tier}`;
            console.log(`  ▶ Seeding ${tenantId}...`);

            const result = await TenantSeeder.seed({
                tenantId,
                name,
                adminEmail,
                variant,
                adminPin: SYSTEM_ADMIN_PIN,
            });

            // Patcher le tier dans tenantConfig (TenantSeeder sème 'CLIENT' par défaut)
            if (result.success) {
                await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, { tier }, { merge: true });

                // Données enrichies pour DEMO uniquement
                if (tier === 'DEMO') {
                    await seedDemoData(variant);
                }
                console.log(`    ✅ ${tenantId} (${tier})`);
            } else {
                console.log(`    ⚠️  ${tenantId} — ${result.error ?? 'déjà existant ou erreur'}`);
            }

            results.push({ tenantId, success: result.success, error: result.error });
        }
        console.log('');
    }

    // Résumé
    const ok  = results.filter(r => r.success).length;
    const err = results.filter(r => !r.success).length;
    console.log('─'.repeat(60));
    console.log(`🏁 Terminé : ${ok} seedés, ${err} ignorés (déjà existants ou erreurs)`);
    console.log(`   Tenants système total : ${getAllSystemTenantIds().length}`);

    if (err > 0) {
        console.log('\nDétails des erreurs :');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  ✗ ${r.tenantId}: ${r.error}`);
        });
    }
}

main().catch(err => {
    console.error('[bootstrap] ❌ Erreur fatale :', err);
    process.exit(1);
});
