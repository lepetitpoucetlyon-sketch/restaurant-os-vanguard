"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { PRICING } from "@/app/(client)/(public)/landing/constants";

export function PricingSection() {
    return (
        <section id="pricing" className="relative py-32 px-6 bg-surface-sidebar">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-action-primary/5 rounded-full blur-[150px]" />

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <span className="text-brand text-sm font-bold uppercase tracking-[0.3em] mb-4 block">Tarifs</span>
                    <h2 className="text-4xl md:text-6xl font-brand font-semibold text-text-primary mb-6">
                        Investissez dans l'excellence
                    </h2>
                    <p className="text-xl text-text-primary/50 max-w-2xl mx-auto">
                        Des formules adaptées à chaque ambition. Sans engagement, sans surprise.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PRICING.map((plan, idx) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            whileHover={{ y: -10 }}
                            className={cn(
                                "relative rounded-3xl p-8 border transition-all duration-500",
                                plan.highlighted
                                    ? "bg-gradient-to-b from-action-primary/20 to-action-primary/5 border-focus/30 shadow-2xl shadow-[#C9A227]/10"
                                    : "bg-surface-card border-border-default hover:border-default"
                            )}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                                    Populaire
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-text-primary mb-2">{plan.name}</h3>
                                <p className="text-text-primary/50 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <span className="text-5xl font-mono font-bold text-text-primary">{plan.price}</span>
                                {plan.period && <span className="text-text-primary/50 text-lg">{plan.period}</span>}
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-3">
                                        <Check className={cn("w-5 h-5 mt-0.5 flex-shrink-0", plan.highlighted ? "text-brand" : "text-text-primary/40")} />
                                        <span className="text-text-primary/80 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all",
                                    plan.highlighted
                                        ? "bg-accent text-primary shadow-lg shadow-[#C9A227]/30"
                                        : "bg-surface-card text-text-primary hover:bg-surface-card"
                                )}
                            >
                                {plan.cta}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
