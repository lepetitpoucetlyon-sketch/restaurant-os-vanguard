"use client";

import { useState } from "react";
import { X, Check, AlertTriangle, ChefHat, Clock, User, Minus, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { useOrders } from "@/engines/ops/NexusOpsProvider";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Order, OrderItem, OrderItemModification } from "@/modules/ops/types";

interface ModificationAlertProps {
    modification: OrderItemModification;
    itemName: string;
    tableNumber: string;
}

export function ModificationAlert({ modification, itemName, tableNumber }: ModificationAlertProps) {
    const { respondToModification } = useOrders();
    const { currentUser } = useAuth();
    const [isResponding, setIsResponding] = useState(false);
    const [responseNote, setResponseNote] = useState('');

    const handleApprove = async () => {
        setIsResponding(true);
        await respondToModification(
            modification.orderId,
            modification.orderItemId,
            true,
            currentUser?.name || 'Chef',
            responseNote || undefined
        );
        setIsResponding(false);
    };

    const handleReject = async () => {
        setIsResponding(true);
        await respondToModification(
            modification.orderId,
            modification.orderItemId,
            false,
            currentUser?.name || 'Chef',
            responseNote || 'Modification non réalisable'
        );
        setIsResponding(false);
    };

    // Parse the modification details
    let removedIngredients: string[] = [];
    let addedIngredients: string[] = [];
    let newNotes = '';

    try {
        const newValue = JSON.parse(modification.newValue || '{}');
        removedIngredients = newValue.removed || [];
        addedIngredients = newValue.added || [];
        newNotes = newValue.notes || '';
    } catch {
        // Use description as fallback
    }

    const timeSinceRequest = Math.floor((new Date().getTime() - new Date(modification.requestedAt).getTime()) / 1000 / 60);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/5 group"
        >
            {/* Ticket Header */}
            <div className="relative h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 w-full" />

            <div className="p-6 md:p-8">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center border border-amber-200 dark:border-amber-500/20 shadow-inner">
                            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-serif font-black italic text-2xl md:text-3xl text-neutral-900 dark:text-white tracking-tight">Table {tableNumber}</span>
                                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-200 dark:border-red-800 animate-pulse">
                                    Prioritaire
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Il y a {timeSinceRequest} min</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                <span className="text-amber-600 dark:text-amber-400">{modification.requestedBy}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-neutral-50 dark:bg-black/20 rounded-3xl p-6 border border-neutral-100 dark:border-white/5 mb-8">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-200 dark:border-white/10">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                            <ChefHat className="w-5 h-5 text-neutral-600 dark:text-neutral-400" strokeWidth={1.5} />
                        </div>
                        <span className="font-serif font-medium text-xl md:text-2xl text-neutral-900 dark:text-white leading-none">
                            {itemName}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {removedIngredients.length > 0 && (
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800/30">
                                    <Minus className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="pt-1.5">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Retirer</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-200 text-lg leading-tight line-through decoration-red-500/50 decoration-2">
                                        {removedIngredients.join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {addedIngredients.length > 0 && (
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0 border border-green-200 dark:border-green-800/30">
                                    <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="pt-1.5">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Ajouter</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-200 text-lg leading-tight">
                                        {addedIngredients.join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {newNotes && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                                <MessageSquare className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 opacity-70">Note Client</p>
                                    <p className="font-serif italic text-blue-900 dark:text-blue-100 text-lg leading-snug">
                                        "{newNotes}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Fallback */}
                        {!removedIngredients.length && !addedIngredients.length && !newNotes && (
                            <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 italic">
                                "{modification.description}"
                            </div>
                        )}
                    </div>
                </div>

                {/* Chef's Response Area */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Ajouter une note de cuisine (optionnel)..."
                        value={responseNote}
                        onChange={(e) => setResponseNote(e.target.value)}
                        className="w-full px-6 py-4 bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                    />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleReject}
                        disabled={isResponding}
                        className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl border-2 border-transparent bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-900/30 transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                        <span>Refuser</span>
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isResponding}
                        className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-green-600 dark:hover:bg-green-400 hover:text-white hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-green-500/25 transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50 disabled:scale-100"
                    >
                        <Check className="w-5 h-5" />
                        <span>Approuver</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

interface ModificationAlertsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ModificationAlertsPanel({ isOpen, onClose }: ModificationAlertsPanelProps) {
    const { data: orders, getPendingModifications } = useOrders();
    const pendingModifications = getPendingModifications();

    // Get item details
    const modificationsWithDetails = pendingModifications.map((mod: OrderItemModification) => {
        const order = (orders || []).find((o: Order) => o.id === mod.orderId);
        const item = (order?.items || []).find((i: OrderItem) => i.id === mod.orderItemId);
        return {
            modification: mod,
            itemName: item?.name || 'Unknown Item',
            tableNumber: order?.tableNumber || '--'
        };
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-neutral-900/60 backdrop-blur-xl"
                    />

                    {/* Floating Panel Container */}
                    <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: -40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                            className="bg-white/90 dark:bg-black/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-white/20 dark:border-white/10 ring-1 ring-black/5 pointer-events-auto"
                        >
                            {/* Panel Header */}
                            <div className="relative shrink-0 px-8 py-6 border-b border-neutral-200/50 dark:border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="font-serif font-bold text-2xl text-neutral-900 dark:text-white tracking-tight">
                                        Modifications
                                    </h2>
                                    <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mt-0.5">
                                        Gérez les demandes spéciales
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 dark:hover:bg-white/20 transition-all active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Decoration */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent" />
                            </div>

                            {/* Panel Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {modificationsWithDetails.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center justify-center py-20 text-center"
                                        >
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-8 animate-in fade-in zoom-in duration-500">
                                                <Check className="w-10 h-10 text-white" strokeWidth={3} />
                                            </div>
                                            <h3 className="font-serif font-medium text-2xl text-neutral-900 dark:text-white mb-2">
                                                Tout est en ordre
                                            </h3>
                                            <p className="text-neutral-500 max-w-[200px] leading-relaxed">
                                                Aucune demande de modification en attente pour le moment.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        modificationsWithDetails.map((details) => (
                                            <ModificationAlert
                                                key={details.modification.id}
                                                {...details}
                                            />
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer Status Bar */}
                            {modificationsWithDetails.length > 0 && (
                                <div className="shrink-0 px-8 py-4 bg-neutral-50 dark:bg-white/5 border-t border-neutral-200 dark:border-white/5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-neutral-500">
                                    <span>En attente</span>
                                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md">
                                        {modificationsWithDetails.length} Ticket{modificationsWithDetails.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
