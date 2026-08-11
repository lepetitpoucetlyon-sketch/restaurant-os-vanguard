"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
interface Option {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
}

interface PremiumSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export function PremiumSelect({
    value,
    onChange,
    options,
    placeholder = "Sélectionner...",
    label,
    className,
    disabled = false,
    icon
}: PremiumSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn("relative space-y-3 w-full", className)}>
            {label && (
                <label className="flex items-center gap-3 text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] px-2 leading-none">
                    {label}
                </label>
            )}

            <div className="relative group">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full h-16 px-8 flex items-center justify-between transition-all duration-500 rounded-2xl border-2 outline-none",
                        "bg-surface-card dark:bg-surface-card/5 backdrop-blur-md shadow-sm",
                        isOpen
                            ? "border-accent-gold ring-4 ring-accent-gold/5 shadow-premium"
                            : "border-border/60 dark:border-subtle hover:border-accent-gold/40 hover:shadow-md",
                        disabled && "opacity-50 cursor-not-allowed grayscale"
                    )}
                >
                    <div className="flex items-center gap-4 overflow-hidden">
                        {(selectedOption?.icon || icon) && (
                            <div className="w-8 h-8 rounded-lg bg-accent-gold/5 flex items-center justify-center text-accent-gold">
                                {selectedOption?.icon || icon}
                            </div>
                        )}
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className={cn(
                                "text-[14px] font-black tracking-wider transition-colors duration-300",
                                value ? "text-text-primary dark:text-text-primary" : "text-text-muted/40"
                            )}>
                                {selectedOption?.label?.toUpperCase() || placeholder?.toUpperCase() || ''}
                            </span>
                        </div>
                    </div>

                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="text-accent-gold opacity-40 group-hover:opacity-100"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute z-[100] w-full mt-3 py-3 bg-surface-card/95 dark:bg-surface-sidebar/95 backdrop-blur-2xl border-2 border-accent-gold/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            <div className="max-h-[300px] overflow-y-auto elegant-scrollbar px-2 space-y-1">
                                {options.map((option) => {
                                    const isActive = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "w-full px-6 py-4 flex items-center justify-between rounded-xl transition-all duration-300 group/opt",
                                                isActive
                                                    ? "bg-accent-gold text-text-primary shadow-glow-accent/20"
                                                    : "text-text-primary hover:bg-accent-gold/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                {option.icon && (
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                        isActive ? "bg-surface-card/20" : "bg-accent-gold/5 text-accent-gold"
                                                    )}>
                                                        {option.icon}
                                                    </div>
                                                )}
                                                <div className="flex flex-col items-start leading-tight">
                                                    <span className={cn(
                                                        "text-[13px] font-black tracking-widest",
                                                        isActive ? "text-text-primary" : "text-text-primary dark:text-muted"
                                                    )}>
                                                        {option.label?.toUpperCase() || ''}
                                                    </span>
                                                    {option.description && (
                                                        <span className={cn(
                                                            "text-[9px] font-medium opacity-60",
                                                            isActive ? "text-text-primary" : "text-text-muted"
                                                        )}>
                                                            {option.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-5 h-5 rounded-full bg-surface-card flex items-center justify-center"
                                                >
                                                    <Check className="w-3 h-3 text-accent-gold" strokeWidth={4} />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
