/**
 * WASTE IMPACT TEST - Restaurant OS
 * Simule la mise au rebut d'un ingrédient et calcule l'impact sur la marge.
 */

import { firestore as db } from '../src/lib/firebase.ts';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const simulateWaste = async () => {
    console.log("🍎 Début de l'Audit des Pertes (Waste Management)...");

    const ING_ID = 'ing_mozzarella';
    const WASTE_QTY = 5; // 5kg perdus

    try {
        // 1. État Initial
        const ingSnap = await getDoc(doc(db, 'stockItems', `stock_${ING_ID}_init`));
        const currentQty = ingSnap.data().quantity;
        const unitCost = ingSnap.data().unitCost || 8.0;
        
        console.log(`📉 Stock Mozzarella Initial : ${currentQty}kg (Coût: ${unitCost}€/kg)`);

        // 2. Déclaration de Perte (Waste)
        // Simulateur de mouvement d'inventaire 'waste'
        const wasteLossValuation = WASTE_QTY * unitCost;
        console.log(`⚠️ Alerte : Perte de ${WASTE_QTY}kg détectée (Valeur : -${wasteLossValuation}€)`);

        await updateDoc(doc(db, 'stockItems', `stock_${ING_ID}_init`), {
            quantity: currentQty - WASTE_QTY
        });

        // 3. Signature du Log de Perte
        const movId = `WASTE_${Date.now()}`;
        await setDoc(doc(db, 'inventoryMovements', movId), {
            id: movId,
            type: 'waste',
            ingredientId: ING_ID,
            quantity: WASTE_QTY,
            reason: 'DLC Dépassée / Casse',
            performedBy: 'Deep Auditor AI',
            performedAt: new Date().toISOString(),
            valuationLoss: wasteLossValuation
        });

        console.log(`✅ Log de perte enregistré. Impact comptable : -${wasteLossValuation}€ de valeur de stock.`);
        
        // 4. Analyse de Rentabilité (Couture Logic)
        // On simule l'impact sur le dashboard Intelligence
        console.log("\n📊 Analyse d'Impact Profitabilité :");
        console.log(` - Marge brute réduite de : ${wasteLossValuation}€ par rapport au CA attendu.`);
        console.log(" - Action suggérée : Ajuster les volumes de commande fournisseur pour minimiser les rebuts.");

    } catch (error) {
        console.error("❌ Waste Audit Error:", error);
    }
};

simulateWaste();
