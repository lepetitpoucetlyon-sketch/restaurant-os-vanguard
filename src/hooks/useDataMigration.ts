'use client';

import { useState, useCallback } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export function useDataMigration() {
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState(0);

    // DUMMY PARSER FOR CSV
    const parseCSV = async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    const result = [];
                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        const obj: any = {};
                        const currentline = lines[i].split(',');
                        for (let j = 0; j < headers.length; j++) {
                            obj[headers[j]] = currentline[j]?.trim();
                        }
                        result.push(obj);
                    }
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    };

    // AI MENU DETECTION via SECURE PROXY
    const analyzeMenuWithAI = async (rawText: string) => {
        setIsMigrating(true);
        try {
            const prompt = `Tu es un assistant de migration de données Restaurant OS. 
Voici le texte brut d'une carte de restaurant scannée via OCR ou collée:
"${rawText}"

Tâche: Extrait tous les plats et structure les en format JSON.
Tu dois retourner UNIQUEMENT un objet JSON valide, sans balises markdown, suivant ce schéma exact:
{
  "categories": [
    { "name": "Entrées", "type": "food", "sortOrder": 1 }
  ],
  "products": [
    {
      "name": "Oeuf Mayo",
      "description": "Oeuf bio, mayonnaise maison.",
      "price": 8.50,
      "categoryName": "Entrées",
      "status": "available",
      "taxRate": 10.0
    }
  ]
}
Associe chaque produit à sa categoryName. Ne renvoie AUCUN autre texte que le JSON brut.`;

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Erreur de communication avec l'IA.");
            }

            const result = await response.json();
            let jsonText = result.content;
            
            // Clean markdown code blocks if any
            jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedData = JSON.parse(jsonText);
            setIsMigrating(false);
            return parsedData;

        } catch (error) {
            console.error("AI Parsing Error:", error);
            setIsMigrating(false);
            throw error;
        }
    };


    const performMigration = useCallback(async <T extends { version: number }>(data: T, migrations: Record<number, (d: any) => any>) => {
        let current = { ...data };
        const targetVersion = Math.max(...Object.keys(migrations).map(Number));

        while (current.version < targetVersion) {
            const nextVersion = current.version + 1;
            if (migrations[nextVersion]) {
                current = migrations[nextVersion](current);
                current.version = nextVersion;
            } else {
                break;
            }
        }
        return current;
    }, []);

    // INJECTION IN DATABASE
    const injectToDB = async (entity: 'staff' | 'menu' | 'crm', data: unknown) => {
        setIsMigrating(true);
        setProgress(10);
        const batch = Nexus.adapter.batch();
        
        try {
            if (entity === 'menu') {
                const { categories, products } = data as { categories: any[], products: any[] };
                const categoryIdMap: Record<string, string> = {};

                // Add Categories to Batch
                for (const cat of categories) {
                    const id = Nexus.adapter.generateId('menu_categories');
                    batch.set(`menu_categories/${id}`, { ...cat, createdAt: new Date().toISOString() });
                    categoryIdMap[cat.name] = id;
                }
                setProgress(50);
                
                // Add Products to Batch
                for (const prod of products) {
                    const id = Nexus.adapter.generateId('products');
                    const catId = categoryIdMap[prod.categoryName] || 'uncategorized';
                    const { categoryName, ...rest } = prod;
                    batch.set(`products/${id}`, { 
                        ...rest, 
                        categoryId: catId,
                        createdAt: new Date().toISOString() 
                    });
                }
                setProgress(80);
                await batch.commit();
                setProgress(100);
            } 
            else if (entity === 'staff') {
                const staffData = data as any[];
                for (const emp of staffData) {
                    const id = Nexus.adapter.generateId('users');
                    batch.set(`users/${id}`, {
                        name: emp.name || emp.Nom,
                        role: emp.role || 'server',
                        pin: emp.pin || Math.floor(1000 + Math.random() * 9000).toString(),
                        createdAt: new Date().toISOString(),
                        accessLevel: 3,
                        performanceScore: 5.0
                    });
                }
                await batch.commit();
                setProgress(100);
            }
            else if (entity === 'crm') {
                const crmData = data as any[];
                for (const crm of crmData) {
                    const id = Nexus.adapter.generateId('crms');
                    batch.set(`crms/${id}`, {
                        firstName: crm.prenom || crm.firstName || "Inconnu",
                        lastName: crm.nom || crm.lastName || "",
                        email: crm.email || "",
                        phone: crm.phone || "",
                        status: 'active',
                        metrics: { totalVisits: 0, totalSpent: 0, noShows: 0 },
                        tags: [],
                        createdAt: new Date().toISOString()
                    });
                }
                await batch.commit();
                setProgress(100);
            }
            
            setTimeout(() => {
                setIsMigrating(false);
                setProgress(0);
            }, 1000);
            
            return true;
            
        } catch (error) {
            console.error("Cloud Injection error:", error);
            setIsMigrating(false);
            setProgress(0);
            throw error;
        }
    };

    const seedProduction = async () => {
        setIsMigrating(true);
        const batch = Nexus.adapter.batch();
        
        try {
            const CATEGORIES = [
                { id: "antipasti", name: "Antipasti", color: "#FF9900", position: 1 },
                { id: "pizzas", name: "Pizzas Gourmet", color: "#C5A059", position: 2 },
                { id: "pasta", name: "Pasta Fresca", color: "#3B82F6", position: 3 },
                { id: "boissons", name: "Vins & Boissons", color: "#9333EA", position: 4 },
                { id: "desserts", name: "Desserts Maison", color: "#EC4899", position: 5 },
            ];

            const PRODUCTS = [
                { id: "piz-mar", categoryId: "pizzas", name: "Margherita Royal", price: 14.00, description: "Tomate San Marzano, Mozzarella di Bufala, Basilic frais, Huile d'olive extra vierge.", image: "https://images.unsplash.com/photo-1574071318508-1cdbcd80ad00?auto=format&fit=crop&q=80&w=800" },
                { id: "piz-dia", categoryId: "pizzas", name: "Diavola Piquante", price: 16.50, description: "Base tomate, Mozzarella, Salami piquant, Olives taggiasche.", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800" },
                { id: "pas-car", categoryId: "pasta", name: "Carbonara Tradition", price: 18.00, description: "Guanciale, Pecorino Romano, Jaune d'œuf frais, Poivre noir.", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=800" },
                { id: "ant-bur", categoryId: "antipasti", name: "Burrata & Pesto", price: 15.00, description: "Burrata crémeuse, Pesto de basilic maison, Tomates cerises confites.", image: "https://images.unsplash.com/photo-1516100882582-96c3a05fe590?auto=format&fit=crop&q=80&w=800" },
                { id: "vin-chi", categoryId: "boissons", name: "Chianti Classico", price: 32.00, description: "Vin rouge toscan, équilibré et corsé. Bouteille 75cl.", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800" },
            ];

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

            // 1. Categories
            for (const cat of CATEGORIES) {
                batch.set(`categories/${cat.id}`, { ...cat, createdAt: new Date().toISOString() });
            }

            // 2. Products
            for (const prod of PRODUCTS) {
                batch.set(`products/${prod.id}`, { ...prod, createdAt: new Date().toISOString() });
            }

            // 3. Audit Ingredients
            for (const ing of AUDIT_INGREDIENTS) {
                batch.set(`ingredients/${ing.id}`, ing);
            }

            // 4. Audit Stocks
            for (const stock of AUDIT_STOCKS) {
                batch.set(`stockItems/${stock.id}`, stock);
            }

            // 5. Audit Recipe
            batch.set(`recipes/${AUDIT_RECIPE.id}`, AUDIT_RECIPE);

            await batch.commit();
            setIsMigrating(false);
            return true;
        } catch (error) {
            console.error("Seeding Error:", error);
            setIsMigrating(false);
            throw error;
        }
    };

    return { parseCSV, analyzeMenuWithAI, injectToDB, seedProduction, isMigrating, progress };
}
