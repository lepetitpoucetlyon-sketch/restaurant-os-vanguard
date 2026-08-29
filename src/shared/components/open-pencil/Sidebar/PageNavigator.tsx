/**
 * 📚 PageNavigator — Sélecteur et explorateur des 84 pages de Restaurant OS
 */

"use client";

import React, { useState } from 'react';
import { PageCatalogRegistry, RegisteredPageMeta } from '@/kernel/open-pencil/catalog/PageCatalogRegistry';
import { 
    Search, LayoutDashboard, ShoppingCart, Users, Gauge, 
    Sparkles, Globe, Filter, CheckCircle2 
} from 'lucide-react';

interface PageNavigatorProps {
    activePageId: string;
    onSelectPage: (pageId: string) => void;
}

const CATEGORY_TABS: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', label: 'Toutes (84)', icon: LayoutDashboard },
    { id: 'operations', label: 'Opérations (14)', icon: ShoppingCart },
    { id: 'commerce', label: 'Commerce (14)', icon: Sparkles },
    { id: 'management', label: 'Gestion & RH (16)', icon: Users },
    { id: 'admin', label: 'Admin Fleet (14)', icon: Gauge },
    { id: 'marketing', label: 'Marketing (15)', icon: Globe },
    { id: 'public', label: 'Légal & Public (11)', icon: Globe },
];

export const PageNavigator: React.FC<PageNavigatorProps> = ({
    activePageId,
    onSelectPage,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const allPages = PageCatalogRegistry.getAllPages();

    const filteredPages = allPages.filter(page => {
        const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory;
        const matchesSearch =
            searchQuery.trim() === '' ||
            page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="w-80 h-full flex flex-col bg-bg-secondary border-r border-white/10 select-none">
            {/* Header & Search */}
            <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <span className="text-sm font-semibold text-text-primary">Pages Restaurant OS</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono font-medium">
                        84 écrans
                    </span>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une page ou route..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-bg-tertiary/40 border border-white/10 text-xs text-text-primary placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
                    />
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="p-2 border-b border-white/5 flex gap-1 overflow-x-auto scrollbar-none bg-bg-primary">
                {CATEGORY_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedCategory(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                            selectedCategory === tab.id
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Pages List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredPages.map(page => {
                    const isActive = page.id === activePageId;
                    return (
                        <button
                            key={page.id}
                            onClick={() => onSelectPage(page.id)}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 group border ${
                                isActive
                                    ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-lg shadow-amber-950/20'
                                    : 'border-transparent hover:bg-white/5 text-text-secondary'
                            }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    isActive
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                        : 'bg-white/5 text-text-muted group-hover:text-amber-400'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-medium truncate text-text-primary">
                                        {page.name}
                                    </span>
                                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono text-text-muted truncate">
                                        {page.route}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-bg-tertiary/40 text-text-muted font-mono uppercase">
                                        {page.devicePreset}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}

                {filteredPages.length === 0 && (
                    <div className="p-8 text-center text-xs text-neutral-500">
                        Aucune page trouvée pour « {searchQuery} »
                    </div>
                )}
            </div>
        </div>
    );
};
