"use client";

import React from 'react';
import { CATEGORY_DOCS } from '@/lib/docs-data';
import { RecipeTechnicalSheet } from './RecipeTechnicalSheet';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '@/hooks';
import { useTutorial } from '@/context/TutorialContext';
import { cn } from "@/lib/ui.foundations";;
import { X, ChevronRight, BookOpen, Zap } from 'lucide-react';
import { NexusTutorialState } from '@nexus/contracts/nexus.types';

export function DocumentationPortal({ isPage = false, categoryOverride }: { isPage?: boolean; categoryOverride?: string }) {
    const { isDocumentationOpen, documentationCategory, closeDocumentation } = useUI();
    const { startTutorial } = useTutorial() as NexusTutorialState;
    const [showFullTutorial, setShowFullTutorial] = React.useState(true);

    const activeCategory = categoryOverride || documentationCategory;

    // Reset to tutorial view when category changes or modal opens
    React.useEffect(() => {
        if (isDocumentationOpen || isPage) {
            setShowFullTutorial(true);
        }
    }, [isDocumentationOpen, activeCategory, isPage]);



    const doc = (CATEGORY_DOCS[activeCategory as string] || {
        title: 'Aide & Documentation',
        description: 'Module d\'assistance technique Restaurant OS.',
        icon: BookOpen,
        color: '#525252',
        details: [
            { label: 'Inconnu', content: 'Aucune fiche technique n\'est disponible pour cette section.' }
        ]
    }) as (typeof CATEGORY_DOCS)[string];

    const CategoryIcon = doc.icon;

    const content = (
        <motion.div
            initial={isPage ? {} : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isPage ? {} : { opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
                "relative w-full bg-white dark:bg-bg-secondary overflow-hidden",
                !isPage && "rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] dark:shadow-black/60 border border-neutral-100 dark:border-border",
                doc.isRecipe ? "max-w-6xl h-[85vh]" : "max-w-4xl",
                isPage && "max-w-none h-full"
            )}
            onClick={e => e.stopPropagation()}
        >
            {doc.isRecipe && !showFullTutorial ? (
                <RecipeTechnicalSheet
                    {...doc.recipe!}
                    onClose={closeDocumentation}
                />
            ) : (
                <>
                    {/* Linear Header */}
                    <div className="p-8 border-b border-neutral-100 dark:border-border flex items-center justify-between bg-[#fdfdfc] dark:bg-bg-tertiary/40">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-accent/20">
                                <BookOpen strokeWidth={1.5} className="w-6 h-6 text-accent dark:text-accent-gold" />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-light text-neutral-900 dark:text-text-primary italic">
                                    {showFullTutorial ? "Tutoriel Guidé : " : "Fiche Technique : "}
                                    <span className="font-normal text-accent dark:text-accent/90">{doc.title}</span>
                                </h2>
                                <p className="text-[9px] font-black text-neutral-500 dark:text-text-muted uppercase tracking-[0.2em] mt-1">Manuel d'utilisation Restaurant OS</p>
                            </div>
                        </div>
                        {!isPage && (
                            <button onClick={closeDocumentation} className="w-10 h-10 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors">
                                <X className="w-5 h-5 text-neutral-500 dark:text-text-muted" />
                            </button>
                        )}
                    </div>

                    {/* Content Body */}
                    <div className={cn(
                        "p-10 space-y-10 overflow-y-auto elegant-scrollbar",
                        isPage ? "flex-1" : "max-h-[60vh]"
                    )}>
                        {showFullTutorial ? (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {doc.fullTutorial ? (
                                    doc.fullTutorial.map((section, sidx) => (
                                        <div key={sidx} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-neutral-50 dark:bg-bg-tertiary flex items-center justify-center text-2xl shadow-inner border border-neutral-100 dark:border-border">
                                                    {section.icon}
                                                </div>
                                                <h3 className="text-xl font-serif font-black text-neutral-900 dark:text-text-primary italic tracking-tight">
                                                    {section.title}
                                                </h3>
                                            </div>
                                            <div className="pl-16 space-y-4">
                                                <p className="text-neutral-600 dark:text-text-muted font-serif text-lg leading-relaxed">
                                                    {section.content}
                                                </p>
                                                <div className="space-y-5">
                                                    {section.points.map((point, pidx) => {
                                                        const parts = point.split(' → ');
                                                        const actionTitle = parts[0];
                                                        const steps = parts.slice(1);

                                                        return (
                                                            <div key={pidx} className="rounded-2xl border border-neutral-100 dark:border-border shadow-sm overflow-hidden">
                                                                <div
                                                                    className="flex items-center gap-4 px-5 py-4 bg-neutral-900 dark:bg-neutral-800 text-white cursor-pointer hover:bg-black dark:hover:bg-neutral-700 transition-colors group/banner"
                                                                    onClick={() => {
                                                                        const tutorialSection: import('@nexus/contracts/nexus.types').NexusTutorialSection = {
                                                                            id: activeCategory as string,
                                                                            title: actionTitle,
                                                                            points: steps.map((step, stepIdx): import('@nexus/contracts/nexus.types').NexusTutorialStep => {
                                                                                const isAutoClick = step.includes('[CLICK]');
                                                                                const selectorMatch = step.match(/\[SELECTOR:(.*?)\]/);
                                                                                const pathMatch = step.match(/\[PATH:(.*?)\]/);

                                                                                const manualSelector = selectorMatch ? selectorMatch[1] : null;
                                                                                const path = pathMatch ? pathMatch[1] : undefined;

                                                                                const cleanStep = step
                                                                                    .replace('[CLICK]', '')
                                                                                    .replace(/\[SELECTOR:.*?\]/, '')
                                                                                    .replace(/\[PATH:.*?\]/, '')
                                                                                    .trim();

                                                                                const selector = manualSelector || `[data-tutorial="${activeCategory}-${sidx}-${pidx}-${stepIdx}"]`;

                                                                                return {
                                                                                    id: `${activeCategory}-${sidx}-${pidx}-${stepIdx}`,
                                                                                    label: cleanStep.split(' → ')[0] || cleanStep,
                                                                                    description: cleanStep,
                                                                                    selector: selector,
                                                                                    path: path,
                                                                                    action: isAutoClick ? () => {
                                                                                        const el = document.querySelector(selector) as HTMLElement;
                                                                                        if (el) el.click();
                                                                                    } : undefined
                                                                                };
                                                                            })
                                                                        };
                                                                        startTutorial(tutorialSection);
                                                                        closeDocumentation();
                                                                    }}
                                                                >
                                                                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-sm font-black group-hover/banner:bg-accent-gold group-hover/banner:text-black transition-all">
                                                                        {pidx + 1}
                                                                    </div>
                                                                    <span className="text-sm font-bold uppercase tracking-wider">{actionTitle}</span>
                                                                    <Zap className="ml-auto w-4 h-4 text-accent-gold opacity-0 group-hover/banner:opacity-100 transition-all" />
                                                                </div>

                                                                {steps.length > 0 && (
                                                                    <div className="p-5 space-y-3 bg-white dark:bg-bg-secondary/50">
                                                                        {steps.map((step, stepIdx) => (
                                                                            <div key={stepIdx} className="flex items-start gap-3">
                                                                                <div className="flex flex-col items-center shrink-0">
                                                                                    <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                                                                        {String.fromCharCode(97 + stepIdx)}
                                                                                    </div>
                                                                                    {stepIdx < steps.length - 1 && (
                                                                                        <div className="w-0.5 h-4 bg-accent/20 mt-1" />
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 pt-0.5">
                                                                                    <span className="text-sm text-neutral-700 dark:text-text-primary leading-relaxed">{step}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-neutral-50 dark:bg-bg-tertiary/20 rounded-[2.5rem] border-2 border-dashed border-neutral-100 dark:border-border/50">
                                        <p className="text-neutral-400 dark:text-text-muted font-serif italic">Le tutoriel détaillé est en cours de rédaction par notre équipe hôtelière.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="p-8 bg-[#f5f5f0] dark:bg-bg-tertiary/20 rounded-3xl border border-[#ebebe0] dark:border-border/50">
                                    <p className="text-base text-neutral-900 dark:text-text-primary font-serif italic leading-relaxed">
                                        "{doc.description}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    {doc.details.map((detail, idx) => (
                                        <div key={idx} className="flex gap-6 group">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-bg-tertiary border border-neutral-100 dark:border-border flex items-center justify-center text-[10px] font-mono font-bold text-accent-gold dark:text-accent-gold/80 shadow-sm shrink-0">
                                                0{idx + 1}
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black text-neutral-900 dark:text-text-primary uppercase tracking-widest">{detail.label}</h4>
                                                <p className="text-sm text-neutral-500 dark:text-text-muted leading-relaxed font-serif italic">
                                                    {detail.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-[#fdfdfc] dark:bg-bg-tertiary/40 border-t border-neutral-100 dark:border-border flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            <span className="text-[8px] font-black text-neutral-500 dark:text-text-muted uppercase tracking-widest italic">Aide Contextuelle Active</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowFullTutorial(!showFullTutorial)}
                                className={cn(
                                    "h-12 px-8 rounded-full font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-3",
                                    showFullTutorial
                                        ? "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent border border-accent/20 dark:border-accent/40"
                                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                                )}
                            >
                                <Zap className="w-4 h-4" />
                                {showFullTutorial ? "Voir Fiche Technique" : "Voir Tutoriel"}
                            </button>

                            <div className="flex items-center gap-3 pr-6 border-r border-neutral-100 dark:border-border">
                                <CategoryIcon className="w-5 h-5" style={{ color: doc.color }} />
                                <span className="text-[9px] font-bold text-neutral-400 dark:text-text-muted uppercase tracking-widest">Support {doc.title}</span>
                            </div>
                            {!isPage && (
                                <button
                                    onClick={closeDocumentation}
                                    className="h-12 px-8 bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-black text-[9px] uppercase tracking-widest transition-all shadow-xl shadow-neutral-900/10 dark:shadow-black/40"
                                >
                                    Compris, Fermer
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );

    if (isPage) {
        return <div className="h-screen w-full bg-bg-primary overflow-hidden flex flex-col">{content}</div>;
    }

    return (
        <AnimatePresence>
            {!isPage && isDocumentationOpen && activeCategory && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDocumentation}
                        className="absolute inset-0 bg-text-primary/20 dark:bg-black/60 backdrop-blur-md"
                    />
                    {content}
                </div>
            )}
        </AnimatePresence>
    );
}
