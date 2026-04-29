"use client";

import { useState, useEffect } from "react";
import {
    X,
    ChefHat,
    Wine,
    Leaf,
    AlertTriangle,
    Save,
    Sparkles,
    Gem
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";
import { useRecipes, useInventory } from "@/engines/ops/NexusOpsProvider";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { AnimatePresence } from "framer-motion";
import type { Recipe } from "@/types";


// Sub-components
import { ProductFinancials } from "./product-form/ProductFinancials";
import { ProductIngredients } from "./product-form/ProductIngredients";
import { ProductSteps } from "./product-form/ProductSteps";

// Constants
import { ALLERGENS, CATEGORIES_DISH, CATEGORIES_COCKTAIL } from "@/constants/product-form";

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    productType: 'dish' | 'cocktail';
    editProduct?: Recipe;
}

export function ProductFormModal({ isOpen, onClose, productType, editProduct }: ProductFormModalProps) {
    const { data: ingredients } = useInventory();
    const { data: recipes, add: addRecipeNode } = useRecipes();
    const { showToast } = useToast();

    // Inline recipe CRUD wrappers
    const addRecipe = async (data: any) => addRecipeNode(data);
    const updateRecipe = async (_id: string, _data: any) => { /* TODO: implement update via Nexus */ };
    const calculateRecipeCost = (ings: Array<{ ingredientId: string; quantity: number }>) => {
        return ings.reduce((total, ri) => {
            const ing = ingredients.find((i: any) => i.id === ri.ingredientId);
            return total + Math.round((Number((ing as any)?.costInCents || 0)) * ri.quantity);
        }, 0);
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

    useEffect(() => {
        if (editProduct && isOpen) {
            setName(editProduct.name || "");
            setDescription(editProduct.description || "");
            setCategory(editProduct.category || "");
            setSellPriceInCents(editProduct.priceInCents || editProduct.sellingPriceInCents || 0);
            setPrepTime(editProduct.prepTime || 0);
            setSelectedAllergens(editProduct.allergens || []);
            setIsVegetarian((editProduct as any).isVegetarian || false);
            setIsVegan((editProduct as any).isVegan || false);
            setIsGlutenFree((editProduct as any).isGlutenFree || false);
            setRecipeIngredients((editProduct as any).ingredients || []);
            setRecipeSteps((editProduct as any).recipeSteps || []);
        } else if (!editProduct && isOpen) {
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
        }
    }, [editProduct, isOpen]);

    const categories = productType === 'dish' ? CATEGORIES_DISH : CATEGORIES_COCKTAIL;
    const calculatedCost = calculateRecipeCost(recipeIngredients);
    const margin = sellPriceInCents > 0 ? ((sellPriceInCents - calculatedCost) / sellPriceInCents) * 100 : 0;

    const toggleAllergen = (id: string) => {
        setSelectedAllergens(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    };

    const addIngredient = () => setRecipeIngredients([...recipeIngredients, { ingredientId: '', quantity: 0 }]);
    const updateIngredient = (index: number, field: 'ingredientId' | 'quantity', value: string | number) => {
        const updated = [...recipeIngredients];
        updated[index] = { ...updated[index], [field]: value };
        setRecipeIngredients(updated);
    };
    const removeIngredient = (index: number) => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));

    const addStep = () => setRecipeSteps([...recipeSteps, { order: recipeSteps.length + 1, instruction: '', duration: undefined }]);
    const updateStep = (index: number, field: 'instruction' | 'duration', value: string | number) => {
        const updated = [...recipeSteps];
        updated[index] = { ...updated[index], [field]: value };
        setRecipeSteps(updated);
    };
    const removeStep = (index: number) => {
        const updated = recipeSteps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
        setRecipeSteps(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category) {
            showToast("Nom et catégorie requis", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const productData = {
                name,
                description,
                category,
                priceInCents: sellPriceInCents,
                sellingPriceInCents: sellPriceInCents,
                costPriceInCents: calculatedCost,
                prepTime,
                allergens: selectedAllergens,
                isVegetarian,
                isVegan,
                isGlutenFree,
                ingredients: recipeIngredients.map((ri, idx) => {
                    const ing = ingredients.find(i => i.id === ri.ingredientId);
                    return {
                        id: `ing_${idx}`,
                        ingredientId: ri.ingredientId,
                        name: ing?.name || '',
                        quantity: ri.quantity,
                        unit: ing?.unit || 'unit',
                        costInCents: Math.round(Number(ing?.costInCents || 0) * ri.quantity),
                    };
                }),
                recipeSteps,
                productType,
                isActive: true,
                color: productType === 'dish' ? '#1B4332' : '#7C3AED',
            };

            if (editProduct) {
                await updateRecipe(editProduct.id, productData);
                showToast("Fiche mise à jour", "success");
            } else {
                await addRecipe(productData);
                showToast("Fiche créée", "success");
            }
            onClose();
        } catch (error) {
            showToast("Erreur d'enregistrement", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" className="p-0 border-none bg-transparent" showClose={false} noPadding>
            <div className="flex flex-col h-[85vh] bg-bg-primary rounded-[3rem] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.3)] border border-white/20">
                {/* Premium Header */}
                <div className={cn("px-10 py-8 text-white relative overflow-hidden", productType === 'dish' ? "bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]" : "bg-gradient-to-br from-[#4C1D95] to-[#7C3AED]")}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                                {productType === 'dish' ? <ChefHat className="w-8 h-8" /> : <Wine className="w-8 h-8" />}
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif font-black tracking-tight flex items-center gap-3">
                                    {editProduct ? 'Modifier' : 'Nouveau'} {productType === 'dish' ? 'Plat Signature' : 'Cocktail Signature'}
                                    <Sparkles className="w-5 h-5 text-accent/80" />
                                </h2>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Configuration de la Fiche Technique de Vente</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto elegant-scrollbar p-10 space-y-10">
                    {/* Section: Identité */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <Gem className="w-4 h-4 text-accent" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Identité de l'Offre</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 lg:col-span-1 space-y-3">
                                <label className="text-[10px] font-bold text-text-muted px-4 font-black uppercase tracking-widest">Intitulé de la Création</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Noix de Saint-Jacques Snackées..." className="w-full h-14 px-6 bg-white dark:bg-bg-secondary rounded-2xl border-2 border-border focus:border-accent font-serif font-black text-lg outline-none transition-all" />
                            </div>
                            <div className="col-span-2 lg:col-span-1">
                                <PremiumSelect label="Classification" value={category} onChange={setCategory} options={categories.map(cat => ({ value: cat, label: cat }))} placeholder="SÉLECTIONNER..." />
                            </div>
                            <div className="col-span-2 space-y-3">
                                <label className="text-[10px] font-bold text-text-muted px-4 font-black uppercase tracking-widest">Description Narrative</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefing pour le personnel de salle et informations clients..." className="w-full h-24 px-6 py-4 bg-white dark:bg-bg-secondary rounded-2xl border-2 border-border focus:border-accent font-bold text-sm outline-none resize-none transition-all" />
                            </div>
                        </div>
                    </div>

                    <ProductFinancials sellPriceInCents={sellPriceInCents} setSellPriceInCents={setSellPriceInCents} prepTime={prepTime} setPrepTime={setPrepTime} calculatedCost={calculatedCost} margin={margin} />

                    {/* Section: Régimes & Allergènes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-2"><Leaf className="w-3.5 h-3.5 text-success" /> Labels Éthiques</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'vegetarian', label: 'VÉGÉTARIEN', icon: '🥗', state: isVegetarian, setState: setIsVegetarian },
                                    { id: 'vegan', label: 'VÉGAN', icon: '🌱', state: isVegan, setState: setIsVegan },
                                    { id: 'glutenFree', label: 'NO GLUTEN', icon: '🌾', state: isGlutenFree, setState: setIsGlutenFree },
                                ].map(opt => (
                                    <button key={opt.id} type="button" onClick={() => opt.setState(!opt.state)} className={cn("px-5 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", opt.state ? "bg-success text-white border-success shadow-lg shadow-success/20" : "bg-white border-border text-text-muted hover:border-text-muted/30")}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-2"><AlertTriangle className="w-3.5 h-3.5 text-error" /> Vigilance Allergènes</label>
                            <div className="flex flex-wrap gap-2">
                                {ALLERGENS.map(a => (
                                    <button key={a.id} type="button" onClick={() => toggleAllergen(a.id)} className={cn("px-4 py-2 rounded-xl border-2 text-[9px] font-black transition-all", selectedAllergens.includes(a.id) ? "bg-error/10 border-error text-error" : "bg-white border-border text-text-muted hover:bg-bg-tertiary")}>{a.name.toUpperCase()}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <ProductIngredients recipeIngredients={recipeIngredients} ingredients={ingredients as any} addIngredient={addIngredient} updateIngredient={updateIngredient} removeIngredient={removeIngredient} />
                    <ProductSteps recipeSteps={recipeSteps} addStep={addStep} updateStep={updateStep} removeStep={removeStep} />
                </div>

                <div className="px-10 py-8 border-t border-border bg-white dark:bg-bg-secondary flex gap-6 shrink-0">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-border bg-white hover:bg-bg-tertiary transition-all">Abandonner</Button>
                    <Button disabled={isSubmitting} onClick={handleSubmit} className={cn("flex-2 px-12 h-14 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all transform hover:scale-[1.02]", productType === 'dish' ? "bg-[#1B4332] hover:bg-black shadow-[#1B4332]/20" : "bg-[#4C1D95] hover:bg-black shadow-[#4C1D95]/20")}>
                        {isSubmitting ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {editProduct ? 'Sauvegarder les modifications' : 'Consigner la Fiche Technique'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
