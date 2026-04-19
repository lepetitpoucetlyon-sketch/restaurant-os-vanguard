import { firestore as db } from '../src/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { FiscalEngine } from '../src/domain/services/FiscalEngine';

const TENANT_ID = 'empire-simulation-sandbox';
const path = (coll: string) => `tenants/${TENANT_ID}/${coll}`;

async function runAudit() {
    console.log(`🏛️ Lancement du Grand Audit sur ${TENANT_ID}...`);

    try {
        // 1. Audit Empire
        const empireOrdersSnap = await getDocs(collection(db, path('orders')));
        const allOrders = empireOrdersSnap.docs.map(d => d.data());
        
        const empireOrders = allOrders.filter(o => o.id.includes('order_empire'));
        const chaosOrders = allOrders.filter(o => o.id.includes('order_chaos'));

        const empireRevenue = empireOrders.reduce((acc, o) => acc + (o.totalInCents || 0), 0) / 100;
        const chaosRevenue = chaosOrders.reduce((acc, o) => acc + (o.totalInCents || 0), 0) / 100;

        console.log(`📊 EMPIRE : ${empireOrders.length} commandes | CA : ${empireRevenue}€`);
        console.log(`📊 CHAOS  : ${chaosOrders.length} commandes | CA : ${chaosRevenue}€`);

        // 2. Audit Fiscal
        const sealsSnap = await getDocs(collection(db, path('fiscalSeals')));
        const allSeals = sealsSnap.docs.map(d => d.data());
        console.log(`🔗 Scellements Fiscaux : ${allSeals.length} sceaux générés.`);

        // 3. Audit Stock
        const stockSnap = await getDocs(collection(db, path('stockItems')));
        const stock = stockSnap.docs.map(d => d.data());
        console.log(`📦 État des Stocks : ${stock.length} ingrédients suivis.`);
        for (const s of stock) {
            console.log(`   - ${s.ingredientName} : ${s.quantity} ${s.unit} [${s.status}]`);
        }

        console.log("🏁 Audit complété.");
    } catch (e) {
        console.error("❌ Erreur Audit:", e);
    }
}

runAudit();
