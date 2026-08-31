"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/shared/utils/motion";
import { BlueprintHeader } from "@components/blueprint/BlueprintHeader";
import { MindMapDependencies } from "@components/blueprint/MindMapDependencies";
import { ActionImpactMap } from "@components/blueprint/ActionImpactMap";
import { StructureOverview } from "@components/blueprint/StructureOverview";
import { BrandPromptGuide } from "@components/blueprint/BrandPromptGuide";
import { GlassCard } from "@ui/GlassCard";
import { Database, Network, Cpu, Info } from "lucide-react";

export default function BlueprintPage() {
    return (
        <div className="min-h-[100dvh] bg-bg-primary text-text-primary overflow-x-hidden selection:bg-action-primary selection:text-action-primary">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-action-primary blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-status-success blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-status-warning blur-[180px] rounded-full" />
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
                        <div className="w-12 h-12 rounded-2xl bg-action-primary border border-border flex items-center justify-center">
                            <Network className="w-6 h-6 text-action-primary" />
                        </div>
                        <h2 className="text-3xl font-brand">ADN du <span className="text-action-primary italic">Projet</span> & Dépendances</h2>
                    </div>
                    <GlassCard className="p-0 overflow-hidden bg-bg-secondary/40 border-border/50">
                        <MindMapDependencies />
                    </GlassCard>
                </section>

                {/* 2. Ondes de Choc & Impacts d'Actions */}
                <section id="impacts" className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-status-success border border-border flex items-center justify-center">
                            <Database className="w-6 h-6 text-status-success" />
                        </div>
                        <h2 className="text-3xl font-brand">Ondes de Choc & <span className="text-status-success italic">Impacts</span></h2>
                    </div>
                    <ActionImpactMap />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* 3. Architecture Simplifiée */}
                    <section id="structure" className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-action-primary border border-border flex items-center justify-center">
                                <Info className="w-6 h-6 text-action-primary" />
                            </div>
                            <h2 className="text-3xl font-brand">Structure du <span className="text-action-primary italic">Code Source</span></h2>
                        </div>
                        <StructureOverview />
                    </section>

                    {/* 4. Marque & Guide de Prompt IA */}
                    <section id="brand" className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-action-primary/10 border border-border flex items-center justify-center">
                                <Cpu className="w-6 h-6 text-brand" />
                            </div>
                            <h2 className="text-3xl font-brand">ADN de Marque & <span className="text-brand italic">Oracle IA</span></h2>
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
