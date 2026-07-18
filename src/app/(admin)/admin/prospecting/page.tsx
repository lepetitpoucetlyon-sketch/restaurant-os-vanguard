"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Globe, Palette, Loader2, ArrowRight, Check, AlertTriangle, RefreshCcw, Wand2 } from 'lucide-react';
import { Button } from '@ui/button';
import { useToast } from '@ui/Toast';
import { useBrandEditor } from '@/hooks/useBrandEditor';
import { authedFetch } from '@/lib/client/authedFetch';
import { BrandingUI } from '@domain/services/BrandingUI';
import { useSettings } from '@/context/SettingsContext';
import type { BrandConfig } from '@/shared/nexus/tokens/brand';
import type { BrandInput } from '@/domain/services/BrandingService';

type ExtractedTokens = Partial<BrandConfig>;
type Phase = 'idle' | 'scanning' | 'preview_ready' | 'applying' | 'done';

const PRESETS: { label: string; color: string; input: BrandInput }[] = [
    { label: 'Gold Luxury',   color: '#C5A059', input: { name: 'Luxury',  primaryColor: '#C5A059', atmosphere: 'luxury'    } },
    { label: 'Bistrot Rouge', color: '#E11D48', input: { name: 'Bistrot', primaryColor: '#E11D48', atmosphere: 'bistro'    } },
    { label: 'Vert Nature',   color: '#059669', input: { name: 'Nature',  primaryColor: '#059669', atmosphere: 'zen'       } },
    { label: 'Bleu Marine',   color: '#1D4ED8', input: { name: 'Marine',  primaryColor: '#1D4ED8', atmosphere: 'modern'   } },
];

function deriveSwatches(tokens: ExtractedTokens) {
    const fields: { label: string; key: keyof ExtractedTokens }[] = [
        { label: 'Principale',  key: 'primaryColor'  },
        { label: 'Accent',      key: 'accentColor'   },
        { label: 'Fond',        key: 'surfaceBg'     },
        { label: 'Carte',       key: 'surfaceCard'   },
        { label: 'Modal',       key: 'surfaceModal'  },
        { label: 'Succès',      key: 'statusSuccess' },
        { label: 'Alerte',      key: 'statusWarning' },
        { label: 'Danger',      key: 'statusDanger'  },
    ];
    return fields
        .filter(f => !!tokens[f.key])
        .map(f => ({ label: f.label, value: tokens[f.key] as string }));
}

function textOn(hex: string): string {
    if (!hex || hex.length < 7) return '#FFFFFF';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000000' : '#FFFFFF';
}

export default function ProspectingDashboard() {
    const { saveTokens, isSaving } = useBrandEditor();
    const { updateIdentity, updateConfig } = useSettings();
    const { showToast } = useToast();

    const [url, setUrl] = useState('');
    const [phase, setPhase] = useState<Phase>('idle');
    const [tokens, setTokens] = useState<ExtractedTokens | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        if (!url.trim()) return;
        setPhase('scanning');
        setTokens(null);
        setError(null);
        try {
            const res = await authedFetch('/api/admin/brand/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Erreur extraction');
            setTokens(data.tokens);
            setPhase('preview_ready');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setPhase('idle');
        }
    };

    const handlePreset = (input: BrandInput) => {
        const theme = BrandingUI.generateThemeFromBrand(input);
        setTokens({
            brandName:    input.name,
            primaryColor: input.primaryColor ?? undefined,
            surfaceBg:    (theme as unknown as Record<string, unknown>).backgroundColor as string ?? '#0A0A0A',
        });
        setPhase('preview_ready');
    };

    const handleApply = async () => {
        if (!tokens) return;
        setPhase('applying');
        try {
            await saveTokens(tokens);
            const theme = BrandingUI.generateThemeFromBrand({
                name: tokens.brandName ?? 'Demo',
                primaryColor: tokens.primaryColor,
                atmosphere: 'luxury',
            });
            await updateConfig('theme', theme as unknown as import('@nexus/contracts').ThemeSettings);
            if (tokens.brandName && updateIdentity) {
                await updateIdentity({
                    name: tokens.brandName,
                    id: 'identity_suture',
                    updatedAt: new Date().toISOString(),
                } as unknown as import('@nexus/contracts').RestaurantIdentity);
            }
            setPhase('done');
            showToast('Charte appliquée — interface mise à jour', 'success');
        } catch {
            showToast('Erreur lors de l\'application', 'error');
            setPhase('preview_ready');
        }
    };

    const handleReset = () => {
        setPhase('idle');
        setTokens(null);
        setError(null);
        setUrl('');
    };

    const swatches = tokens ? deriveSwatches(tokens) : [];
    const isApplying = phase === 'applying';

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10">

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-accent">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-xs font-black uppercase tracking-[0.4em]">Propulsion Commerciale</span>
                </div>
                <h1 className="text-5xl font-serif italic">Mettre à sa sauce.</h1>
                <p className="text-text-muted max-w-xl">
                    Entre l'URL du site ou l'Instagram du prospect. L'IA capture la charte graphique
                    et transforme l'app en sa propre interface en moins de 60 secondes.
                </p>
            </div>

            {/* Input zone */}
            {phase !== 'done' && (
                <motion.div
                    layout
                    className="bg-bg-secondary border border-border/40 rounded-[2rem] p-8 space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Magic Scan</h2>
                            <p className="text-xs text-text-muted">Site web ou page Instagram</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="https://le-bistrot.fr  ou  instagram.com/lebistrot"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleScan()}
                                disabled={phase === 'scanning'}
                                className="w-full pl-10 pr-4 h-12 rounded-xl border border-border bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent text-sm disabled:opacity-50 transition-all"
                            />
                        </div>
                        <Button
                            onClick={handleScan}
                            disabled={phase === 'scanning' || !url.trim()}
                            className="h-12 px-6 rounded-xl bg-accent text-bg-primary font-bold flex items-center gap-2 disabled:opacity-40"
                        >
                            {phase === 'scanning'
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><Wand2 className="w-4 h-4" /><span>Analyser</span></>
                            }
                        </Button>
                    </div>

                    {phase === 'scanning' && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-sm text-text-muted"
                        >
                            <Loader2 className="w-4 h-4 animate-spin text-accent" />
                            Capture du site en cours… Playwright + Vision IA
                        </motion.p>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-status-danger/10 border border-status-danger/20"
                        >
                            <AlertTriangle className="w-4 h-4 text-status-danger mt-0.5 shrink-0" />
                            <p className="text-sm text-status-danger">{error}</p>
                        </motion.div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-border/40" />
                        <span className="text-xs text-text-muted uppercase tracking-widest">ou preset rapide</span>
                        <div className="flex-1 h-px bg-border/40" />
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-3">
                        {PRESETS.map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => handlePreset(preset.input)}
                                className="group p-4 rounded-xl border border-border hover:border-accent transition-all text-left space-y-3"
                            >
                                <div
                                    className="w-8 h-8 rounded-full shadow-sm transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: preset.color }}
                                />
                                <span className="text-xs font-bold block text-text-primary">{preset.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Palette preview */}
            <AnimatePresence>
                {phase === 'preview_ready' && tokens && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-bg-secondary border border-border/40 rounded-[2rem] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 py-5 border-b border-border/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Palette className="w-5 h-5 text-accent" />
                                <div>
                                    <p className="text-sm font-bold text-text-primary">
                                        {tokens.brandName ?? 'Charte détectée'}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {swatches.length} couleur{swatches.length > 1 ? 's' : ''} extraite{swatches.length > 1 ? 's' : ''}
                                        {tokens.fontBrand && ` · ${tokens.fontBrand}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="h-9 px-4 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
                                >
                                    <RefreshCcw className="w-3 h-3" /> Rescanner
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    disabled={isSaving || isApplying}
                                    className="h-9 px-5 rounded-full bg-status-success text-white font-bold uppercase tracking-widest text-[10px] hover:opacity-90 flex items-center gap-2"
                                >
                                    {isApplying
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <><Check className="w-3 h-3" /><span>Appliquer</span></>
                                    }
                                </Button>
                            </div>
                        </div>

                        {/* Grande bande couleur principale */}
                        {tokens.primaryColor && (
                            <div
                                className="w-full h-28 flex items-center justify-between px-8"
                                style={{ backgroundColor: tokens.primaryColor }}
                            >
                                <div style={{ color: textOn(tokens.primaryColor) }}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Couleur principale</p>
                                    <p className="text-2xl font-mono font-bold">{tokens.primaryColor}</p>
                                </div>
                                {tokens.brandName && (
                                    <p className="text-lg font-serif italic opacity-70" style={{ color: textOn(tokens.primaryColor) }}>
                                        {tokens.brandName}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Swatches palette */}
                        {swatches.length > 0 && (
                            <div className="px-8 py-6 space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-text-muted">Palette complète</p>
                                <div className="flex flex-wrap gap-4">
                                    {swatches.map(s => (
                                        <div key={s.label} className="flex flex-col items-center gap-2">
                                            <div
                                                className="w-14 h-14 rounded-2xl shadow-md border border-white/10 relative group cursor-pointer"
                                                style={{ backgroundColor: s.value }}
                                                title={s.value}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-[9px] font-mono font-bold" style={{ color: textOn(s.value), backgroundColor: s.value }}>
                                                    {s.value}
                                                </span>
                                            </div>
                                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Typo preview */}
                        {tokens.fontBrand && (
                            <div className="px-8 pb-6 border-t border-border/30 pt-5">
                                <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">Typographie</p>
                                {tokens.fontBrandUrl && (
                                    // eslint-disable-next-line @next/next/no-page-custom-font
                                    <link rel="stylesheet" href={tokens.fontBrandUrl} />
                                )}
                                <div className="bg-bg-primary rounded-xl p-5 flex items-baseline gap-6">
                                    <span className="text-4xl text-text-primary" style={{ fontFamily: tokens.fontBrand }}>
                                        Bonsoir
                                    </span>
                                    <span className="text-sm text-text-muted font-mono">{tokens.fontBrand}</span>
                                </div>
                            </div>
                        )}

                        {/* Mini UI preview */}
                        {tokens.primaryColor && (
                            <div className="px-8 pb-8 border-t border-border/30 pt-5 space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-text-muted">Aperçu interface</p>
                                <div
                                    className="rounded-2xl p-5 space-y-3"
                                    style={{ backgroundColor: tokens.surfaceBg ?? '#0A0A0A' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: tokens.primaryColor }} />
                                        <span
                                            className="text-sm font-bold"
                                            style={{ color: textOn(tokens.surfaceBg ?? '#0A0A0A'), fontFamily: tokens.fontBrand }}
                                        >
                                            {tokens.brandName ?? 'Mon Restaurant'}
                                        </span>
                                    </div>
                                    <div className="h-px w-full opacity-20" style={{ backgroundColor: tokens.primaryColor }} />
                                    <div className="flex gap-2">
                                        <div
                                            className="px-4 py-2 rounded-lg text-xs font-bold"
                                            style={{ backgroundColor: tokens.primaryColor, color: textOn(tokens.primaryColor) }}
                                        >
                                            Nouvelle commande
                                        </div>
                                        <div
                                            className="px-4 py-2 rounded-lg text-xs border opacity-50"
                                            style={{ borderColor: tokens.primaryColor, color: textOn(tokens.surfaceBg ?? '#0A0A0A') }}
                                        >
                                            Table 4
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Done */}
            <AnimatePresence>
                {phase === 'done' && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-status-success/10 border border-status-success/20 rounded-[2rem] p-8 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-status-success flex items-center justify-center text-white">
                                <Check className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-text-primary">
                                    {tokens?.brandName ?? 'Branding'} appliqué avec succès
                                </p>
                                <p className="text-sm text-text-muted">L'interface a été mise à jour instantanément.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="h-10 px-5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                                <RefreshCcw className="w-3 h-3" /> Nouveau client
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                className="h-10 px-5 rounded-full bg-accent text-bg-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                                Voir le résultat <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
