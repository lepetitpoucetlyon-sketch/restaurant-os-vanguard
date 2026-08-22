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
            <div className="relative bg-bg-primary border border-border shadow-premium rounded-[3rem] w-full overflow-hidden group/modal">
                {/* Visual Accent Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none opacity-50" />

                {/* Header */}
                <div className="p-10 border-b border-border/50 relative z-10 bg-surface-card/50 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 flex items-center justify-center border border-accent-gold/20 shadow-glow-accent/10">
                                <ArrowRight className="w-6 h-6 text-accent-gold" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif font-black text-text-primary italic tracking-tight leading-none">Convoi de Stock</h2>
                                <p className="text-[9px] font-black text-accent-gold uppercase tracking-[0.4em] mt-3 opacity-60">Logistique & Déplacement d&apos;Archive</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-bg-tertiary/50 hover:bg-surface-card flex items-center justify-center transition-all border border-border/50 hover:rotate-90 hover:text-error duration-500"
                        >
                            <X className="w-5 h-5 opacity-40 hover:opacity-100" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-10 space-y-10 relative z-10">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-24 h-24 rounded-full bg-accent-gold flex items-center justify-center mb-10 shadow-glow"
                            >
                                <Check className="w-12 h-12 text-text-primary" strokeWidth={3} />
                            </motion.div>
                            <p className="text-3xl font-serif font-black text-text-primary italic tracking-tight">Transfert Scellé</p>
                            <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mt-4 opacity-50">L&apos;Archive a rejoint son nouvel emplacement</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
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
                                        className="p-8 bg-surface-card/50 border border-border/40 rounded-[2.5rem] flex items-center justify-between shadow-premium"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-accent-gold/5 flex items-center justify-center border border-accent-gold/10 text-accent-gold">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] leading-none">ORIGINE ACTUELLE</span>
                                                <span className="text-[15px] font-serif italic font-black text-text-primary tracking-tight leading-none">{String(currentLocation.name || '').toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div className="px-5 py-3 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[11px] font-black tracking-widest uppercase">
                                            {String(currentItem.quantity)} {String(currentItem.unit || '').toUpperCase()}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Transition Icon */}
                            <div className="flex justify-center -my-6 relative z-10 text-center">
                                <motion.div
                                    animate={{ y: [0, 5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-16 h-16 rounded-full bg-surface-card text-accent-gold shadow-premium flex items-center justify-center border-4 border-border-default relative group-hover/modal:scale-110 transition-transform duration-700"
                                >
                                    <ArrowRight className="w-8 h-8 rotate-90" strokeWidth={2.5} />
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
                    <div className="p-10 border-t border-border/50 bg-surface-card/50 backdrop-blur-md flex items-center justify-between gap-6 relative z-10">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-text-muted hover:text-text-primary transition-all duration-300"
                        >
                            ANNULER
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedItem || !targetLocation || isSubmitting}
                            className={cn(
                                "flex items-center gap-4 px-12 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group/btn shadow-premium",
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
