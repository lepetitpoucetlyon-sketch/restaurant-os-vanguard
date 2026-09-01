"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui.foundations";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";

// ── GlassCard CVA ─────────────────────────────────────────────────────────────
const glassCardVariants = cva(
  "backdrop-blur-[var(--glass-blur,16px)] border overflow-hidden relative",
  {
    variants: {
      variant: {
        default:  "bg-surface-card/40 dark:bg-bg-secondary/40 border-white/50 dark:border-border/50 shadow-xl",
        elevated: "bg-surface-card/50 dark:bg-bg-secondary/50 border-white/60 dark:border-border/60 shadow-2xl shadow-neutral-200/30 dark:shadow-black/40",
        inset:    "bg-surface-bg/50 dark:bg-surface-card/5 border-subtle dark:border-border shadow-inner",
      },
      padding: {
        none: "",
        sm:    "p-4",
        md:    "p-6",
        lg:    "p-8",
        xl:    "p-10",
      },
      rounded: {
        md:    "rounded-xl",
        lg:    "rounded-2xl",
        xl:    "rounded-[1.5rem]",
        "2xl": "rounded-[2rem]",
        "3xl": "rounded-[2.5rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "lg",
      rounded: "2xl",
    },
  }
);

export type GlassCardVariants = VariantProps<typeof glassCardVariants>;

interface GlassCardProps extends HTMLMotionProps<"div">, GlassCardVariants {
  children: ReactNode;
  className?: string;
  enableInitialAnimation?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    children,
    className,
    variant = "default",
    padding = "lg",
    rounded = "2xl",
    enableInitialAnimation = true,
    ...props
  }, ref) => {
    const baseClasses = cn(glassCardVariants({ variant, padding, rounded }), className);

    if (enableInitialAnimation) {
      return (
        <motion.div
          ref={ref}
          className={baseClasses}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4, boxShadow: "var(--shadow-glow-accent, 0 40px 80px rgba(0,0,0,0.15))" }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    const {
      whileHover, whileTap, whileDrag, whileFocus, whileInView,
      initial, animate, transition, variants,
      onAnimationStart, onAnimationComplete, onUpdate,
      onDragStart, onDragEnd, onDrag, onDirectionLock,
      onDragTransitionEnd, layout, layoutId,
      ...htmlProps
    } = props;

    return (
      <div ref={ref} className={baseClasses} {...(htmlProps as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { glassCardVariants };
export default GlassCard;
