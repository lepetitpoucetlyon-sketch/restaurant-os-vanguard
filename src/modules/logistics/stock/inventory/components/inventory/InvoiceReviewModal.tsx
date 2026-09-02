"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ShoppingCart, TrendingUp, HelpCircle, Save, X } from 'lucide-react';
import { Button } from '@ui/Button';
import { cn } from '@/lib/ui.foundations';
import type { ExtractedInvoice } from '../../../../domain/schemas/inventory';
import { InventoryVisionService, VisionMatchResult } from '../../../../services/InventoryVisionService';
import { useInventory } from '../../hooks/useInventory';

interface InvoiceReviewModalProps {
    data: ExtractedInvoice;
    onClose: () => void;
    onSaveComplete: () => void;
}

export function InvoiceReviewModal({ data, onClose, onSaveComplete }: InvoiceReviewModalProps) {
    const { ingredients, addStockItem } = useInventory();
    const [matches, _setMatches] = useState<VisionMatchResult[]>(() => 
        data.items.map((/* eslint-disable @typescript-eslint/no-explicit-any */ item: any /* eslint-enable @typescript-eslint/no-explicit-any */) => InventoryVisionService.findBestMatch(item, ingredients as import("@nexus/contracts").Ingredient[]))
    );

    const handleSave = async () => {
        // Enregistrement réel des stocks basés sur les matches
        for (const match of matches) {
            if (match.matchedIngredientId) {
                await addStockItem({
                    ingredientId: match.matchedIngredientId,
                    ingredientName: match.matchedIngredientName || match.extracted.name,
                    category: 'other',
                    quantity: match.extracted.quantity,
                    unit: match.extracted.unit as import('@nexus/contracts').IngredientUnit,
                    storageLocationId: 'frigo_1',
                    batchNumber: match.extracted.batchNumber || `VISION-${Date.now()}`,
                    receptionDate: new Date().toISOString().split('T')[0],
                    dlc: match.extracted.expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    supplierName: data.supplierName,
                    invoiceReference: data.invoiceNumber,
                    unitCostInCents: Math.round(match.extracted.unitPriceHT * 100),
                    unitCostInMicrounits: Math.round(match.extracted.unitPriceHT * 1_000_000),
                    status: 'available'
                });
            }
        }
        onSaveComplete();
    };

    return (
        <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }} 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div 
                role="dialog"
                aria-modal="true"
                aria-label="Revue Facture & Rapprochement Stock"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl bg-surface-card border border-border rounded-2xl sm:rounded-[3rem] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-5 sm:p-8 lg:p-10 border-b border-white/5 flex items-center justify-between gap-4 bg-surface-card/[0.02]">
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-status-warning text-primary flex items-center justify-center shadow-2xl shadow-amber-500/20 shrink-0">
                            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-nano font-black uppercase tracking-[0.4em] text-secondary">Multimodal Audit Results</span>
                                <div className="px-3 py-0.5 sm:py-1 bg-status-success/10 border border-emerald-500/20 rounded-full">
                                    <span className="text-nano font-bold text-status-success uppercase tracking-widest">IA Verified</span>
                                </div>
                            </div>
                            <h2 className="text-xl sm:text-2xl lg:text-4xl font-serif italic text-text-primary uppercase tracking-tighter truncate">Revue de Facture : {data.supplierName}</h2>
                        </div>
                    </div>
                    <button aria-label="Fermer" onClick={onClose} className="p-3 sm:p-4 hover:bg-surface-card/5 rounded-full transition-colors text-secondary hover:text-text-primary shrink-0">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Content Table with Responsive Horizontal Scroll */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
                    <div className="overflow-x-auto elegant-scrollbar -mx-2 px-2">
                        <table className="w-full min-w-[36.25rem] border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-nano font-black text-secondary uppercase tracking-[0.3em]">
                                    <th className="text-left px-4 sm:px-6 py-3 sm:py-4 font-black">Produit Extrait</th>
                                    <th className="text-left px-4 sm:px-6 py-3 sm:py-4 font-black">Association Inventaire</th>
                                    <th className="text-center px-4 sm:px-6 py-3 sm:py-4 font-black">Quantité</th>
                                    <th className="text-right px-4 sm:px-6 py-3 sm:py-4 font-black">Prix Unitaire HT</th>
                                    <th className="text-right px-4 sm:px-6 py-3 sm:py-4 font-black">Total HT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((match, i) => (
                                    <motion.tr 
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group bg-surface-card/[0.03] hover:bg-surface-card/[0.05] transition-all rounded-2xl overflow-hidden"
                                    >
                                        <td className="px-4 sm:px-6 py-4 sm:py-6 rounded-l-2xl border-l-2 border-transparent group-hover:border-action-primary transition-all">
                                            <p className="text-sm font-serif italic text-text-primary/90">{match.extracted.name}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-6">
                                            <div className={cn(
                                                "flex items-center gap-3 p-2 rounded-xl border transition-all",
                                                match.isNewProduct 
                                                    ? "bg-status-warning/5 border-action-primary/20 text-status-warning" 
                                                    : "bg-status-success/5 border-emerald-500/20 text-status-success"
                                            )}>
                                                {match.isNewProduct ? <HelpCircle size={14} /> : <Check size={14} />}
                                                <span className="text-nano font-bold uppercase tracking-widest">
                                                    {match.matchedIngredientName || "Nouveau Produit"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-6 text-center">
                                            <span className="text-sm font-mono text-text-primary opacity-60">{match.extracted.quantity} {match.extracted.unit}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-mono text-text-primary">{match.extracted.unitPriceHT.toFixed(2)}€</span>
                                                <div className="flex items-center gap-1 text-nano text-status-success font-bold uppercase">
                                                    <TrendingUp size={10} />
                                                    Stable
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 sm:py-6 text-right rounded-r-2xl font-mono text-text-primary text-base">
                                            {match.extracted.totalHT.toFixed(2)}€
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 sm:p-8 lg:p-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-card/[0.02]">
                    <div className="space-y-1 text-center sm:text-left">
                        <p className="text-nano font-bold text-secondary uppercase tracking-widest">Total Facture (Estimé)</p>
                        <p className="text-2xl sm:text-4xl font-serif italic text-text-primary leading-none">{data.totalTTC.toFixed(2)}€ <span className="text-xs not-italic opacity-40">TTC</span></p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                        <Button onClick={onClose} variant="ghost" className="px-6 sm:px-8 py-3 sm:py-6 text-nano uppercase font-black tracking-widest text-secondary hover:text-text-primary w-full sm:w-auto">Annuler</Button>
                        <Button 
                            onClick={handleSave}
                            className="px-6 sm:px-10 py-3 sm:py-6 bg-surface-card text-primary text-nano uppercase font-black tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] w-full sm:w-auto"
                        >
                            <Save size={18} />
                            Synchroniser l'Inventaire
                        </Button>
                    </div>
                </div>
            </motion.div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
