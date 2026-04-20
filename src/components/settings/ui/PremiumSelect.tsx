// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface PremiumSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export function PremiumSelect({ value, onChange, options, placeholder = "Sélectionner..." }: PremiumSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl bg-bg-tertiary/50 border-2 transition-all duration-300",
                    isOpen
                        ? "border-accent shadow-[0_0_20px_rgba(197,160,89,0.15)]"
                        : "border-border hover:border-accent/30"
                )}
            >
                <span className={cn(
                    "font-serif text-sm",
                    value ? "text-text-primary" : "text-text-muted"
                )}>
                    {selectedOption?.label || placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-accent" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 py-2 rounded-2xl bg-bg-secondary border-2 border-accent/30 shadow-2xl backdrop-blur-xl overflow-hidden"
                    >
                        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-4 py-3 text-left text-sm font-serif transition-all duration-200",
                                        value === opt.value
                                            ? "bg-accent/10 text-accent font-semibold"
                                            : "text-text-primary hover:bg-accent/5"
                                    )}
                                >
                                    {value === opt.value && (
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-2" />
                                    )}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
