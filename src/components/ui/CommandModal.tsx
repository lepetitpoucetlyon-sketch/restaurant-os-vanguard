"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Command,
    LayoutDashboard,
    Store,
    Map,
    CalendarDays,
    ChefHat,
    Package,
    Users,
    ClipboardCheck,
    BarChart3,
    Calculator,
    Sparkles,
    CalendarRange,
    X,
    ArrowRight,
    Plus,
    FileText,
    Receipt,
    Clock,
    Printer
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { Modal } from "@ui/Modal";
import { useUI } from "@/hooks";

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
    action?: () => void;
    href?: string;
    category: 'navigation' | 'actions' | 'search';
    section?: string;
    shortcut?: string;
}

const NAV_ITEMS: CommandItem[] = [
    // Navigation items kept for reference but hidden from main view as requested
    { id: 'dashboard', label: 'Tableau de bord', description: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/', category: 'navigation', section: 'Navigation', shortcut: '⌘1' },
];

const ACTION_ITEMS: CommandItem[] = [
    // Création Rapide
    { id: 'new-order', label: 'Nouvelle Commande', description: 'Créer un ticket POS', icon: Receipt, href: '/pos', category: 'actions', section: 'Création Rapide', shortcut: '⌘N' },
    { id: 'new-reservation', label: 'Nouvelle Réservation', description: 'Ajouter au carnet', icon: CalendarDays, href: '/reservations?new=true', category: 'actions', section: 'Création Rapide', shortcut: '⌘R' },
    { id: 'new-client', label: 'Nouveau Client', description: 'Fiche Customer', icon: Users, href: '/customer?new=true', category: 'actions', section: 'Création Rapide' },
    { id: 'new-staff', label: 'Recrutement / Staff', description: 'Ajouter un collaborateur', icon: Users, href: '/staff?new=true', category: 'actions', section: 'Création Rapide' },
    { id: 'new-product', label: 'Référencer Produit', description: 'Ajout catalogue', icon: Package, href: '/inventory?action=add', category: 'actions', section: 'Création Rapide' },

    // Opérations
    { id: 'start-shift', label: 'Ouvrir Service', description: 'Début de shift', icon: Clock, category: 'actions', section: 'Opérations' },
    { id: 'end-shift', label: 'Clôture Z', description: 'Fin de journée', icon: Calculator, category: 'actions', section: 'Opérations' },
    { id: 'inventory-check', label: 'Inventaire Éclair', description: 'Scan de stock', icon: Package, category: 'actions', section: 'Opérations' },
    { id: 'print-menu', label: 'Imprimer Menu', description: 'Carte du jour', icon: Printer, category: 'actions', section: 'Opérations' },

    // Finance & Reports
    { id: 'export-report', label: 'Rapport Financier', description: 'Export PDF J-1', icon: FileText, category: 'actions', section: 'Finance & Analyses' },
    { id: 'view-analytics', label: 'Live Analytics', description: 'Performance temps réel', icon: BarChart3, href: '/analytics', category: 'actions', section: 'Finance & Analyses' },
];

interface CommandModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommandModal({ isOpen, onClose }: CommandModalProps) {
    const { theme } = useUI();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Only show ACTION_ITEMS by default, unless searching matches navigation
    const allItems = [...ACTION_ITEMS];

    const filteredItems = searchTerm
        ? allItems.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : allItems;

    const handleClose = () => {
        setSearchTerm('');
        setSelectedIndex(0);
        onClose();
    };

    const handleItemClick = (item: CommandItem) => {
        if (item.href) {
            router.push(item.href);
        } else if (item.action) {
            item.action();
        }
        handleClose();
    };

    // Group items by section
    const groupedItems = filteredItems.reduce((acc, item) => {
        const section = item.section || 'Actions';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {} as Record<string, CommandItem[]>);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = filteredItems[selectedIndex];
                if (item) handleItemClick(item);
            } else if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, handleClose, isOpen, selectedIndex]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            className="p-0 border-none bg-transparent"
        >
            <div className={cn(
                "relative w-full border rounded-[2.5rem] overflow-hidden flex flex-col group/modal transition-colors duration-500",
                "bg-bg-primary border-border shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_50px_rgba(197,160,89,0.1)]"
            )}>
                {/* Visual Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-accent-gold/5 blur-3xl pointer-events-none" />

                {/* Spotlight Search Header */}
                <div className="flex items-center gap-6 p-10 border-b border-border/10 relative z-10 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/20 shadow-glow">
                        <Search strokeWidth={1.5} className="w-6 h-6" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="QUELLE ACTION EXÉCUTER ?"
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setSelectedIndex(0);
                        }}
                        className="flex-1 bg-transparent text-text-primary text-2xl font-serif font-black italic outline-none tracking-tighter transition-colors placeholder:text-text-muted/20"
                    />
                    <div className="flex items-center gap-3 px-4 py-2 border border-border bg-bg-tertiary/40 rounded-2xl transition-colors">
                        <span className="text-[11px] font-black tracking-[0.2em] text-text-muted/60">ECHAP</span>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[500px] overflow-y-auto elegant-scrollbar p-6 space-y-8 relative z-10">
                    {filteredItems.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="font-serif italic text-2xl text-black/20">Aucune action trouvée pour "{searchTerm}"</p>
                        </div>
                    ) : (
                        Object.entries(groupedItems).map(([section, items], sectionIndex) => (
                            <div key={section} className="space-y-3">
                                <div className="flex items-center gap-4 px-4 mb-4 mt-2">
                                    <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
                                    <p className="text-[11px] font-black text-accent-gold uppercase tracking-[0.4em]">
                                        {section}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {items.map((item) => {
                                        const globalIndex = filteredItems.indexOf(item);
                                        const Icon = item.icon;
                                        const isActive = selectedIndex === globalIndex;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleItemClick(item)}
                                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                className={cn(
                                                    "group flex items-center gap-5 p-4 rounded-2.5xl transition-all duration-500 border",
                                                    isActive
                                                        ? "bg-accent-gold border-transparent shadow-glow translate-x-1"
                                                        : "bg-white/5 border-transparent opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700",
                                                    isActive ? "bg-white/20 text-white" : "bg-white text-accent-gold border border-accent-gold/20 shadow-sm"
                                                )}>
                                                    <Icon strokeWidth={1.5} className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className={cn("font-serif font-black italic text-md leading-none transition-colors", isActive ? "text-black hidden-text-shadow" : "text-text-primary")}>
                                                        {item.label}
                                                    </p>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mt-2", isActive ? "text-black/60" : "text-text-muted/60")}>
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <ArrowRight className={cn(
                                                    "w-5 h-5 transition-all duration-700",
                                                    isActive ? "text-black translate-x-2" : "text-text-muted/20"
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Center - Operational Protocol */}
                <div className="p-8 border-t flex items-center justify-between relative z-10 shrink-0 border-black/5 bg-black/[0.02]">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-black/5 border-black/10 text-black/40 px-2 py-1 border rounded-lg text-[9px] font-black">↑↓</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Parcourir</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-black/5 border-black/10 text-black/40 px-2 py-1 border rounded-lg text-[9px] font-black">↵</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Activer</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-black text-accent-gold uppercase tracking-[0.3em]">IA Maître</span>
                            <span className="text-[7px] font-black uppercase tracking-[0.5em] mt-1 text-black/20 transition-colors">Version 2.5 Alpha</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-accent-gold" />
                        </div>
                    </div>
                </div>
            </div>
        </Modal >
    );
}
