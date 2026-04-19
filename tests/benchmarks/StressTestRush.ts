import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, query, orderBy, limit, getDocs, runTransaction, setDoc } from 'firebase/firestore';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION (Adapted for Client SDK) ---
const TENANT_ID = 'stress_test_tenant';
const RUSH_COUNT = 50;

// Load environment variables manually if helpful, but assuming process.env is populated
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// --- INITIALIZATION ---
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// --- TYPES ---
interface Order {
    id: string;
    items: any[];
    totalInCents: number;
    status: 'paid';
    timestamp: string;
}

// --- UTILS ---
const simulateOrder = (i: number): Order => ({
    id: `stress_order_${Date.now()}_${i}`,
    items: [{ productId: 'prod_rush_burger', name: 'Nexus Rush Burger', quantity: 1, priceInCents: 1500 }],
    totalInCents: 1500,
    status: 'paid',
    timestamp: new Date().toISOString()
});

const generateHash = (data: string, previousHash: string): string => {
    return crypto.createHash('sha256').update(data + previousHash).digest('hex');
};

// --- CORE LOGIC ---
async function runProtocolOverload() {
    console.log(`\n--- 🌋 PROTOCOLE OVERLOAD & ORACLE (Client SDK Engine) ---`);
    console.log(`📡 Cible: ${TENANT_ID} | Volume: ${RUSH_COUNT} units`);

    const startTime = Date.now();
    const results: any[] = [];
    
    const fiscalSealsRef = collection(db, `tenants/${TENANT_ID}/fiscalSeals`);
    const qLast = query(fiscalSealsRef, orderBy('timestamp', 'desc'), limit(1));
    const lastSealSnap = await getDocs(qLast);
    let currentLastHash = lastSealSnap.empty ? 'GENESIS_ROOT' : lastSealSnap.docs[0].data().hash;
    
    console.log(`⛓️  Ancre de chaîne : ${currentLastHash.substring(0, 12)}...`);

    const orders = Array.from({ length: RUSH_COUNT }).map((_, i) => simulateOrder(i));

    const processOrder = async (order: Order, index: number) => {
        const orderStartTime = Date.now();
        try {
            const result = await runTransaction(db, async (transaction) => {
                const internalLastSealSnap = await getDocs(query(fiscalSealsRef, orderBy('timestamp', 'desc'), limit(1)));
                const internalLastHash = internalLastSealSnap.empty ? 'GENESIS_ROOT' : internalLastSealSnap.docs[0].data().hash;
                
                const dataSnapshot = JSON.stringify({ orderId: order.id, total: order.totalInCents });
                const newHash = generateHash(dataSnapshot, internalLastHash);
                
                const sealId = `seal_${crypto.randomUUID().replace(/-/g, '')}`;
                const sealRef = doc(db, `tenants/${TENANT_ID}/fiscalSeals`, sealId);
                const orderRef = doc(db, `tenants/${TENANT_ID}/orders`, order.id);

                transaction.set(sealRef, {
                    id: sealId,
                    transactionId: order.id,
                    hash: newHash,
                    previousHash: internalLastHash,
                    timestamp: new Date().toISOString(),
                    dataSnapshot
                });

                transaction.set(orderRef, {
                    ...order,
                    fiscalSealHash: newHash
                });

                return newHash;
            });

            results.push({ id: order.id, hash: result, latency: Date.now() - orderStartTime, success: true });
        } catch (error) {
            console.error(`❌ Échec Ordre ${index}:`, error);
            results.push({ id: order.id, success: false, latency: Date.now() - orderStartTime });
        }
    };

    // Parallel execution
    console.log(`⚡ Injection en cours...`);
    await Promise.all(orders.map((o, i) => processOrder(o, i)));

    const totalDuration = Date.now() - startTime;
    const stats = {
        successRate: (results.filter(r => r.success).length / RUSH_COUNT) * 100,
        avgLatency: results.reduce((acc, r) => acc + (r.latency || 0), 0) / RUSH_COUNT,
        totalDuration,
        orderCount: RUSH_COUNT,
        ramUsage: process.memoryUsage().heapUsed / 1024 / 1024
    };

    console.log(`\n--- 📊 RÉSULTATS ---`);
    console.log(`✅ Taux succès: ${stats.successRate}%`);
    console.log(`⏱️  Durée: ${totalDuration}ms`);
    
    return stats;
}

if (require.main === module) {
    runProtocolOverload().then(m => {
        fs.writeFileSync(path.join(__dirname, 'stress_metrics.json'), JSON.stringify(m, null, 2));
        process.exit(0);
    });
}

export { runProtocolOverload };
