import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/axiom';
import { toMicrounits } from '@/shared/schemas/primitives';

export class DemoSeeder {
    static async provision(tenantId: string) {
        logger.info(`[DemoSeeder] Provisioning Sandbox Data for tenant: ${tenantId}`);

        // Assure que l'on est bien en Simulacra Mode
        if (!Nexus.isSimulacraActive()) {
            throw new Error("[DemoSeeder] FATAL: Cannot seed data outside Simulacra Mode. Aborting to protect Production.");
        }

        // 1. Catalog (Products)
        // 1 € = 1 000 000 µ (toMicrounits est l'identité) — on fournit AUSSI priceInCents
        // pour satisfaire le type-guard isProduct (champ legacy attendu).
        const products = [
            { id: 'p-1', name: 'Œuf Mayonnaise', priceInMicrounits: toMicrounits(5_000_000), priceInCents: 500, categoryId: 'entrees', taxRate: '0.10' },
            { id: 'p-2', name: 'Pâté en croûte', priceInMicrounits: toMicrounits(9_500_000), priceInCents: 950, categoryId: 'entrees', taxRate: '0.10' },
            { id: 'p-3', name: 'Entrecôte Frites', priceInMicrounits: toMicrounits(24_000_000), priceInCents: 2400, categoryId: 'plats', taxRate: '0.10' },
            { id: 'p-4', name: 'Tartare de Boeuf', priceInMicrounits: toMicrounits(18_000_000), priceInCents: 1800, categoryId: 'plats', taxRate: '0.10' },
            { id: 'p-5', name: 'Mousse au Chocolat', priceInMicrounits: toMicrounits(7_000_000), priceInCents: 700, categoryId: 'desserts', taxRate: '0.10' },
            { id: 'p-6', name: 'Café Expresso', priceInMicrounits: toMicrounits(2_500_000), priceInCents: 250, categoryId: 'boissons', taxRate: '0.10' },
            { id: 'p-7', name: 'Pinte de Blonde', priceInMicrounits: toMicrounits(8_000_000), priceInCents: 800, categoryId: 'boissons', taxRate: '0.20' },
        ];

        for (const p of products) {
            await Nexus.adapter.set(`tenants/${tenantId}/products/${p.id}`, p);
        }

        // 2. Categories
        const categories = [
            { id: 'entrees', name: 'Entrées', displayOrder: 1 },
            { id: 'plats', name: 'Plats', displayOrder: 2 },
            { id: 'desserts', name: 'Desserts', displayOrder: 3 },
            { id: 'boissons', name: 'Boissons', displayOrder: 4 },
        ];

        for (const c of categories) {
            await Nexus.adapter.set(`tenants/${tenantId}/categories/${c.id}`, c);
        }

        // 3. Tables (Floor Plan)
        // isTable exige `seats: number` ET `number: string` — on garde capacity
        // (compat) et on fournit seats pour passer le convertisseur.
        const tables = [
            { id: 't-1', number: '1', status: 'ordered', seats: 2, capacity: 2 },
            { id: 't-2', number: '2', status: 'dirty', seats: 4, capacity: 4 },
            { id: 't-3', number: '3', status: 'available', seats: 2, capacity: 2 },
            { id: 't-4', number: '4', status: 'available', seats: 6, capacity: 6 },
            { id: 't-5', number: '5', status: 'available', seats: 2, capacity: 2 },
        ];

        for (const t of tables) {
            await Nexus.adapter.set(`tenants/${tenantId}/tables/${t.id}`, t);
        }

        // 4. Identities (HR) - Fake Employees
        const identities = [
            { id: 'emp-1', name: 'Jean Dupont', pinCode: '1234', roles: ['MANAGER'] },
            { id: 'emp-2', name: 'Marie Curie', pinCode: '4321', roles: ['STAFF'] },
        ];

        for (const emp of identities) {
            await Nexus.adapter.set(`tenants/${tenantId}/identities/${emp.id}`, emp);
        }

        // 5. Orders (Pending to make the KDS alive)
        // isOrder exige `tableNumber: string` et un total (totalInMicrounits|totalInCents).
        const orders = [
            {
                id: 'ord-1',
                tableId: 't-1',
                tableNumber: '1',
                serverName: 'Marie Curie',
                status: 'new',
                totalInMicrounits: toMicrounits(40_000_000), // 24 € + 2 × 8 €
                items: [
                    { id: 'oi-1', productId: 'p-3', name: 'Entrecôte Frites', unitPriceInMicrounits: toMicrounits(24_000_000), quantity: 1, course: 'plat', status: 'pending' },
                    { id: 'oi-2', productId: 'p-7', name: 'Pinte de Blonde', unitPriceInMicrounits: toMicrounits(8_000_000), quantity: 2, status: 'delivered' }
                ],
                createdAt: new Date().toISOString()
            }
        ];

        for (const o of orders) {
            await Nexus.adapter.set(`tenants/${tenantId}/orders/${o.id}`, o);
        }

        logger.info(`[DemoSeeder] Provisioning Complete. Welcome to Le Petit Poucet.`);
    }
}
