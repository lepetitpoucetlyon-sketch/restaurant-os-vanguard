"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    Users,
    Clock,
    Phone,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Instagram,
    Facebook,
    Globe,
    ChevronRight,
    MessageSquare,
    Star,
    LayoutGrid,
    BookOpen,
    Heart,
    X,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;
import { useToast } from "@/components/ui/Toast";
import { useUI } from "@/context/UIContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useReservations } from "@/engines/ops/NexusOpsProvider";

// Mock reservation sources
const RESERVATION_SOURCES = {
    website: { name: 'Site Web', icon: Globe, color: '#1A1A1A' },
    google: { name: 'Google', icon: Globe, color: '#4285F4' },
    instagram: { name: 'Instagram', icon: Instagram, color: '#E4405F' },
    facebook: { name: 'Facebook', icon: Facebook, color: '#1877F2' },
    phone: { name: 'Téléphone', icon: Phone, color: '#C5A059' },
    thefork: { name: 'TheFork', icon: ExternalLink, color: '#00A86B' },
    tripadvisor: { name: 'TripAdvisor', icon: ExternalLink, color: '#34E0A1' },
};

const STATUS_CONFIG = {
    confirmed: { label: 'CONFIRMÉ', color: '#C5A059', bg: '#E6F9EF' },
    pending: { label: 'EN ATTENTE', color: '#FF9900', bg: '#FFF7E6' },
    cancelled: { label: 'ANNULÉ', color: '#FF4D4D', bg: '#FEECEC' },
    noshow: { label: 'NO-SHOW', color: '#6C757D', bg: '#F8F9FA' },
};

export default function OmnichannelReservationsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { data: reservations, isLoading, addReservation } = useReservations();
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewReservation, setShowNewReservation] = useState(false);

    // New Reservation State
    const [newRes, setNewRes] = useState<{
        name: string;
        phone: string;
        source: 'phone' | 'website' | 'walk-in' | 'google' | 'thefork' | 'instagram' | 'facebook' | 'tripadvisor' | 'direct';
        guests: number;
        time: string;
        date: string;
    }>({
        name: '',
        phone: '',
        source: 'website',
        guests: 2,
        time: '20:00',
        date: new Date().toISOString().split('T')[0]
    });

    const filteredReservations = (reservations || []).filter(r => {
        if (filterSource && r.source !== filterSource) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        if (searchQuery && !r.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: (reservations || []).length,
        confirmed: (reservations || []).filter(r => r.status === 'confirmed').length,
        pending: (reservations || []).filter(r => r.status === 'pending').length,
        guests: (reservations || []).reduce((acc, r) => acc + (r.guests || 0), 0),
    };

    const handleConfirm = async (id: string) => {
        try {
            await addReservation({ id, status: 'confirmed' });
            showToast("Réservation confirmée", "premium");
        } catch (error) {
            showToast("Erreur lors de la confirmation", "error");
        }
    };

    const handleSubmit = async () => {
        try {
            await addReservation({
                ...newRes,
                id: `RES-${Math.random().toString(36).substr(2, 9)}`,
                status: 'confirmed',
                tags: ['Direct'],
                tableId: 'T-?',
                crmName: newRes.name,
                customerName: newRes.name,
                covers: newRes.guests,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as any);
            showToast("Réservation enregistrée", "premium");
            setShowNewReservation(false);
        } catch (error) {
            showToast("Échec de l'enregistrement", "error");
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex-col bg-bg-primary transition-colors duration-500 overflow-hidden font-sans">
            {/* Main Action Bar Interior */}
            <div className="p-12 pb-0">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-serif text-text-primary italic mb-2">Réservations <span className="text-accent-gold not-italic font-sans font-black uppercase tracking-tighter text-3xl">Omnicanal</span></h1>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                            SMART COMMAND CENTER • SYCHRONISATION TEMPS RÉEL
                        </p>
                    </div>
                    <div className="flex items-center gap-12">
                        {[
                            { label: 'TOTAL', val: stats.total, col: 'text-white' },
                            { label: 'CONFIRMÉES', val: stats.confirmed, col: 'text-accent' },
                            { label: 'EN ATTENTE', val: stats.pending, col: 'text-accent' },
                            { label: 'COUVERTS', val: stats.guests, col: 'text-white' }
                        ].map(stat => (
                            <div key={stat.label} className="text-center group">
                                <p className="text-5xl font-mono font-extralight italic leading-none mb-3 text-text-primary transition-transform group-hover:scale-110">{stat.val}</p>
                                <p className={cn("text-[9px] font-black uppercase tracking-[0.3em]", stat.col === 'text-white' ? 'text-text-muted' : 'text-accent')}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Unified Command Center Bar */}
                <div className="flex items-center bg-bg-secondary p-1.5 rounded-full border border-border mb-10 shadow-2xl">
                    <div className="flex-1 relative flex items-center pr-6 min-w-0">
                        <Search className="absolute left-6 w-4 h-4 text-text-muted" strokeWidth={1.5} />
                        <input
                            type="text"
                            placeholder="RECHERCHER PAR NOM, TÉLÉPHONE, CONFIRMÉ, EN ATTENTE, ANNULÉ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-primary pl-14 pr-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border-none text-text-primary placeholder:text-text-muted truncate"
                        />
                    </div>

                    <div className="w-px h-8 bg-border/40" />

                    <div className="flex items-center gap-0.5 px-4">
                        {[
                            { id: 'confirmed', label: 'CONFIRMÉ' },
                            { id: 'pending', label: 'EN ATTENTE' },
                            { id: 'cancelled', label: 'ANNULÉ' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(filterStatus === tab.id ? null : tab.id)}
                                className={cn(
                                    "px-6 h-12 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
                                    filterStatus === tab.id
                                        ? "bg-text-primary text-bg-primary shadow-lg"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-8 bg-border/40" />

                    <div className="flex items-center gap-4 pl-6 pr-2">
                        <div className="flex items-center bg-[#E6F9EF] px-5 rounded-full border border-[#D1F0DE] h-12 gap-3 whitespace-nowrap">
                            <div className="w-1.5 h-3 bg-success rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1D5C3E]">FLUX SYNCHRONISÉ</span>
                        </div>

                        <Button
                            onClick={() => setShowNewReservation(true)}
                            className="h-12 px-8 rounded-full bg-accent hover:bg-[#00C058] text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all gap-3 shadow-lg shadow-emerald-500/10 whitespace-nowrap"
                        >
                            <Plus strokeWidth={2.5} className="h-3.5 w-3.5" />
                            NOUVELLE RÉSERVATION
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Deep Black / Emerald active */}
                <div className="w-[340px] bg-bg-secondary border-r border-border flex flex-col p-10 pt-16 overflow-y-auto elegant-scrollbar">
                    <div className="mb-12">
                        <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">PLATEFORMES</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { id: 'all', label: 'TOUTES', count: stats.total, icon: LayoutGrid },
                            { id: 'website', label: 'SITE WEB', count: (reservations || []).filter(r => r.source === 'website').length, icon: Globe },
                            { id: 'google', label: 'GOOGLE', count: (reservations || []).filter(r => r.source === 'google').length, icon: Globe },
                            { id: 'instagram', label: 'INSTAGRAM', count: (reservations || []).filter(r => r.source === 'instagram').length, icon: Instagram },
                            { id: 'facebook', label: 'FACEBOOK', count: (reservations || []).filter(r => r.source === 'facebook').length, icon: Facebook },
                            { id: 'phone', label: 'TÉLÉPHONE', count: (reservations || []).filter(r => r.source === 'phone').length, icon: Phone },
                            { id: 'thefork', label: 'THEFORK', count: (reservations || []).filter(r => r.source === 'thefork').length, icon: ExternalLink }
                        ].map((platform) => {
                            const active = (filterSource === platform.id || (!filterSource && platform.id === 'all'));
                            return (
                                <button
                                    key={platform.id}
                                    onClick={() => setFilterSource(platform.id === 'all' ? null : platform.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-4 rounded-3xl transition-all duration-500",
                                        active
                                            ? "bg-accent text-bg-primary shadow-2xl shadow-amber-500/20"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                            active ? "bg-black/10" : "bg-white/5"
                                        )}>
                                            <platform.icon className={cn("w-5 h-5", active ? "text-white" : "text-white/40")} strokeWidth={active ? 2.5 : 1.5} />
                                        </div>
                                        <span className="text-[11px] font-black tracking-widest">{platform.label}</span>
                                    </div>
                                    <span className={cn("text-[10px] font-mono", active ? "text-black" : "text-white/20")}>
                                        {platform.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Connection Status Section */}
                    <div className="mt-auto pt-10 border-t border-neutral-100">
                        <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-6">ÉTAT DES CONNEXIONS</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'Google Reserve', status: 'online' },
                                { name: 'TheFork', status: 'online' },
                                { name: 'Instagram', status: 'online' },
                            ].map(api => (
                                <div key={api.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(0,215,100,0.4)]" />
                                        <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">{api.name}</span>
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-bg-primary flex flex-col overflow-hidden">


                    {/* Reservations List - Large White Cards matching Screenshot */}
                    <ScrollArea className="flex-1 p-12 pt-0 elegant-scrollbar">
                        <div className="space-y-6 max-w-7xl mx-auto pb-10">
                            {filteredReservations.map((res, i) => {
                                const source = RESERVATION_SOURCES[res.source as keyof typeof RESERVATION_SOURCES];
                                return (
                                    <motion.div
                                        key={res.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-bg-secondary p-4 pl-4 pr-10 rounded-[3rem] shadow-2xl flex items-center justify-between group relative overflow-hidden h-32"
                                    >
                                        <div className="flex items-center gap-10">
                                            {/* Source Icon Box */}
                                            <div className="w-20 h-20 rounded-[2rem] bg-bg-primary flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500">
                                                {source ? (
                                                    <source.icon strokeWidth={1} className="w-10 h-10 text-text-muted group-hover:text-accent transition-colors" />
                                                ) : (
                                                    <Globe strokeWidth={1} className="w-10 h-10 text-text-muted group-hover:text-accent transition-colors" />
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-5">
                                                    <h3 className="text-4xl font-serif text-text-primary italic group-hover:text-accent transition-colors">{res.name}</h3>
                                                    <div className="flex gap-2">
                                                        {res.tags.map((tag, idx) => (
                                                            <span key={idx} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FCF9EE] text-accent text-[9px] font-black uppercase tracking-widest border border-accent/30">
                                                                {tag === 'Client fidèle' && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                                                                {tag}
                                                            </span>
                                                        )) || null}
                                                        {res.notes && (
                                                            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-200">
                                                                <MessageSquare className="w-3 h-3" />
                                                                {res.notes}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 text-[12px] text-text-muted font-bold tracking-tight">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-accent" strokeWidth={2.5} />
                                                        <span>{res.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Users className="w-4 h-4 text-accent" strokeWidth={2.5} />
                                                        <span>{res.guests} pers.</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Layout className="w-4 h-4 text-accent" strokeWidth={2.5} />
                                                        <span>{res.tableId || 'T-?'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {res.status === 'confirmed' ? (
                                                <div className="px-10 py-4 rounded-full bg-[#E6F9EF] text-[#1D5C3E] text-[10px] font-black uppercase tracking-[0.3em] border border-[#1D5C3E]/20 shadow-sm">
                                                    CONFIRMÉ
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <Button
                                                        className="h-14 px-12 bg-accent hover:bg-[#00C058] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20"
                                                        onClick={() => handleConfirm(res.id)}
                                                    >
                                                        CONFIRMER
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* New Reservation Dialog Integration Backdrop (Simplified) */}
            <AnimatePresence>
                {showNewReservation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-text-primary/40 backdrop-blur-xl flex items-center justify-center p-8"
                        onClick={() => setShowNewReservation(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-neutral-900 dark:bg-bg-primary p-10 text-white relative overflow-hidden">
                                <h2 className="text-3xl font-serif font-light italic tracking-tight relative z-10">Nouvelle Réservation</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mt-2 relative z-10">SYSTÈME OMNICANAL SMART</p>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-4">
                                    {[
                                        { label: 'IDENTITÉ DU CONVIVE', placeholder: 'Nom Complet', key: 'name' },
                                        { label: 'CONTACT MOBILE', placeholder: '+33 ...', key: 'phone' },
                                        { label: 'CANAL DE RÉCEPTION', placeholder: 'website / phone / google', key: 'source' }
                                    ].map(field => (
                                        <div key={field.label}>
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">{field.label}</p>
                                            <input 
                                                type="text" 
                                                placeholder={field.placeholder} 
                                                value={newRes[field.key as keyof typeof newRes]}
                                                onChange={(e) => setNewRes({ ...newRes, [field.key]: e.target.value })}
                                                className="w-full bg-[#f5f5f0] border border-[#ebebe0] rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">NOMBRE DE COUVERTS</p>
                                        <input 
                                            type="number" 
                                            value={newRes.guests} 
                                            onChange={(e) => setNewRes({ ...newRes, guests: parseInt(e.target.value) })}
                                            className="w-full bg-[#f5f5f0] border border-[#ebebe0] rounded-2xl px-6 py-4 text-xs font-bold outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">CRÉNEAU TEMPOREL</p>
                                        <input 
                                            type="time" 
                                            value={newRes.time} 
                                            onChange={(e) => setNewRes({ ...newRes, time: e.target.value })}
                                            className="w-full bg-[#f5f5f0] border border-[#ebebe0] rounded-2xl px-6 py-4 text-xs font-bold outline-none" 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 pt-0 flex gap-4">
                                <Button variant="ghost" onClick={() => setShowNewReservation(false)} className="h-16 px-8 rounded-full text-[10px] font-black uppercase tracking-widest border border-neutral-100 flex-1">
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="h-16 flex-[2] bg-neutral-900 dark:bg-bg-primary hover:bg-black dark:hover:bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl"
                                >
                                    Valider la Table
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
