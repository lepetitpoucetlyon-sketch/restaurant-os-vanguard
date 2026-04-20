// @ts-nocheck
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface PremiumNumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export function PremiumNumberInput({ value, onChange, min = 0, max = 100, step = 1 }: PremiumNumberInputProps) {
    const handleIncrement = () => {
        const newValue = Math.min(value + step, max);
        onChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(value - step, min);
        onChange(newValue);
    };

    return (
        <div className="flex items-center gap-3">
            {/* Decrement Button */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDecrement}
                disabled={value <= min}
                className={cn(
                    "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-300",
                    value <= min
                        ? "border-border bg-bg-tertiary/30 text-text-muted cursor-not-allowed"
                        : "border-accent/30 bg-bg-tertiary/50 text-accent hover:border-accent hover:bg-accent/10"
                )}
            >
                <Minus className="w-5 h-5" />
            </motion.button>

            {/* Value Display */}
            <div className="flex-1 relative">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                        const val = parseInt(e.target.value) || min;
                        onChange(Math.max(min, Math.min(max, val)));
                    }}
                    min={min}
                    max={max}
                    className="w-full text-center p-4 rounded-2xl bg-bg-tertiary/50 border-2 border-border text-text-primary font-serif text-xl font-semibold focus:border-accent focus:outline-none focus:shadow-[0_0_20px_rgba(197,160,89,0.15)] transition-all duration-300 appearance-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                />
            </div>

            {/* Increment Button */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleIncrement}
                disabled={value >= max}
                className={cn(
                    "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-300",
                    value >= max
                        ? "border-border bg-bg-tertiary/30 text-text-muted cursor-not-allowed"
                        : "border-accent/30 bg-bg-tertiary/50 text-accent hover:border-accent hover:bg-accent/10"
                )}
            >
                <Plus className="w-5 h-5" />
            </motion.button>
        </div>
    );
}
