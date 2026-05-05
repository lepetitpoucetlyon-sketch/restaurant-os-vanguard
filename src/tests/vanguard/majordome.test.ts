import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { SharedKernel } from '@/lib/shared-kernel';

// Re-declaring schema for standalone test logic (parity with useDataMigration.ts)
const MenuMigrationSchema = z.object({
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

type MenuMigration = z.infer<typeof MenuMigrationSchema>;

const preprocessData = (data: any): MenuMigration => {
    const raw = data as Record<string, any>;
    if (!raw || typeof raw !== 'object') return { categories: [], products: [] };
    
    const clean: MenuMigration = {
        categories: Array.isArray(raw.categories) ? raw.categories.map((c: any) => ({
            name: SharedKernel.Sovereign.cleanString(c?.name || ''),
            type: String(c?.type || 'food'),
            sortOrder: Number(c?.sortOrder || 1)
        })) : [],
        products: Array.isArray(raw.products) ? raw.products.map((p: any) => ({
            name: SharedKernel.Sovereign.cleanString(p?.name || ''),
            description: String(p?.description || ''),
            price: SharedKernel.Sovereign.cleanNumber(p?.price || 0),
            categoryName: String(p?.categoryName || 'Autre'),
            status: String(p?.status || 'available'),
            taxRate: Number(p?.taxRate || 10.0)
        })) : []
    };
    return clean;
};

describe('🧹 MAJORDOME : TEST DE PURETÉ DES DONNÉES', () => {
    
    it('M01: Nettoyage des chaînes et des nombres (CSV SALE)', () => {
        const dirtyData = {
            categories: [
                { name: "  Entrées  ", type: "food", sortOrder: "1" }
            ],
            products: [
                { 
                    name: "  Pizza  Margherita  ", 
                    description: "Tomate, Mozza", 
                    price: "12,50", 
                    categoryName: "Pizzas",
                    taxRate: "10"
                }
            ]
        };

        const cleaned = preprocessData(dirtyData);
        
        // Assertions
        expect(cleaned.categories[0].name).toBe("Entrées");
        expect(cleaned.products[0].name).toBe("Pizza Margherita");
        expect(cleaned.products[0].price).toBe(12.50);
        expect(cleaned.products[0].taxRate).toBe(10);
    });

    it('M02: Validation Zod après nettoyage', () => {
        const dirtyData = {
            categories: [{ name: "   " }], // Should be empty after trim, then fail zod
            products: [{ name: "Valid", price: "0" }] // Price 0 should fail
        };

        const cleaned = preprocessData(dirtyData);
        const result = MenuMigrationSchema.safeParse(cleaned);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.length).toBeGreaterThan(0);
        }
    });

    it('M03: Resilience face aux champs manquants', () => {
        const emptyData = {};
        const cleaned = preprocessData(emptyData);
        expect(cleaned.categories).toEqual([]);
        expect(cleaned.products).toEqual([]);
    });
});
