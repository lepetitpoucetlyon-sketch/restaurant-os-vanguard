// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, X, Menu } from "lucide-react";
import Link from "next/link";

export function LandingNavbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                    {/* Logo */}
                    <Link href="/landing" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#8B7355] flex items-center justify-center shadow-lg shadow-[#C9A227]/20">
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-serif text-xl font-semibold tracking-tight">Restaurant OS</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Fonctionnalités</Link>
                        <Link href="#pricing" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Tarifs</Link>
                        <Link href="#testimonials" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Témoignages</Link>
                        <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Connexion</Link>
                    </div>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-2.5 bg-[#C9A227] text-black font-bold text-sm rounded-xl shadow-lg shadow-[#C9A227]/30 hover:shadow-xl hover:shadow-[#C9A227]/40 transition-all"
                        >
                            Démonstration
                        </motion.button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden mt-4 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
                    >
                        <div className="flex flex-col gap-4">
                            <Link href="#features" className="text-white/80 text-lg font-medium">Fonctionnalités</Link>
                            <Link href="#pricing" className="text-white/80 text-lg font-medium">Tarifs</Link>
                            <Link href="#testimonials" className="text-white/80 text-lg font-medium">Témoignages</Link>
                            <Link href="/login" className="text-white/80 text-lg font-medium">Connexion</Link>
                            <button className="mt-4 w-full py-3 bg-[#C9A227] text-black font-bold rounded-xl">
                                Démonstration
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
}
