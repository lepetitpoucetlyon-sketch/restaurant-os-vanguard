"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ShoppingCart, TrendingUp, HelpCircle, Save, X } from 'lucide-react';
import { Button } from '@ui/button';
import { cn } from '@/lib/ui.foundations';
import { ExtractedInvoice } from '@domain/services/VisionService';
import { InventoryVisionService, VisionMatchResult } from '@domain/services/InventoryVisionService';
import { useInventory } from '@/modules/ops/providers/NexusOpsProvider';

interface InvoiceReviewModalProps {
    data: ExtractedInvoice;
    onClose: () => void;
    onSaveComplete: () => void;
}

export function InvoiceReviewModal({ data, onClose, onSaveComplete }: InvoiceReviewModalProps) {
    const { ingredients, addStockItem } = useInventory();
    const [matches, _setMatches] = useState<VisionMatchResult[]>(() => 
        data.items.map(item => InventoryVisionService.findBestMatch(item, ingredients as import("@nexus/contracts").Ingredient[]))
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
                    status: 'available'
                });
            }
        }
        onSaveComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-surface-sidebar/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl bg-[#0B0B0C] border border-subtle rounded-[3rem] flex flex-col max-h-[90vh] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            >
                {/* Header */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-surface-card/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-status-warning text-primary flex items-center justify-center shadow-2xl shadow-amber-500/20">
                            <ShoppingCart size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Multimodal Audit Results</span>
                                <div className="px-3 py-1 bg-status-success/10 border border-emerald-500/20 rounded-full">
                                    <span className="text-[8px] font-bold text-status-success uppercase tracking-widest">IA Verified</span>
                                </div>
                            </div>
                            <h2 className="text-4xl font-serif italic text-white uppercase tracking-tighter">Revue de Facture : {data.supplierName}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-surface-card/5 rounded-full transition-colors text-secondary hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content Table */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <table className="w-full border-separate border-spacing-y-4">
                        <thead>
                            <tr className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">
                                <th className="text-left px-6 py-4 font-black">Produit Extrait</th>
                                <th className="text-left px-6 py-4 font-black">Association Inventaire</th>
                                <th className="text-center px-6 py-4 font-black">Quantité</th>
                                <th className="text-right px-6 py-4 font-black">Prix Unitaire HT</th>
                                <th className="text-right px-6 py-4 font-black">Total HT</th>
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
                                    <td className="px-6 py-6 rounded-l-2xl border-l-2 border-transparent group-hover:border-amber-500 transition-all">
                                        <p className="text-sm font-serif italic text-white/90">{match.extracted.name}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className={cn(
                                            "flex items-center gap-3 p-2 rounded-xl border transition-all",
                                            match.isNewProduct 
                                                ? "bg-status-warning/5 border-amber-500/20 text-status-warning" 
                                                : "bg-status-success/5 border-emerald-500/20 text-status-success"
                                        )}>
                                            {match.isNewProduct ? <HelpCircle size={14} /> : <Check size={14} />}
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {match.matchedIngredientName || "Nouveau Produit"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className="text-sm font-mono text-white opacity-60">{match.extracted.quantity} {match.extracted.unit}</span>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-mono text-white">{match.extracted.unitPriceHT.toFixed(2)}€</span>
                                            <div className="flex items-center gap-1 text-[8px] text-status-success font-bold uppercase">
                                                <TrendingUp size={10} />
                                                Stable
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right rounded-r-2xl font-mono text-white text-base">
                                        {match.extracted.totalHT.toFixed(2)}€
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-10 border-t border-white/5 flex items-center justify-between bg-surface-card/[0.02]">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">Total Facture (Estimé)</p>
                        <p className="text-4xl font-serif italic text-white leading-none">{data.totalTTC.toFixed(2)}€ <span className="text-xs not-italic opacity-40">TTC</span></p>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={onClose} variant="ghost" className="px-8 py-6 text-[10px] uppercase font-black tracking-widest text-secondary hover:text-white">Annuler</Button>
                        <Button 
                            onClick={handleSave}
                            className="px-10 py-6 bg-surface-card text-primary text-[10px] uppercase font-black tracking-[0.2em] rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
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
