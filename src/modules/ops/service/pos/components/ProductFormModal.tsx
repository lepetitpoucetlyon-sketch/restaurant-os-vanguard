"use client";

import { useState, useEffect } from "react";
import {
    Save,
} from "lucide-react";
import type { ServingMethod } from "@nexus/contracts";
import { Button } from "@ui/button";
import { useRecipes } from '../../../providers/hooks/kitchenHooks';
import { useInventory } from '../../../providers/hooks/catalogHooks';
import { useToast } from "@ui/Toast";
import { Modal } from "@ui/Modal";
import { authedFetch } from "@/lib/client/authedFetch";
import type { Recipe, RecipeIngredient } from "@nexus/contracts/nexus-internal-mapper";

// Sub-components
import { ProductFinancials } from "./product-form/ProductFinancials";
import { ProductIngredients } from "./product-form/ProductIngredients";
import { ProductSteps } from "./product-form/ProductSteps";
import { ProductBasicDetails } from "./product-form/ProductBasicDetails";
import { ProductBarFields } from "./product-form/ProductBarFields";

// Constants
import { ALLERGENS, CATEGORIES_DISH, CATEGORIES_COCKTAIL } from "@/constants/product-form";

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    productType: 'dish' | 'cocktail';
    editProduct?: Recipe;
}

export function ProductFormModal({ isOpen, onClose, productType, editProduct }: ProductFormModalProps) {
    const { data: ingredients = [] } = useInventory();
    const { data: _recipes, add: addRecipe, updateRecipe, calculateRecipeCost: calculateRecipeCostHook } = useRecipes();
    const { showToast } = useToast();

    const calculateRecipeCost = (ings: Array<{ ingredientId: string; quantity: number }>) => {
        return calculateRecipeCostHook({
            ingredients: ings.map((ri) => {
                const ing = (ingredients as Array<{ id?: string }>).find((i) => i?.id === ri.ingredientId);
                return { ...ing, quantity: ri.quantity };
            })
        } as unknown as Recipe);
    };

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [sellPriceInCents, setSellPriceInCents] = useState<number>(0);
    const [prepTime, setPrepTime] = useState<number>(0);
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
    const [isVegetarian, setIsVegetarian] = useState(false);
    const [isVegan, setIsVegan] = useState(false);
    const [isGlutenFree, setIsGlutenFree] = useState(false);
    const [recipeIngredients, setRecipeIngredients] = useState<Array<{ ingredientId: string; quantity: number }>>([]);
    const [recipeSteps, setRecipeSteps] = useState<Array<{ order: number; instruction: string; duration?: number }>>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bar recipe fields
    const [baseSpirit, setBaseSpirit] = useState("");
    const [mixersInput, setMixersInput] = useState<string[]>([]);
    const [newMixerInput, setNewMixerInput] = useState("");
    const [garnish, setGarnish] = useState("");
    const [servingMethod, setServingMethod] = useState<ServingMethod>("built");
    const [glassType, setGlassType] = useState("");

    useEffect(() => {
        if (editProduct && isOpen) {
            setName(String(editProduct.name || ""));
            setDescription(String(editProduct.description || ""));
            setCategory(String(editProduct.category || ""));
            setSellPriceInCents(Number((editProduct.sellingPriceInCents ?? Math.round((editProduct.sellingPriceInMicrounits ?? 0) / 10_000)) || 0));
            setPrepTime(Number(editProduct.preparationTimeMinutes || 0));
            setSelectedAllergens(editProduct.allergens || []);
            setIsVegetarian(editProduct?.isVegetarian || false);
            setIsVegan(editProduct?.isVegan || false);
            setIsGlutenFree(editProduct?.isGlutenFree || false);
            setRecipeIngredients((editProduct?.ingredients || []).map((i) => ({
                ingredientId: (i as { ingredientId?: string; id?: string }).ingredientId ?? (i as { id?: string }).id ?? "",
                quantity: i.quantity
            })));
            setRecipeSteps(editProduct?.recipeSteps || []);
            setBaseSpirit(String(editProduct.baseSpirit ?? ""));
            setMixersInput((editProduct.mixers ?? []) as string[]);
            setGarnish(String(editProduct.garnish ?? ""));
            setServingMethod((editProduct.servingMethod as ServingMethod) ?? "built");
            setGlassType(String(editProduct.glassType ?? ""));
        } else if (isOpen) {
            setName("");
            setDescription("");
            setCategory("");
            setSellPriceInCents(0);
            setPrepTime(0);
            setSelectedAllergens([]);
            setIsVegetarian(false);
            setIsVegan(false);
            setIsGlutenFree(false);
            setRecipeIngredients([]);
            setRecipeSteps([]);
            setBaseSpirit("");
            setMixersInput([]);
            setNewMixerInput("");
            setGarnish("");
            setServingMethod("built");
            setGlassType("");
        }
    }, [editProduct, isOpen]);

    // Helpers for ingredients
    const addIngredient = () => {
        setRecipeIngredients((prev) => [...prev, { ingredientId: "", quantity: 1 }]);
    };
    const updateIngredient = (index: number, field: 'ingredientId' | 'quantity', value: string | number) => {
        setRecipeIngredients((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };
    const removeIngredient = (index: number) => {
        setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    // Helpers for steps
    const addStep = () => {
        setRecipeSteps((prev) => [...prev, { order: prev.length + 1, instruction: "", duration: 5 }]);
    };
    const updateStep = (index: number, field: 'instruction' | 'duration', value: string | number) => {
        setRecipeSteps((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };
    const removeStep = (index: number) => {
        setRecipeSteps((prev) => prev.filter((_, i) => i !== index).map((s, idx) => ({ ...s, order: idx + 1 })));
    };

    const calculatedCost = calculateRecipeCost(recipeIngredients);
    const margin = sellPriceInCents > 0 ? ((sellPriceInCents - calculatedCost) / sellPriceInCents) * 100 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category) {
            showToast("Le nom et la catégorie sont obligatoires", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const recipeData: Partial<Recipe> = {
                name,
                description,
                category,
                type: productType,
                sellingPriceInCents: sellPriceInCents,
                sellingPriceInMicrounits: sellPriceInCents * 10_000,
                costInCents: calculatedCost,
                costInMicrounits: calculatedCost * 10_000,
                preparationTimeMinutes: prepTime,
                allergens: selectedAllergens,
                isVegetarian,
                isVegan,
                isGlutenFree,
                ingredients: recipeIngredients as unknown as RecipeIngredient[],
                recipeSteps,
                ...(productType === 'cocktail' ? {
                    baseSpirit,
                    mixers: mixersInput,
                    garnish,
                    servingMethod,
                    glassType,
                } : {}),
                status: 'active',
                updatedAt: new Date().toISOString()
            };

            if (editProduct) {
                await updateRecipe(editProduct.id, recipeData);
                showToast("Produit mis à jour avec succès", "success");
            } else {
                await addRecipe({ ...recipeData, createdAt: new Date().toISOString() } as Omit<Recipe, 'id'>);
                showToast("Nouveau produit créé", "success");
            }

            try {
                await authedFetch('/api/admin/fleet/ota-broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scope: 'all',
                        maintenanceMode: false,
                        message: `Catalog update: ${name}`
                    })
                });
            } catch {
                // non-blocking
            }

            onClose();
        } catch {
            showToast("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = productType === 'dish' ? CATEGORIES_DISH : CATEGORIES_COCKTAIL;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editProduct ? `Modifier ${editProduct.name}` : `Nouveau ${productType === 'dish' ? 'Plat' : 'Cocktail'}`}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <ProductBasicDetails
                    name={name}
                    setName={setName}
                    description={description}
                    setDescription={setDescription}
                    category={category}
                    setCategory={setCategory}
                    categories={categories}
                    selectedAllergens={selectedAllergens}
                    setSelectedAllergens={setSelectedAllergens}
                    allergensList={ALLERGENS}
                    isVegetarian={isVegetarian}
                    setIsVegetarian={setIsVegetarian}
                    isVegan={isVegan}
                    setIsVegan={setIsVegan}
                    isGlutenFree={isGlutenFree}
                    setIsGlutenFree={setIsGlutenFree}
                    productType={productType}
                />

                {productType === 'cocktail' && (
                    <ProductBarFields
                        baseSpirit={baseSpirit}
                        setBaseSpirit={setBaseSpirit}
                        mixersInput={mixersInput}
                        setMixersInput={setMixersInput}
                        newMixerInput={newMixerInput}
                        setNewMixerInput={setNewMixerInput}
                        garnish={garnish}
                        setGarnish={setGarnish}
                        servingMethod={servingMethod}
                        setServingMethod={setServingMethod}
                        glassType={glassType}
                        setGlassType={setGlassType}
                    />
                )}

                <ProductFinancials
                    sellPriceInCents={sellPriceInCents}
                    setSellPriceInCents={setSellPriceInCents}
                    prepTime={prepTime}
                    setPrepTime={setPrepTime}
                    calculatedCost={calculatedCost}
                    margin={margin}
                />

                <ProductIngredients
                    recipeIngredients={recipeIngredients}
                    ingredients={ingredients as unknown as import('@nexus/contracts').Ingredient[]}
                    addIngredient={addIngredient}
                    updateIngredient={updateIngredient}
                    removeIngredient={removeIngredient}
                />

                <ProductSteps
                    recipeSteps={recipeSteps}
                    addStep={addStep}
                    updateStep={updateStep}
                    removeStep={removeStep}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="default" disabled={isSubmitting} className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {isSubmitting ? "Enregistrement..." : "Enregistrer le produit"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
