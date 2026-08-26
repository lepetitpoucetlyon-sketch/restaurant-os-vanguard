"use client";

import { useState, useMemo, useCallback } from "react";
import { PageShell } from "@/shared/components/ui/PageShell";
import { SkeletonList } from "@/shared/components/ui/SkeletonList";
import { ChefHat } from "lucide-react";
import { useProducts, useCategories } from '@/modules/logistics';
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Product } from "@nexus/contracts";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import type { JsonObject } from "@/shared/types/json";
import { toMicrounits } from "@/shared/schemas/primitives";

import type { MenuBuilderEditForm } from "@/modules/ops";
import { CategorySidebar, ProductCardGrid, ProductEditModal } from "@/modules/ops";

function MenuBuilderPage() {
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState("");
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState<MenuBuilderEditForm>({ name: '', priceEuros: '', taxRate: '0.10', allergens: [], recipeId: '' });
    const [saving, setSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

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

    /**
     * Ouvre l'éditeur sur un produit neuf. Le brouillon porte déjà son id et sa
     * catégorie : `saveProduct` distingue création et édition sur `isCreating`,
     * car `update` sur un chemin inexistant échouerait.
     */
    const createProduct = useCallback(() => {
        if (!activeCategory) {
            setFeedback("Créez d'abord une catégorie : un plat doit être rangé quelque part.");
            return;
        }
        const draft = {
            id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: '',
            priceInMicrounits: 0,
            categoryId: activeCategory,
        } as unknown as Product;

        setIsCreating(true);
        setEditingProduct(draft);
        setEditForm({ name: '', priceEuros: '', taxRate: '0.10', allergens: [], recipeId: '' });
    }, [activeCategory]);

    const createCategory = useCallback(async (name: string) => {
        const label = name.trim();
        if (!label) return;
        setFeedback(null);
        try {
            const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await Nexus.adapter.set(Nexus.getTenantPath(`categories/${id}`), {
                id,
                name: label,
                order: categories.length,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            setSelectedCategory(id);
        } catch (err) {
            setFeedback(`Création de la catégorie impossible : ${err instanceof Error ? err.message : String(err)}`);
        }
    }, [categories.length]);

    const saveProduct = useCallback(async () => {
        if (!editingProduct) return;
        if (!editForm.name.trim()) {
            setFeedback('Donnez un nom au plat avant d\'enregistrer.');
            return;
        }
        setSaving(true);
        setFeedback(null);
        try {
            const priceInMicrounits = toMicrounits(parseFloat(editForm.priceEuros) || 0);
            const path = Nexus.getTenantPath(`products/${editingProduct.id}`);
            const payload = {
                name: editForm.name.trim(),
                priceInMicrounits,
                taxRate: editForm.taxRate,
                allergens: editForm.allergens,
                recipeId: editForm.recipeId || null,
                updatedAt: Date.now(),
            };

            if (isCreating) {
                await Nexus.adapter.set(path, {
                    ...payload,
                    id: editingProduct.id,
                    categoryId: editingProduct.categoryId,
                    createdAt: Date.now(),
                });
            } else {
                await Nexus.adapter.update(path, payload);
            }
            setEditingProduct(null);
            setIsCreating(false);
        } catch (err) {
            // Sans ce retour, l'enregistrement échouait en silence : le gérant
            // refermait l'éditeur en croyant son plat enregistré.
            setFeedback(`Enregistrement impossible : ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSaving(false);
        }
    }, [editingProduct, editForm, isCreating]);

    const closeEditor = useCallback(() => {
        setEditingProduct(null);
        setIsCreating(false);
    }, []);

    const isLoading = productsLoading || categoriesLoading;

    if (isLoading) {
        return (
            <PageShell
                kicker="Carte"
                title="Menu Builder"
                subtitle="Gestion de la carte, des prix, allergènes et liaison recettes."
                icon={ChefHat}
                breadcrumbs={[{ label: "Opérations" }, { label: "Menu Builder" }]}
            >
                <div className="p-6">
                    <SkeletonList variant="card" count={6} />
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Menu Builder"
            subtitle="Gestion de la carte, des prix, allergènes et liaison recettes."
            icon={ChefHat}
            breadcrumbs={[{ label: "Opérations" }, { label: "Menu Builder" }]}
        >
            {feedback && (
                <div role="alert" className="mx-6 mt-6 px-4 py-3 rounded-2xl bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm font-medium">
                    {feedback}
                </div>
            )}

            <div className="flex flex-1 overflow-hidden gap-6 p-6">
                <CategorySidebar
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelectCategory={setSelectedCategory}
                    onCreateCategory={createCategory}
                />

                <ProductCardGrid
                    products={filteredProducts}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenEditor={openEditor}
                    onCreateProduct={createProduct}
                />
            </div>

            <ProductEditModal
                editingProduct={editingProduct}
                editForm={editForm}
                saving={saving}
                isCreating={isCreating}
                onClose={closeEditor}
                onFormChange={setEditForm}
                onToggleAllergen={toggleAllergen}
                onSave={saveProduct}
            />
        </PageShell>
    );
}

export default withPageGuard(MenuBuilderPage, "menu_builder");
