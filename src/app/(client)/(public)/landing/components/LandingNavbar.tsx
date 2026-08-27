"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Menu } from "lucide-react";
import Link from "next/link";

import { useBrandAsset } from "@/shared/nexus/tokens/assets";

export function LandingNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const brandLogo = useBrandAsset('logo');

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-subtle">
                    {/* Logo */}
                    <Link href="/landing" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-action-primary flex items-center justify-center shadow-lg shadow-action-primary/20">
                            <img src={brandLogo} alt="Logo" className="w-6 h-6 object-contain invert dark:invert-0" />
                        </div>
                        <span className="text-text-primary font-brand text-xl font-semibold tracking-tight">Restaurant OS</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Fonctionnalités</Link>
                        <Link href="#pricing" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Tarifs</Link>
                        <Link href="#testimonials" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Témoignages</Link>
                        <Link href="/login" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Connexion</Link>
                    </div>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/onboarding">
                            <motion.span
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-block px-6 py-2.5 bg-action-primary text-action-primary-fg font-bold text-sm rounded-xl shadow-lg shadow-action-primary/30 hover:shadow-xl hover:shadow-action-primary/40 transition-all cursor-pointer"
                            >
                                Démonstration
                            </motion.span>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-text-primary">
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden mt-4 p-6 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-subtle"
                    >
                        <div className="flex flex-col gap-4">
                            <Link href="#features" className="text-text-primary/80 text-lg font-medium">Fonctionnalités</Link>
                            <Link href="#pricing" className="text-text-primary/80 text-lg font-medium">Tarifs</Link>
                            <Link href="#testimonials" className="text-text-primary/80 text-lg font-medium">Témoignages</Link>
                            <Link href="/login" className="text-text-primary/80 text-lg font-medium">Connexion</Link>
                            <Link href="/onboarding" className="mt-4 w-full py-3 bg-action-primary text-action-primary-fg font-bold rounded-xl text-center block">
                                Démonstration
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
}
