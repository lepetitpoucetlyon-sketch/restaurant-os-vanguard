const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * RESTAURANT OS - PRODUCTION SEEDER
 * This script populates your Firebase Firestore with clean, production-ready data.
 * Run with: node scripts/seed-production.js
 */

// 1. Initialize Firebase Admin
// Make sure you have your service account key or use default credentials if on local
// For a simple script, we can use the project ID if the environment is set up.
// NOTE: This assumes you have firebase-admin installed.
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'kitchen-os-gastro'
    });
}

const db = admin.firestore();

const CATEGORIES = [
    { id: "antipasti", name: "Antipasti", color: "#FF9900", position: 1 },
    { id: "pizzas", name: "Pizzas Gourmet", color: "#C5A059", position: 2 },
    { id: "pasta", name: "Pasta Fresca", color: "#3B82F6", position: 3 },
    { id: "boissons", name: "Vins & Boissons", color: "#9333EA", position: 4 },
    { id: "desserts", name: "Desserts Maison", color: "#EC4899", position: 5 },
];

const PRODUCTS = [
    { id: "piz-mar", categoryId: "pizzas", name: "Margherita Royal", price: 14.00, description: "Tomate San Marzano, Mozzarella di Bufala, Basilic frais, Huile d'olive extra vierge.", image: "pizza-margherita" },
    { id: "piz-dia", categoryId: "pizzas", name: "Diavola Piquante", price: 16.50, description: "Base tomate, Mozzarella, Salami piquant, Olives taggiasche.", image: "pizza-diavola" },
    { id: "pas-car", categoryId: "pasta", name: "Carbonara Tradition", price: 18.00, description: "Guanciale, Pecorino Romano, Jaune d'œuf frais, Poivre noir.", image: "pasta-carbonara" },
    { id: "ant-bur", categoryId: "antipasti", name: "Burrata & Pesto", price: 15.00, description: "Burrata crémeuse, Pesto de basilic maison, Tomates cerises confites.", image: "antipasti-burrata" },
    { id: "vin-chi", categoryId: "boissons", name: "Chianti Classico", price: 32.00, description: "Vin rouge toscan, équilibré et corsé. Bouteille 75cl.", image: "wine-chianti" },
];

async function seed() {
    console.log("🚀 Starting Production Seeding for Restaurant OS...");

    try {
        // --- 1. SEED CATEGORIES ---
        console.log("📁 Seeding Categories...");
        for (const cat of CATEGORIES) {
            await db.collection('categories').doc(cat.id).set(cat);
            console.log(`✅ Category [${cat.name}] added.`);
        }

        // --- 2. SEED PRODUCTS ---
        console.log("🍕 Seeding Products...");
        for (const prod of PRODUCTS) {
            await db.collection('products').doc(prod.id).set(prod);
            console.log(`✅ Product [${prod.name}] added.`);
        }

        console.log("\n✨ DATABASE SUCCESSFULLY SEEDED! ✨");
        console.log("Your POS should now display live production data.");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    }
}

seed();
