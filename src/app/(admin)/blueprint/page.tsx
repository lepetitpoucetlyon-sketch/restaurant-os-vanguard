// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { BlueprintHeader } from "@/components/blueprint/BlueprintHeader";
import { MindMapDependencies } from "@/components/blueprint/MindMapDependencies";
import { ActionImpactMap } from "@/components/blueprint/ActionImpactMap";
import { StructureOverview } from "@/components/blueprint/StructureOverview";
import { BrandPromptGuide } from "@/components/blueprint/BrandPromptGuide";
import { GlassCard } from "@/components/ui/GlassCard";
import { Database, Network, Cpu, Palette, Info } from "lucide-react";

export default function BlueprintPage() {
    return (
        <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-accent/30 selection:text-accent-gold">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-500/3 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-amber-500/3 blur-[180px] rounded-full" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            <motion.main
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-7xl mx-auto px-6 py-20 space-y-32"
            >
                {/* Hero / Header Section */}
                <section>
                    <BlueprintHeader />
                </section>

                {/* 1. ADN des Dépendances & Mind Map */}
                <section id="dna" className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-border flex items-center justify-center">
                            <Network className="w-6 h-6 text-accent-gold" />
                        </div>
                        <h2 className="text-3xl font-serif">ADN du <span className="text-accent-gold italic">Projet</span> & Dépendances</h2>
                    </div>
                    <GlassCard className="p-0 overflow-hidden bg-bg-secondary/40 border-border/50">
                        <MindMapDependencies />
                    </GlassCard>
                </section>

                {/* 2. Ondes de Choc & Impacts d'Actions */}
                <section id="impacts" className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-border flex items-center justify-center">
                            <Database className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-serif">Ondes de Choc & <span className="text-emerald-400 italic">Impacts</span></h2>
                    </div>
                    <ActionImpactMap />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* 3. Architecture Simplifiée */}
                    <section id="structure" className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-border flex items-center justify-center">
                                <Info className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-serif">Structure du <span className="text-blue-400 italic">Code Source</span></h2>
                        </div>
                        <StructureOverview />
                    </section>

                    {/* 4. Marque & Guide de Prompt IA */}
                    <section id="brand" className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-border flex items-center justify-center">
                                <Cpu className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-3xl font-serif">ADN de Marque & <span className="text-purple-400 italic">Oracle IA</span></h2>
                        </div>
                        <BrandPromptGuide />
                    </section>
                </div>
                
                {/* Footer Insight */}
                <motion.footer variants={fadeInUp} className="pt-20 border-t border-border/50 text-center">
                    <p className="text-text-muted text-sm font-mono tracking-widest uppercase">
                        RESTAURANT OS — BluePrint v12.0 "L'Architecte" &bull; Architecture Cloud-Native &bull; 2026
                    </p>
                </motion.footer>
            </motion.main>
        </div>
    );
}
