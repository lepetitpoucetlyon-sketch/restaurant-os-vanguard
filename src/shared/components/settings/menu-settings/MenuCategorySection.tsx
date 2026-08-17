"use client";

import { motion } from "framer-motion";
import {
    ChefHat,
    Plus,
    Trash2,
    GripVertical,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";

export interface MenuCategory {
    id: string;
    name: string;
    color: string;
    order: number;
    isActive: boolean;
    productCount: number;
}

const ALLERGENS = [
    'Gluten', 'Crustaceans', 'Eggs', 'Finned Fish', 'Arachides', 'Soy Poly',
    'Dairy Node', 'Nut Matrix', 'Celery', 'Mustard', 'Sesame', 'Sulfites', 'Lupin', 'Mollusks'
];

interface MenuCategorySectionProps {
    categories: MenuCategory[];
    newCategoryName: string;
    setNewCategoryName: (v: string) => void;
    addCategory: () => void;
    toggleCategory: (id: string) => void;
    deleteCategory: (id: string) => void;
}

export function MenuCategorySection({
    categories,
    newCategoryName,
    setNewCategoryName,
    addCategory,
    toggleCategory,
    deleteCategory
}: MenuCategorySectionProps) {
    return (
        <>
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
                                        className="absolute top-1 left-1 w-4 h-4 bg-surface-card rounded-full shadow-md"
                                    />
                                </button>
                                <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className="w-10 h-10 bg-status-danger/5 text-status-danger hover:bg-status-danger hover:text-text-primary rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
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
        </>
    );
}
