const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

/**
 * RESTAURANT OS - OPERATIONAL AUDIT VALIDATION
 * This script verifies data integrity and computes a theoretical stock deduction.
 */

const firebaseConfig = {
    projectId: "kitchen-os-gastro",
    appId: "1:751200716315:web:14f411b2cf6a36a9795abe",
    apiKey: "AIzaSyDeCiXTa9nDLlbn-C9BKJfpb7Hp9cO9Id4",
    authDomain: "kitchen-os-gastro.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runAudit() {
    console.log("🧐 Running Operational Audit Analysis...\n");

    try {
        // 1. Verify Menu Integrity
        const prodId = "piz-mar";
        const prodSnap = await getDoc(doc(db, "products", prodId));
        if (!prodSnap.exists()) throw new Error("Product 'piz-mar' missing!");
        
        console.log(`✅ Menu Integrity: Found [${prodSnap.data().name}]`);

        // 2. Verify Recipe Integrity
        const recipeSnap = await getDoc(doc(db, "recipes", prodId));
        if (!recipeSnap.exists()) throw new Error("Recipe for 'piz-mar' missing!");
        
        const recipe = recipeSnap.data();
        console.log(`✅ Recipe Integrity: Found [${recipe.ingredients.length}] ingredients for this product.`);

        // 3. Verify Stock Status
        const stockSnap = await getDocs(collection(db, "stockItems"));
        const mozzaStock = stockSnap.docs
            .map(d => d.data())
            .filter(s => s.ingredientId === "ing-mozza" && s.status === "available");

        const totalMozza = mozzaStock.reduce((acc, s) => acc + s.quantity, 0);
        console.log(`✅ Stock Status: Found ${totalMozza}kg of Mozzarella Available.`);

        // 4. Theoretical Simulation (Sale of 2 Pizzas)
        const qtyToSell = 2;
        const mozzaPerPizza = recipe.ingredients.find(i => i.id === "ing-mozza")?.quantity || 0;
        const totalDeduction = mozzaPerPizza * qtyToSell;
        const remainingStock = totalMozza - totalDeduction;

        console.log(`\n🧪 Simulation: Vente de ${qtyToSell} x Margherita Royal`);
        console.log(`   - Besoin Mozzarella: ${totalDeduction}kg`);
        console.log(`   - Stock Final Théorique: ${remainingStock}kg`);

        if (remainingStock < 0) {
            console.error("❌ ALERTE: Rupture de stock simulée!");
        } else {
            console.log("\n💎 AUDIT DE DONNÉES VALIDÉ! Le système est prêt pour l'exploitation réelle.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Audit Error:", error.message);
        process.exit(1);
    }
}

runAudit();
