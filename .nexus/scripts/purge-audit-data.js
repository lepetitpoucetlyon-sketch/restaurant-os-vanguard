/**
 * FINAL PURGE - Restaurant OS
 * Supprime toutes les traces de test (Seeding & Audit).
 */

import { firestore as db } from '../src/lib/firebase.ts';
import { doc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';

const purgeAll = async () => {
    console.log("🧼 Purge finale du système (Clean Slate Production)...");

    try {
        // 1. Supprimer les ingrédients de test
        const ings = ['ing_farine', 'ing_tomate', 'ing_mozzarella'];
        for (const id of ings) {
            await deleteDoc(doc(db, 'ingredients', id));
            await deleteDoc(doc(db, 'stockItems', `stock_${id}_init`));
            console.log(` 🚿 Ingrédient & Stock supprimé : ${id}`);
        }

        // 2. Supprimer les recettes & produits de test
        const prods = ['prod_margherita'];
        for (const id of prods) {
            await deleteDoc(doc(db, 'recipes', id));
            await deleteDoc(doc(db, 'products', id));
            console.log(` 🚿 Recette & Produit supprimé : ${id}`);
        }

        // 3. Supprimer les commandes d'audit
        const ordersSnap = await getDocs(query(collection(db, 'orders'), where('serverName', 'in', ['Audit System', 'Audit Deep'])));
        for (const d of ordersSnap.docs) {
            await deleteDoc(doc(db, 'orders', d.id));
            console.log(` 🚿 Commande audit supprimée : ${d.id}`);
        }

        // 4. Supprimer les logs d'audit (Optionnel, mais on veut laisser clean)
        const logsSnap = await getDocs(collection(db, 'audit_logs'));
        for (const d of logsSnap.docs) {
            if (d.data().userName === 'Deep Auditor AI') {
                await deleteDoc(doc(db, 'audit_logs', d.id));
                console.log(` 🚿 Log audit supprimé : ${d.id}`);
            }
        }

        console.log("🏁 Système 100% propre. Prêt pour la Prochaine Étape : Production Réelle !");
    } catch (error) {
        console.error("❌ Purge Error:", error);
    }
};

purgeAll();
