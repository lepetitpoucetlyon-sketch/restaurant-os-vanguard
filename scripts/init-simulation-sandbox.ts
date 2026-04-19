/**
 * INITIALIZATION SCRIPT - EMPIRE SIMULATION SANDBOX
 * Prepares the isolated tenant for the dual-week simulation (Empire vs Chaos).
 */

import { firestore as db } from '../src/lib/firebase'; 
import { collection, setDoc, doc } from 'firebase/firestore';

const TENANT_ID = 'empire-simulation-sandbox';
const path = (coll: string) => `tenants/${TENANT_ID}/${coll}`;

const initSandbox = async () => {
    console.log(`🚀 Initialisation du Bac à Sable Empire [${TENANT_ID}]...`);

    try {
        // 1. Ingrédients Fondamentaux
        const ingredients = [
            { id: 'ing_farine', name: 'Farine Bio T55', minQuantity: 10, unit: 'kg', category: 'dry' },
            { id: 'ing_tomate', name: 'Sauce Tomate San Marzano', minQuantity: 5, unit: 'kg', category: 'fresh' },
            { id: 'ing_mozzarella', name: 'Mozzarella di Bufala', minQuantity: 3, unit: 'kg', category: 'fresh' },
            { id: 'ing_boeuf', name: 'Filet de Bœuf Black Angus', minQuantity: 2, unit: 'kg', category: 'meat' },
            { id: 'ing_truffe', name: 'Truffe Noire du Périgord', minQuantity: 0.1, unit: 'kg', category: 'luxury' }
        ];

        for (const ing of ingredients) {
            await setDoc(doc(db, path('ingredients'), ing.id), ing);
            
            // Stock Initial (Généreux pour Empire, Limité pour Chaos à venir)
            const stockId = `stock_${ing.id}_init`;
            await setDoc(doc(db, path('stockItems'), stockId), {
                id: stockId,
                ingredientId: ing.id,
                ingredientName: ing.name,
                quantity: 100, // 100 unités par défaut
                unit: ing.unit,
                storageLocationId: 'reserve_centrale',
                dlc: '2026-12-31',
                status: 'available',
                unitCostInCents: ing.category === 'luxury' ? 15000 : 250
            });
        }
        console.log("✅ Ingrédients et Stock Master initialisés.");

        // 2. Recettes Signature
        const recipes = [
            {
                id: 'prod_margherita',
                name: 'Margherita Royale',
                category: 'cat_cuisine',
                sellingPriceInCents: 1450,
                ingredients: [
                    { id: 'ing_farine', quantity: 0.25, unit: 'kg' },
                    { id: 'ing_tomate', quantity: 0.1, unit: 'kg' },
                    { id: 'ing_mozzarella', quantity: 0.12, unit: 'kg' }
                ]
            },
            {
                id: 'prod_rossini',
                name: 'Filet de Bœuf Rossini',
                category: 'cat_cuisine',
                sellingPriceInCents: 5200,
                ingredients: [
                    { id: 'ing_boeuf', quantity: 0.2, unit: 'kg' },
                    { id: 'ing_truffe', quantity: 0.015, unit: 'kg' }
                ]
            }
        ];

        for (const recipe of recipes) {
            await setDoc(doc(db, path('recipes'), recipe.id), recipe);
            await setDoc(doc(db, path('products'), recipe.id), {
                id: recipe.id,
                name: recipe.name,
                priceInCents: recipe.sellingPriceInCents,
                categoryId: recipe.category,
                image: recipe.id === 'prod_margherita' 
                    ? 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38' 
                    : 'https://images.unsplash.com/photo-1661338927008-0bf14555898d'
            });
        }
        console.log("✅ Catalogue Recettes et Produits prêt.");

        // 3. Staff Virtuel
        const staff = [
            { id: 'emp_césar', name: 'César Auguste', role: 'chef', performanceScore: 4.9 },
            { id: 'emp_marc', name: 'Marc Aurèle', role: 'serveur', performanceScore: 4.8 }
        ];
        for (const s of staff) {
            await setDoc(doc(db, path('staff')), s);
        }

        console.log("🏁 Bac à Sable initialisé avec succès ! Prêt pour la simulation.");
    } catch (error) {
        console.error("❌ Erreur d'initialisation :", error);
    }
};

initSandbox();
