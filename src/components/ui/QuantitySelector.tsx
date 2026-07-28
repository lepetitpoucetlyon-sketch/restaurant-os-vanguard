"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/ui.foundations";

interface QuantitySelectorProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    className?: string
}

/**
 * Premium Quantity Selector with "Liquid Glass" effect.
 * Features round buttons and adaptable backgrounds for MS/MC.
 */
export function QuantitySelector({
    value,
    onChange,
    min = 0,
    max = 99,
    className,
}: QuantitySelectorProps) {
    const increment = () => {
        if (value < max) onChange(value + 1)
    }

    const decrement = () => {
        if (value > min) onChange(value - 1)
    }

    return (
        <div
            className={cn(
                // Base Pill Shape
                "relative flex items-center justify-between p-1 rounded-full",
                "w-36 h-12 select-none",
                // Background - MC: Light Green | MS: Dark Forest Green
                "bg-[#E6F9EF] dark:bg-[#062D1F]/80 dark:backdrop-blur-md",
                // Contour/Border
                "border border-accent/20 dark:border-accent/30",
                // Liquid Glass Highlight (Top edge)
                "before:absolute before:top-0 before:left-4 before:right-4 before:h-[1px]",
                "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                className
            )}
        >
            {/* Minus Button - Round & Muted */}
            <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={decrement}
                disabled={value <= min}
                className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                    "hover:bg-surface-sidebar/5 dark:hover:bg-surface-card/5",
                    "text-secondary dark:text-muted disabled:opacity-30",
                    "border border-transparent dark:border-white/5"
                )}
            >
                <Minus size={20} strokeWidth={2.5} />
            </motion.button>

            {/* Value Display */}
            <div className="flex-1 text-center font-bold text-lg text-primary dark:text-text-primary">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={value}
                        initial={{ y: 2, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -2, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Plus Button - Round, Radiant Emerald with Glow */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={increment}
                disabled={value >= max}
                className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full transition-shadow",
                    "bg-accent text-text-primary shadow-[0_0_15px_-3px_#C5A059]",
                    "hover:shadow-[0_0_20px_-2px_#C5A059]",
                    // Liquid glass highlight on the button itself
                    "after:absolute after:top-1 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-[1px] after:bg-surface-card/40 after:rounded-full after:blur-[0.5px]"
                )}
            >
                <Plus size={22} strokeWidth={3} />
            </motion.button>
        </div>
    )
}
