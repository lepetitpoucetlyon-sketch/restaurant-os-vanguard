"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { ReactNode } from "react";

interface DateNavigatorProps {
    displayDate: string | ReactNode;
    onPrev: () => void;
    onNext: () => void;
    onToday?: () => void;
    variant?: "default" | "minimal" | "pill";
    showTodayButton?: boolean;
    className?: string;
}

export function DateNavigator({
    displayDate,
    onPrev,
    onNext,
    onToday,
    variant = "default",
    showTodayButton = false,
    className,
}: DateNavigatorProps) {
    const variantClasses = {
        default: "bg-bg-tertiary/50 px-4 py-2 rounded-full border border-border/50",
        minimal: "bg-transparent",
        pill: "bg-bg-secondary px-6 py-3 rounded-full border border-border shadow-sm",
    };

    const buttonClasses = cn(
        "p-2 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all"
    );

    return (
        <div className={cn("flex items-center gap-4", variantClasses[variant], className)}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onPrev}
                className={buttonClasses}
                aria-label="Jour précédent"
            >
                <ChevronLeft strokeWidth={2.5} className="h-4 w-4" />
            </motion.button>

            <span className="text-sm font-serif font-medium italic text-text-primary capitalize min-w-[140px] text-center">
                {displayDate}
            </span>

            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onNext}
                className={buttonClasses}
                aria-label="Jour suivant"
            >
                <ChevronRight strokeWidth={2.5} className="h-4 w-4" />
            </motion.button>

            {showTodayButton && onToday && (
                <>
                    <div className="w-px h-6 bg-border/50" />
                    <button
                        onClick={onToday}
                        className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
                    >
                        Aujourd'hui
                    </button>
                </>
            )}
        </div>
    );
}
