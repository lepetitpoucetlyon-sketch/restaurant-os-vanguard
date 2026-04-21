import { NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NF525Service } from '@/domain/services/NF525Service';

const TENANT_ID = 'empire-simulation-sandbox';
const path = (coll: string) => `tenants/${TENANT_ID}/${coll}`;

/**
 * SIMULATION API GATEWAY
 * Triggers Sandbox Init and Dual-Week Simulations
 */
export async function POST(req: Request) {
    const { action } = await req.json();
    console.log(`[SimulationAPI] Action reçue : ${action}`);

    try {
        if (action === 'INIT_SANDBOX') {
            await initSandbox();
            return NextResponse.json({ success: true, message: 'Sandbox Empire Initialisé' });
        }

        if (action === 'RUN_EMPIRE_WEEK') {
            await runEmpireWeek();
            return NextResponse.json({ success: true, message: 'Semaine EMPIRE simulée avec succès' });
        }

        if (action === 'RUN_CHAOS_WEEK') {
            await runChaosWeek();
            return NextResponse.json({ success: true, message: 'Semaine CHAOS simulée avec succès' });
        }

        if (action === 'AUDIT') {
            const data = await runAuditData();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`[SimulationAPI] Erreur : ${message}`, e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function initSandbox() {
    const batch = Nexus.adapter.batch();

    // Master Ingredients
    const ings = [
        { id: 'ing_farine', name: 'Farine Bio T55', minQuantity: 10, unit: 'kg', category: 'dry' },
        { id: 'ing_tomate', name: 'Sauce Tomate San Marzano', minQuantity: 5, unit: 'kg', category: 'frais' },
        { id: 'ing_mozzarella', name: 'Mozzarella di Bufala', minQuantity: 3, unit: 'kg', category: 'frais' }
    ];

    for (const ing of ings) {
        batch.set(`${path('ingredients')}/${ing.id}`, ing);
        
        const stockId = `stock_${ing.id}_init`;
        batch.set(`${path('stockItems')}/${stockId}`, {
            id: stockId,
            ingredientId: ing.id,
            ingredientName: ing.name,
            quantity: 100,
            unit: ing.unit,
            storageLocationId: 'reserve_centrale',
            dlc: '2026-12-31',
            status: 'available',
            unitCost: 2.5
        });
    }

    // Products
    interface SimulationProduct { id: string; name: string; priceInCents: number; categoryId: string }
    const products: SimulationProduct[] = [
        { id: 'prod_margherita', name: 'Margherita Royale', priceInCents: 1450, categoryId: 'cat_cuisine' }
    ];

    for (const p of products) {
        batch.set(`${path('products')}/${p.id}`, p);
        batch.set(`${path('recipes')}/${p.id}`, {
            id: p.id,
            name: p.name,
            ingredients: [
                { id: 'ing_farine', quantity: 0.25, unit: 'kg' },
                { id: 'ing_tomate', quantity: 0.1, unit: 'kg' }
            ]
        });
    }

    await batch.commit();
}

/**
 * SIMULATION EMPIRE - 7 Jours de Perfection
 */
async function runEmpireWeek() {
    console.log("🏰 Lancement de la Semaine EMPIRE...");
    
    // Auto-Init si nécessaire
    let products = await Nexus.adapter.query(path('products'));
    if (products.length === 0) {
        console.log("🛠️ Catalogue vide. Auto-initialisation du Sandbox...");
        await initSandbox();
        products = await Nexus.adapter.query(path('products'));
    }

    if (!products.length) {
        throw new Error("Impossible d'initialiser le catalogue de produits.");
    }

    for (let day = 1; day <= 7; day++) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - (7 - day));
        const dateString = timestamp.toISOString().split('T')[0];

        console.log(`📅 Jour ${day} [${dateString}] : Injection de 25 commandes...`);
        
        for (let i = 0; i < 25; i++) {
            const orderId = `order_empire_j${day}_${i}`;
            const product = products[Math.floor(Math.random() * products.length)];
            
            const orderData = {
                id: orderId,
                status: 'pending',
                totalInCents: product.priceInCents || 1000,
                items: [{ productId: product.id, quantity: 1, name: product.name, unitPrice: product.priceInCents || 1000 }],
                createdAt: timestamp.getTime(),
                updatedAt: timestamp.getTime(),
                tenantId: TENANT_ID
            };

            await Nexus.adapter.set(`${path('orders')}/${orderId}`, orderData);
            await NF525Service.executeAtomicPayment(orderId, { isTrainingMode: false });
        }
    }
}

async function runChaosWeek() {
    console.log("🌋 Lancement de la Semaine CHAOS...");
    const products = await Nexus.adapter.query(path('products'));

    for (let day = 1; day <= 7; day++) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - (7 - day));
        const dateString = timestamp.toISOString().split('T')[0];

        // --- SCÉNARIO CHAOS ---
        
        // J3 : Pénurie Critique
        if (day === 3) {
            console.log("⚠️ CHAOS J3 : Vidage du stock de Mozzarella.");
            const mozzaStockPath = `${path('stockItems')}/stock_ing_mozzarella_init`;
            await Nexus.adapter.update(mozzaStockPath, { quantity: 0, status: 'out_of_stock' });
        }

        console.log(`📅 CHAOS Jour ${day} [${dateString}] : Injection de 20 commandes...`);
        
        for (let i = 0; i < 20; i++) {
            const orderId = `order_chaos_j${day}_${i}`;
            const product = products[Math.floor(Math.random() * products.length)];
            
            // J6 : Anomalie de Prix (Vente à 0.01€)
            const price = (day === 6 && i % 5 === 0) ? 1 : product.priceInCents;

            const orderData = {
                id: orderId,
                status: 'pending',
                totalInCents: price,
                items: [{ productId: product.id, quantity: 1, name: product.name, unitPrice: price }],
                createdAt: timestamp.getTime(),
                updatedAt: timestamp.getTime(),
                tenantId: TENANT_ID
            };

            await Nexus.adapter.set(`${path('orders')}/${orderId}`, orderData);
            
            try {
                // J5 : Simulation Échec de Scellement (Uniquement pour certaines transactions)
                const options = (day === 5 && i % 10 === 0) ? { isTrainingMode: true } : { isTrainingMode: false };
                await NF525Service.executeAtomicPayment(orderId, options);
            } catch (err) {
                console.warn(`[ChaosAPI] Commande ${orderId} échouée (Attendu en mode Chaos)`);
            }
        }
    }
}

/**
 * AUDIT DATA - Extraction des métriques
 */
async function runAuditData() {
    console.log("🧐 Extraction des données d'audit...");
    const allOrders = await Nexus.adapter.query(path('orders'));
    
    interface AuditOrder { id: string; totalInCents: number }
    const empireOrders = allOrders.filter((o) => (o as AuditOrder).id.includes('order_empire')) as AuditOrder[];
    const chaosOrders = allOrders.filter((o) => (o as AuditOrder).id.includes('order_chaos')) as AuditOrder[];
    
    const fiscalSeals = await Nexus.adapter.query(path('fiscalSeals'));
    const stockItems = await Nexus.adapter.query(path('stockItems'));

    return {
        empire: {
            count: empireOrders.length,
            revenue: empireOrders.reduce((acc: number, o) => acc + (o.totalInCents || 0), 0) / 100
        },
        chaos: {
            count: chaosOrders.length,
            revenue: chaosOrders.reduce((acc: number, o) => acc + (o.totalInCents || 0), 0) / 100
        },
        fiscal: {
            sealsCount: fiscalSeals.length
        },
        stock: stockItems.map((s) => {
            const stock = s as { ingredientName: string; quantity: number; status: string };
            return { name: stock.ingredientName, quantity: stock.quantity, status: stock.status };
        })
    };
}
