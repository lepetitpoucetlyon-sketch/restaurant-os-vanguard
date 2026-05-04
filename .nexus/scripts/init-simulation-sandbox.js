/**
 * INITIALIZATION SCRIPT (JS) - EMPIRE SIMULATION SANDBOX
 * Uses firebase-admin for structural reliability in script execution.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize with a service account if available, or just use the emulator/default if configured
// For this environment, we'll try to use the environment variables or a local config
const TENANT_ID = 'empire-simulation-sandbox';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-empire'
    });
}

const db = admin.firestore();

const getTenantPath = (coll) => `tenants/${TENANT_ID}/${coll}`;

async function initSandbox() {
    console.log(`🚀 Initialisation du Bac à Sable Empire [${TENANT_ID}] via Admin SDK...`);

    try {
        // 1. Ingredients
        const ingredients = [
            { id: 'ing_farine', name: 'Farine Bio T55', minQuantity: 10, unit: 'kg', category: 'dry' },
            { id: 'ing_tomate', name: 'Sauce Tomate San Marzano', minQuantity: 5, unit: 'kg', category: 'frais' },
            { id: 'ing_mozzarella', name: 'Mozzarella di Bufala', minQuantity: 3, unit: 'kg', category: 'frais' },
            { id: 'ing_boeuf', name: 'Filet de Bœuf Black Angus', minQuantity: 2, unit: 'kg', category: 'viande' },
            { id: 'ing_truffe', name: 'Truffe Noire du Périgord', minQuantity: 0.1, unit: 'kg', category: 'luxe' }
        ];

        for (const ing of ingredients) {
            await db.collection(getTenantPath('ingredients')).doc(ing.id).set(ing);
            
            // Stock Initial
            const stockId = `stock_${ing.id}_init`;
            await db.collection(getTenantPath('stockItems')).doc(stockId).set({
                id: stockId,
                ingredientId: ing.id,
                ingredientName: ing.name,
                quantity: 100,
                unit: ing.unit,
                storageLocationId: 'reserve_centrale',
                dlc: '2026-12-31',
                status: 'available',
                unitCost: ing.category === 'luxe' ? 150 : 2.5
            });
        }

        // 2. Products & Recipes
        const products = [
            { id: 'prod_margherita', name: 'Margherita Royale', priceInCents: 1450, categoryId: 'cat_cuisine' },
            { id: 'prod_rossini', name: 'Filet de Bœuf Rossini', priceInCents: 5200, categoryId: 'cat_cuisine' }
        ];

        for (const p of products) {
            await db.collection(getTenantPath('products')).doc(p.id).set(p);
            
            // Mock Recipe
            await db.collection(getTenantPath('recipes')).doc(p.id).set({
                id: p.id,
                name: p.name,
                ingredients: p.id === 'prod_margherita' ? [
                    { id: 'ing_farine', quantity: 0.25, unit: 'kg' },
                    { id: 'ing_tomate', quantity: 0.1, unit: 'kg' }
                ] : [
                    { id: 'ing_boeuf', quantity: 0.2, unit: 'kg' }
                ]
            });
        }

        console.log("🏁 Bac à Sable initialisé !");
    } catch (e) {
        console.error("❌ Erreur:", e);
    }
}

initSandbox();
