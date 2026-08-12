'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Plus,
    Building2,
    User,
    FileText,
    Sparkles,
    Package,
    Search
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";;
import { Modal } from '@ui/Modal';
import { PremiumSelect } from '@ui/PremiumSelect';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
import { useQuotes } from '../../../../../ops/providers/hooks/commerceHooks';
import { useInventory } from '../../../../../logistics/stock/inventory/hooks/useInventory';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
import { useCRM } from '../../../../../ops/providers/hooks/commerceHooks';
import { QuoteLine } from '../../types';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';


interface NewQuoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

import { recalculateLineTotals, buildQuotePayload, needsRecalculation, type QuoteProduct } from './new-quote/quoteHelpers';
import { CatalogSidebar } from './new-quote/CatalogSidebar';
import { QuoteLineRow } from './new-quote/QuoteLineRow';

function createQuoteLine(product?: QuoteProduct): Partial<QuoteLine> {
    const price = product?.priceInMicrounits ?? ((product?.priceInCents ?? product?.unitCostInCents ?? 0) * 10_000);
    return recalculateLineTotals({
        id: crypto.randomUUID(),
        type: product ? 'product' : 'service',
        designation: product?.name ?? '',
        quantity: 1,
        unitPriceHTInMicrounits: price,
        vatRate: 20,
        unit: 'unité',
    });
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
                    <section className="space-y-8">
                        <div className="flex items-center gap-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-accent" />
                            </div>
                            <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.3em]">Cible de Haute Excellence</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Type Toggle */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block ml-2">Type d'entité</label>
                                <div className="flex p-1.5 bg-bg-secondary rounded-[24px] border border-border shadow-inner">
                                    <button
                                        onClick={() => setCRMType('company')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-3 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                                            crmType === 'company' ? "bg-surface-card dark:bg-surface-card/10 text-text-primary shadow-premium" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <Building2 className="w-4 h-4" />
                                        Entreprise
                                    </button>
                                    <button
                                        onClick={() => setCRMType('individual')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-3 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                                            crmType === 'individual' ? "bg-surface-card dark:bg-surface-card/10 text-text-primary shadow-premium" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <User className="w-4 h-4" />
                                        Particulier
                                    </button>
                                </div>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block ml-2">Dénomination</label>
                                <input
                                    type="text"
                                    value={crmName}
                                    onChange={(e) => setCRMName(e.target.value)}
                                    placeholder="Ex: Société Example SAS"
                                    className="w-full h-14 px-8 bg-bg-secondary border border-border rounded-[24px] text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 shadow-inner"
                                />
                            </div>

                            {/* Email Input */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block ml-2">Coordination Email</label>
                                <input
                                    type="email"
                                    value={crmEmail}
                                    onChange={(e) => setCRMEmail(e.target.value)}
                                    placeholder="contact@archive-exécutive.com"
                                    className="w-full h-14 px-8 bg-bg-secondary border border-border rounded-[24px] text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 shadow-inner"
                                />
                            </div>

                            {/* Subject Input */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block ml-2">Objet du Protocole</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Privatisation Salle Excellence..."
                                    className="w-full h-14 px-8 bg-bg-secondary border border-border rounded-[24px] text-sm font-serif italic text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 shadow-inner"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Content Matrix (Items Table) */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-accent-gold" />
                                </div>
                                <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.3em]">Matrice de Composition</h3>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowCatalog(true)}
                                    className="px-6 py-2.5 bg-bg-secondary border border-border rounded-full text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-accent-gold transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Search className="w-3.5 h-3.5" />
                                    Catalogue Artefacts
                                </button>
                                <button
                                    onClick={() => addNewLine()}
                                    className="px-6 py-2.5 bg-accent-gold text-primary rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-premium hover:bg-surface-card transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Ligne Manuelle
                                </button>
                            </div>
                        </div>

                        {/* Matrix Grid */}
                        <div className="bg-bg-secondary/40 border border-border rounded-[42px] overflow-hidden backdrop-blur-md">
                            <div className="grid grid-cols-[1fr,100px,140px,100px,140px,60px] p-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border/50 bg-bg-tertiary">
                                <div>Désignation & Artefact</div>
                                <div className="text-center">Quantité</div>
                                <div className="text-center">Prix Un. HT</div>
                                <div className="text-center">TVA %</div>
                                <div className="text-right">Total TTC</div>
                                <div />
                            </div>

                            <div className="divide-y divide-border/30">
                                <AnimatePresence initial={false}>
                                    {lines.map((line) => (
                                        <QuoteLineRow key={line.id} line={line} onUpdate={updateLine} onRemove={removeLine} />
                                    ))}
                                </AnimatePresence>

                                {lines.length === 0 && (
                                    <div className="py-20 text-center space-y-4">
                                        <FileText className="w-12 h-12 mx-auto text-text-muted/10" strokeWidth={1} />
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Matrice Vide • Insérer Artefact</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
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

                <CatalogSidebar
                    isOpen={showCatalog}
                    onClose={() => setShowCatalog(false)}
                    products={filteredProducts}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSelectProduct={addNewLine}
                />
            </div>
        </Modal>
    );
}
