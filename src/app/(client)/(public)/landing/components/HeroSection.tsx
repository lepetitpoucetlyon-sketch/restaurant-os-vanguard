"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import { STATS } from "@/app/(client)/(public)/landing/constants";

import { useBrandAsset } from "@/shared/nexus/tokens/assets";

export function HeroSection() {
    const brandBanner = useBrandAsset('banner');

    return (
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-24 pb-20 px-6">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-surface-bg" />
            
            {/* Dynamic Banner Background with Overlay */}
            <div 
                className="absolute inset-0 opacity-20 bg-cover bg-center"
                style={{ backgroundImage: `url(${brandBanner})` }}
            />

            <div className="absolute top-1/4 left-1/4 w-[37.5rem] h-[600px] bg-action-primary/10 rounded-full blur-[150px] opacity-50" />
            <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[400px] bg-action-accent/10 rounded-full blur-[120px] opacity-30" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }}
            />

            <div className="relative z-10 max-w-6xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-card border border-border-subtle mb-8"
                >
                    <Sparkles className="w-4 h-4 text-action-primary" />
                    <span className="text-text-secondary text-sm font-medium">Propulsé par l'IA</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-brand font-semibold text-text-primary leading-[1.1] tracking-tight mb-8"
                >
                    L'Intelligence<br />
                    <span className="text-action-primary">Exécutive</span><br />
                    pour Restaurateurs
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                    Gérez votre établissement avec la précision d'un chef étoilé.<br />
                    POS, Cuisine, Stocks, Finance, RH — tout en un.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                >
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 40px var(--action-primary)" }}
                        whileTap={{ scale: 0.98 }}
                        className="group px-8 py-4 bg-action-primary text-action-primary-fg font-bold text-lg rounded-2xl shadow-xl shadow-action-primary/30 flex items-center gap-3 transition-all"
                    >
                        Demander une Démonstration
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group px-8 py-4 bg-surface-card text-text-primary font-bold text-lg rounded-2xl border border-border-subtle hover:bg-surface-glass flex items-center gap-3 transition-all"
                    >
                        <Play className="w-5 h-5" />
                        Voir la Vidéo
                    </motion.button>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
                >
                    {STATS.map((stat, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-3xl md:text-4xl font-mono font-bold text-text-primary mb-2">{stat.value}</div>
                            <div className="text-sm text-text-secondary font-medium">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <div className="w-6 h-10 rounded-full border-2 border-border-subtle flex items-start justify-center p-2">
                    <div className="w-1.5 h-3 rounded-full bg-text-secondary" />
                </div>
            </motion.div>
        </section>
    );
}
