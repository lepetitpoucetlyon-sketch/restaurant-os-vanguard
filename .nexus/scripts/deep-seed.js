/**
 * 🏭 Deep Seed Script - Restaurant OS
 * Seeds industrial recipes and stock items for testing Phase 6.
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs } = require('firebase/firestore');

// Minimal config for the script (replacing project aliases)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'main-restaurant'; // Change as needed

async function seed() {
    console.log('🍱 Starting Industrial Seeding...');

    // 1. STOCK ITEMS (Ingredients)
    const stockItems = [
        { id: 'ing_bread', name: 'Pain Burger', ingredientId: 'bread', quantity: 100, unit: 'pcs', dlc: '2026-12-31', status: 'available' },
        { id: 'ing_meat', name: 'Steak Haché', ingredientId: 'meat', quantity: 50, unit: 'pcs', dlc: '2026-06-30', status: 'available' },
        { id: 'ing_cheese', name: 'Cheddar Affiné', ingredientId: 'cheese', quantity: 200, unit: 'slices', dlc: '2026-09-15', status: 'available' },
        { id: 'ing_dough', name: 'Pâte à Pizza Artisanale', ingredientId: 'dough', quantity: 40, unit: 'kg', dlc: '2026-05-20', status: 'available' },
        { id: 'ing_tomato', name: 'Sauce Tomate San Marzano', ingredientId: 'tomato_sauce', quantity: 10, unit: 'L', dlc: '2027-01-01', status: 'available' }
    ];

    for (const item of stockItems) {
        await setDoc(doc(db, `tenants/${TENANT_ID}/stockItems`, item.id), item);
        console.log(`✅ Seeded stock item: ${item.name}`);
    }

    // 2. RECIPES
    // We assume these IDs match some products in the database
    const recipes = [
        {
            id: 'rec_burger_classic',
            productId: 'burger_classic', // Replace with real product ID if known
            name: 'Classic Burger Recipe',
            ingredients: [
                { ingredientId: 'bread', quantity: 1, unit: 'pcs' },
                { ingredientId: 'meat', quantity: 1, unit: 'pcs' },
                { ingredientId: 'cheese', quantity: 1, unit: 'slices' }
            ]
        },
        {
            id: 'rec_pizza_margherita',
            productId: 'pizza_margherita',
            name: 'Margherita Recipe',
            ingredients: [
                { ingredientId: 'dough', quantity: 0.25, unit: 'kg' },
                { ingredientId: 'tomato_sauce', quantity: 0.1, unit: 'L' },
                { ingredientId: 'cheese', quantity: 100, unit: 'grams' }
            ]
        }
    ];

    for (const recipe of recipes) {
        await setDoc(doc(db, `tenants/${TENANT_ID}/recipes`, recipe.id), recipe);
        console.log(`✅ Seeded recipe: ${recipe.name}`);
    }

    console.log('✨ Seeding complete.');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
