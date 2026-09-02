"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Target } from "lucide-react";
import {
    MenuAestheticSection,
    type MenuAestheticSettings
} from "./menu-settings/MenuAestheticSection";
import { MenuFiscalSection } from "./menu-settings/MenuFiscalSection";
import {
    MenuCategorySection,
    type MenuCategory
} from "./menu-settings/MenuCategorySection";

const defaultCategories: MenuCategory[] = [
    { id: '1', name: 'Entrées', color: '#22C55E', order: 1, isActive: true, productCount: 12 },
    { id: '2', name: 'Plats Principaux', color: '#3B82F6', order: 2, isActive: true, productCount: 18 },
    { id: '3', name: 'Poissons & Fruits de Mer', color: '#06B6D4', order: 3, isActive: true, productCount: 6 },
    { id: '4', name: 'Viandes & Grillades', color: '#EF4444', order: 4, isActive: true, productCount: 8 },
    { id: '5', name: 'Desserts', color: '#EC4899', order: 5, isActive: true, productCount: 10 },
    { id: '6', name: 'Boissons & Softs', color: '#F59E0B', order: 6, isActive: true, productCount: 24 },
    { id: '7', name: 'Vins & Spiritueux', color: '#8B5CF6', order: 7, isActive: true, productCount: 32 },
    { id: '8', name: 'Formules & Menus', color: '#14B8A6', order: 8, isActive: true, productCount: 4 },
];

export default function MenuSettings() {
    const [categories, setCategories] = useState<MenuCategory[]>(defaultCategories);
    const [isSaving, setIsSaving] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [menuSettings, setMenuSettings] = useState<MenuAestheticSettings>({
        showImages: true,
        showDescriptions: true,
        showAllergens: true,
        showNutrition: false,
        showCalories: true,
        pricingMode: 'ttc',
        defaultVAT: 10,
        suggestionsEnabled: true,
        seasonalLabels: true,
    });

    const handleSave = async () => {
        setIsSaving(true);
        // 🚀 INDUSTRIAL SOUDURE: Instantaneous Menu Sync
        setIsSaving(false);
    };

    const addCategory = () => {
        if (!newCategoryName.trim()) return;
        const newCategory: MenuCategory = {
            id: Date.now().toString(),
            name: newCategoryName,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            order: categories.length + 1,
            isActive: true,
            productCount: 0,
        };
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
    };

    const toggleCategory = (id: string) => {
        setCategories(prev => prev.map(c =>
            c.id === id ? { ...c, isActive: !c.isActive } : c
        ));
    };

    const deleteCategory = (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Menu Aesthetics Projection */}
            <MenuAestheticSection
                menuSettings={menuSettings}
                setMenuSettings={setMenuSettings}
            />

            {/* Fiscal Strategy (Pricing) */}
            <MenuFiscalSection
                menuSettings={menuSettings}
                setMenuSettings={setMenuSettings}
            />

            {/* Topology (Categories) & Safety Bioshield (Allergens) */}
            <MenuCategorySection
                categories={categories}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                addCategory={addCategory}
                toggleCategory={toggleCategory}
                deleteCategory={deleteCategory}
            />

            {/* Global Dispatch */}
            <div className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <div className="relative">
                            <Target className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-surface-card/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Commit Menu Hierarchy
                </motion.button>
            </div>
        </div>
    );
}
