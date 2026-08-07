/**
 * 🎭 seed-demo-data.ts
 *
 * Injecte des données fictives riches dans les tenants DEMO pour chaque verticale.
 * Ces données sont réalistes et impressionnantes pour un prospect.
 *
 * Usage :
 *   npx tsx scripts/seed-demo-data.ts                    # toutes les verticales
 *   npx tsx scripts/seed-demo-data.ts --variant restaurant
 *
 * ⚠️ Érase les données existantes du tenant DEMO — ne PAS exécuter sur un tenant CLIENT.
 */

import 'dotenv/config';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PLATFORM_VARIANTS } from '@/domain/schemas/tenant';
import { getSystemTenantId, isSystemTenant } from '@/lib/mcc/SystemTenantRegistry';
import type { PlatformVariant } from '@/domain/schemas/tenant';

const variantArg = process.argv.find(a => a.startsWith('--variant='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--variant') + 1];

const variantsToSeed: readonly PlatformVariant[] = variantArg
    ? [variantArg as PlatformVariant]
    : PLATFORM_VARIANTS;

// ── Helpers ───────────────────────────────────────────────────────────────────

const now = Date.now();
const h   = 3_600_000;
const day = 86_400_000;

function isoOffset(offsetMs: number) {
    return new Date(now + offsetMs).toISOString();
}

// ── Seed par verticale ────────────────────────────────────────────────────────

async function seedRestaurant(tenantId: string) {
    // 30 commandes POS (mix statuts)
    const statuses = ['paid', 'paid', 'paid', 'paid', 'pending', 'new', 'cancelled'] as const;
    for (let i = 0; i < 30; i++) {
        const status = statuses[i % statuses.length];
        const total  = (850 + i * 420) * 1_000_000; // microunits
        await Nexus.adapter.set(`tenants/${tenantId}/orders/order_${i}`, {
            id: `order_${i}`, tableId: `table-${(i % 10) + 1}`, status,
            totalInMicrounits: total,
            items: [
                { productId: `prod_${i % 6}`, quantity: (i % 3) + 1, priceInMicrounits: 1_200_000_000 },
                ...(i % 2 === 0 ? [{ productId: `prod_${(i + 2) % 6}`, quantity: 1, priceInMicrounits: 800_000_000 }] : []),
            ],
            createdAt: isoOffset(-(30 - i) * h),
            updatedAt: isoOffset(-(30 - i) * h + 20 * 60_000),
        });
    }

    // 10 réservations
    const guestNames = ['Martin', 'Dupont', 'Bernard', 'Petit', 'Robert', 'Durand', 'Simon', 'Michel', 'Lefebvre', 'Garcia'];
    for (let i = 0; i < 10; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/reservations/res_${i}`, {
            id: `res_${i}`, guestName: guestNames[i], partySize: (i % 6) + 1,
            date: isoOffset(i * day).split('T')[0],
            time: `${18 + (i % 4)}:${i % 2 === 0 ? '00' : '30'}`,
            status: i < 8 ? 'confirmed' : 'pending',
            phone: `06${String(11000000 + i * 7).padStart(8, '0')}`,
            notes: i % 3 === 0 ? 'Anniversaire — prévoir une bougie' : '',
            createdAt: isoOffset(-i * 2 * day),
        });
    }

    // 8 employés
    const staffRoles = ['MANAGER', 'WAITER', 'WAITER', 'COOK', 'COOK', 'CASHIER', 'WAITER', 'BARTENDER'] as const;
    const staffNames = ['Sophie Moreau', 'Lucas Renard', 'Emma Blanc', 'Pierre Leroy', 'Julie Morin', 'Antoine Girard', 'Camille Fontaine', 'Hugo Lambert'];
    for (let i = 0; i < 8; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/users/staff_${i}`, {
            id: `staff_${i}`, name: staffNames[i],
            email: `${staffNames[i].toLowerCase().replace(' ', '.')}@demo.internal`,
            role: staffRoles[i], roleLevel: i === 0 ? 10 : i < 2 ? 7 : 3,
            status: 'active', createdAt: isoOffset(-60 * day),
        });
    }

    // 3 contrôles HACCP
    const zones = ['Chambre froide', 'Cuisine chaude', 'Zone réception'];
    for (let i = 0; i < 3; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/haccpLogs/haccp_${i}`, {
            id: `haccp_${i}`, type: 'temperature', value: 3.2 + i * 0.4,
            unit: '°C', zone: zones[i], status: 'compliant',
            recordedAt: isoOffset(-i * 4 * h), operatorId: 'staff_0',
        });
    }

    // Analytics fictifs
    await Nexus.adapter.set(`tenants/${tenantId}/analytics/summary`, {
        period: 'last_7_days',
        revenueInMicrounits: 38_450_000_000,
        ordersCount: 142,
        avgTicketInMicrounits: 2_708_000_000,
        coverCount: 387,
        topProducts: [
            { name: 'Entrecôte Rossini', count: 42, revenueInMicrounits: 8_400_000_000 },
            { name: 'Tataki de thon', count: 38, revenueInMicrounits: 5_700_000_000 },
            { name: 'Crème brûlée', count: 71, revenueInMicrounits: 4_970_000_000 },
        ],
        updatedAt: isoOffset(0),
    });
}

async function seedHotel(tenantId: string) {
    for (let i = 0; i < 20; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/reservations/res_${i}`, {
            id: `res_${i}`, guestName: `Guest ${i + 1}`, roomNumber: (i % 5) + 101,
            checkIn: isoOffset(i * day).split('T')[0],
            checkOut: isoOffset((i + 2) * day).split('T')[0],
            status: i < 16 ? 'confirmed' : 'pending',
            totalInMicrounits: (12_000 + i * 500) * 1_000_000,
            createdAt: isoOffset(-i * day),
        });
    }
    for (let i = 0; i < 10; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/orders/roomservice_${i}`, {
            id: `roomservice_${i}`, type: 'room_service', roomNumber: (i % 5) + 101,
            status: 'paid', totalInMicrounits: (2_500 + i * 200) * 1_000_000,
            createdAt: isoOffset(-i * 3 * h),
        });
    }
}

async function seedBakery(tenantId: string) {
    for (let i = 0; i < 50; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/orders/sale_${i}`, {
            id: `sale_${i}`, status: 'paid',
            totalInMicrounits: (350 + i * 80) * 1_000_000,
            items: [{ productId: `prod_${i % 8}`, quantity: (i % 4) + 1, priceInMicrounits: 350_000_000 }],
            createdAt: isoOffset(-i * 15 * 60_000),
        });
    }
}

async function seedGarage(tenantId: string) {
    const statuses = ['draft', 'sent', 'accepted', 'completed', 'declined'] as const;
    for (let i = 0; i < 15; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/quotes/devis_${i}`, {
            id: `devis_${i}`, vehiclePlate: `AB-${100 + i}-CD`,
            client: `Client Garage ${i + 1}`, status: statuses[i % statuses.length],
            totalInMicrounits: (45_000 + i * 8_000) * 1_000_000,
            description: 'Révision complète + vidange + filtres',
            createdAt: isoOffset(-i * 2 * day),
        });
    }
}

async function seedSalon(tenantId: string) {
    for (let i = 0; i < 25; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/reservations/rdv_${i}`, {
            id: `rdv_${i}`, clientName: `Cliente ${i + 1}`,
            service: ['Coupe', 'Coloration', 'Brushing', 'Soin'][i % 4],
            practitioner: `Praticien ${(i % 5) + 1}`,
            date: isoOffset(i * day / 3).split('T')[0],
            time: `${9 + (i % 8)}:${i % 2 === 0 ? '00' : '30'}`,
            status: 'confirmed', durationMin: 45 + (i % 3) * 15,
            totalInMicrounits: (3_500 + i * 500) * 1_000_000,
            createdAt: isoOffset(-i * day),
        });
    }
}

async function seedClinic(tenantId: string) {
    for (let i = 0; i < 20; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/reservations/rdv_${i}`, {
            id: `rdv_${i}`, patientRef: `PAT${String(1000 + i).padStart(4, '0')}`,
            specialty: ['Généraliste', 'Dermatologue', 'Cardiologue'][i % 3],
            date: isoOffset(i * day / 2).split('T')[0],
            time: `${8 + (i % 10)}:${i % 2 === 0 ? '00' : '30'}`,
            status: i < 16 ? 'confirmed' : 'pending',
            createdAt: isoOffset(-i * day),
        });
    }
}

async function seedRetail(tenantId: string) {
    for (let i = 0; i < 50; i++) {
        await Nexus.adapter.set(`tenants/${tenantId}/orders/sale_${i}`, {
            id: `sale_${i}`, status: 'paid',
            totalInMicrounits: (2_500 + i * 350) * 1_000_000,
            items: Array.from({ length: (i % 4) + 1 }, (_, j) => ({
                productId: `prod_${(i + j) % 20}`, quantity: (j % 3) + 1,
                priceInMicrounits: (1_200 + j * 300) * 1_000_000,
            })),
            createdAt: isoOffset(-i * 2 * h),
        });
    }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

async function seedVariant(variant: PlatformVariant) {
    const tenantId = getSystemTenantId(variant, 'DEMO');
    if (!isSystemTenant(tenantId)) {
        console.error(`[seed-demo] ❌ ${tenantId} n'est pas un tenant système`);
        return;
    }
    console.log(`  ▶ ${variant} → ${tenantId}`);
    switch (variant) {
        case 'restaurant': await seedRestaurant(tenantId); break;
        case 'hotel':      await seedHotel(tenantId);      break;
        case 'bakery':     await seedBakery(tenantId);     break;
        case 'garage':     await seedGarage(tenantId);     break;
        case 'salon':      await seedSalon(tenantId);      break;
        case 'clinic':     await seedClinic(tenantId);     break;
        case 'retail':     await seedRetail(tenantId);     break;
        case 'custom':     console.log('    (custom — minimal, pas de seed spécialisé)'); break;
    }
    console.log(`    ✅ ${variant} seedé`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🎭 Seed données DEMO enrichies\n');
    ensureServerNexus();

    for (const variant of variantsToSeed) {
        await seedVariant(variant);
    }
    console.log('\n🏁 Seed DEMO terminé.');
}

main().catch(err => {
    console.error('[seed-demo] ❌ Erreur fatale:', err);
    process.exit(1);
});
