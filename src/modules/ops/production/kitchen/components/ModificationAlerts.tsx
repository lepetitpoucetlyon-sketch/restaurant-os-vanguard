"use client";

import { useState } from "react";
import { X, Check, AlertTriangle, ChefHat, Clock, Minus, Plus, MessageSquare } from "lucide-react";
;
import { useOrders } from '../../../providers/hooks/kitchenHooks';
import { useAuth } from "@/shared/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Order, OrderItem, OrderItemModification } from "@nexus/contracts";

interface ModificationAlertProps {
    modification: OrderItemModification;
    itemName: string;
    tableNumber: string;
}

function parseModDetails(modification: OrderItemModification): { removedIngredients: string[]; addedIngredients: string[]; newNotes: string } {
    try {
        const newValue = JSON.parse(String(modification.newValue || '{}'));
        return { removedIngredients: newValue.removed || [], addedIngredients: newValue.added || [], newNotes: newValue.notes || '' };
    } catch {
        return { removedIngredients: [], addedIngredients: [], newNotes: '' };
    }
}

export function ModificationAlert({ modification, itemName, tableNumber }: ModificationAlertProps) {
    const { respondToModification } = useOrders();
    const { currentUser } = useAuth();
    const [isResponding, setIsResponding] = useState(false);
    const [responseNote, setResponseNote] = useState('');

    const handleApprove = async () => {
        setIsResponding(true);
        await respondToModification(
            String(modification.orderId || ''),
            String(modification.orderItemId || ''),
            true,
            currentUser?.name || 'Chef',
            responseNote || undefined
        );
        setIsResponding(false);
    };

    const handleReject = async () => {
        setIsResponding(true);
        await respondToModification(
            String(modification.orderId || ''),
            String(modification.orderItemId || ''),
            false,
            currentUser?.name || 'Chef',
            responseNote || 'Modification non réalisable'
        );
        setIsResponding(false);
    };

    const { removedIngredients, addedIngredients, newNotes } = parseModDetails(modification);

    const timeSinceRequest = Math.floor((new Date().getTime() - new Date(modification.requestedAt).getTime()) / 1000 / 60);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="w-full bg-surface-card border border-border rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5 group"
        >
            {/* Ticket Header */}
            <div className="relative h-2 bg-gradient-to-r from-status-warning via-status-warning to-status-warning w-full" />

            <div className="p-6 md:p-8">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-status-warning dark:bg-status-warning/20 flex items-center justify-center border border-amber-200 dark:border-action-primary/20 shadow-inner">
                            <AlertTriangle className="w-8 h-8 text-status-warning dark:text-status-warning" strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-serif font-black italic text-2xl md:text-3xl text-primary dark:text-text-primary tracking-tight">Table {tableNumber}</span>
                                <span className="px-2 py-0.5 rounded-full bg-status-danger dark:bg-status-danger/30 text-status-danger dark:text-status-danger text-chip-label border border-red-200 dark:border-red-800 animate-pulse">
                                    Prioritaire
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Il y a {String(timeSinceRequest)} min</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="text-status-warning dark:text-status-warning">{String(modification.requestedBy || 'Chef')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-surface-glass rounded-3xl p-6 border border-border mb-8">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                        <div className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center shrink-0 border border-border">
                            <ChefHat className="w-5 h-5 text-secondary dark:text-muted" strokeWidth={1.5} />
                        </div>
                        <span className="font-serif font-medium text-xl md:text-2xl text-primary dark:text-text-primary leading-none">
                            {itemName}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {removedIngredients.length > 0 && (
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-status-danger dark:bg-status-danger/20 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800/30">
                                    <Minus className="w-4 h-4 text-status-danger dark:text-status-danger" />
                                </div>
                                <div className="pt-1.5">
                                    <p className="text-nano font-black text-muted uppercase tracking-widest mb-1">Retirer</p>
                                    <p className="font-medium text-primary dark:text-muted text-lg leading-tight line-through decoration-red-500/50 decoration-2">
                                        {removedIngredients.join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {addedIngredients.length > 0 && (
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-status-success dark:bg-status-success/20 flex items-center justify-center shrink-0 border border-green-200 dark:border-green-800/30">
                                    <Plus className="w-4 h-4 text-status-success dark:text-status-success" />
                                </div>
                                <div className="pt-1.5">
                                    <p className="text-nano font-black text-muted uppercase tracking-widest mb-1">Ajouter</p>
                                    <p className="font-medium text-primary dark:text-muted text-lg leading-tight">
                                        {addedIngredients.join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {newNotes && (
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-tertiary dark:bg-action-primary/10 border border-focus dark:border-focus/30">
                                <MessageSquare className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-nano font-black text-brand uppercase tracking-widest mb-1 opacity-70">Note Client</p>
                                    <p className="font-serif italic text-brand dark:text-brand text-lg leading-snug">
                                        "{newNotes}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Fallback */}
                        {!removedIngredients.length && !addedIngredients.length && !newNotes && (
                            <div className="p-4 rounded-xl bg-surface-glass text-text-muted italic">
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
                        className="w-full px-6 py-4 bg-surface-glass border border-border rounded-2xl text-base text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-action-primary/50 transition-all font-medium"
                    />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleReject}
                        disabled={isResponding}
                        className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl border-2 border-transparent bg-surface-bg dark:bg-surface-card/5 text-secondary hover:bg-surface-bg hover:text-status-danger hover:border-red-100 dark:hover:bg-status-danger/20 dark:hover:text-status-danger dark:hover:border-red-900/30 transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                        <span>Refuser</span>
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isResponding}
                        className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-action-primary hover:bg-status-success text-text-on-primary hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-green-500/25 transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50 disabled:scale-100"
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
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl"
                    />

                    {/* Floating Panel Container */}
                    <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: -40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.95 }}
                            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                            className="bg-surface-card backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-border ring-1 ring-black/5 pointer-events-auto"
                        >
                            {/* Panel Header */}
                            <div className="relative shrink-0 px-8 py-6 border-b border-subtle/50 dark:border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="font-serif font-bold text-2xl text-primary dark:text-text-primary tracking-tight">
                                        Modifications
                                    </h2>
                                    <p className="text-secondary dark:text-muted text-sm font-medium mt-0.5">
                                        Gérez les demandes spéciales
                                    </p>
                                </div>

                                <button aria-label="Fermer"
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-surface-bg dark:bg-surface-card/10 flex items-center justify-center text-secondary hover:bg-surface-bg dark:hover:bg-surface-card/20 transition-all active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Decoration */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-surface-bg dark:via-white/10 to-transparent" />
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
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-status-success to-status-success flex items-center justify-center shadow-lg shadow-green-500/30 mb-8 animate-in fade-in zoom-in duration-500">
                                                <Check className="w-10 h-10 text-text-primary" strokeWidth={3} />
                                            </div>
                                            <h3 className="font-serif font-medium text-2xl text-primary dark:text-text-primary mb-2">
                                                Tout est en ordre
                                            </h3>
                                            <p className="text-secondary max-w-[200px] leading-relaxed">
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
                                <div className="shrink-0 px-8 py-4 bg-surface-bg dark:bg-surface-card/5 border-t border-subtle dark:border-white/5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-secondary">
                                    <span>En attente</span>
                                    <span className="bg-status-warning dark:bg-status-warning/30 text-status-warning dark:text-status-warning px-2 py-1 rounded-md">
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
