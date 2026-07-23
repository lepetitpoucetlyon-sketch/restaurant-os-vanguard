"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star,
    Loader2,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    TrendingUp,
    ExternalLink,
    AlertTriangle,
    Cpu,
    Sparkles,
    ShieldCheck,
    PenTool
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";

interface ReviewSource {
    id: string;
    platform: string;
    url: string;
    name: string;
    logo: string;
    rating: number;
    reviewCount: number;
    connected: boolean;
    color: string;
    [key: string]: unknown;
}

const REVIEW_SOURCES: ReviewSource[] = [
    { id: 'google', platform: 'google', url: 'https://google.com', name: 'Google Maps', logo: '🌐', rating: 4.6, reviewCount: 234, connected: true, color: '#4285F4' },
    { id: 'tripadvisor', platform: 'tripadvisor', url: 'https://tripadvisor.com', name: 'TripAdvisor', logo: '🦉', rating: 4.5, reviewCount: 89, connected: true, color: '#00AF87' },
    { id: 'thefork', platform: 'thefork', url: 'https://thefork.com', name: 'TheFork', logo: '🍴', rating: 8.9, reviewCount: 156, connected: true, color: '#00A97F' },
    { id: 'yelp', platform: 'yelp', url: 'https://yelp.com', name: 'Yelp', logo: '📍', rating: 4.4, reviewCount: 45, connected: false, color: '#D32323' },
];

export default function ReviewsSettings() {
    const [sources, setSources] = useState<ReviewSource[]>(REVIEW_SOURCES);
    const [isSaving, setIsSaving] = useState(false);
    const [autoReply, setAutoReply] = useState(true);
    const [templates, setTemplates] = useState({
        positive: "Merci beaucoup {name} pour votre retour chaleureux ! Nous sommes ravis que votre expérience chez nous ait été à la hauteur. Au plaisir de vous revoir bientôt !",
        negative: "Cher(e) {name}, nous sommes sincèrement désolés de votre expérience. Vos retours nous sont précieux et nous aideront à nous améliorer. N'hésitez pas à nous contacter directement.",
        neutral: "Merci {name} pour votre avis ! Nous apprécions vos retours et espérons vous accueillir à nouveau très prochainement."
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Nexus.adapter.set('marketingSettings/reputation', {
                sources,
                autoReply,
                templates,
            });
            toast.success("Paramètres réputation sauvegardés.");
        } catch (_error) {
            toast.error("Échec de la sauvegarde des paramètres réputation.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSource = (id: string) => {
        setSources(prev => prev.map(s =>
            s.id === id ? { ...s, connected: !s.connected } : s
        ));
    };

    const avgRating = sources.filter(s => s.connected).reduce((sum, s) => sum + s.rating, 0) / sources.filter(s => s.connected).length;
    const totalReviews = sources.filter(s => s.connected).reduce((sum, s) => sum + s.reviewCount, 0);

    return (
        <div className="space-y-12 pb-20">
            {/* Reputation Spectrum Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-secondary border border-border rounded-[2.5rem] p-10 shadow-premium relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <Star className="w-10 h-10 mb-6 text-accent" />
                    <p className="text-5xl font-serif italic text-text-primary tracking-tighter mb-1">{avgRating.toFixed(1)}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Composite Rating</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-bg-secondary border border-border rounded-[2.5rem] p-10 shadow-premium relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <MessageSquare className="w-10 h-10 mb-6 text-accent" />
                    <p className="text-5xl font-serif italic text-text-primary tracking-tighter mb-1">{totalReviews}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Signal Volume</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-bg-secondary border border-border rounded-[2.5rem] p-10 shadow-premium relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-status-success/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <TrendingUp className="w-10 h-10 mb-6 text-status-success" />
                    <p className="text-5xl font-serif italic text-text-primary tracking-tighter mb-1">+12%</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Trajectory Growth</p>
                </motion.div>
            </div>

            {/* Reputation Sources Matrix */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Reputation Nodes
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Global Signal Source Configuration</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {sources.map((source, idx) => (
                        <motion.div
                            key={source.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (idx * 0.05) }}
                            whileHover={{ y: -6, scale: 1.01 }}
                            className={cn(
                                "p-8 rounded-[2rem] border transition-all duration-500 relative group overflow-hidden flex flex-col justify-between",
                                source.connected
                                    ? "bg-bg-primary border-border shadow-lg"
                                    : "bg-bg-tertiary/20 border-border/50 opacity-80"
                            )}
                        >
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-bg-tertiary flex items-center justify-center text-3xl shadow-inner border border-border group-hover:scale-110 transition-transform duration-500">
                                        {source.logo}
                                    </div>
                                    <div>
                                        <p className="font-serif italic text-text-primary text-xl">{source.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Star className="w-3 h-3 text-accent fill-accent" />
                                            <span className="text-sm font-bold text-text-primary">{source.rating}</span>
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">({source.reviewCount} Signals)</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSource(source.id)}
                                    className={cn(
                                        "w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner",
                                        source.connected ? "bg-accent shadow-accent/20" : "bg-bg-tertiary"
                                    )}
                                >
                                    <motion.div
                                        animate={{ x: source.connected ? 26 : 2 }}
                                        className="absolute top-1 left-1 w-6 h-6 bg-surface-card rounded-full shadow-md"
                                    />
                                </button>
                            </div>

                            <AnimatePresence>
                                {source.connected && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted bg-bg-tertiary hover:bg-text-primary hover:text-bg-primary rounded-2xl border border-border flex items-center justify-center gap-3 transition-all duration-500 group/btn"
                                    >
                                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        Project Portal
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Neural Response Engine (Auto-Reply) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                                Neural Response Engine
                            </h3>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Automated Semantic Acknowledgement</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAutoReply(!autoReply)}
                        className={cn(
                            "w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner",
                            autoReply ? "bg-accent shadow-accent/20" : "bg-bg-tertiary"
                        )}
                    >
                        <motion.div
                            animate={{ x: autoReply ? 26 : 2 }}
                            className={cn("absolute top-1 left-1 w-6 h-6 bg-surface-card rounded-full shadow-md", autoReply ? "" : "opacity-50")}
                        />
                    </button>
                </div>

                <AnimatePresence>
                    {autoReply && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-6 overflow-hidden"
                        >
                            <div className="p-8 bg-bg-primary rounded-[2rem] border border-border group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-status-success/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-status-success/10 flex items-center justify-center">
                                        <ThumbsUp className="w-4 h-4 text-status-success" />
                                    </div>
                                    <span className="font-bold text-[10px] uppercase tracking-widest text-status-success">Positive Vector Spectrum (4-5★)</span>
                                </div>
                                <textarea
                                    value={templates.positive}
                                    onChange={(e) => setTemplates(t => ({ ...t, positive: e.target.value }))}
                                    rows={3}
                                    className="w-full px-6 py-5 bg-bg-tertiary border border-border rounded-2xl text-sm font-serif italic text-text-primary focus:bg-bg-primary focus:border-emerald-500/30 transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="p-8 bg-bg-primary rounded-[2rem] border border-border group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-status-warning/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-status-warning/10 flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4 text-status-warning" />
                                    </div>
                                    <span className="font-bold text-[10px] uppercase tracking-widest text-status-warning">Neutral Signal Buffer (3★)</span>
                                </div>
                                <textarea
                                    value={templates.neutral}
                                    onChange={(e) => setTemplates(t => ({ ...t, neutral: e.target.value }))}
                                    rows={3}
                                    className="w-full px-6 py-5 bg-bg-tertiary border border-border rounded-2xl text-sm font-serif italic text-text-primary focus:bg-bg-primary focus:border-amber-500/30 transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="p-8 bg-bg-primary rounded-[2rem] border border-border group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-status-danger/10 flex items-center justify-center">
                                        <ThumbsDown className="w-4 h-4 text-status-danger" />
                                    </div>
                                    <span className="font-bold text-[10px] uppercase tracking-widest text-status-danger">Negative Anomaly Protocol (1-2★)</span>
                                </div>
                                <textarea
                                    value={templates.negative}
                                    onChange={(e) => setTemplates(t => ({ ...t, negative: e.target.value }))}
                                    rows={3}
                                    className="w-full px-6 py-5 bg-bg-tertiary border border-border rounded-2xl text-sm font-serif italic text-text-primary focus:bg-bg-primary focus:border-rose-500/30 transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-4 px-8 py-5 bg-bg-tertiary rounded-[1.5rem] border border-border">
                                <PenTool className="w-5 h-5 text-text-muted" />
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
                                    SYNTAX HINT: Use <code className="bg-bg-primary px-2 py-0.5 rounded text-accent border border-border">{'{name}'}</code> to synthesize the specific node identity within the response projection.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Global Dispatch */}
            <div className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <div className="relative">
                            <ShieldCheck className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-surface-card/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Commit Reputation State
                </motion.button>
            </div>
        </div>
    );
}
