"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import Image from 'next/image';
import { FEATURES } from "@/app/(public)/landing/constants";

export function FeaturesSection() {
    return (
        <section id="features" className="relative py-32 px-6 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <span className="text-[#C9A227] text-sm font-bold uppercase tracking-[0.3em] mb-4 block">Fonctionnalités</span>
                    <h2 className="text-4xl md:text-6xl font-serif font-semibold text-white mb-6">
                        Tout ce dont vous avez besoin
                    </h2>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto">
                        Une suite complète d'outils conçus pour l'excellence opérationnelle.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((feature, idx) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className={cn(
                                "group relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-transparent cursor-pointer",
                                feature.size === "large" ? "md:col-span-2 md:row-span-2" : "",
                                feature.size === "medium" ? "md:row-span-2" : ""
                            )}
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 p-8 h-full flex flex-col justify-end min-h-[300px]">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/10 backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
                                    style={{ backgroundColor: `${feature.color}20` }}
                                >
                                    <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                                </div>
                                <h3 className="text-2xl font-serif font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-white/50 leading-relaxed">{feature.description}</p>

                                <div className="mt-6 flex items-center gap-2 text-[#C9A227] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-bold uppercase tracking-widest">En savoir plus</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
