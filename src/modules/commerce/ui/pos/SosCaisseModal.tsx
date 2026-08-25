'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LifeBuoy,
    Printer,
    CreditCard,
    Zap,
    Lock,
    HelpCircle,
    Loader2,
    CheckCircle2,
    AlertOctagon,
    X,
    BotMessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';

interface SosCaisseModalProps {
    isOpen: boolean;
    onClose: () => void;
    tableId?: string | null;
}

const PRESET_ISSUES = [
    {
        id: 'printer',
        icon: Printer,
        title: 'Imprimante Cuisine / Caisse',
        desc: 'Bons non imprimés, papier bloqué ou panne réseau.',
    },
    {
        id: 'payment',
        icon: CreditCard,
        title: 'TPE / Paiement CB',
        desc: 'Terminal Stripe déconnecté ou échec de transaction.',
    },
    {
        id: 'slowness',
        icon: Zap,
        title: 'Lenteur / Coup de Feu',
        desc: 'Application ralentie en plein service de rush.',
    },
    {
        id: 'fiscal',
        icon: Lock,
        title: 'Clôture Z / Fiscalité',
        desc: 'Erreur de scellement NF525 ou impossible de clôturer.',
    },
    {
        id: 'other',
        icon: HelpCircle,
        title: 'Autre Problème Technique',
        desc: 'Décrivez précisément la panne rencontrée.',
    },
];

export function SosCaisseModal({ isOpen, onClose, tableId }: SosCaisseModalProps) {
    const [selectedPreset, setSelectedPreset] = useState<string>('printer');
    const [details, setDetails] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiResponse, setAiResponse] = useState<{
        status: string;
        fix?: string;
        ticketId?: string;
    } | null>(null);

    const handleSubmitSos = async () => {
        const preset = PRESET_ISSUES.find(p => p.id === selectedPreset);
        const description = `[SOS CAISSE EN SERVICE] ${preset?.title} : ${details.trim() || preset?.desc} ${tableId ? `(Table ${tableId})` : ''}`.trim();

        if (description.length < 10) {
            toast.error('Veuillez préciser le motif de l\'alerte SOS.');
            return;
        }

        setIsSubmitting(true);
        setAiResponse(null);

        try {
            const res = await authedFetch('/api/tenant/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(errData.error || `Erreur serveur HTTP ${res.status}`);
            }

            const data = await res.json() as {
                ticketId: string;
                status: string;
                draft?: { solution?: string; suggestedResponse?: string };
            };

            setAiResponse({
                status: 'ACKNOWLEDGED',
                ticketId: data.ticketId,
                fix: data.draft?.solution || data.draft?.suggestedResponse || 'Alerte transmise avec succès au cockpit Suzerain MCC. Le support technique est prévenu.',
            });

            toast.success('🚨 Alerte SOS Caisse transmise avec priorité maximale.');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erreur réseau';
            toast.error(`Échec transmission SOS : ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setAiResponse(null);
        setDetails('');
        setSelectedPreset('printer');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-xl bg-surface-card border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-500/10 overflow-hidden"
                >
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

                    {/* Header */}
                    <div className="flex items-start justify-between pb-6 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 animate-pulse">
                                <AlertOctagon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold uppercase tracking-tight text-text-primary">
                                        SOS Caisse • Urgence Service
                                    </h2>
                                    <span className="px-2 py-0.5 text-nano font-black uppercase tracking-wider bg-red-500/20 text-red-400 rounded-full">
                                        Priorité P0
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Assistance directe en temps réel et diagnostic immédiat.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleReset}
                            className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    {!aiResponse ? (
                        <div className="py-6 space-y-6">
                            {/* Preset Buttons */}
                            <div className="space-y-2">
                                <label className="text-chip-label text-text-muted">
                                    Type d'incident constaté
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {PRESET_ISSUES.map(preset => {
                                        const Icon = preset.icon;
                                        const isSelected = selectedPreset === preset.id;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => setSelectedPreset(preset.id)}
                                                className={cn(
                                                    'p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all',
                                                    isSelected
                                                        ? 'bg-red-500/10 border-red-500/50 shadow-sm'
                                                        : 'bg-bg-tertiary/50 border-border/40 hover:bg-bg-tertiary'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                                                    isSelected ? 'bg-red-500 text-white' : 'bg-bg-primary text-text-muted'
                                                )}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn('text-xs font-bold truncate', isSelected ? 'text-red-400' : 'text-text-primary')}>
                                                        {preset.title}
                                                    </p>
                                                    <p className="text-nano text-text-muted line-clamp-1">
                                                        {preset.desc}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Additional details */}
                            <div className="space-y-2">
                                <label className="text-chip-label text-text-muted">
                                    Précision supplémentaire (Optionnel)
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Ex: L'imprimante thermique bip 3 fois et le voyant rouge clignote..."
                                    rows={2}
                                    className="w-full bg-bg-tertiary/70 border border-border/50 rounded-2xl p-3.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-red-500/50 resize-none"
                                />
                            </div>

                            {/* Submit SOS Button */}
                            <button
                                onClick={handleSubmitSos}
                                disabled={isSubmitting}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-red-600/20 transition-all active:scale-98 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyse Technique et Alerte Suzerain...
                                    </>
                                ) : (
                                    <>
                                        <LifeBuoy className="w-5 h-5" />
                                        Déclencher l'Alerte SOS Caisse
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* AI Live Diagnostic Result */
                        <div className="py-6 space-y-6">
                            <div className="p-5 rounded-2xl bg-status-success/10 border border-emerald-500/30 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-status-success/20 flex items-center justify-center text-status-success shrink-0">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-status-success">
                                        Alerte transmise au Support (Ticket #{aiResponse.ticketId?.slice(0, 8)})
                                    </h4>
                                    <p className="text-xs text-text-muted">
                                        Votre alerte est enregistrée. L'opérateur de garde et l'IA analysent vos paramètres.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-action-primary/10 border border-action-primary/20 space-y-3">
                                <div className="flex items-center gap-2 text-action-primary">
                                    <BotMessageSquare className="w-4 h-4" />
                                    <span className="text-nano font-black uppercase tracking-wider">
                                        Diagnostic Immédiat IA & Recommandation
                                    </span>
                                </div>
                                <p className="text-xs text-text-primary leading-relaxed font-mono">
                                    {aiResponse.fix}
                                </p>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full h-12 rounded-2xl bg-bg-tertiary hover:bg-bg-primary border border-border text-text-primary text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Revenir à la Caisse
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
