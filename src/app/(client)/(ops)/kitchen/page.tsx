
"use client";

import { useState } from "react";
import {
    Utensils,
    BookOpen,
    Trash2,
    ChefHat,
    Timer,
    Calculator,
    Truck,
    ShieldAlert,
    ChevronRight,
    ChevronLeft,
    LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { useKitchen, useManagement, useInventory, useRecipes } from "@/engines/ops/NexusOpsProvider";
import { Recipe, PrepTask, Product, Order } from "@nexus/contracts";
import { useUI } from "@/hooks/useUI";
import { ProductFormModal } from "@/components/modals/ProductFormModal";
import { PrepTaskDetailDialog } from "@modules/ops";
import { RecipeDetailDialog } from "@modules/ops";
import { cinematicContainer, fadeInUp } from "@/lib/motion";
import { useRouter } from "next/navigation";
import { ExpertHub } from "@modules/commerce";

import { MiseEnPlaceTab } from "@modules/ops";
import { RecipesTab } from "@modules/ops";
import { WasteTab } from "@modules/ops";
import { MarginsTab } from "@modules/ops";
import { SuppliersTab } from "@modules/ops";
import { AllergensTab } from "@modules/ops";
import { CookingTimesTab } from "@modules/ops";
import { IngredientsTab } from "@modules/ops";
import { useAtomValue } from "jotai";
import { performanceModeAtom } from "@/store/pillars/sovereign";

type KitchenTab = 'mise-en-place' | 'recipes' | 'ingredients' | 'margins' | 'waste' | 'suppliers' | 'allergens' | 'cooking-times';

export default function KitchenPage() {
    const router = useRouter();
    const ordersData: any[] = []; // Real orders should come from useKitchen
    const [activeTab, setActiveTab] = useState<KitchenTab>('mise-en-place');
    
    // Nexus Grade X Hooks
    const kitchen = useKitchen();
    const recipesHook = useRecipes();
    const management = useManagement();
    const inventory = useInventory();
    const { openDocumentation } = useUI();
    const performanceMode = useAtomValue(performanceModeAtom);

    // Mapping to NexusNode (Grade X)
    const { 
        prepTasks: rawPrepTasks, 
        togglePrepTask, 
        miseEnPlaceTarget 
    } = kitchen;

    const prepTasks = (rawPrepTasks || []) as unknown as import("@nexus/contracts").MiseEnPlaceTask[];

    const {
        data: recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe
    } = recipesHook;
    
    const wasteLogs = [] as any[]; // Suture required for waste
    
    const ingredients = (inventory.stockItems || []) as unknown as import("@nexus/contracts").Ingredient[];
    const products = inventory.stockItems;

    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [selectedPrepTask, setSelectedPrepTask] = useState<PrepTask | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | Recipe | null>(null);

    const [isSideNavOpen, setIsSideNavOpen] = useState(true);

    return (
        <div className="flex flex-1 h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden pb-20 md:pb-0 relative">
            {/* Top-Left Toggle Button (Fixed Position for Performance) */}
            <motion.button
                initial={false}
                animate={{
                    x: isSideNavOpen ? 8 : 4,
                    rotate: isSideNavOpen ? 0 : 180,
                }}
                transition={performanceMode ? { duration: 0 } : {
                    type: "spring",
                    stiffness: 400,
                    damping: 40,
                }}
                onClick={() => setIsSideNavOpen(!isSideNavOpen)}
                className="hidden md:flex absolute top-8 z-[100] w-10 h-10 rounded-2xl bg-white text-accent items-center justify-center shadow-xl shadow-black/10 border border-neutral-200/60 group focus:outline-none"
                title={isSideNavOpen ? "Réduire le menu" : "Développer le menu"}
            >
                <ChevronLeft strokeWidth={2.5} className="w-5 h-5" />
            </motion.button>

            {/* Left Sidebar - Sub Navigation - Hidden on mobile */}
            <AnimatePresence initial={false}>
                {isSideNavOpen && (
                    <motion.div
                        initial={performanceMode ? (false as any) : { opacity: 0, x: -320 }}
                        animate={performanceMode ? (false as any) : { opacity: 1, x: 0 }}
                        exit={performanceMode ? (false as any) : { opacity: 0, x: -320 }}
                        transition={performanceMode ? { duration: 0 } as any : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "hidden md:flex w-[320px] bg-bg-secondary border-r border-border flex-col p-8 elegant-scrollbar overflow-hidden shrink-0",
                            performanceMode ? "" : "backdrop-blur-xl"
                        )}
                    >
                        <div className="mb-10 min-w-[260px]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 shrink-0" /> {/* Spacer for floating button */}
                                <div className="flex-1">
                                    <motion.h1
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-2xl font-serif font-semibold text-text-primary tracking-tight"
                                    >
                                        Gestion Cuisine
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.6 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-2"
                                    >
                                        Opérations & Production
                                    </motion.p>
                                </div>
                            </div>
                        </div>

                        <motion.nav
                            variants={cinematicContainer}
                            initial="hidden"
                            animate="visible"
                            className="space-y-1.5 flex-1 min-w-[260px]"
                        >
                            {(['mise-en-place', 'recipes', 'ingredients', 'margins', 'waste', 'suppliers', 'allergens', 'cooking-times'] as const).map((tab) => {
                                const icons: Record<KitchenTab, LucideIcon> = {
                                    'mise-en-place': Utensils,
                                    'recipes': BookOpen,
                                    'ingredients': Truck,
                                    'margins': Calculator,
                                    'waste': Trash2,
                                    'suppliers': Truck,
                                    'allergens': ShieldAlert,
                                    'cooking-times': Timer
                                };
                                const labels: Record<KitchenTab, string> = {
                                    'mise-en-place': 'Mise en Place',
                                    'recipes': 'Livre de Recettes',
                                    'ingredients': 'Catalogue Ingrédients',
                                    'margins': 'Marges & Rentabilité',
                                    'waste': 'Gaspillage & Pertes',
                                    'suppliers': 'Fiches Fournisseurs',
                                    'allergens': 'Allergènes & Régimes',
                                    'cooking-times': 'Temps de Cuisson'
                                };
                                const Icon = icons[tab];
                                const isActive = activeTab === tab;

                                return (
                                    <motion.button
                                        key={tab}
                                        variants={fadeInUp}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-4 rounded-xl font-bold text-[13px] transition-all duration-300 relative group",
                                            isActive
                                                ? "text-accent"
                                                : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 relative z-10 truncate">
                                            <Icon strokeWidth={1.5} className={cn("w-5 h-5 shrink-0", isActive ? "text-accent" : "text-text-muted")} />
                                            <span className="truncate">{labels[tab]}</span>
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId={performanceMode ? undefined : "activeKitchenTab"}
                                                className="absolute inset-0 bg-bg-tertiary dark:bg-bg-tertiary/50 border border-border/50 rounded-xl shadow-sm z-0"
                                                transition={performanceMode ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.nav>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="p-6 bg-bg-tertiary/40 rounded-xl border border-border/50 mt-10 min-w-[260px]"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                >
                                    <ChefHat strokeWidth={1.5} className="w-4 h-4 text-accent" />
                                </motion.div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-primary">Objectif Prep</span>
                            </div>
                            <p className="text-[12px] text-text-muted leading-relaxed font-medium">
                                Basé sur <span className="text-text-primary font-bold">{Object.keys(miseEnPlaceTarget).length} articles</span> pour les services à venir.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Workspace - Adaptive Layout */}
            <div
                className={cn(
                    "flex-1 overflow-auto p-4 md:p-12 elegant-scrollbar transition-[padding] duration-700 ease-out-expo",
                    !isSideNavOpen ? "md:pl-32" : "md:pl-16"
                )}
            >
                {activeTab === 'mise-en-place' && (
                    <MiseEnPlaceTab
                        prepTasks={prepTasks}
                        togglePrepTask={togglePrepTask}
                        onSelectTask={setSelectedPrepTask}
                    />
                )}

                {activeTab === 'recipes' && (
                    <RecipesTab
                        recipes={recipes}
                        onSelectRecipe={setSelectedRecipe}
                        onEditRecipe={(recipe) => {
                            setEditingProduct(recipe);
                            setShowProductModal(true);
                        }}
                        onDeleteRecipe={(id) => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer cette fiche ?")) {
                                deleteRecipe(id);
                            }
                        }}
                        onNewRecipe={() => {
                            setEditingProduct(null);
                            setShowProductModal(true);
                        }}
                    />
                )}

                {activeTab === 'ingredients' && (
                    <IngredientsTab />
                )}

                {activeTab === 'waste' && (
                    <WasteTab
                        ingredients={ingredients}
                        wasteLogs={wasteLogs}
                    />
                )}

                {activeTab === 'margins' && (
                    <MarginsTab recipes={recipes} />
                )}

                {activeTab === 'suppliers' && (
                    <SuppliersTab />
                )}

                {activeTab === 'allergens' && (
                    <AllergensTab />
                )}

                {activeTab === 'cooking-times' && (
                    <CookingTimesTab />
                )}
            </div>

            {/* Recipe Details Modal */}
            <RecipeDetailDialog
                recipe={selectedRecipe}
                isOpen={!!selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
            />

            {/* Prep Task Detail Modal */}
            <PrepTaskDetailDialog
                isOpen={!!selectedPrepTask}
                onClose={() => setSelectedPrepTask(null)}
                task={selectedPrepTask as any}
                onToggleStatus={(id) => {
                    togglePrepTask(id);
                    setSelectedPrepTask((prev) => prev ? { ...prev, isCompleted: !prev.isCompleted } : null);
                }}
            />

            {/* Product Form Modal */}
            <ProductFormModal
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                }}
                productType="dish"
                editProduct={editingProduct as any}
            />

            {/* Diagnostic & Expertise Center */}
            <ExpertHub 
                domain="recipes" 
            />

        </div>
    );
}
