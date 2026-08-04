import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Plus } from 'lucide-react';
import { QuoteProduct } from './quoteHelpers';

interface QuoteCatalogSidebarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filteredProducts: QuoteProduct[];
    addNewLine: (product?: QuoteProduct) => void;
    setShowCatalog: (show: boolean) => void;
}

export function QuoteCatalogSidebar({
    searchQuery,
    setSearchQuery,
    filteredProducts,
    addNewLine,
    setShowCatalog
}: QuoteCatalogSidebarProps) {
    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-[400px] h-full bg-bg-secondary border-l border-border z-50 shadow-2xl p-8 flex flex-col"
        >
            <div className="flex items-center justify-between mb-10">
                <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.4em]">Bibliothèque Artefacts</h4>
                <button onClick={() => setShowCatalog(false)} className="p-2 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="FILTRER LES PRODUITS..."
                    className="w-full h-12 pl-12 pr-6 bg-bg-tertiary border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-accent-gold transition-all"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 elegant-scrollbar pr-2">
                {filteredProducts.map((product, idx) => (
                    <button
                        key={product.id || idx}
                        onClick={() => addNewLine(product)}
                        className="w-full p-6 bg-bg-primary border border-border rounded-[28px] hover:border-accent-gold group transition-all text-left flex items-center justify-between shadow-sm"
                    >
                        <div>
                            <p className="text-sm font-black text-text-primary group-hover:text-accent-gold transition-colors">{String(product.name || '')}</p>
                            <p className="text-[10px] text-text-muted font-medium mt-1">{(Number(product.priceInMicrounits || (product.priceInCents ? product.priceInCents * 10_000 : 0)) / 1_000_000).toFixed(2)}€ HT</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-text-muted group-hover:bg-accent-gold group-hover:text-text-primary transition-all">
                            <Plus className="w-4 h-4" />
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
