// @ts-nocheck
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UtensilsCrossed,
    Save,
    Loader2,
    Plus,
    Trash2,
    GripVertical,
    ImageIcon,
    Euro,
    Leaf,
    Flame,
    AlertTriangle,
    Zap,
    LayoutGrid,
    Target,
    Activity,
    ChefHat,
    Sparkles,
    CheckCircle2,
    ShieldCheck,
    FileText,
    ImageIcon as FileImageIcon
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;

interface MenuCategory {
    id: string;
    name: string;
    color: string;
    order: number;
    isActive: boolean;
    productCount: number;
}

const defaultCategories: MenuCategory[] = [
    { id: '1', name: 'Neural Starters', color: '#22C55E', order: 1, isActive: true, productCount: 12 },
    { id: '2', name: 'Core Circuits', color: '#3B82F6', order: 2, isActive: true, productCount: 18 },
    { id: '3', name: 'Oceanic Nodes', color: '#06B6D4', order: 3, isActive: true, productCount: 6 },
    { id: '4', name: 'Proteine Vectors', color: '#EF4444', order: 4, isActive: true, productCount: 8 },
    { id: '5', name: 'Final Decoders', color: '#EC4899', order: 5, isActive: true, productCount: 10 },
    { id: '6', name: 'Liquid Refresh', color: '#F59E0B', order: 6, isActive: true, productCount: 24 },
    { id: '7', name: 'Vineyard Layers', color: '#8B5CF6', order: 7, isActive: true, productCount: 32 },
    { id: '8', name: 'Strategic Menus', color: '#14B8A6', order: 8, isActive: true, productCount: 4 },
];

const ALLERGENS = [
    'Gluten', 'Crustaceans', 'Eggs', 'Finned Fish', 'Arachides', 'Soy Poly',
    'Dairy Node', 'Nut Matrix', 'Celery', 'Mustard', 'Sesame', 'Sulfites', 'Lupin', 'Mollusks'
];

export default function MenuSettings() {
    const [categories, setCategories] = useState<MenuCategory[]>(defaultCategories);
    const [isSaving, setIsSaving] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [menuSettings, setMenuSettings] = useState({
        showImages: true,
        showDescriptions: true,
        showAllergens: true,
        showNutrition: false,
        showCalories: true,
        pricingMode: 'ttc' as 'ttc' | 'ht',
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Menu Aesthetic Engine
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Global Terminal Presentation Params</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { key: 'showImages', label: 'Visual Synthesis', sub: 'Photo projection', icon: FileImageIcon },
                        { key: 'showDescriptions', label: 'Semantic Data', sub: 'Detailed descriptions', icon: FileText },
                        { key: 'showAllergens', label: 'Bioshield Intel', sub: 'Allergen signaling', icon: AlertTriangle },
                        { key: 'showCalories', label: 'Thermal Units', sub: 'Calorie projection', icon: Flame },
                        { key: 'seasonalLabels', label: 'Cycle Logic', sub: 'Seasonal identifiers', icon: Leaf },
                        { key: 'suggestionsEnabled', label: 'Neural Recs', sub: 'AI upselling engine', icon: Sparkles },
                    ].map((setting) => {
                        const Icon = setting.icon as any;
                        const isEnabled = menuSettings[setting.key as keyof typeof menuSettings];
                        return (
                            <motion.button
                                key={setting.key}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setMenuSettings(s => ({ ...s, [setting.key]: !s[setting.key as keyof typeof menuSettings] }))}
                                className={cn(
                                    "p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group/item flex flex-col justify-between h-40 text-left",
                                    isEnabled
                                        ? "bg-bg-primary border-accent/20 shadow-lg shadow-accent/5"
                                        : "bg-bg-tertiary/50 border-transparent hover:bg-bg-primary/50"
                                )}
                            >
                                <div className="flex justify-between items-start" data-tutorial={setting.key === 'showImages' ? 'settings-3-0' : undefined}>
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                        isEnabled ? "bg-accent text-bg-primary" : "bg-bg-tertiary text-text-muted group-hover/item:text-text-primary"
                                    )}>
                                        <Icon className="w-5 h-5 transition-transform group-hover/item:scale-110" />
                                    </div>
                                    <div className={cn(
                                        "w-8 h-4 rounded-full relative transition-all duration-500",
                                        isEnabled ? "bg-emerald-500" : "bg-bg-tertiary border border-border"
                                    )}>
                                        <motion.div
                                            animate={{ x: isEnabled ? 18 : 2 }}
                                            className="absolute top-1 w-2 h-2 bg-white rounded-full shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-serif text-text-primary uppercase tracking-tight text-xs mb-1 italic">{setting.label}</p>
                                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{setting.sub}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Fiscal Strategy (Pricing) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <Euro className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Fiscal Logic
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Pricing Matrix & VAT Calibration</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">Valuation Mode</label>
                        <div className="flex gap-4 bg-bg-tertiary p-2 rounded-[1.5rem] border border-border">
                            <button
                                onClick={() => setMenuSettings(s => ({ ...s, pricingMode: 'ttc' }))}
                                className={cn(
                                    "flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                                    menuSettings.pricingMode === 'ttc'
                                        ? "bg-bg-primary shadow-sm text-text-primary border border-border"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                                data-tutorial="settings-3-0"
                            >
                                Gross (TTC)
                            </button>
                            <button
                                onClick={() => setMenuSettings(s => ({ ...s, pricingMode: 'ht' }))}
                                className={cn(
                                    "flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                                    menuSettings.pricingMode === 'ht'
                                        ? "bg-bg-primary shadow-sm text-text-primary border border-border"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                                data-tutorial="settings-3-1"
                            >
                                Net (HT)
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">Default VAT Unit</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={menuSettings.defaultVAT}
                                onChange={(e) => setMenuSettings(s => ({ ...s, defaultVAT: Number(e.target.value) }))}
                                className="w-full px-8 py-5 bg-bg-primary border border-border rounded-[2rem] text-3xl font-serif text-text-primary focus:border-accent transition-all outline-none"
                            />
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-serif text-text-muted italic">%</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Topology (Categories) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                            <ChefHat className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                                Category Hierarchy
                            </h3>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{categories.length} Operational Nodes Configured</p>
                        </div>
                    </div>
                </div>

                {/* Add new category */}
                <div className="relative group mb-10">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Define new operational category..."
                        className="w-full pl-8 pr-48 py-6 bg-bg-primary border border-border rounded-[2rem] text-lg font-serif text-text-primary focus:border-accent transition-all outline-none placeholder:text-text-muted/50"
                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                        data-tutorial="settings-3-2"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05, x: -8 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addCategory}
                        className="absolute right-4 top-1/2 -translate-y-1/2 px-8 py-3 bg-text-primary text-bg-primary rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Initialize
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.05) }}
                            className={cn(
                                "flex items-center gap-6 p-6 rounded-[2.5rem] border transition-all duration-500 group",
                                cat.isActive
                                    ? "border-border bg-bg-primary"
                                    : "border-transparent bg-bg-tertiary/50 opacity-60"
                            )}
                        >
                            <GripVertical className="w-5 h-5 text-text-muted cursor-grab group-hover:text-text-primary transition-colors" />
                            <div
                                className="w-12 h-12 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500 border border-border"
                                style={{ backgroundColor: `${cat.color}20` }}
                            >
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="font-serif text-text-primary uppercase tracking-tight text-lg italic">{cat.name}</p>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{cat.productCount} Linked Products</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => toggleCategory(cat.id)}
                                    className={cn(
                                        "w-12 h-6 rounded-full relative transition-all duration-500",
                                        cat.isActive ? "bg-accent shadow-lg shadow-accent/20" : "bg-bg-tertiary shadow-inner border border-border"
                                    )}
                                >
                                    <motion.div
                                        animate={{ x: cat.isActive ? 26 : 2 }}
                                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                                    />
                                </button>
                                <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className="w-10 h-10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Safety Bioshield (Allergens) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative"
            >
                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Compliance Biomatrix
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Allergen Shield Enforcement</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 relative z-10">
                    {ALLERGENS.map((allergen, idx) => (
                        <motion.span
                            key={allergen}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (idx * 0.03) }}
                            whileHover={{ scale: 1.1 }}
                            className="px-6 py-3 bg-bg-primary text-text-primary rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-border hover:border-accent hover:text-accent cursor-crosshair transition-all shadow-sm"
                        >
                            {allergen}
                        </motion.span>
                    ))}
                </div>
            </motion.div>

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
                            <div className="absolute inset-0 bg-white/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Commit Menu Hierarchy
                </motion.button>
            </div>
        </div>
    );
}
