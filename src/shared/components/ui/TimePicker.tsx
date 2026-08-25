"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
interface TimePickerProps {
    value: string; // "HH:mm"
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export function TimePicker({
    value,
    onChange,
    label,
    placeholder = "12:00",
    className
}: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Parse hours and minutes from value
    const initialHours = value ? parseInt(value.split(":")[0]) : 12;
    const initialMinutes = value ? parseInt(value.split(":")[1]) : 0;
    
    const [hours, setHours] = useState(initialHours);
    const [minutes, setMinutes] = useState(initialMinutes);

    const hoursList = Array.from({ length: 24 }, (_, i) => i);
    const minutesList = Array.from({ length: 60 }, (_, i) => i);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleConfirm = () => {
        const hh = hours.toString().padStart(2, '0');
        const mm = minutes.toString().padStart(2, '0');
        onChange(`${hh}:${mm}`);
        setIsOpen(false);
    };

    // Scroll snap behavior emulation for selection
    const hoursRef = useRef<HTMLDivElement>(null);
    const minutesRef = useRef<HTMLDivElement>(null);

    const scrollToValue = (ref: React.RefObject<HTMLDivElement | null>, val: number) => {
        if (ref.current) {
            const item = ref.current.children[val] as HTMLElement;
            if (item) {
                ref.current.scrollTo({
                    top: item.offsetTop - ref.current.offsetHeight / 2 + item.offsetHeight / 2,
                    behavior: "smooth"
                });
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Wait for animation to finish before scrolling
            setTimeout(() => {
                scrollToValue(hoursRef, hours);
                scrollToValue(minutesRef, minutes);
            }, 100);
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className={cn("relative space-y-2 w-full", className)}>
            {label && (
                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] px-2">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-16 px-6 flex items-center justify-between transition-all duration-500 rounded-2xl border-2 outline-none",
                    "bg-bg-tertiary/50 dark:bg-surface-card/5 backdrop-blur-md",
                    isOpen
                        ? "border-accent-gold ring-4 ring-accent-gold/10 shadow-premium bg-surface-card dark:bg-bg-secondary"
                        : "border-transparent hover:border-accent-gold/30"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isOpen ? "bg-accent-gold text-text-primary" : "bg-bg-tertiary text-text-muted"
                    )}>
                        <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-mono font-bold tracking-tighter text-text-primary">
                        {value || placeholder}
                    </span>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-text-muted transition-transform duration-500", isOpen && "rotate-180 text-accent-gold")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute z-[110] left-0 right-0 mt-3 p-2 bg-surface-card dark:bg-surface-sidebar border border-border/50 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden"
                    >
                        <div className="flex h-64 relative">
                            {/* Selection Highlight */}
                            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-14 bg-bg-tertiary/50 dark:bg-surface-card/5 rounded-2xl pointer-events-none border border-accent-gold/10" />
                            
                            {/* Hours Column */}
                            <div 
                                ref={hoursRef}
                                className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory py-24"
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    const index = Math.round(el.scrollTop / 48);
                                    if (index >= 0 && index < 24) setHours(index);
                                }}
                            >
                                {hoursList.map((h) => (
                                    <div 
                                        key={h}
                                        onClick={() => scrollToValue(hoursRef, h)}
                                        className={cn(
                                            "h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-300",
                                            hours === h ? "text-2xl font-black text-text-primary scale-110" : "text-lg font-medium text-text-muted opacity-30"
                                        )}
                                    >
                                        <span className="font-mono">{h.toString().padStart(2, '0')}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center text-2xl font-black text-text-muted/20">:</div>

                            {/* Minutes Column */}
                            <div 
                                ref={minutesRef}
                                className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory py-24"
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    const index = Math.round(el.scrollTop / 48);
                                    if (index >= 0 && index < 60) setMinutes(index);
                                }}
                            >
                                {minutesList.map((m) => (
                                    <div 
                                        key={m}
                                        onClick={() => scrollToValue(minutesRef, m)}
                                        className={cn(
                                            "h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-300",
                                            minutes === m ? "text-2xl font-black text-text-primary scale-110" : "text-lg font-medium text-text-muted opacity-30"
                                        )}
                                    >
                                        <span className="font-mono">{m.toString().padStart(2, '0')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-2 pt-0 mt-2">
                            <button
                                onClick={handleConfirm}
                                className="w-full h-14 bg-text-primary text-text-primary dark:bg-accent-gold dark:text-text-primary rounded-2xl font-black uppercase text-nano tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] shadow-xl transition-all active:scale-[0.98]"
                            >
                                Confirmer <Check className="w-4 h-4 text-accent-gold dark:text-text-primary" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
