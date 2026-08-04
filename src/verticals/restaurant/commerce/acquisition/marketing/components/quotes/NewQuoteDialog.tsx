'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import { Modal } from '@ui/Modal';
import { useInventory, useQuotes, useCRM } from '@/modules/ops';
import { QuoteLine } from '@/verticals/restaurant/commerce/acquisition/marketing/types';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

import { QuoteProduct, createQuoteLine, recalculateLineTotals, buildQuotePayload, needsRecalculation } from './new-quote/quoteHelpers';
import { QuoteCRMForm } from './new-quote/QuoteCRMForm';
import { QuoteMatrix } from './new-quote/QuoteMatrix';
import { QuoteCatalogSidebar } from './new-quote/QuoteCatalogSidebar';

interface NewQuoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NewQuoteDialog({ isOpen, onClose }: NewQuoteDialogProps) {
    const [crmType, setCRMType] = useState<'individual' | 'company'>('company');
    const [crmName, setCRMName] = useState('');
    const [crmEmail, setCRMEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [lines, setLines] = useState<Partial<QuoteLine>[]>(() => [createQuoteLine()]);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCatalog, setShowCatalog] = useState(false);

    const addNewLine = (product?: QuoteProduct) => {
        setLines([...lines, createQuoteLine(product)]);
        setShowCatalog(false);
    };

    const resetForm = () => {
        setCRMType('company');
        setCRMName('');
        setCRMEmail('');
        setSubject('');
        setLines([createQuoteLine()]);
        setIsSaving(false);
        setSearchQuery('');
        setShowCatalog(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: string, updates: Partial<QuoteLine>) => {
        const needsRecalc = needsRecalculation(updates);
        setLines(lines.map(l => {
            if (l.id !== id) return l;
            const merged = { ...l, ...updates };
            return needsRecalc ? recalculateLineTotals(merged) : merged;
        }));
    };

    const calculateTotals = () => {
        const totalHTInMicrounits = lines.reduce((sum, l) => sum + (l.totalHTInMicrounits || 0), 0);
        const totalVATInMicrounits = lines.reduce((sum, l) => sum + (l.vatAmountInMicrounits || 0), 0);
        const totalTTCInMicrounits = lines.reduce((sum, l) => sum + (l.totalTTCInMicrounits || 0), 0);
        return { totalHTInMicrounits, totalVATInMicrounits, totalTTCInMicrounits };
    };

    const totals = calculateTotals();

    const { data: inventoryProducts } = useInventory();
    const { createQuote } = useQuotes();
    const { selectedCRM } = useCRM();
    
    const handleSave = async () => {
        if (!crmName || !crmEmail || lines.length === 0) {
            toast.error("Veuillez remplir les informations client et ajouter au moins une ligne.");
            return;
        }

        setIsSaving(true);
        try {
            await createQuote(buildQuotePayload(lines, crmName, subject, selectedCRM?.id, totals));
            
            toast.success("Le devis a été généré et persisté avec succès.");
            handleClose();
        } catch (error) {
            logger.error('[NewQuoteDialog] Failed to generate quote', error);
            toast.error("Échec de la génération du devis. Vérifiez la console.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = (inventoryProducts || []).filter((p: QuoteProduct) =>
        String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="xl">
            <div className="flex flex-col h-[90vh] bg-bg-primary overflow-hidden relative">
                {/* Visual Background Effects */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent-gold to-accent opacity-50" />
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-accent-gold/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Header Section */}
                <div className="p-12 pb-8 flex items-end justify-between relative z-10 shrink-0 border-b border-border/30">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em]">Architecture de Devis</span>
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Protocol v4.2</span>
                        </div>
                        <h2 className="text-5xl font-serif font-black text-text-primary italic tracking-tighter leading-none">Nouveau Devis</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-14 h-14 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
                    >
                        <X strokeWidth={1.5} className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-12 space-y-16 elegant-scrollbar relative z-10">
                    {/* CRM Configuration */}
                    <QuoteCRMForm
                        crmType={crmType} setCRMType={setCRMType}
                        crmName={crmName} setCRMName={setCRMName}
                        crmEmail={crmEmail} setCRMEmail={setCRMEmail}
                        subject={subject} setSubject={setSubject}
                    />

                    {/* Content Matrix (Items Table) */}
                    <QuoteMatrix
                        lines={lines}
                        updateLine={updateLine}
                        removeLine={removeLine}
                        addNewLine={addNewLine}
                        setShowCatalog={setShowCatalog}
                    />
                </div>

                {/* Footer Analysis Bar */}
                <div className="p-8 px-12 bg-bg-secondary border-t border-border flex items-center justify-between relative z-10 shrink-0 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-16">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">Total HT</span>
                            <span className="text-2xl font-mono text-text-primary tracking-tighter">{((totals.totalHTInMicrounits || 0) / 1_000_000).toFixed(2)}€</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">TVA (Mixte)</span>
                            <span className="text-2xl font-mono text-text-primary/40 tracking-tighter">{((totals.totalVATInMicrounits || 0) / 1_000_000).toFixed(2)}€</span>
                        </div>
                        <div className="w-px h-10 bg-border mx-4" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mb-1">VALEUR FINALE TTC</span>
                            <span className="text-4xl font-mono font-black text-accent tracking-tighter">
                                {((totals.totalTTCInMicrounits || 0) / 1_000_000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <button
                            onClick={onClose}
                            className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] hover:text-text-primary transition-colors"
                        >
                            Abandonner
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            disabled={isSaving}
                            className={cn(
                                "h-16 px-14 bg-accent text-text-primary rounded-[24px] text-[11px] font-black uppercase tracking-[0.5em] shadow-premium transition-all duration-700 relative overflow-hidden group flex items-center gap-4",
                                isSaving && "opacity-50 grayscale cursor-not-allowed"
                            )}
                        >
                            <div className="absolute inset-0 bg-surface-card translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                                    <span className="relative z-10">Mémorisation...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform group-hover:text-primary" />
                                    <span className="relative z-10 group-hover:text-primary">Générer le Devis</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Catalog Sidebar (Absolute overlay) */}
                <AnimatePresence>
                    {showCatalog && (
                        <QuoteCatalogSidebar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            filteredProducts={filteredProducts}
                            addNewLine={addNewLine}
                            setShowCatalog={setShowCatalog}
                        />
                    )}
                </AnimatePresence>
            </div>
        </Modal>
    );
}
