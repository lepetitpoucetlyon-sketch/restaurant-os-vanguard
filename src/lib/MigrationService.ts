import { z } from 'zod';
import { randomBytes } from 'crypto';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { authedFetch } from '@/lib/client/authedFetch';
import { validatePin } from '@/lib/auth/validatePin';
import { JsonObject } from "@/lib/types/json";

/**
 * Generates a cryptographically secure 4-digit PIN (1000–9999).
 * Uses crypto.randomBytes — never Math.random().
 */
function generateSecurePin(): string {
  let pin: string;
  do {
    pin = String(1000 + (randomBytes(2).readUInt16BE(0) % 9000));
  } while (!validatePin(pin).valid);
  return pin;
}

export const MenuMigrationSchema = z.object({
    categories: z.array(z.object({
        name: z.string().min(1, "Le nom de la catégorie est obligatoire"),
        type: z.string().default("food"),
        sortOrder: z.number().default(1)
    })),
    products: z.array(z.object({
        name: z.string().min(1, "Le nom du plat est obligatoire pour être servi"),
        description: z.string().optional().default(""),
        price: z.number().positive("Le prix doit être supérieur à 0€ pour être conforme"),
        categoryName: z.string().min(1, "Chaque plat doit appartenir à une catégorie"),
        status: z.string().default("available"),
        taxRate: z.number().default(10.0)
    }))
});

export type MenuMigration = z.infer<typeof MenuMigrationSchema>;

function buildStaffRecord(emp: Record<string, string>): Record<string, unknown> {
    return {
        name: emp.name || emp.Nom,
        role: emp.role || 'server',
        pin: (emp.pin && validatePin(emp.pin).valid) ? emp.pin : generateSecurePin(),
        createdAt: new Date().toISOString(),
        accessLevel: 3,
        performanceScore: 5.0,
    };
}

function buildCrmRecord(crm: Record<string, string>): Record<string, unknown> {
    return {
        firstName: crm.prenom || crm.firstName || "Inconnu",
        lastName: crm.nom || crm.lastName || "",
        email: crm.email || "",
        phone: crm.phone || "",
        status: 'active',
        metrics: { totalVisits: 0, totalSpent: 0, noShows: 0 },
        tags: [],
        createdAt: new Date().toISOString(),
    };
}

export class MigrationService {
    static preprocessData(data: unknown): MenuMigration {
        const raw = data as JsonObject;
        if (!raw || typeof raw !== 'object') return { categories: [], products: [] };
        
        const clean: MenuMigration = {
            categories: Array.isArray(raw.categories) ? (raw.categories as JsonObject[]).map((c) => ({
                name: SharedKernel.Sovereign.cleanString(c?.name || ''),
                type: String(c?.type || 'food'),
                sortOrder: Number(c?.sortOrder || 1)
            })) : [],
            products: Array.isArray(raw.products) ? (raw.products as JsonObject[]).map((p) => ({
                name: SharedKernel.Sovereign.cleanString(p?.name || ''),
                description: String(p?.description || ''),
                price: SharedKernel.Sovereign.cleanNumber(p?.price || 0),
                categoryName: String(p?.categoryName || 'Autre'),
                status: String(p?.status || 'available'),
                taxRate: Number(p?.taxRate || 10.0)
            })) : []
        };
        return clean;
    }

    static async analyzeMenuWithAI(rawText: string): Promise<unknown> {
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

        const response = await authedFetch('/api/oracle', {
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
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonText);
    }

    static async injectToDB(
        entity: 'staff' | 'menu' | 'crm', 
        data: unknown, 
        onProgress: (val: number) => void
    ): Promise<boolean> {
        onProgress(10);
        const batch = Nexus.adapter.batch();
        
        if (entity === 'menu') {
            const cleanedData = this.preprocessData(data);
            const validation = MenuMigrationSchema.safeParse(cleanedData);
            
            if (!validation.success) {
                const firstError = validation.error.issues[0];
                throw new Error(`[Majordome] : ${firstError.message} (Champ: ${firstError.path.join('.')})`);
            }

            const { categories, products } = validation.data;
            const categoryIdMap: Record<string, string> = {};

            for (const cat of categories) {
                const id = Nexus.adapter.generateId('menu_categories');
                batch.set(`menu_categories/${id}`, { ...cat, createdAt: new Date().toISOString() });
                categoryIdMap[cat.name] = id;
            }
            onProgress(50);
            
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
            onProgress(80);
            await batch.commit();
            onProgress(100);
        } 
        else if (entity === 'staff') {
            for (const emp of data as Record<string, string>[]) {
                batch.set(`users/${Nexus.adapter.generateId('users')}`, buildStaffRecord(emp));
            }
            await batch.commit();
            onProgress(100);
        }
        else if (entity === 'crm') {
            for (const crm of data as Record<string, string>[]) {
                batch.set(`crms/${Nexus.adapter.generateId('crms')}`, buildCrmRecord(crm));
            }
            await batch.commit();
            onProgress(100);
        }
        return true;
    }

    static async seedProduction(): Promise<boolean> {
        // Idempotency guard: skip if any category already exists to avoid overwriting real data
        const existing = await Nexus.adapter.get('categories/antipasti').catch(() => null);
        if (existing) return true;

        const batch = Nexus.adapter.batch();
        
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

        for (const cat of CATEGORIES) batch.set(`categories/${cat.id}`, { ...cat, createdAt: new Date().toISOString() });
        for (const prod of PRODUCTS) batch.set(`products/${prod.id}`, { ...prod, createdAt: new Date().toISOString() });
        for (const ing of AUDIT_INGREDIENTS) batch.set(`ingredients/${ing.id}`, ing);
        for (const stock of AUDIT_STOCKS) batch.set(`stockItems/${stock.id}`, stock);
        batch.set(`recipes/${AUDIT_RECIPE.id}`, AUDIT_RECIPE);

        await batch.commit();
        return true;
    }
}
