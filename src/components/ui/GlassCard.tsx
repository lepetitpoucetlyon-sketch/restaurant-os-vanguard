"use client";

import { cn } from "@/lib/ui.foundations";;
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'inset';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    animate?: boolean;
}

const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
};

const roundedMap = {
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-[1.5rem]',
    '2xl': 'rounded-[2rem]',
    '3xl': 'rounded-[2.5rem]',
};

const variantMap = {
    default: 'bg-white/40 dark:bg-bg-secondary/40 border-white/50 dark:border-border/50 shadow-xl',
    elevated: 'bg-white/50 dark:bg-bg-secondary/50 border-white/60 dark:border-border/60 shadow-2xl shadow-neutral-200/30 dark:shadow-black/40',
    inset: 'bg-neutral-50/50 dark:bg-white/5 border-neutral-100 dark:border-border shadow-inner',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({
        children,
        className,
        variant = 'default',
        padding = 'lg',
        rounded = '2xl',
        animate = true,
        ...props
    }, ref) => {
        const baseClasses = cn(
            "backdrop-blur-xl border overflow-hidden relative",
            variantMap[variant],
            paddingMap[padding],
            roundedMap[rounded],
            className
        );

        if (animate) {
            return (
                <motion.div
                    ref={ref}
                    className={baseClasses}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{
                        y: -4,
                        boxShadow: '0 40px 80px rgba(0,0,0,0.15)'
                    }}
                    {...props}
                >
                    {children}
                </motion.div>
            );
        }

        return (
            <div ref={ref} className={baseClasses} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                {children}
            </div>
        );
    }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
