import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

// Configuration from .env.local (Mocked since I can't load it easily in tsx without dotenv)
const firebaseConfig = {
    apiKey: "AIzaSyCbHj4syb-2mpv8SxUEp5TkBv2kGvPdOf0",
    authDomain: "kitchen-os-gastro.firebaseapp.com",
    projectId: "kitchen-os-gastro",
    storageBucket: "kitchen-os-gastro.firebasestorage.app",
    messagingSenderId: "751200716315",
    appId: "1:751200716315:web:14f411b2cf6a36a9795abe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'lepetitpoucet';
const PREFIX = `tenants/${TENANT_ID}/`;

async function seed() {
    console.log(`🚀 Starting seed for client: ${TENANT_ID}`);
    const batch = writeBatch(db);

    // 1. SETTINGS & IDENTITY
    const settingsRef = doc(db, PREFIX + 'settings', 'global');
    await setDoc(settingsRef, {
        identity: {
            name: "Le Petit Poucet (Lyon)",
            slogan: "L'Excellence du Bouchon Lyonnais",
            cuisine: "Bistronomie Lyonnaise",
            logo: "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?auto=format&fit=crop&w=200&h=200"
        },
        contact: {
            address: "24 Rue Mercière",
            postalCode: "69002",
            city: "Lyon",
            phoneMain: "04 78 42 19 09",
            emailGeneral: "contact@petitpoucet-lyon.fr"
        },
        pos: {
            currency: 'EUR',
            priceFormat: 'with_cents',
            displayMode: 'ttc'
        }
    });

    // 2. CATEGORIES
    const categories = [
        { id: 'cat_entrees', name: 'Entrées du Bouchon', color: '#DE685E' },
        { id: 'cat_plats', name: 'Plats de Résistance', color: '#4A90E2' },
        { id: 'cat_desserts', name: 'Desserts & Fromages', color: '#F5A623' },
        { id: 'cat_boissons', name: 'Boissons & Vins', color: '#7ED321' }
    ];

    for (const cat of categories) {
        batch.set(doc(db, PREFIX + 'categories', cat.id), cat);
    }

    // 3. PRODUCTS
    const products = [
        { id: 'p_saucisson', categoryId: 'cat_entrees', name: 'Saucisson Brioché', price: 14.00, color: '#DE685E', description: 'Le classique de Lyon, servi tiède.' },
        { id: 'p_quenelle', categoryId: 'cat_plats', name: 'Quenelle de Brochet', price: 24.00, color: '#4A90E2', description: 'Sauce Nantua aux écrevisses.' },
        { id: 'p_tablier', categoryId: 'cat_plats', name: 'Tablier de Sapeur', price: 19.50, color: '#4A90E2', description: 'Gras-double pané et grillé.' },
        { id: 'p_tarte', categoryId: 'cat_desserts', name: 'Tarte aux Pralines', price: 9.00, color: '#F5A623', description: 'La célèbre tarte rose de Lyon.' },
        { id: 'p_morgon', categoryId: 'cat_boissons', name: 'Morgon (Pot 46cl)', price: 18.00, color: '#7ED321', description: 'Vigne de Beaujolais.' }
    ];

    for (const prod of products) {
        batch.set(doc(db, PREFIX + 'products', prod.id), prod);
    }

    // 4. STORAGE LOCATIONS
    const locations = [
        { id: 'frigo_1', name: 'Chambre Froide Positive', type: 'refrigerator', temperature: 3.2 },
        { id: 'cave', name: 'Cave à Vins', type: 'refrigerator', temperature: 12.0 },
        { id: 'economat', name: 'Économat', type: 'ambient', temperature: 19.0 }
    ];

    for (const loc of locations) {
        batch.set(doc(db, PREFIX + 'storageLocations', loc.id), loc);
    }

    // 5. INGREDIENTS & STOCK
    const ingredients = [
        { id: 'ing_farine', name: 'Farine T45', category: 'dry', unit: 'kg', minStock: 10, currentStock: 25 },
        { id: 'ing_oeufs', name: 'Œufs Bio', category: 'fresh', unit: 'pcs', minStock: 50, currentStock: 120 },
        { id: 'ing_pralines', name: 'Pralines de Lyon', category: 'dry', unit: 'kg', minStock: 5, currentStock: 12 }
    ];

    for (const ing of ingredients) {
        batch.set(doc(db, PREFIX + 'ingredients', ing.id), ing);
        // Initial Stock Item
        batch.set(doc(db, PREFIX + 'stockItems', `stock_${ing.id}`), {
            id: `stock_${ing.id}`,
            ingredientId: ing.id,
            quantity: ing.currentStock,
            unit: ing.unit,
            storageLocationId: 'economat',
            batchNumber: 'BATCH-INITIAL',
            receptionDate: new Date().toISOString()
        });
    }

    // 6. TABLES & FLOOR PLAN
    const floors = [{ id: 'floor_main', name: 'Salle Principale' }];
    const zones = [{ id: 'zone_window', name: 'Côté Vitrine', floorId: 'floor_main' }];
    const tables = [
        { id: 't1', number: '1', covers: 2, zoneId: 'zone_window', x: 100, y: 100, shape: 'square', status: 'free' },
        { id: 't2', number: '2', covers: 4, zoneId: 'zone_window', x: 250, y: 100, shape: 'square', status: 'free' },
        { id: 't3', number: '3', covers: 2, zoneId: 'zone_window', x: 400, y: 100, shape: 'square', status: 'free' }
    ];

    for (const f of floors) batch.set(doc(db, PREFIX + 'floors', f.id), f);
    for (const z of zones) batch.set(doc(db, PREFIX + 'zones', z.id), z);
    for (const t of tables) batch.set(doc(db, PREFIX + 'tables', t.id), t);

    // 7. STAFF / USERS
    const staff = [
        { id: 'u_paul', name: 'Paul Manager', role: 'admin', pin: '9999', status: 'active' },
        { id: 'u_chef', name: 'Jean Chef', role: 'kitchen', pin: '1234', status: 'active' },
        { id: 'u_lucas', name: 'Lucas Serveur', role: 'waiter', pin: '5678', status: 'active' }
    ];

    for (const s of staff) {
        batch.set(doc(db, PREFIX + 'users', s.id), s);
    }

    await batch.commit();
    console.log('✅ Seed complete! Restaurant "Le Petit Poucet (Lyon)" is now ready for demonstration.');
}

seed().catch(console.error);
