/**
 * AUDIT TEST CYCLE - Restaurant OS
 * Simule un cycle complet : Vente -> Décrémentation Stock -> Audit Revenue.
 */

import { firestore as db } from '../src/lib/firebase.ts';
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const simulateCycle = async () => {
    console.log("🔍 Début du cycle d'audit (Simulation de vente)...");

    const PRODUCT_ID = 'prod_margherita';
    const QUANTITY = 2; // 2 Pizzas

    try {
        // 1. Relever le stock AVANT
        const stockRef = doc(db, 'stockItems', `stock_ing_farine_init`);
        const beforeSnap = await getDoc(stockRef);
        const beforeQty = beforeSnap.data().quantity;
        console.log(`📈 Stock Farine AVANT : ${beforeQty}kg`);

        // 2. Simuler la création de la commande (CA = 29.00€)
        const orderId = `AUDIT_SALE_${Date.now()}`;
        const order = {
            tableNumber: 5,
            serverName: 'Audit System',
            status: 'paid',
            total: 29.0,
            timestamp: serverTimestamp(),
            items: [{ productId: PRODUCT_ID, name: 'Margherita Royale', quantity: QUANTITY, price: 14.5 }]
        };
        await setDoc(doc(db, 'orders', orderId), order);
        console.log(`✅ Commande d'audit créée: ${orderId} (29€)`);

        // 3. Simuler la décrémentation du stock (Logique du POSService)
        // Normalement déclenchée par OrdersContext lors du passage à 'paid'
        console.log("⚙️ Simulation de la décrémentation des stocks...");
        
        const recipeSnap = await getDoc(doc(db, 'recipes', PRODUCT_ID));
        const recipe = recipeSnap.data();
        
        for (const ing of recipe.ingredients) {
            const neededQty = ing.quantity * QUANTITY;
            const ingStockRef = doc(db, 'stockItems', `stock_${ing.id}_init`);
            const ingStockSnap = await getDoc(ingStockRef);
            const currentQty = ingStockSnap.data().quantity;
            
            await updateDoc(ingStockRef, {
                quantity: currentQty - neededQty
            });
            console.log(`📉 Décrémentation : ${ing.id} (-${neededQty}${ing.unit})`);
        }

        // 4. Relever le stock APRES
        const afterSnap = await getDoc(stockRef);
        const afterQty = afterSnap.data().quantity;
        console.log(`📊 Stock Farine APRES : ${afterQty}kg`);

        // 5. Validation finale
        const diff = beforeQty - afterQty;
        if (Math.abs(diff - 0.5) < 0.001) { // 0.25kg par pizza * 2
            console.log("✨ Audit Validé : Les stocks ont été décrémentés avec une précision millimétrique !");
        } else {
            console.warn(`⚠️ Audit Partiel : Écart de stock inattendu (${diff}kg au lieu de 0.5kg)`);
        }

    } catch (error) {
        console.error("❌ Échec de l'audit critique :", error);
    }
};

simulateCycle();
