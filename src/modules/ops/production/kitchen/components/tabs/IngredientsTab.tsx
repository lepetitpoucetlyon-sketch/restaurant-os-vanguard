import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Package, Tag, Truck, Save, X } from "lucide-react";
import { formatMu } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";
import { cinematicContainer, fadeInUp, cinematicItem } from "@/shared/utils/motion";
import { useInventory } from '../../../../providers/hooks/catalogHooks';
import { Modal } from "@/shared/components/ui/Modal";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { useTenant } from "@/shared/hooks/useTenant";
import { toast } from "sonner";
import type { Ingredient } from "@nexus/contracts";

export function IngredientsTab() {
    const { activeTenantId } = useTenant();
    const tenantId = activeTenantId || 'default';
    const { data: rawIngredients, isLoading, error } = useInventory();
    const ingredients = (rawIngredients || []) as unknown as Ingredient[];
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
    const [formName, setFormName] = useState("");
    const [formCategory, setFormCategory] = useState("Sec");
    const [formUnit, setFormUnit] = useState("kg");
    const [formCostEur, setFormCostEur] = useState("0");
    const [formMinQty, setFormMinQty] = useState("0");
    const [formSupplier, setFormSupplier] = useState("Nexus");

    const categories = ["all", ...Array.from(new Set((ingredients || []).map((i) => String(i.category || 'other'))))];

    const filteredIngredients = (ingredients || []).filter((ing) => {
        const matchesSearch = String(ing.name || ing.ingredientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(ing.supplierName || 'Nexus').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || ing.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleOpenCreate = () => {
        setEditingIng(null);
        setFormName("");
        setFormCategory("Sec");
        setFormUnit("kg");
        setFormCostEur("0.00");
        setFormMinQty("1");
        setFormSupplier("Nexus");
        setIsModalOpen(true);
    };

    const handleOpenEdit = (ing: Ingredient) => {
        setEditingIng(ing);
        const _i = ing as unknown as { unitCostInMicrounits?: number; costInMicrounits?: number; unitCostInCents?: number; costInCents?: number };
        const _costMu = _i.unitCostInMicrounits ?? _i.costInMicrounits ?? Number(_i.unitCostInCents ?? _i.costInCents ?? 0) * 10_000;
        setFormName(String(ing.name || ing.ingredientName || ""));
        setFormCategory(String(ing.category || "Sec"));
        setFormUnit(String(ing.unit || "kg"));
        setFormCostEur((_costMu / 1_000_000).toFixed(2));
        setFormMinQty(String(ing.minQuantity || 0));
        setFormSupplier(String(ing.supplierName || "Nexus"));
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error("Le nom de l'ingrédient est requis");
            return;
        }

        const costMu = Math.round((parseFloat(formCostEur) || 0) * 1_000_000);
        const minQty = parseFloat(formMinQty) || 0;
        const id = editingIng?.id || `ing_${Date.now()}`;
        const itemPath = `${Nexus.getTenantPath('stockItems', tenantId)}/${id}`;

        const payload = {
            id,
            name: formName.trim(),
            ingredientName: formName.trim(),
            category: formCategory,
            unit: formUnit,
            unitCostInMicrounits: costMu,
            costInMicrounits: costMu,
            minQuantity: minQty,
            supplierName: formSupplier,
            updatedAt: new Date().toISOString(),
        };

        try {
            await Nexus.adapter.set(itemPath, payload);
            toast.success(editingIng ? "Ingrédient mis à jour" : "Ingrédient ajouté au catalogue");
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save ingredient:", err);
            toast.error("Erreur lors de l'enregistrement de l'ingrédient");
        }
    };

    const handleDelete = async (ing: Ingredient) => {
        const name = String(ing.name || ing.ingredientName || "cet ingrédient");
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${name} du catalogue ?`)) {
            return;
        }

        try {
            const itemPath = `${Nexus.getTenantPath('stockItems', tenantId)}/${ing.id}`;
            await Nexus.adapter.delete(itemPath);
            toast.success(`${name} a été supprimé`);
        } catch (err) {
            console.error("Failed to delete ingredient:", err);
            toast.error("Erreur lors de la suppression de l'ingrédient");
        }
    };

    if (isLoading) return <div className="h-96 flex items-center justify-center text-text-muted animate-pulse font-black uppercase tracking-[0.3em]">Synchro Nexus...</div>;
    if (error) return <div className="h-96 flex items-center justify-center text-error border border-error/20 rounded-2xl bg-error/5">Erreur de Réalité : {error}</div>;

    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="space-y-10"
        >
            <motion.div variants={fadeInUp} className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif font-semibold text-text-primary tracking-tight">Catalogue Ingrédients</h2>
                    <p className="text-text-muted text-[13px] mt-2 font-medium">Référentiel des matières premières et coûts unitaires.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-border">
                        {categories.map(cat => (
                            <button
                                key={String(cat)}
                                onClick={() => setSelectedCategory(String(cat))}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-chip-label transition-all",
                                    selectedCategory === String(cat)
                                        ? "bg-accent text-text-primary shadow-lg shadow-accent/20"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                {String(cat)}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-64">
                        <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-elegant w-full h-12 pl-11 pr-4"
                        />
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredIngredients.map((ing) => {
                    const _i = ing as unknown as { unitCostInMicrounits?: number; costInMicrounits?: number; unitCostInCents?: number; costInCents?: number };
                    const _costMu = _i.unitCostInMicrounits ?? _i.costInMicrounits ?? Number(_i.unitCostInCents ?? _i.costInCents ?? 0) * 10_000;
                    return (<motion.div
                        key={ing.id}
                        variants={cinematicItem}
                        whileHover={{ y: -5 }}
                        className="bg-bg-secondary rounded-2xl border border-border p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center group-hover:bg-accent transition-colors">
                                <Package className="w-6 h-6 text-text-muted group-hover:text-text-primary transition-colors" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleOpenEdit(ing)}
                                    title="Modifier l'ingrédient"
                                    aria-label="Modifier l'ingrédient"
                                    className="p-2 rounded-lg bg-bg-tertiary text-text-muted hover:text-accent border border-border"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(ing)}
                                    title="Supprimer l'ingrédient"
                                    aria-label="Supprimer l'ingrédient"
                                    className="p-2 rounded-lg bg-error/5 text-error hover:bg-error/10 border border-error/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                             <div>
                                 <h3 className="text-lg font-serif font-black text-text-primary tracking-tight truncate">{String(ing.ingredientName || ing.name || '')}</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                     <Tag className="w-3 h-3 text-accent" />
                                     <span className="text-nano font-bold text-text-muted uppercase tracking-wider">{String(ing.category || '')}</span>
                                 </div>
                             </div>
 
                             <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                                 <div>
                                     <p className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-1">Coût Unitaire</p>
                                     <p className="text-xl font-mono font-black text-text-primary">{formatMu(_costMu)}<span className="text-nano text-text-muted ml-1">/{String(ing.unit || '')}</span></p>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-1">Stock Min</p>
                                     <p className="text-xl font-mono font-black text-text-primary">{String(ing.minQuantity || 0)} <span className="text-nano text-text-muted ml-0.5">{String(ing.unit || '')}</span></p>
                                 </div>
                             </div>

                            <div className="flex items-center gap-3 text-text-muted">
                                <Truck className="w-4 h-4" />
                                <span className="text-micro font-bold truncate">{String(ing.supplierName || 'Nexus')}</span>
                            </div>
                        </div>
                    </motion.div>);
                })}

                <motion.button
                    onClick={handleOpenCreate}
                    variants={cinematicItem}
                    whileHover={{ scale: 1.02 }}
                    className="h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 hover:border-accent group transition-all cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center group-hover:bg-accent transition-colors">
                        <Plus className="w-8 h-8 text-accent group-hover:text-text-primary transition-colors" />
                    </div>
                    <span className="text-nano font-black uppercase tracking-[0.3em] text-text-muted group-hover:text-accent">Ajouter au Catalogue</span>
                </motion.button>
            </div>

            {/* Modal d'édition/création d'ingrédient */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingIng ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}
                size="md"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Nom de l'ingrédient</label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Ex: Farine T55 Bio"
                                className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Catégorie</label>
                                <input
                                    type="text"
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    placeholder="Ex: Sec, Frais, Liquide"
                                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Unité</label>
                                <input
                                    type="text"
                                    value={formUnit}
                                    onChange={(e) => setFormUnit(e.target.value)}
                                    placeholder="kg, L, pièce"
                                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Coût unitaire (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formCostEur}
                                    onChange={(e) => setFormCostEur(e.target.value)}
                                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Stock minimum</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formMinQty}
                                    onChange={(e) => setFormMinQty(e.target.value)}
                                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Fournisseur</label>
                            <input
                                type="text"
                                value={formSupplier}
                                onChange={(e) => setFormSupplier(e.target.value)}
                                placeholder="Ex: Metro, Transgourmet, Nexus"
                                className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-xl border border-border text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-primary"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-accent text-text-primary font-bold text-xs uppercase tracking-wider hover:opacity-90 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Enregistrer
                        </button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
}
