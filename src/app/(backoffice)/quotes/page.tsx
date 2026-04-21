'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/ui.foundations";;
import {
    FileText,
    Plus,
    Send,
    Eye,
    Download,
    Copy,
    MoreVertical,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Users,
    Calendar,
    Euro,
    TrendingUp,
    Filter,
    Search,
    ChevronDown,
    ChevronRight,
    Mail,
    Printer,
    Edit2,
    Trash2,
    X,
    Building2,
    User,
    FileSignature,
    Sparkles,
    LayoutGrid
} from 'lucide-react';
import { NewReservationDialog } from "@/components/reservations/NewReservationDialog";
import { upsertReservationAction, deleteReservationAction, cancelReservationAction } from '@/app/(admin)/actions/reservations';
import {
    Quote,
    QuoteStatus,
    QUOTE_STATUS_CONFIG
} from '@/types';
import { QuotesService } from "@/lib/quotes-service";
import { useGeminiAgent } from "@/hooks/useGeminiAgent";
import { useIntelligence } from "@/context/IntelligenceContext";

interface NewQuoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewQuoteDialog = ({ isOpen, onClose }: NewQuoteDialogProps) => null;

import { useQuotes } from "@/engines/ops/NexusOpsProvider";

// Removed MOCK_QUOTES

// ============================================
// COMPONENTS
// ============================================

function StatCard({
    label,
    value,
    subvalue,
    icon: Icon,
    color = 'text-white'
}: {
    label: string;
    value: string | number;
    subvalue?: string;
    icon: React.ElementType;
    color?: string;
}) {
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-bg-tertiary/10 dark:bg-bg-tertiary/10 border border-border/30 rounded-[42px] p-8 shadow-premium relative overflow-hidden group backdrop-blur-3xl"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="space-y-3 min-w-0">
                    <p className="text-accent-gold text-[9px] font-black uppercase tracking-[0.4em] mb-3 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">{label}</p>
                    <p className={cn("text-3xl md:text-4xl font-mono font-black italic tracking-tight leading-none truncate", color === 'text-white' ? 'text-text-primary' : color)}>{value}</p>
                    {subvalue && (
                        <div className="flex items-center gap-2 mt-4">
                            <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                            <p className="text-text-muted/60 text-[9px] font-black tracking-[0.2em] uppercase truncate">{subvalue}</p>
                        </div>
                    )}
                </div>
                <div className="w-14 h-14 rounded-[20px] bg-bg-tertiary/10 border border-border/30 shrink-0 flex items-center justify-center text-text-muted group-hover:text-accent-gold group-hover:scale-110 transition-all duration-700 shadow-glow-sm">
                    <Icon strokeWidth={1} className="w-7 h-7" />
                </div>
            </div>
        </motion.div>
    );
}

function QuoteCard({ quote, onView, inflationRate = 0 }: { quote: Quote; onView: () => void; inflationRate?: number }) {
    const statusConfig = QUOTE_STATUS_CONFIG[quote.status];
    const [menuOpen, setMenuOpen] = useState(false);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const formatCurrency = (amountInCents: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amountInCents / 100);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            className="bg-bg-tertiary/10 dark:bg-bg-tertiary/10 border border-border/30 rounded-[48px] p-8 pr-16 hover:bg-white/[0.04] transition-all duration-700 group relative overflow-hidden flex items-center justify-between shadow-premium backdrop-blur-2xl"
        >
            {/* Status Neon Bar */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-20 rounded-r-full shadow-glow-sm" style={{ backgroundColor: statusConfig.color }} />
            <div className="absolute right-0 top-0 w-[30%] h-full bg-gradient-to-l from-white/[0.01] to-transparent pointer-events-none" />

            <div className="flex items-center gap-12 flex-1">
                {/* Visual Anchor */}
                <div className="relative">
                    <div className="absolute inset-0 bg-accent/10 blur-[30px] rounded-full scale-125 group-hover:bg-accent-gold/20 transition-all duration-700" />
                    <div className="w-24 h-24 rounded-[32px] bg-bg-tertiary border border-border/30 flex items-center justify-center relative z-10 shadow-premium transition-transform duration-700 group-hover:rotate-6">
                        {quote.customer.type === 'company' ? (
                            <Building2 strokeWidth={1} className="w-10 h-10 text-accent-gold" />
                        ) : (
                            <User strokeWidth={1} className="w-10 h-10 text-accent-gold" />
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em] opacity-40">{quote.quoteNumber}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span
                            className="px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-border/30 shadow-inner"
                            style={{ backgroundColor: `${statusConfig.color}15`, color: statusConfig.color }}
                        >
                            {statusConfig.label}
                        </span>
                    </div>
                    <h3 className="text-4xl font-serif text-text-primary italic tracking-tight group-hover:text-accent-gold transition-colors duration-500">{quote.customer.companyName || quote.customer.name}</h3>
                    <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.3em] truncate max-w-xl opacity-40">{quote.subject}</p>
                </div>
            </div>

            <div className="flex items-center gap-24 relative z-10">
                <div className="text-center group-hover:scale-105 transition-transform duration-700">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] mb-3 opacity-40">Validité</p>
                    <p className="text-3xl font-serif font-black text-text-primary italic opacity-70 tracking-tighter">{formatDate(quote.validUntil)}</p>
                </div>

                <div className="text-right min-w-[180px] group-hover:scale-110 transition-transform duration-700">
                    <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.5em] mb-3">MONTANT TTC</p>
                    <p className="text-4xl font-mono font-black text-text-primary italic tracking-tight leading-none">{formatCurrency(quote.totals.totalTTCInCents)}</p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <Sparkles className="w-3.5 h-3.5 text-accent-gold animate-pulse" />
                        <span className="text-[8px] font-black text-accent-gold uppercase tracking-[0.2em]">Signature Probable : {QuotesService.predictSignatureChance(quote, inflationRate)}%</span>
                    </div>
                </div>

                <div className="flex gap-5">
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onView}
                        className="w-16 h-16 rounded-[24px] bg-accent text-white flex items-center justify-center shadow-glow group/btn overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                        <Eye strokeWidth={2} className="w-6 h-6 relative z-10 group-hover/btn:text-black transition-colors" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-16 h-16 rounded-[24px] bg-bg-tertiary/10 text-text-muted hover:text-text-primary flex items-center justify-center transition-all border border-border/30 shadow-premium"
                    >
                        <Download strokeWidth={1.5} className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-16 h-16 rounded-[24px] bg-bg-tertiary/10 text-text-muted hover:text-text-primary flex items-center justify-center transition-all border border-border/30 shadow-premium"
                    >
                        <MoreVertical strokeWidth={1.5} className="w-6 h-6" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

function QuoteStats({ quotes }: { quotes: Quote[] }) {
    const thisMonth = quotes.filter(q => {
        const date = new Date(q.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const pending = quotes.filter(q => ['draft', 'sent', 'viewed'].includes(q.status));
    const accepted = quotes.filter(q => q.status === 'accepted' || q.status === 'converted');
    const totalValueInCents = accepted.reduce((sum, q) => sum + q.totals.totalTTCInCents, 0);
    const conversionRate = quotes.length > 0
        ? (accepted.length / quotes.filter(q => q.status !== 'draft').length * 100).toFixed(0)
        : 0;

    const formatCurrency = (amountInCents: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amountInCents / 100);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
                label="Devis ce mois"
                value={thisMonth.length}
                subvalue={`${pending.length} en attente`}
                icon={FileText}
            />
            <StatCard
                label="Taux conversion"
                value={`${conversionRate}%`}
                icon={TrendingUp}
                color="text-success"
            />
            <StatCard
                label="CA Accepté"
                value={formatCurrency(totalValueInCents)}
                icon={Euro}
                color="text-info"
            />
            <StatCard
                label="Valeur en attente"
                value={formatCurrency(pending.reduce((sum, q) => sum + q.totals.totalTTCInCents, 0))}
                icon={Clock}
                color="text-warning"
            />
        </div>
    );
}

function StatusFilter({
    value,
    onChange
}: {
    value: QuoteStatus | 'all';
    onChange: (v: QuoteStatus | 'all') => void;
}) {
    const statuses: (QuoteStatus | 'all')[] = ['all', 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'];

    return (
        <div className="flex items-center gap-3 flex-wrap bg-bg-tertiary/10 p-1.5 rounded-[28px] border border-border/30 backdrop-blur-xl shadow-inner">
            {statuses.map(status => {
                const config = status === 'all'
                    ? { label: 'Tous', color: '#FFFFFF' }
                    : QUOTE_STATUS_CONFIG[status];

                const isActive = value === status;

                return (
                    <button
                        key={status}
                        onClick={() => onChange(status)}
                        className={cn(
                            "px-8 py-3 rounded-[20px] text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 relative overflow-hidden group/filter",
                            isActive
                                ? "text-black shadow-glow-sm"
                                : "text-text-muted hover:text-text-primary"
                        )}
                        style={{ backgroundColor: isActive ? config.color : 'transparent' }}
                    >
                        <span className="relative z-10">{config.label}</span>
                        {!isActive && (
                            <div className="absolute inset-0 bg-bg-tertiary/10 translate-y-full group-hover/filter:translate-y-0 transition-transform duration-500" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function QuotesPage() {
    const { data: quotes, isLoading } = useQuotes();
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewQuoteDialogOpen, setIsNewQuoteDialogOpen] = useState(false);
    const { globalInflationRate } = useIntelligence();

    const filteredQuotes = (quotes || []).filter(quote => {
        if (statusFilter !== 'all' && quote.status !== statusFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                quote.quoteNumber.toLowerCase().includes(query) ||
                (quote.customer.name && quote.customer.name.toLowerCase().includes(query)) ||
                (quote.customer.companyName && quote.customer.companyName.toLowerCase().includes(query)) ||
                quote.subject.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const stats = QuotesService.calculateStats(quotes || []);
    const { sendMessage } = useGeminiAgent();

    // Mettre à jour le contexte global de l'IA pour cette page
    useEffect(() => {
        if (quotes) {
            const updateContext = () => {
                window.dispatchEvent(new CustomEvent('ai:context_update', { 
                    detail: stats 
                }));
            };
            updateContext();
        }
    }, [stats, quotes]);

    const handleAISend = (text: string) => {
        sendMessage(text, stats);
    };

    return (
        <div className="h-screen -m-4 md:-m-8 bg-bg-primary overflow-hidden flex flex-col relative">
            {/* Global Ambient Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent-gold/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="flex-1 overflow-auto p-12 md:p-20 w-full elegant-scrollbar relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-16">
                        <div>
                            <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.6em] mb-4">Architecture Exécutive</p>
                            <h1 className="text-7xl font-serif text-text-primary italic tracking-tighter mb-6 leading-none">Gestion des Devis</h1>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-primary bg-bg-tertiary" />
                                    ))}
                                </div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em]">98% Conversion Protocol • v4.2</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsNewQuoteDialogOpen(true)}
                                className="h-16 px-12 bg-accent text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.5em] shadow-glow flex items-center gap-5 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                                <Plus strokeWidth={2.5} className="w-4 h-4 relative z-10 group-hover:text-black transition-colors" />
                                <span className="relative z-10 group-hover:text-black transition-colors">Nouveau Devis</span>
                                <div className="w-8 h-px bg-white/20 group-hover:bg-black/20 group-hover:w-12 transition-all relative z-10" />
                            </motion.button>
                        </div>
                    </div>


                    {/* Stats */}
                    <QuoteStats quotes={quotes || []} />

                    {/* Search & Filters Capsule */}
                    <div className="mt-20 flex items-center justify-between bg-bg-tertiary/10 dark:bg-bg-tertiary/10 backdrop-blur-2xl p-2 rounded-[32px] border border-border/30 mb-12 shadow-premium">
                        <StatusFilter value={statusFilter} onChange={setStatusFilter} />

                        <div className="relative flex-1 max-w-md mr-2 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-gold transition-colors" strokeWidth={2.5} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="RECHERCHER DANS L'ARCHIVE..."
                                className="w-full h-14 pl-16 pr-8 bg-bg-tertiary/40 border border-border rounded-[24px] text-[10px] text-text-primary font-black uppercase tracking-widest placeholder:text-text-muted/40 outline-none focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all"
                            />
                        </div>
                    </div>

                    {/* Quotes Grid */}
                    <div className="grid grid-cols-1 gap-8 pb-32">
                        <AnimatePresence mode="popLayout">
                            {filteredQuotes.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-52 bg-bg-tertiary/10 rounded-[64px] border border-dashed border-border/30 shadow-inner relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-accent/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                    <FileText className="w-24 h-24 mx-auto mb-10 text-white/5 group-hover:text-accent-gold/20 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6" strokeWidth={1} />
                                    <p className="text-3xl font-serif italic text-text-muted tracking-tight">Aucun protocole archivé dans cette dimension</p>
                                    <p className="text-[10px] font-black text-text-muted/30 uppercase tracking-[0.5em] mt-6">Protocol v4.2 • Intelligence Matrix</p>
                                </motion.div>
                            ) : (
                                filteredQuotes.map(quote => (
                                    <QuoteCard
                                        key={quote.id}
                                        quote={quote}
                                        inflationRate={globalInflationRate || 0}
                                        onView={() => { }}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <NewQuoteDialog
                isOpen={isNewQuoteDialogOpen}
                onClose={() => setIsNewQuoteDialogOpen(false)}
            />
        </div>
    );
}
