'use client';

/**
 * SplashScreen — Écran de démarrage cinématique Empire (mode custom & branded)
 *
 * Affiché au chargement de l'application si splashEnabled est actif.
 * Logo + fond verre fumé + lueur charte + barre de synchronisation Nexus Node.
 * DB-agnostique : lit les atoms Jotai (tenantBrandTokensAtom).
 */

import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantBrandTokensAtom } from '@/store/pillars/sovereign';
import { BrandTokensSchema, defaultBrandTokens } from '@/shared/nexus/tokens/brand';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
    onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
    const rawTokens = useAtomValue(tenantBrandTokensAtom);
    const [progress, setProgress] = useState(15);
    const [isExiting, setIsExiting] = useState(false);

    const result = BrandTokensSchema.safeParse(rawTokens ?? defaultBrandTokens);
    const tokens = result.success ? result.data : defaultBrandTokens;

    const primary = tokens.primaryColor ?? '#C5A059';
    const logoUrl = tokens.logoUrl;
    const brandName = tokens.brandName ?? 'Restaurant OS';
    const tagline = tokens.tagline ?? 'Nexus Sovereign Metaplatform';
    const fontBrand = tokens.fontBrand ?? 'Playfair Display, Georgia, serif';

    useEffect(() => {
        // Progress animation: 15% -> 60% -> 92% -> 100% -> done
        const p1 = setTimeout(() => setProgress(60), 400);
        const p2 = setTimeout(() => setProgress(92), 1100);
        const p3 = setTimeout(() => setProgress(100), 1800);
        const p4 = setTimeout(() => setIsExiting(true), 2200);
        const p5 = setTimeout(onDone, 2700);

        return () => {
            clearTimeout(p1);
            clearTimeout(p2);
            clearTimeout(p3);
            clearTimeout(p4);
            clearTimeout(p5);
        };
    }, [onDone]);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.03, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    aria-hidden="true"
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070709] select-none overflow-hidden"
                >
                    {/* Lueur d'ambiance radiale dynamique */}
                    <div
                        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-1000"
                        style={{
                            background: `radial-gradient(circle, ${primary}25 0%, ${primary}08 45%, transparent 70%)`,
                            filter: 'blur(80px)',
                            transform: 'translate(-50%, -50%)',
                            top: '40%',
                            left: '50%',
                        }}
                    />

                    {/* Carte Centrale Glassmorphism */}
                    <motion.div
                        initial={{ scale: 0.92, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="relative z-10 flex flex-col items-center p-8 md:p-12 rounded-3xl border border-white/10 bg-surface-glass backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] max-w-md w-[90%]"
                    >
                        {/* Halo Logo */}
                        <div className="relative mb-6 flex items-center justify-center">
                            <div
                                className="absolute inset-0 rounded-2xl animate-pulse"
                                style={{
                                    background: primary,
                                    filter: 'blur(25px)',
                                    opacity: 0.35,
                                }}
                            />

                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    srcSet={tokens.logoUrl_2x ? `${logoUrl} 1x, ${tokens.logoUrl_2x} 2x` : undefined}
                                    alt={brandName}
                                    className="relative z-10 max-h-20 max-w-[200px] object-contain drop-shadow-2xl"
                                />
                            ) : (
                                <div
                                    className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20"
                                    style={{
                                        background: `linear-gradient(135deg, ${primary} 0%, ${adjustBrightness(primary, -40)} 100%)`,
                                    }}
                                >
                                    <span
                                        className="text-3xl font-black text-white"
                                        style={{ fontFamily: fontBrand }}
                                    >
                                        {brandName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Nom du Tenant / Marque */}
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-2xl md:text-3xl font-bold text-white tracking-tight text-center"
                            style={{ fontFamily: fontBrand }}
                        >
                            {brandName}
                        </motion.h1>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-xs uppercase tracking-[0.2em] text-white/70 mt-2 text-center font-medium"
                        >
                            {tagline}
                        </motion.p>

                        {/* Barre de Synchronisation Nexus */}
                        <div className="w-full mt-8 flex flex-col gap-2">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                                <motion.div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progress}%`,
                                        background: `linear-gradient(90deg, ${primary} 0%, #FFFFFF 100%)`,
                                        boxShadow: `0 0 12px ${primary}`,
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-white/40 font-mono mt-1">
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span>Nexus Node Sovereign</span>
                                </span>
                                <span>{progress}%</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer discret */}
                    <div className="absolute bottom-8 flex items-center gap-2 text-white/30 text-xs tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-accent-gold animate-pulse" />
                        <span>Grade X Empire Standard</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Assombrit ou éclaircit une couleur hex d'un delta [-255, 255] */
function adjustBrightness(hex: string, delta: number): string {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const clamp = (n: number) => Math.max(0, Math.min(255, n));
    const r = clamp(parseInt(clean.slice(0, 2), 16) + delta);
    const g = clamp(parseInt(clean.slice(2, 4), 16) + delta);
    const b = clamp(parseInt(clean.slice(4, 6), 16) + delta);
    return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}
