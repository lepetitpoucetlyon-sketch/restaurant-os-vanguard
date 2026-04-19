
"use client";

import { motion } from "framer-motion";
import { Plus, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUI } from "@/context/UIContext";

interface PlaceholderViewProps {
    title: string;
    description: string;
    icon: LucideIcon;
}

export function PlaceholderView({ title, description, icon: Icon }: PlaceholderViewProps) {
    const { openDocumentation } = useUI();
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-h-[calc(100vh-320px)] flex items-center justify-center"
        >
            <motion.div
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="relative bg-bg-secondary rounded-3xl border border-border shadow-2xl shadow-black/5 p-12 max-w-2xl w-full mx-auto overflow-hidden text-center"
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/5 to-transparent -mr-32 -mt-32 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent -ml-24 -mb-24 rounded-full blur-2xl" />

                <div className="relative z-10 transition-all">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
                        className="w-24 h-24 bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-accent/10"
                    >
                        <Icon className="w-12 h-12 text-accent" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-3xl font-serif font-black text-text-primary mb-4 italic"
                    >
                        {title}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="text-base text-text-muted max-w-md mx-auto mb-10 leading-relaxed"
                    >
                        {description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="flex items-center justify-center gap-4"
                    >
                        <Button
                            size="lg"
                            className="h-14 px-10 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-accent/30 transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-3" />
                            Configurer le Module
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 px-8 rounded-2xl font-bold text-sm uppercase tracking-widest"
                            onClick={() => {
                                openDocumentation('accounting');
                            }}
                        >
                            Documentation
                        </Button>
                    </motion.div>

                    {/* Feature hints */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.7 }}
                        className="mt-12 pt-8 border-t border-border/50"
                    >
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Fonctionnalités à venir</p>
                        <div className="flex items-center justify-center gap-3">
                            {['Import Excel', 'Export PDF', 'Synchronisation', 'Alertes'].map((feature, i) => (
                                <motion.span
                                    key={feature}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                    className="px-4 py-2 bg-bg-tertiary text-text-muted text-xs font-bold rounded-full"
                                >
                                    {feature}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}
