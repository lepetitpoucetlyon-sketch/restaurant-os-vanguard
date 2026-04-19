"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    AlertTriangle,
    Copy,
    Sparkles,
    Code2,
    Layers,
    Cpu,
    Shield,
    ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@/components/ui/Toast";

interface AuditSection {
    id: string;
    title: string;
    icon: any;
    color: string;
    description: string;
    axes: {
        id: string;
        title: string;
        problem: string;
        prompt: string;
    }[];
}

const CinematicCard = ({ section, isExpanded, onToggle }: { section: AuditSection, isExpanded: boolean, onToggle: () => void }) => {
    const { showToast } = useToast();
    const Icon = section.icon;

    const copyPrompt = (prompt: string, id: string) => {
        navigator.clipboard.writeText(prompt);
        showToast(`Prompt ${id} copié !`, "success");
    };

    return (
        <motion.div
            layout
            className={cn(
                "bg-bg-secondary border border-border/40 rounded-[3.5rem] overflow-hidden transition-all duration-700",
                isExpanded ? "ring-2 ring-border shadow-2xl" : "hover:bg-bg-tertiary/50"
            )}
        >
            <div
                className="p-10 cursor-pointer flex items-center justify-between"
                onClick={onToggle}
            >
                <div className="flex items-center gap-10">
                    <div
                        className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden"
                        style={{ backgroundColor: `${section.color}15` }}
                    >
                        <Icon className="w-10 h-10 relative z-10" style={{ color: section.color }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-text-primary/10 to-transparent opacity-20" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-serif italic text-text-primary tracking-tight mb-2">{section.title}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40">{section.axes.length} Axes Stratégiques</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <ChevronDown className="w-6 h-6 text-text-muted/30" />
                </motion.div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-10 pb-10 border-t border-border/20"
                    >
                        <div className="pt-10 space-y-8">
                            <p className="text-sm text-text-muted italic leading-relaxed max-w-2xl">
                                {section.description}
                            </p>

                            <div className="grid gap-6">
                                {section.axes.map((axis) => (
                                    <div key={axis.id} className="p-8 bg-bg-primary/50 rounded-[2.5rem] border border-border/20 group hover:border-accent-gold/20 transition-all">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <span className="text-[10px] font-mono font-black text-accent-gold/60">{axis.id}</span>
                                                    <h4 className="text-xl font-serif italic text-text-primary">{axis.title}</h4>
                                                </div>
                                                <p className="text-xs text-text-muted font-medium uppercase tracking-widest flex items-center gap-3">
                                                    <AlertTriangle className="w-4 h-4 text-error/40" />
                                                    {axis.problem}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => copyPrompt(axis.prompt, axis.id)}
                                                className="w-12 h-12 rounded-2xl bg-bg-secondary hover:bg-bg-tertiary shadow-soft border border-border/50"
                                            >
                                                <Copy className="w-4 h-4 text-accent-gold/60" />
                                            </Button>
                                        </div>
                                        <div className="relative group/prompt overflow-hidden rounded-2xl bg-black/5 dark:bg-black/40 p-6 border border-border/10">
                                            <pre className="text-[11px] font-mono leading-relaxed text-text-muted/80 whitespace-pre-wrap">
                                                {axis.prompt}
                                            </pre>
                                            <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary/40 to-transparent pointer-events-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const AuditPortalController = ({ auditData }: { auditData: AuditSection[] }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>('architecture');

    return (
        <div className="grid gap-10">
            {auditData.map((section) => (
                <CinematicCard
                    key={section.id}
                    section={section}
                    isExpanded={expandedSection === section.id}
                    onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                />
            ))}
        </div>
    );
};
