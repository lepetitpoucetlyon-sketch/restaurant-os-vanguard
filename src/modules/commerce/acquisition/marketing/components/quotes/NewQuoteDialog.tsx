'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@ui/Modal';
import { useQuotes } from '../../../../../ops/providers/hooks/commerceHooks';
import { useInventory } from '../../../../../logistics/stock/inventory/hooks/useInventory';
import { useCRM } from '../../../../../ops/providers/hooks/commerceHooks';
import type { QuoteLine } from '../../types';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

import { recalculateLineTotals, buildQuotePayload, needsRecalculation, type QuoteProduct } from './new-quote/quoteHelpers';
import { QuoteCrmSection } from './dialog/QuoteCrmSection';
import { QuoteMatrixGrid } from './dialog/QuoteMatrixGrid';
import { QuoteCatalogSidebar } from './dialog/QuoteCatalogSidebar';
import { QuoteFooterBar } from './dialog/QuoteFooterBar';

interface NewQuoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

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
                    <QuoteCrmSection
                        crmType={crmType}
                        setCRMType={setCRMType}
                        crmName={crmName}
                        setCRMName={setCRMName}
                        crmEmail={crmEmail}
                        setCRMEmail={setCRMEmail}
                        subject={subject}
                        setSubject={setSubject}
                    />

                    <QuoteMatrixGrid
                        lines={lines}
                        onAddNewLine={() => addNewLine()}
                        onOpenCatalog={() => setShowCatalog(true)}
                        onUpdateLine={updateLine}
                        onRemoveLine={removeLine}
                    />
                </div>

                {/* Footer Analysis Bar */}
                <QuoteFooterBar
                    totals={totals}
                    isSaving={isSaving}
                    onClose={onClose}
                    onSave={handleSave}
                />

                {/* Catalog Sidebar */}
                <QuoteCatalogSidebar
                    showCatalog={showCatalog}
                    onCloseCatalog={() => setShowCatalog(false)}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filteredProducts={filteredProducts}
                    onSelectProduct={addNewLine}
                />
            </div>
        </Modal>
    );
}
