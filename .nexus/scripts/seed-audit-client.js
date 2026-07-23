const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, writeBatch, collection } = require('firebase/firestore');

/**
 * RESTAURANT OS - CLIENT-SIDE AUDIT SEEDER
 */

const firebaseConfig = {
    projectId: "kitchen-os-gastro",
    appId: "1:751200716315:web:14f411b2cf6a36a9795abe",
    apiKey: "AIzaSyDeCiXTa9nDLlbn-C9BKJfpb7Hp9cO9Id4",
    authDomain: "kitchen-os-gastro.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const AUDIT_INGREDIENTS = [
    { id: "ing-farine", name: "Farine de Blé 00", category: "dry", unit: "kg", minQuantity: 5, cost: 1.20, supplier: "Grossiste Italien", defaultStorageLocation: "epicerie_1" },
    { id: "ing-mozza", name: "Mozzarella di Bufala", category: "dairy", unit: "kg", minQuantity: 2, cost: 8.50, supplier: "Ferme Locale", defaultStorageLocation: "frigo_1" },
    { id: "ing-tomate", name: "Sauce Tomate San Marzano", category: "condiment", unit: "kg", minQuantity: 10, cost: 3.00, supplier: "Conserverie Bio", defaultStorageLocation: "epicerie_2" },
];

const AUDIT_STOCKS = [
    { id: "stock-farine-001", ingredientId: "ing-farine", ingredientName: "Farine de Blé 00", category: "dry", quantity: 20, unit: "kg", storageLocationId: "epicerie_1", receptionDate: new Date().toISOString(), dlc: "2026-12-31", unitCost: 1.20, status: "available" },
    { id: "stock-mozza-001", ingredientId: "ing-mozza", ingredientName: "Mozzarella di Bufala", category: "dairy", quantity: 15, unit: "kg", storageLocationId: "frigo_1", receptionDate: new Date().toISOString(), dlc: "2026-05-01", unitCost: 8.50, status: "available" },
    { id: "stock-tomate-001", ingredientId: "ing-tomate", ingredientName: "Sauce Tomate San Marzano", category: "condiment", quantity: 50, unit: "kg", storageLocationId: "epicerie_2", receptionDate: new Date().toISOString(), dlc: "2026-12-31", unitCost: 3.00, status: "available" },
];

const AUDIT_RECIPE = {
    id: "piz-mar",
    name: "Margherita Royal",
    ingredients: [
        { id: "ing-farine", name: "Farine de Blé 00", quantity: 0.2, unit: "kg" },
        { id: "ing-mozza", name: "Mozzarella di Bufala", quantity: 0.15, unit: "kg" },
        { id: "ing-tomate", name: "Sauce Tomate San Marzano", quantity: 0.1, unit: "kg" },
    ]
};

async function runSeed() {
    console.log("🚀 Seeding audit data via client SDK...");
    const batch = writeBatch(db);

    try {
        AUDIT_INGREDIENTS.forEach(ing => batch.set(doc(db, 'ingredients', ing.id), ing));
        AUDIT_STOCKS.forEach(stock => batch.set(doc(db, 'stockItems', stock.id), stock));
        batch.set(doc(db, 'recipes', AUDIT_RECIPE.id), AUDIT_RECIPE);

        await batch.commit();
        console.log("✅ Audit data seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

runSeed();
