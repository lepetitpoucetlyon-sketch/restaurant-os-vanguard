'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Modal } from "@ui/Modal";
import { Package, RefreshCw, Plus, X } from "lucide-react";
import { useInventory } from "@/modules/ops";
import { useAtomValue } from "jotai";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { IngredientUnit, DEFAULT_STORAGE_LOCATIONS } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { logger } from "@/lib/logger";
import type { ExtractedInvoice } from "@/modules/ops";

import { type SupplierRecord } from "./stock-reception/receptionConstants";
import { StockSuccessView } from "./stock-reception/StockSuccessView";
import { StockReceptionForm } from "./stock-reception/StockReceptionForm";

interface StockReceptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StockReceptionModal({ isOpen, onClose }: StockReceptionModalProps) {
    const { ingredients, storageLocations } = useInventory();
    const tenantId = useAtomValue(tenantIdAtom);

    const [selectedIngredient, setSelectedIngredient] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [unit, setUnit] = useState<IngredientUnit>('kg');
    const [storageLocation, setStorageLocation] = useState<string>('');
    const [batchNumber, setBatchNumber] = useState<string>('');
    const [lotNumber, setLotNumber] = useState<string>('');
    const [unitCost, setUnitCost] = useState<string>('');
    const [receptionDate, setReceptionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dlc, setDlc] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

    useEffect(() => {
        if (!isOpen) return;
        const path = tenantId ? `tenants/${tenantId}/suppliers` : Nexus.getTenantPath('suppliers');
        Nexus.adapter
            .query<SupplierRecord>(path)
            .then((results) => setSuppliers(results ?? []))
            .catch((err) => logger.warn('[StockReceptionModal] Failed to load suppliers', err));
    }, [isOpen, tenantId]);

    const handleIngredientChange = (ingredientId: string) => {
        setSelectedIngredient(ingredientId);
        const ing = ingredients.find(i => i.id === ingredientId);
        if (ing) {
            setUnit(ing.unit as IngredientUnit);
            setStorageLocation(String(ing.defaultStorageLocation || ''));
            setUnitCost((Number(ing.costInCents || 0) / 100).toString());
            if (ing.supplierId) {
                setSelectedSupplierId(String(ing.supplierId));
            }
            const dlcDate = new Date();
            dlcDate.setDate(dlcDate.getDate() + (Number(ing.shelfLifeDays) || 7));
            setDlc(dlcDate.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedIngredient || !quantity || !storageLocation || !dlc || !tenantId) return;

        setIsSubmitting(true);
        const ing = ingredients.find(i => i.id === selectedIngredient);
        if (!ing) { setIsSubmitting(false); return; }

        try {
            const id = Nexus.adapter.generateId('stockItems');
            await Nexus.adapter.set(`tenants/${tenantId}/stockItems/${id}`, {
                id,
                ingredientId: selectedIngredient,
                ingredientName: ing.name,
                category: ing.category,
                quantity: parseFloat(quantity),
                unit,
                storageLocationId: storageLocation,
                receptionDate,
                dlc,
                unitCost: parseFloat(unitCost) || 0,
                ...(batchNumber && { batchNumber }),
                ...(lotNumber && { lotNumber }),
                ...(selectedSupplierId && { supplierId: selectedSupplierId }),
                status: 'available',
                createdAt: new Date().toISOString(),
            });

            setSuccess(true);
            setSelectedIngredient('');
            setQuantity('');
            setBatchNumber('');
            setLotNumber('');
            setUnitCost('');
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1200);
        } catch (error) {
            logger.error('[StockReceptionModal] Reception failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeLocations = storageLocations.length > 0 ? storageLocations : DEFAULT_STORAGE_LOCATIONS;

    const handleInvoiceScanned = (invoice: ExtractedInvoice) => {
        const firstItem = invoice.items[0];
        if (firstItem) {
            const nameLower = firstItem.name.toLowerCase();
            const matched = ingredients.find(i => i.name.toLowerCase().includes(nameLower) || nameLower.includes(i.name.toLowerCase()));
            if (matched) handleIngredientChange(matched.id);
            setQuantity(String(firstItem.quantity));
            if (firstItem.unit) setUnit(firstItem.unit as IngredientUnit);
            setUnitCost(String(firstItem.unitPriceHT));
            if (firstItem.expirationDate) setDlc(firstItem.expirationDate);
            if (firstItem.batchNumber) setBatchNumber(firstItem.batchNumber);
        }
        if (invoice.supplierName) {
            const matchedSupplier = suppliers.find(s => s.name.toLowerCase() === invoice.supplierName.toLowerCase());
            if (matchedSupplier) setSelectedSupplierId(matchedSupplier.id);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            showClose={false}
            className="p-0 border-none bg-transparent"
        >
            <div className="relative bg-bg-primary border border-white/40 rounded-[3rem] shadow-premium w-full max-h-[90vh] flex flex-col overflow-hidden group/modal">
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/5 blur-[80px] pointer-events-none rounded-full" />

                {/* Header */}
                <div className="p-10 border-b border-border/40 bg-surface-card/40 backdrop-blur-md relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[22px] bg-text-primary flex items-center justify-center shadow-premium">
                                <Package className="w-8 h-8 text-text-primary" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-serif font-black text-text-primary italic tracking-tight">Réception Archive.</h2>
                                <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mt-2">Scellement de nouvelles ressources</p>
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
                        <StockSuccessView />
                    ) : (
                        <StockReceptionForm
                            ingredients={ingredients}
                            storageLocations={activeLocations}
                            suppliers={suppliers}
                            selectedIngredient={selectedIngredient}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            unit={unit}
                            setUnit={setUnit}
                            storageLocation={storageLocation}
                            setStorageLocation={setStorageLocation}
                            selectedSupplierId={selectedSupplierId}
                            setSelectedSupplierId={setSelectedSupplierId}
                            receptionDate={receptionDate}
                            setReceptionDate={setReceptionDate}
                            dlc={dlc}
                            setDlc={setDlc}
                            handleIngredientChange={handleIngredientChange}
                            handleInvoiceScanned={handleInvoiceScanned}
                        />
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
                            disabled={!selectedIngredient || !quantity || !storageLocation || !dlc || isSubmitting}
                            className={cn(
                                "flex items-center gap-6 px-16 py-6 rounded-[30px] text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-500 shadow-premium",
                                selectedIngredient && quantity && storageLocation && dlc
                                    ? "bg-text-primary text-text-primary hover:bg-accent-gold"
                                    : "bg-text-muted/10 text-text-muted/20 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                                <Plus className="w-6 h-6" />
                            )}
                            {isSubmitting ? "SCELLAGE..." : "SCELLER DANS L'ARCHIVE"}
                        </motion.button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
