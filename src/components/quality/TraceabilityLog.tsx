import React from 'react';
import { History, Search } from 'lucide-react';

export const TraceabilityLog: React.FC = () => {
    return (
        <div className="p-6 bg-white dark:bg-bg-secondary rounded-[2rem] border border-border shadow-soft">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-serif font-bold italic flex items-center gap-3">
                    <History className="w-5 h-5 text-accent-gold" />
                    Registre de Traçabilité
                </h3>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" placeholder="Rechercher un lot..." className="pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-xl text-xs focus:outline-none focus:border-accent-gold" />
                </div>
            </div>
            <div className="space-y-3">
                <p className="text-[10px] text-text-muted italic uppercase tracking-widest text-center py-4">Consultez les archives pour la conformité NF525/HACCP</p>
            </div>
        </div>
    );
};
