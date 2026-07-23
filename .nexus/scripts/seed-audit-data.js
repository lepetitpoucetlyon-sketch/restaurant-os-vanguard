/**
 * SEED AUDIT DATA - Restaurant OS
 * Injecte des données de production de test (Recettes, Ingrédients, Table)
 * pour valider le flux complet sans polluer les données clients.
 */

import { firestore as db } from '../src/lib/firebase.ts'; 
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

const seedData = async () => {
    console.log("🚀 Initialisation du Seeding d'Audit...");

    try {
        // 1. Ingrédients (Master Data)
        const ingredients = [
            { id: 'ing_farine', name: 'Farine Bio T55', minQuantity: 10, unit: 'kg', category: 'epicerie' },
            { id: 'ing_tomate', name: 'Sauce Tomate San Marzano', minQuantity: 5, unit: 'kg', category: 'frais' },
            { id: 'ing_mozzarella', name: 'Mozzarella di Bufala', minQuantity: 3, unit: 'kg', category: 'frais' }
        ];

        for (const ing of ingredients) {
            await setDoc(doc(db, 'ingredients', ing.id), ing);
            console.log(`✅ Ingrédient injecté : ${ing.name}`);

            // Ajouter un stock initial (Batch)
            const stockId = `stock_${ing.id}_init`;
            await setDoc(doc(db, 'stockItems', stockId), {
                id: stockId,
                ingredientId: ing.id,
                ingredientName: ing.name,
                quantity: 50, // 50kg initial
                unit: ing.unit,
                storageLocationId: 'frigo_1',
                dlc: '2026-12-31',
                status: 'available',
                unitCost: 2.5
            });
            console.log(`📦 Stock initial injecté pour : ${ing.name}`);
        }

        // 2. Recettes (Produits POS)
        const recipes = [
            {
                id: 'prod_margherita',
                name: 'Margherita Royale',
                category: 'pizzas',
                sellingPrice: 14.5,
                costPrice: 4.2,
                ingredients: [
                    { id: 'ing_farine', quantity: 0.25, unit: 'kg' },
                    { id: 'ing_tomate', quantity: 0.1, unit: 'kg' },
                    { id: 'ing_mozzarella', quantity: 0.12, unit: 'kg' }
                ]
            }
        ];

        for (const recipe of recipes) {
            await setDoc(doc(db, 'recipes', recipe.id), recipe);
            await setDoc(doc(db, 'products', recipe.id), {
                id: recipe.id,
                name: recipe.name,
                price: recipe.sellingPrice,
                category: recipe.category,
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38'
            });
            console.log(`✅ Produit & Recette injectés : ${recipe.name}`);
        }

        console.log("🏁 Seeding d'Audit terminé avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors du seeding :", error);
    }
};

seedData();
