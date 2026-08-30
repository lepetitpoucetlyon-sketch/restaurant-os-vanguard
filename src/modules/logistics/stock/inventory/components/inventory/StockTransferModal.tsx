"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, MapPin, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useInventory } from "../../hooks/useInventory";
import { StockItem, DEFAULT_STORAGE_LOCATIONS, type StorageLocation } from "@nexus/contracts";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@ui/Modal";
import { PremiumSelect } from "@ui/PremiumSelect";

interface StockTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockItem?: StockItem;
}

export function StockTransferModal({ isOpen, onClose, stockItem }: StockTransferModalProps) {
    const { stockItems, transferStock, storageLocations } = useInventory();

    const [selectedItem, setSelectedItem] = useState<string | null>(stockItem?.id ?? null);
    const [targetLocation, setTargetLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Sync selectedItem si la prop stockItem change (ex : réouverture sur un autre article)
    useEffect(() => {
        if (stockItem?.id) {
            setSelectedItem(stockItem.id);
        }
    }, [stockItem]);

    const currentItem = stockItems.find((s: StockItem) => s.id === selectedItem);
    const activeLocations = storageLocations.length > 0 ? storageLocations : DEFAULT_STORAGE_LOCATIONS;

    const handleSubmit = async () => {
        if (!selectedItem || !targetLocation) return;

        setIsSubmitting(true);
        const qty = currentItem ? (Number(currentItem.quantity) || 0) : 0;
        await transferStock(selectedItem, targetLocation, qty);
        setIsSubmitting(false);
        setSuccess(true);
        // Instant closure after success - zero delay mandate
        setSelectedItem('');
        setTargetLocation('');
        onClose();
        setSuccess(false);
    };

    const availableStock = stockItems.filter((s: StockItem) => s.status === 'available' && (Number(s.quantity) || 0) > 0);
    const currentLocation = currentItem
        ? activeLocations.find((l: StorageLocation) => l.id === currentItem.storageLocationId)
        : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            showClose={false}
            className="p-0 border-none bg-transparent"
        >
            <div className="relative bg-bg-primary border border-border shadow-premium rounded-2xl sm:rounded-[3rem] w-full overflow-hidden group/modal">
                {/* Visual Accent Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none opacity-50" />

                {/* Header */}
                <div className="p-5 sm:p-8 lg:p-10 border-b border-border/50 relative z-10 bg-surface-card/50 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-accent-gold/10 flex items-center justify-center border border-accent-gold/20 shadow-glow-accent/10 shrink-0">
                                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-accent-gold" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-3xl font-serif font-black text-text-primary italic tracking-tight leading-none truncate">Convoi de Stock</h2>
                                <p className="text-nano font-black text-accent-gold uppercase tracking-[0.4em] mt-2 sm:mt-3 opacity-60">Logistique & Déplacement d&apos;Archive</p>
                            </div>
                        </div>
                        <button aria-label="Fermer"
                            onClick={onClose}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-bg-tertiary/50 hover:bg-surface-card flex items-center justify-center transition-all border border-border/50 hover:rotate-90 hover:text-error duration-500 shrink-0"
                        >
                            <X className="w-5 h-5 opacity-40 hover:opacity-100" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-10 relative z-10">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent-gold flex items-center justify-center mb-8 sm:mb-10 shadow-glow"
                            >
                                <Check className="w-10 h-10 sm:w-12 sm:h-12 text-text-primary" strokeWidth={3} />
                            </motion.div>
                            <p className="text-2xl sm:text-3xl font-serif font-black text-text-primary italic tracking-tight">Transfert Scellé</p>
                            <p className="text-nano font-black text-accent-gold uppercase tracking-[0.4em] mt-3 sm:mt-4 opacity-50">L&apos;Archive a rejoint son nouvel emplacement</p>
                        </div>
                    ) : (
                        <div className="space-y-6 sm:space-y-10">
                            {/* Item Selection */}
                            <PremiumSelect
                                label="ARTEFACT A DEPLACER"
                                value={selectedItem || ''}
                                onChange={(val) => setSelectedItem(val || null)}
                                options={availableStock.map((s: StockItem) => ({
                                    value: String(s.id),
                                    label: String(s.ingredientName || ''),
                                    description: `${s.quantity} ${String(s.unit || '').toUpperCase()}`
                                }))}
                                placeholder="SELECTIONNER UN ARTICLE..."
                            />

                            {/* Current Position */}
                            <AnimatePresence mode="wait">
                                {currentItem && currentLocation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                                        className="p-4 sm:p-8 bg-surface-card/50 border border-border/40 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-between gap-4 shadow-premium"
                                    >
                                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-accent-gold/5 flex items-center justify-center border border-accent-gold/10 text-accent-gold shrink-0">
                                                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <span className="text-nano font-black text-text-muted uppercase tracking-[0.3em] leading-none">ORIGINE ACTUELLE</span>
                                                <span className="text-sm sm:text-[15px] font-serif italic font-black text-text-primary tracking-tight leading-none truncate">{String(currentLocation.name || '').toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div className="px-3 sm:px-5 py-2 sm:py-3 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-nano sm:text-micro font-black tracking-widest uppercase shrink-0">
                                            {String(currentItem.quantity)} {String(currentItem.unit || '').toUpperCase()}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Transition Icon */}
                            <div className="flex justify-center -my-4 sm:-my-6 relative z-10 text-center">
                                <motion.div
                                    animate={{ y: [0, 5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-card text-accent-gold shadow-premium flex items-center justify-center border-4 border-border-default relative group-hover/modal:scale-110 transition-transform duration-700"
                                >
                                    <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 rotate-90" strokeWidth={2.5} />
                                    <div className="absolute inset-0 rounded-full bg-accent-gold/10 animate-pulse" />
                                </motion.div>
                            </div>

                            {/* Target Selection */}
                            <PremiumSelect
                                label="DESTINATION FINALE"
                                value={targetLocation}
                                onChange={setTargetLocation}
                                options={activeLocations
                                    .filter((l: StorageLocation) => l.isActive && l.id !== currentItem?.storageLocationId)
                                    .map((loc: StorageLocation) => ({
                                        value: String(loc.id),
                                        label: String(loc.name || ''),
                                        description: loc.temperature !== undefined ? `${loc.temperature}°C` : ''
                                    }))
                                }
                                placeholder="SELECTIONNER UNE ZONE..."
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-5 sm:p-8 lg:p-10 border-t border-border/50 bg-surface-card/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
                        <button
                            onClick={onClose}
                            className="px-6 sm:px-8 py-3 sm:py-4 text-nano font-black uppercase tracking-[0.4em] text-text-muted hover:text-text-primary transition-all duration-300 w-full sm:w-auto text-center"
                        >
                            ANNULER
                        </button>
                        <button aria-label="Rafraîchir"
                            onClick={handleSubmit}
                            disabled={!selectedItem || !targetLocation || isSubmitting}
                            className={cn(
                                "flex items-center justify-center gap-3 sm:gap-4 px-8 sm:px-12 py-3.5 sm:py-5 rounded-xl sm:rounded-[22px] text-nano font-black uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group/btn shadow-premium w-full sm:w-auto",
                                selectedItem && targetLocation
                                    ? "bg-text-primary text-text-primary hover:bg-accent-gold hover:text-text-primary"
                                    : "bg-bg-tertiary text-text-muted/40 cursor-not-allowed border border-border/20"
                            )}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-500" />
                            )}
                            {isSubmitting ? "CONVOI..." : "LANCER LE CONVOI"}

                            {/* Hover Shine */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
