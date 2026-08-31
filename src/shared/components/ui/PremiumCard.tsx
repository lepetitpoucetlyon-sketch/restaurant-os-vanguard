"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { ReactNode, forwardRef } from "react";

interface PremiumCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode;
    variant?: "default" | "glass" | "elevated" | "minimal";
    hoverEffect?: boolean;
    glowColor?: "accent" | "success" | "warning" | "error" | "none";
    padding?: "none" | "sm" | "md" | "lg" | "xl";
    rounded?: "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
};

const roundedClasses = {
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-[2rem]",
    "2xl": "rounded-[2.5rem]",
    "3xl": "rounded-[3rem]",
    full: "rounded-full",
};

const glowClasses = {
    accent: "hover:shadow-accent/10 hover:border-accent/40",
    success: "hover:shadow-emerald-500/10 hover:border-emerald-500/40",
    warning: "hover:shadow-amber-500/10 hover:border-action-primary/40",
    error: "hover:shadow-rose-500/10 hover:border-rose-500/40",
    none: "",
};

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
    (
        {
            children,
            className,
            variant = "default",
            hoverEffect = true,
            glowColor = "accent",
            padding = "lg",
            rounded = "2xl",
            role,
            "aria-label": ariaLabel,
            ...props
        },
        ref
    ) => {
        const baseClasses = cn(
            "relative overflow-hidden transition-all duration-500",
            paddingClasses[padding],
            roundedClasses[rounded]
        );

        // taste-skill : ombres teintées or à la place des shadow-lg/2xl génériques
        const variantClasses = {
            default: cn(
                "bg-bg-secondary border border-border shadow-[0_8px_24px_-14px_rgba(197,160,89,0.15)]",
                hoverEffect && "hover:shadow-[0_20px_40px_-16px_rgba(197,160,89,0.22)] hover:-translate-y-[1px]",
                glowClasses[glowColor]
            ),
            glass: cn(
                "bg-surface-card/40 dark:bg-surface-card/5 backdrop-blur-xl border border-white/50 dark:border-subtle shadow-[0_8px_24px_-14px_rgba(197,160,89,0.12)]",
                hoverEffect && "hover:shadow-[0_20px_40px_-16px_rgba(197,160,89,0.20)] hover:-translate-y-[1px]"
            ),
            elevated: cn(
                "bg-bg-secondary border border-border shadow-[0_20px_50px_-20px_rgba(197,160,89,0.22)]",
                hoverEffect && "hover:shadow-[0_32px_64px_-20px_rgba(197,160,89,0.28)] hover:-translate-y-[2px]",
                glowClasses[glowColor]
            ),
            minimal: cn(
                "bg-bg-tertiary border border-border/50",
                hoverEffect && "hover:bg-bg-secondary hover:border-border"
            ),
        };

        return (
            <motion.div
                ref={ref}
                className={cn(baseClasses, variantClasses[variant], className)}
                role={role || (ariaLabel ? "region" : undefined)}
                aria-label={ariaLabel}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

PremiumCard.displayName = "PremiumCard";
