'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Plus, Trash2, FileText } from 'lucide-react';
import { PremiumSelect } from '@ui/PremiumSelect';
import type { QuoteLine } from '../../../types';

interface QuoteMatrixGridProps {
    lines: Partial<QuoteLine>[];
    onAddNewLine: () => void;
    onOpenCatalog: () => void;
    onUpdateLine: (id: string, updates: Partial<QuoteLine>) => void;
    onRemoveLine: (id: string) => void;
}

export function QuoteMatrixGrid({
    lines,
    onAddNewLine,
    onOpenCatalog,
    onUpdateLine,
    onRemoveLine,
}: QuoteMatrixGridProps) {
    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-accent-gold" />
                    </div>
                    <h3 className="text-micro font-black text-text-muted uppercase tracking-[0.3em]">Matrice de Composition</h3>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onOpenCatalog}
                        className="px-6 py-2.5 bg-bg-secondary border border-border rounded-full text-chip-label-sm text-text-muted hover:text-accent-gold transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Catalogue Artefacts
                    </button>
                    <button
                        onClick={onAddNewLine}
                        className="px-6 py-2.5 bg-accent-gold text-primary rounded-full text-chip-label-sm flex items-center gap-2 shadow-premium hover:bg-surface-card transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Ligne Manuelle
                    </button>
                </div>
            </div>

            <div className="bg-bg-secondary/40 border border-border rounded-[42px] overflow-hidden backdrop-blur-md">
                <div className="grid grid-cols-[1fr,100px,140px,100px,140px,60px] p-6 text-nano font-black text-text-muted uppercase tracking-[0.2em] border-b border-border/50 bg-bg-tertiary">
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
                            <motion.div
                                key={line.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="grid grid-cols-[1fr,100px,140px,100px,140px,60px] p-6 items-center group"
                            >
                                <input
                                    value={line.designation}
                                    onChange={(e) => onUpdateLine(line.id!, { designation: e.target.value })}
                                    placeholder="Saisir la prestation..."
                                    className="bg-transparent text-sm text-text-primary outline-none font-medium placeholder:text-text-muted/20"
                                />
                                <div className="flex justify-center">
                                    <input
                                        type="number"
                                        value={line.quantity}
                                        onChange={(e) => onUpdateLine(line.id!, { quantity: parseFloat(e.target.value) || 0 })}
                                        className="w-16 h-10 bg-bg-tertiary border border-border rounded-xl text-center text-sm font-mono text-text-primary focus:border-accent-gold transition-all shadow-inner"
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <input
                                        type="number"
                                        value={line.unitPriceHTInMicrounits ? (line.unitPriceHTInMicrounits / 1_000_000) : 0}
                                        onChange={(e) => onUpdateLine(line.id!, { unitPriceHTInMicrounits: Math.round(parseFloat(e.target.value) * 1_000_000) || 0 })}
                                        className="w-24 h-10 bg-bg-tertiary border border-border rounded-xl text-center text-sm font-mono text-accent focus:border-accent-gold transition-all shadow-inner"
                                    />
                                </div>
                                <div className="flex justify-center w-full">
                                    <PremiumSelect
                                        value={line.vatRate?.toString() || "20"}
                                        onChange={(val) => onUpdateLine(line.id!, { vatRate: parseFloat(val) })}
                                        options={[
                                            { value: '20', label: '20%' },
                                            { value: '10', label: '10%' },
                                            { value: '5.5', label: '5.5%' }
                                        ]}
                                        className="w-24 mt-0 space-y-0"
                                    />
                                </div>
                                <div className="text-right text-sm font-mono font-black text-text-primary tracking-tighter">
                                    {((line.totalTTCInMicrounits || 0) / 1_000_000).toFixed(2)}€
                                </div>
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onRemoveLine(line.id!)}
                                        className="p-3 text-text-muted hover:text-error transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {lines.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <FileText className="w-12 h-12 mx-auto text-text-muted/10" strokeWidth={1} />
                            <p className="text-nano font-black text-text-muted uppercase tracking-[0.3em]">Matrice Vide • Insérer Artefact</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
