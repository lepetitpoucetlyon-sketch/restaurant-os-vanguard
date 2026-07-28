import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/axiom';
import { toMicrounits } from '@/domain/schemas/primitives';

export class DemoSeeder {
    static async provision(tenantId: string) {
        logger.info(`[DemoSeeder] Provisioning Sandbox Data for tenant: ${tenantId}`);

        // Assure que l'on est bien en Simulacra Mode
        if (!Nexus.isSimulacraActive()) {
            throw new Error("[DemoSeeder] FATAL: Cannot seed data outside Simulacra Mode. Aborting to protect Production.");
        }

        // 1. Catalog (Products)
        const products = [
            { id: 'p-1', name: 'Œuf Mayonnaise', priceInMicrounits: toMicrounits(500), categoryId: 'entrees', taxRate: '0.10' },
            { id: 'p-2', name: 'Pâté en croûte', priceInMicrounits: toMicrounits(950), categoryId: 'entrees', taxRate: '0.10' },
            { id: 'p-3', name: 'Entrecôte Frites', priceInMicrounits: toMicrounits(2400), categoryId: 'plats', taxRate: '0.10' },
            { id: 'p-4', name: 'Tartare de Boeuf', priceInMicrounits: toMicrounits(1800), categoryId: 'plats', taxRate: '0.10' },
            { id: 'p-5', name: 'Mousse au Chocolat', priceInMicrounits: toMicrounits(700), categoryId: 'desserts', taxRate: '0.10' },
            { id: 'p-6', name: 'Café Expresso', priceInMicrounits: toMicrounits(250), categoryId: 'boissons', taxRate: '0.10' },
            { id: 'p-7', name: 'Pinte de Blonde', priceInMicrounits: toMicrounits(800), categoryId: 'boissons', taxRate: '0.20' },
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
        const tables = [
            { id: 't-1', number: '1', status: 'ordered', capacity: 2 },
            { id: 't-2', number: '2', status: 'dirty', capacity: 4 },
            { id: 't-3', number: '3', status: 'available', capacity: 2 },
            { id: 't-4', number: '4', status: 'available', capacity: 6 },
            { id: 't-5', number: '5', status: 'available', capacity: 2 },
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
        const orders = [
            {
                id: 'ord-1',
                tableId: 't-1',
                tableNumber: 1,
                serverName: 'Marie Curie',
                status: 'new',
                items: [
                    { id: 'oi-1', productId: 'p-3', name: 'Entrecôte Frites', unitPriceInMicrounits: toMicrounits(2400), quantity: 1, course: 'plat', status: 'pending' },
                    { id: 'oi-2', productId: 'p-7', name: 'Pinte de Blonde', unitPriceInMicrounits: toMicrounits(800), quantity: 2, status: 'delivered' }
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
