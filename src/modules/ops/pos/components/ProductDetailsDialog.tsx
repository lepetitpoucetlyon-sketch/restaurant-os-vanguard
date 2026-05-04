"use client";

import { useState } from "react";
import { X, Check, Minus, Plus, ShoppingCart, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@ui/button";
import { ScrollArea } from "@ui/scroll-area";
import { cn } from "@/lib/ui.foundations";;
import { Modal } from "@ui/Modal";
import { Product, OptionGroup, Option } from "@nexus/contracts";
import { useLanguage } from "@/hooks";
import { useNexusFleet } from "@/engines/fleet/NexusFleetProvider";

// Standard EU allergens list
const COMMON_ALLERGENS = [
    { id: 'gluten', name: 'Gluten', icon: '🌾' },
    { id: 'crustaceans', name: 'Crustacés', icon: '🦐' },
    { id: 'eggs', name: 'Œufs', icon: '🥚' },
    { id: 'fish', name: 'Poisson', icon: '🐟' },
    { id: 'peanuts', name: 'Arachides', icon: '🥜' },
    { id: 'soy', name: 'Soja', icon: '🫘' },
    { id: 'milk', name: 'Lait', icon: '🥛' },
    { id: 'nuts', name: 'Fruits à coque', icon: '🌰' },
    { id: 'celery', name: 'Céleri', icon: '🥬' },
    { id: 'mustard', name: 'Moutarde', icon: '🟡' },
    { id: 'sesame', name: 'Sésame', icon: '⚪' },
    { id: 'sulfites', name: 'Sulfites', icon: '🍷' },
    { id: 'lupin', name: 'Lupin', icon: '🌸' },
    { id: 'molluscs', name: 'Mollusques', icon: '🦪' },
];

interface ProductDetailsDialogProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Product, quantity: number, selectedOptions: Record<string, Option[]>, note?: string) => void;
}

export function ProductDetailsDialog({ product, isOpen, onClose, onAddToCart }: ProductDetailsDialogProps) {
    const [quantity, setQuantity] = useState(1);
    const [selections, setSelections] = useState<Record<string, string[]>>({});
    const [note, setNote] = useState("");
    const [lastProductId, setLastProductId] = useState<string | null>(null);
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
    const [customAllergen, setCustomAllergen] = useState("");
    const [customAllergens, setCustomAllergens] = useState<string[]>([]);
    const [showAllergenInput, setShowAllergenInput] = useState(false);
    const { t } = useLanguage();
    const { priceMultiplier } = useNexusFleet();

    if (isOpen && product && product.id !== lastProductId) {
        setLastProductId(product.id);
        setQuantity(1);
        setNote("");
        setSelectedAllergens([]);
        setCustomAllergens([]);
        setCustomAllergen("");
        setShowAllergenInput(false);
        const initialSelections: Record<string, string[]> = {};
        (product.optionGroups as OptionGroup[] | undefined)?.forEach(group => {
            const defaults = group.options.filter(opt => opt.isDefault).map(opt => opt.id);
            if (defaults.length > 0) {
                initialSelections[group.id] = defaults;
            }
        });
        setSelections(initialSelections);
    }

    if (!isOpen || !product) return null;

    const toggleAllergen = (allergenId: string) => {
        setSelectedAllergens(prev =>
            prev.includes(allergenId)
                ? prev.filter(id => id !== allergenId)
                : [...prev, allergenId]
        );
    };

    const addCustomAllergen = () => {
        if (customAllergen.trim() && !customAllergens.includes(customAllergen.trim())) {
            const newAllergen = customAllergen.trim();
            setCustomAllergens(prev => [...prev, newAllergen]);
            setSelectedAllergens(prev => [...prev, `custom_${newAllergen}`]);
            setCustomAllergen("");
            setShowAllergenInput(false);
        }
    };

    const removeCustomAllergen = (allergen: string) => {
        setCustomAllergens(prev => prev.filter(a => a !== allergen));
        setSelectedAllergens(prev => prev.filter(id => id !== `custom_${allergen}`));
    };


    const handleOptionToggle = (group: OptionGroup, optionId: string) => {
        setSelections(prev => {
            const current = prev[group.id] || [];
            if (group.type === 'single') {
                return { ...prev, [group.id]: [optionId] };
            } else {
                const isSelected = current.includes(optionId);
                let newSelection;
                if (isSelected) {
                    newSelection = current.filter(id => id !== optionId);
                } else {
                    if (group.maxSelections && current.length >= group.maxSelections) {
                        return prev;
                    }
                    newSelection = [...current, optionId];
                }
                return { ...prev, [group.id]: newSelection };
            }
        });
    };

    const calculateTotal = () => {
        let total = product.priceInCents;
        (product.optionGroups as OptionGroup[] | undefined)?.forEach(group => {
            const selectedIds = selections[group.id] || [];
            selectedIds.forEach(id => {
                const option = group.options.find(opt => opt.id === id);
                if (option) {
                    total += option.priceModifierInCents;
                }
            });
        });
        return total * priceMultiplier * quantity;
    };

    const isValid = () => {
        if (!product.optionGroups) return true;
        return (product.optionGroups as OptionGroup[]).every(group => {
            if (group.required) {
                const selected = selections[group.id];
                return selected && selected.length >= (group.minSelections || 1);
            }
            return true;
        });
    };

    const handleAdd = () => {
        const selectedOptionsMap: Record<string, Option[]> = {};
        (product.optionGroups as OptionGroup[] | undefined)?.forEach(group => {
            const selectedIds = selections[group.id] || [];
            if (selectedIds.length > 0) {
                selectedOptionsMap[group.name] = group.options.filter(opt => selectedIds.includes(opt.id));
            }
        });

        // Build final note with allergens
        let finalNote = note;
        if (selectedAllergens.length > 0) {
            const allergenNames = selectedAllergens.map(id => {
                if (id.startsWith('custom_')) {
                    return id.replace('custom_', '');
                }
                const allergen = COMMON_ALLERGENS.find(a => a.id === id);
                return allergen ? t(`allergens.${allergen.id}`) : id;
            });
            const allergenWarning = `⚠️ ALLERGIES: ${allergenNames.join(', ')}`;
            finalNote = finalNote ? `${allergenWarning}\n${note}` : allergenWarning;
        }

        onAddToCart(product, quantity, selectedOptionsMap, finalNote);
        onClose();
    };


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="bg-bg-secondary rounded-[48px] shadow-premium w-full flex flex-col overflow-hidden scale-100 border border-border/50 transition-colors max-h-[92vh]">

                {/* Aesthetic Backdrop + Header - Museum Tier */}
                <div className="relative h-40 md:h-52 bg-bg-tertiary overflow-hidden flex-shrink-0 transition-colors">
                    <div className="absolute inset-0">
                        {product.image ? (
                            <img
                                src={`/images/${product.image}.png`}
                                alt={product.name}
                                className="w-full h-full object-cover blur-[2px] scale-105 opacity-40 transition-transform duration-1000 group-hover:scale-110"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'; }}
                            />
                        ) : (
                            <div className={cn("absolute inset-0 opacity-20", product.color)} />
                        )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-bg-secondary/40 to-transparent" />

                    {/* Visual Gold Glow */}
                    <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent-gold/10 blur-[100px] pointer-events-none" />

                    <div className="absolute bottom-8 left-8 md:left-12 right-8 md:right-12 flex justify-between items-end">
                        <div className="min-w-0 max-w-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">{t('pos.details.selection')}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-serif font-black text-text-primary tracking-tighter italic leading-tight">{product.name}</h2>
                            <p className="text-text-muted text-sm md:text-base font-serif italic mt-3 line-clamp-2 opacity-80 leading-relaxed max-wxl">
                                {product.description || t('pos.fallback_description')}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-3xl md:text-3xl font-serif font-black text-accent-gold italic drop-shadow-sm">
                                {((product.priceInCents * priceMultiplier) / 100).toFixed(2)}€
                            </span>
                            <div className="flex items-center gap-3 bg-white/5 rounded-full p-1 border border-white/10">
                                <button
                                    onClick={onClose}
                                    className="w-12 h-12 bg-white/10 dark:bg-black/20 hover:bg-accent-gold hover:text-white backdrop-blur-xl rounded-2xl flex items-center justify-center text-text-primary transition-all border border-white/10 shadow-premium group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable Gallery */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-bg-primary transition-colors scrollbar-hide elegant-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* Options Section */}
                        <div className="lg:col-span-12 space-y-12">
                            {(product.optionGroups as OptionGroup[] | undefined)?.map(group => (
                                <div key={group.id} className="space-y-6">
                                    <div className="flex items-center justify-between px-2 border-b border-border/50 pb-4">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-[0.3em] text-center">
                                                {t(`pos.options.${group.id}`)}
                                            </h3>
                                            {group.required && (
                                                <span className="text-[9px] font-black bg-accent-gold text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">{t('pos.details.required')}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                                                {group.type === 'single' ? t('pos.details.single_choice') : `${t('pos.details.max_selection')}: ${group.maxSelections || '∞'}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                        {group.options.map(option => {
                                            const isSelected = (selections[group.id] || []).includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleOptionToggle(group, option.id)}
                                                    className={cn(
                                                        "group relative flex items-center justify-between p-5 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all duration-500",
                                                        isSelected
                                                            ? "border-accent-gold bg-white dark:bg-white/5 shadow-premium ring-4 ring-accent-gold/5"
                                                            : "border-border/60 bg-bg-tertiary/40 hover:border-accent-gold/40 hover:bg-bg-tertiary/60"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-xl border flex items-center justify-center transition-all duration-500",
                                                            isSelected
                                                                ? "bg-accent-gold border-accent-gold scale-110 shadow-premium"
                                                                : "border-border/80 bg-white dark:bg-black group-hover:scale-105"
                                                        )}>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <span className={cn("text-[14px] font-black transition-colors uppercase tracking-tight", isSelected ? "text-text-primary" : "text-text-secondary")}>
                                                            {t(`pos.options.${option.id}`)}
                                                        </span>
                                                    </div>
                                                    {option.priceModifierInCents > 0 && (
                                                        <span className={cn("text-[11px] font-serif italic font-bold px-3 py-1 rounded-full transition-all", isSelected ? "bg-accent-gold text-white" : "text-accent-gold bg-accent-gold/10")}>
                                                            +{option.priceModifierInCents / 100}€
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Allergens & Notes - Two Columns */}
                        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border">

                            {/* Allergens Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4">
                                        <AlertTriangle className="w-5 h-5 text-accent-gold" />
                                        <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-[0.3em]">{t('pos.details.allergens')}</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                    {COMMON_ALLERGENS.map(allergen => {
                                        const isSelected = selectedAllergens.includes(allergen.id);
                                        return (
                                            <button
                                                key={allergen.id}
                                                onClick={() => toggleAllergen(allergen.id)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left group",
                                                    isSelected
                                                        ? "border-red-500/50 bg-red-500/5 text-red-600 dark:text-red-400 shadow-sm"
                                                        : "border-border bg-bg-tertiary/40 hover:border-red-500/30 text-text-secondary"
                                                )}
                                            >
                                                <span className="text-xl group-hover:scale-125 transition-transform">{allergen.icon}</span>
                                                <span className="text-[12px] font-black uppercase tracking-tight truncate">{t(`allergens.${allergen.id}`)}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-red-500 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {showAllergenInput ? (
                                    <div className="flex items-center gap-3 px-1">
                                        <input
                                            type="text"
                                            placeholder={t('pos.details.allergen_placeholder')}
                                            value={customAllergen}
                                            onChange={(e) => setCustomAllergen(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addCustomAllergen()}
                                            className="flex-1 px-5 py-3.5 bg-bg-tertiary border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 transition-all"
                                            autoFocus
                                        />
                                        <button
                                            onClick={addCustomAllergen}
                                            disabled={!customAllergen.trim()}
                                            className="p-3.5 bg-accent-gold text-white rounded-2xl transition-all shadow-premium disabled:opacity-30"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowAllergenInput(true)}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-bg-tertiary/40 hover:bg-bg-tertiary transition-all border border-dashed border-border rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-accent-gold"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t('pos.details.add_custom_allergen')}
                                    </button>
                                )}
                            </div>

                            {/* Note Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4">
                                        <Sparkles className="w-5 h-5 text-accent-gold" />
                                        <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-[0.3em]">{t('pos.details.notes')}</h3>
                                    </div>
                                </div>
                                <div className="relative group h-full">
                                    <textarea
                                        placeholder={t('pos.details.notes_placeholder')}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full h-[calc(100%-2rem)] bg-bg-tertiary/40 border border-border rounded-[32px] p-6 text-sm md:text-base font-serif italic text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 transition-all resize-none min-h-[200px]"
                                    />
                                    <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-accent-gold/20 group-focus-within:bg-accent-gold group-focus-within:animate-pulse transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Footer Controls - Execution Tier */}
                <div className="p-10 border-t border-border/40 bg-white dark:bg-black/40 backdrop-blur-xl flex items-center justify-between gap-10 transition-colors relative flex-shrink-0">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent" />

                    {/* Quality Selective Counter */}
                    <div className="flex items-center gap-6 bg-white dark:bg-white/5 px-6 py-2.5 rounded-full border border-border/40 shadow-sm">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-accent-gold transition-all"
                        >
                            <Minus className="w-5 h-5" strokeWidth={1} />
                        </button>
                        <span className="text-2xl font-serif italic font-black text-text-primary min-w-[30px] text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-accent-gold transition-all"
                        >
                            <Plus className="w-5 h-5" strokeWidth={1} />
                        </button>
                    </div>

                    {/* Master Action Button - The Exhibition Choice */}
                    <button
                        disabled={!isValid()}
                        onClick={handleAdd}
                        className="flex-1 h-20 bg-black dark:bg-white dark:text-black rounded-full shadow-premium flex items-center justify-between px-10 transition-all active:scale-[0.98] group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-8">
                            <ShoppingCart className="w-6 h-6 text-white dark:text-black" strokeWidth={1.5} />
                            <div className="flex flex-col items-start translate-y-[1px]">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 dark:text-black/40 leading-none mb-1">{t('pos.details.add_to')}</span>
                                <span className="text-[13px] font-black uppercase tracking-[0.3em] text-white dark:text-black leading-none">{t('pos.details.archive')}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 h-full">
                            <div className="w-px h-8 bg-white/10 dark:bg-black/10" />
                            <span className="text-2xl font-sans font-black tracking-tight text-white dark:text-black">
                                {calculateTotal() / 100}€
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
