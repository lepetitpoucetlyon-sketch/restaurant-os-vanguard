"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FranchiseSiteOverview } from '@/shared/nexus/contracts/franchise.types';

export function NewTransferModal({
    open,
    sites,
    currentTenantId,
    onClose,
    onSubmit,
}: {
    open: boolean;
    sites: FranchiseSiteOverview[];
    currentTenantId: string | undefined;
    onClose: () => void;
    onSubmit: (params: { targetTenantId: string; itemName: string; quantity: number }) => Promise<void>;
}) {
    const [targetId, setTargetId] = useState<string>('');
    const [itemName, setItemName] = useState<string>('Farine T55');
    const [quantity, setQuantity] = useState<number>(25);

    const handleSubmit = async () => {
        await onSubmit({ targetTenantId: targetId, itemName, quantity });
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                    aria-hidden="true"
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Nouveau Transfert de Stock"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl p-6 space-y-5 shadow-2xl"
                    >
                        <h3 className="text-sm font-bold text-text-primary">Nouveau Transfert de Stock</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-nano font-bold uppercase text-text-secondary">Destination</label>
                                <select
                                    value={targetId}
                                    onChange={(e) => setTargetId(e.target.value)}
                                    className="w-full mt-1 p-2.5 rounded-xl bg-bg-primary border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                                >
                                    <option value="">Sélectionner un restaurant cible...</option>
                                    {sites
                                        .filter((s) => s.tenantId !== currentTenantId)
                                        .map((s) => (
                                            <option key={s.tenantId} value={s.tenantId}>
                                                {s.name} ({s.city})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-nano font-bold uppercase text-text-secondary">
                                    Ingrédient / Produit
                                </label>
                                <input
                                    type="text"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="w-full mt-1 p-2.5 rounded-xl bg-bg-primary border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                                    placeholder="Ex: Huile d'olive AOP, Farine T55..."
                                />
                            </div>

                            <div>
                                <label className="text-nano font-bold uppercase text-text-secondary">Quantité</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-full mt-1 p-2.5 rounded-xl bg-bg-primary border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!targetId}
                                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 disabled:opacity-50 text-bg-primary text-xs font-bold"
                            >
                                Valider le Transfert
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
