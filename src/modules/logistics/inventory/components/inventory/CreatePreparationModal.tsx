import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@ui/Modal";
import { PremiumSelect } from "@ui/PremiumSelect";
import { ChefHat, X, Check, MapPin, Package, RefreshCw, Plus, Minus, Calendar } from "lucide-react";
import { useInventory } from "@/modules/ops/providers/NexusOpsProvider";
import { useAuth } from "@/shared/hooks";
import { IngredientUnit, PreparationType, DEFAULT_STORAGE_LOCATIONS } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";;

const PREPARATION_TYPES: { value: PreparationType; label: string }[] = [
    { value: 'mise_en_place', label: 'Mise en place générale' },
    { value: 'sauce', label: 'Sauce' },
    { value: 'fond', label: 'Fond / Bouillon' },
    { value: 'marinade', label: 'Marinade' },
    { value: 'bouillon', label: 'Bouillon' },
    { value: 'pate', label: 'Pâte (boulangerie/pâtisserie)' },
    { value: 'garniture', label: 'Garniture' },
    { value: 'decoupe', label: 'Découpe / Portionnage' },
    { value: 'assemblage', label: 'Assemblage prêt à cuire' },
    { value: 'dessert_base', label: 'Base dessert (crème, ganache...)' },
    { value: 'other', label: 'Autre' }
];

const CONTAINER_OPTIONS = [
    'Bac GN 1/1',
    'Bac GN 1/2',
    'Bac GN 1/3',
    'Bac GN 1/4',
    'Bac GN 1/6',
    'Bac GN 1/9',
    'Seau 5L',
    'Seau 10L',
    'Bocal 1L',
    'Film alimentaire',
    'Autre'
];

const UNIT_OPTIONS: IngredientUnit[] = ['kg', 'g', 'l', 'ml', 'unit', 'piece'];

interface CreatePreparationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreatePreparationModal({ isOpen, onClose }: CreatePreparationModalProps) {
    const { stockItems, addPreparation, storageLocations, consumeStock } = useInventory();
    const { currentUser } = useAuth();

    const [name, setName] = useState('');
    const [type, setType] = useState<PreparationType>('mise_en_place');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState<IngredientUnit>('kg');
    const [portions, setPortions] = useState('');
    const [storageLocation, setStorageLocation] = useState('frigo_5');
    const [containerId, setContainerId] = useState('');
    const [dlcDays, setDlcDays] = useState('3');
    const [notes, setNotes] = useState('');

    // Ingredients used
    const [usedIngredients, setUsedIngredients] = useState<{
        stockItemId: string;
        ingredientName: string;
        quantityUsed: number;
        unit: IngredientUnit;
    }[]>([]);
    const [selectedStockItem, setSelectedStockItem] = useState('');
    const [ingredientQty, setIngredientQty] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const addIngredient = () => {
        const stock = stockItems.find(s => s.id === selectedStockItem);
        if (!stock || !ingredientQty) return;

        setUsedIngredients([...usedIngredients, {
            stockItemId: stock.id,
            ingredientName: stock.ingredientName as string,
            quantityUsed: parseFloat(ingredientQty),
            unit: stock.unit as IngredientUnit
        }]);
        setSelectedStockItem('');
        setIngredientQty('');
    };

    const removeIngredient = (index: number) => {
        setUsedIngredients(usedIngredients.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name || !quantity || !storageLocation) return;

        setIsSubmitting(true);

        const dlcDate = new Date();
        dlcDate.setDate(dlcDate.getDate() + parseInt(dlcDays));

        // Deduct stock for used ingredients
        for (const ing of usedIngredients) {
            await consumeStock(ing.stockItemId, ing.quantityUsed, `Préparation: ${name}`);
        }

        // Calculate total cost in cents
        const totalCostInCents = usedIngredients.reduce((acc, used) => {
            const stock = stockItems.find(s => s.id === used.stockItemId);
            if (stock && stock.unitCostInCents) {
                return acc + Math.round(used.quantityUsed * (Number(stock.unitCostInCents) || 0));
            }
            return acc;
        }, 0);

        // Create the preparation
        await addPreparation({
            name,
            type,
            quantity: parseFloat(quantity),
            unit,
            portions: portions ? parseInt(portions) : undefined,
            storageLocationId: storageLocation,
            containerId: containerId || undefined,
            preparationDate: new Date().toISOString().split('T')[0],
            preparedBy: currentUser?.name || 'Chef',
            dlc: dlcDate.toISOString().split('T')[0],
            ingredients: usedIngredients,
            status: 'fresh',
            notes: notes || '',
            costInCents: totalCostInCents
        });

        setIsSubmitting(false);
        setSuccess(true);

        // Instant reset and closure - zero delay mandate
        setName('');
        setQuantity('');
        setPortions('');
        setNotes('');
        setUsedIngredients([]);
        onClose();
    };

    const activeLocations = storageLocations.length > 0 ? storageLocations : DEFAULT_STORAGE_LOCATIONS;
    const availableStock = stockItems.filter(s => s.status === 'available' && (Number(s.quantity) || 0) > 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            showClose={false}
            className="p-0 border-none bg-transparent"
        >
            <div className="relative bg-[#F8F7F2] border border-white/40 rounded-[3rem] shadow-premium w-full max-h-[90vh] flex flex-col overflow-hidden group/modal">
                {/* Cinematic Background Elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/5 blur-[80px] pointer-events-none rounded-full" />

                {/* Header */}
                <div className="p-10 border-b border-border/40 bg-surface-card/40 backdrop-blur-md relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[22px] bg-text-primary flex items-center justify-center shadow-premium">
                                <ChefHat className="w-8 h-8 text-white" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-serif font-black text-text-primary italic tracking-tight">Sceau de Préparation.</h2>
                                <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mt-2">Mise en place & Alchimie Culinaire</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-surface-card/60 hover:bg-surface-card flex items-center justify-center transition-all border border-border/40 hover:rotate-90 hover:scale-110 shadow-soft"
                        >
                            <X className="w-5 h-5 text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 elegant-scrollbar relative z-10">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-24 h-24 rounded-[2.5rem] bg-text-primary flex items-center justify-center mb-10 shadow-premium"
                            >
                                <Check className="w-12 h-12 text-white" strokeWidth={3} />
                            </motion.div>
                            <p className="text-4xl font-serif font-black text-text-primary italic">Mise en Place Scellée.</p>
                            <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mt-4">L&apos;œuvre culinaire a été archivée avec succès</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Identity Section */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-gold shadow-glow" />
                                        NOM DE L&apos;ŒUVRE *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="EX: SAUCE BÉARNAISE"
                                        className="w-full px-8 py-5 bg-surface-card/60 border border-border/40 rounded-2xl text-[14px] font-black text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-accent-gold focus:ring-4 focus:ring-accent-gold/5 transition-all tracking-widest shadow-soft"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2 text-nowrap">
                                        CATÉGORIE PROTOCOLE
                                    </label>
                                    <PremiumSelect
                                        value={type}
                                        onChange={(val) => setType(val as PreparationType)}
                                        options={PREPARATION_TYPES.map(t => ({
                                            value: String(t.value),
                                            label: t.label?.toUpperCase() || ''
                                        }))}
                                    />
                                </div>
                            </div>

                            {/* Measurement Grid */}
                            <div className="grid grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] px-2">RENDEMENT *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-6 py-5 bg-surface-card border border-border/40 rounded-2xl text-[20px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest shadow-soft"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] px-2 text-center block">UNITÉ PROTOCOLE</label>
                                    <PremiumSelect
                                        value={unit}
                                        onChange={(val) => setUnit(val as IngredientUnit)}
                                        options={UNIT_OPTIONS.map(u => ({
                                            value: String(u),
                                            label: u?.toUpperCase() || ''
                                        }))}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] px-2 text-right block">PORTIONS</label>
                                    <input
                                        type="number"
                                        value={portions}
                                        onChange={(e) => setPortions(e.target.value)}
                                        placeholder="OPT"
                                        className="w-full px-6 py-5 bg-surface-card border border-border/40 rounded-2xl text-[20px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest shadow-soft"
                                    />
                                </div>
                            </div>

                            {/* Logistics Grid */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-primary uppercase tracking-[0.4em] px-2">
                                        <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                                        ARCHIVE DE STOCKAGE *
                                    </label>
                                    <PremiumSelect
                                        value={storageLocation}
                                        onChange={setStorageLocation}
                                        options={activeLocations.filter(l => l.isActive).map(loc => ({
                                            value: String(loc.id),
                                            label: String(loc.name || '').toUpperCase()
                                        }))}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] px-2">
                                        VÉHICULE / CONTENEUR
                                    </label>
                                    <PremiumSelect
                                        value={containerId}
                                        onChange={setContainerId}
                                        options={CONTAINER_OPTIONS.map(c => ({
                                            value: String(c),
                                            label: c?.toUpperCase() || ''
                                        }))}
                                    />
                                </div>
                            </div>

                            {/* Alchemical Composition (Ingredients) */}
                            <div className="bg-surface-card/40 backdrop-blur-md rounded-[2.5rem] p-10 border border-border/40 space-y-10 shadow-soft">
                                <label className="flex items-center gap-4 text-[11px] font-black text-text-primary uppercase tracking-[0.5em] mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center shadow-soft">
                                        <Package className="w-4 h-4 text-accent-gold" />
                                    </div>
                                    COMPOSITION ALCHIMIQUE.
                                </label>

                                <div className="flex items-center gap-6">
                                    <div className="flex-1">
                                        <PremiumSelect
                                            value={selectedStockItem}
                                            onChange={setSelectedStockItem}
                                            options={availableStock.map(s => ({
                                                value: String(s.id),
                                                label: String(s.ingredientName || '').toUpperCase(),
                                                description: `${s.quantity} ${String(s.unit || '').toUpperCase()} EN ARCHIVE`
                                            }))}
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={ingredientQty}
                                        onChange={(e) => setIngredientQty(e.target.value)}
                                        placeholder="QTÉ"
                                        className="w-40 px-6 py-6 bg-surface-card border border-border/40 rounded-2xl text-[16px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest placeholder:text-text-muted/20 shadow-soft"
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05, rotate: 90 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={addIngredient}
                                        disabled={!selectedStockItem || !ingredientQty}
                                        className="w-16 h-16 rounded-2xl bg-text-primary text-white flex items-center justify-center disabled:bg-text-muted/10 disabled:text-text-muted/20 transition-all shadow-premium"
                                    >
                                        <Plus className="w-8 h-8" strokeWidth={2.5} />
                                    </motion.button>
                                </div>

                                {usedIngredients.length > 0 && (
                                    <div className="grid grid-cols-1 gap-4">
                                        <AnimatePresence mode="popLayout">
                                            {usedIngredients.map((ing, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    key={idx}
                                                    className="flex items-center justify-between px-8 py-5 bg-surface-card/60 border border-border/20 rounded-2xl group/inv hover:bg-surface-card transition-all shadow-soft"
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-2 h-2 rounded-full bg-accent-gold shadow-glow" />
                                                        <span className="text-[12px] font-black text-text-primary uppercase tracking-widest">{ing.ingredientName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <span className="text-[14px] font-serif italic font-black text-accent-gold">{ing.quantityUsed} {ing.unit.toUpperCase()}</span>
                                                        <button
                                                            onClick={() => removeIngredient(idx)}
                                                            className="w-10 h-10 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error hover:text-white transition-all opacity-0 group-hover/inv:opacity-100"
                                                        >
                                                            <Minus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Cycle de Vie & Notes */}
                            <div className="grid grid-cols-1 gap-12">
                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-[0.5em] px-2 outline-none">
                                        <Calendar className="w-4 h-4 text-accent-gold" />
                                        CYCLE DE VIE (DLC PROTOCOLE)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {['1', '2', '3', '4', '5', '7'].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setDlcDays(d)}
                                                className={cn(
                                                    "flex-1 py-5 rounded-[22px] text-[11px] font-black uppercase tracking-[0.3em] transition-all border shadow-soft",
                                                    dlcDays === d
                                                        ? "bg-text-primary border-text-primary text-white shadow-premium scale-105"
                                                        : "bg-surface-card/60 border-border/40 text-text-muted hover:bg-surface-card hover:border-accent-gold/20"
                                                )}
                                            >
                                                J+{d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-[0.5em] px-2 outline-none">
                                        OBSERVATIONS PROTOCOLÉES
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="NOTES SUR L'ŒUVRE..."
                                        rows={3}
                                        className="w-full px-8 py-6 bg-surface-card/60 border border-border/40 rounded-3xl text-[13px] font-black text-text-primary focus:outline-none focus:border-accent-gold transition-all placeholder:text-text-muted/20 tracking-widest shadow-soft resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-10 border-t border-border/40 bg-surface-card/40 backdrop-blur-md flex items-center justify-between gap-6 relative z-10">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.5em] text-text-muted hover:text-text-primary transition-all rounded-[22px]"
                        >
                            ANNULATION
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={!name || !quantity || !storageLocation || isSubmitting}
                            className={cn(
                                "flex items-center gap-6 px-16 py-6 rounded-[22px] text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-500 shadow-premium",
                                name && quantity && storageLocation
                                    ? "bg-text-primary text-white hover:bg-accent-gold"
                                    : "bg-text-muted/10 text-text-muted/20 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                                <ChefHat className="w-6 h-6" />
                            )}
                            {isSubmitting ? "SCELLAGE..." : "SCELLER L'ALCHIMIE"}
                        </motion.button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
