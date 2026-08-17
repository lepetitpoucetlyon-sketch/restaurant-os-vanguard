"use client";

import { useState, useMemo, useCallback } from "react";
import { PageHeader } from "@components/ui/PageHeader";
import { ChefHat, Loader2 } from "lucide-react";
import { useProducts, useCategories } from '@/modules/logistics';
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Product } from "@nexus/contracts";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { JsonObject } from "@/shared/types/json";
import { toMicrounits } from "@/shared/schemas/primitives";

import type { MenuBuilderEditForm } from "@/modules/ops/menu-builder/menuBuilderConstants";
import { CategorySidebar } from "@/modules/ops/menu-builder/components/CategorySidebar";
import { ProductCardGrid } from "@/modules/ops/menu-builder/components/ProductCardGrid";
import { ProductEditModal } from "@/modules/ops/menu-builder/components/ProductEditModal";

function MenuBuilderPage() {
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState("");
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState<MenuBuilderEditForm>({ name: '', priceEuros: '', taxRate: '0.10', allergens: [], recipeId: '' });
    const [saving, setSaving] = useState(false);

    const activeCategory = selectedCategory || categories[0]?.id || '';

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.categoryId === activeCategory &&
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [products, activeCategory, searchQuery]
    );

    const openEditor = useCallback((product: Product) => {
        setEditingProduct(product);
        const priceMu = product.priceInMicrounits || 0;
        setEditForm({
            name: product.name,
            priceEuros: (priceMu / 1_000_000).toFixed(2),
            taxRate: (product as JsonObject).taxRate as string || '0.10',
            allergens: (product as JsonObject).allergens as string[] || [],
            recipeId: (product as JsonObject).recipeId as string || '',
        });
    }, []);

    const toggleAllergen = useCallback((id: string) => {
        setEditForm(prev => ({
            ...prev,
            allergens: prev.allergens.includes(id)
                ? prev.allergens.filter(a => a !== id)
                : [...prev.allergens, id]
        }));
    }, []);

    const saveProduct = useCallback(async () => {
        if (!editingProduct) return;
        setSaving(true);
        try {
            const priceInMicrounits = toMicrounits(parseFloat(editForm.priceEuros) || 0);
            const path = Nexus.getTenantPath(`products/${editingProduct.id}`);
            await Nexus.adapter.update(path, {
                name: editForm.name,
                priceInMicrounits,
                taxRate: editForm.taxRate,
                allergens: editForm.allergens,
                recipeId: editForm.recipeId || null,
                updatedAt: Date.now(),
            });
            setEditingProduct(null);
        } catch (err) {
            console.error('[MenuBuilder] Save failed', err);
        } finally {
            setSaving(false);
        }
    }, [editingProduct, editForm]);

    const isLoading = productsLoading || categoriesLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-bg-primary items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <p className="text-text-muted font-bold">Chargement du menu...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-bg-primary">
            <PageHeader
                title="Menu Builder"
                subtitle="Gestion de la carte, des prix, allergènes et liaison recettes."
                icon={ChefHat}
            />

            <div className="flex flex-1 overflow-hidden mt-6 gap-6 px-6 pb-6">
                <CategorySidebar
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelectCategory={setSelectedCategory}
                />

                <ProductCardGrid
                    products={filteredProducts}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenEditor={openEditor}
                />
            </div>

            <ProductEditModal
                editingProduct={editingProduct}
                editForm={editForm}
                saving={saving}
                onClose={() => setEditingProduct(null)}
                onFormChange={setEditForm}
                onToggleAllergen={toggleAllergen}
                onSave={saveProduct}
            />
        </div>
    );
}

export default withPageGuard(MenuBuilderPage, "menu_builder");
