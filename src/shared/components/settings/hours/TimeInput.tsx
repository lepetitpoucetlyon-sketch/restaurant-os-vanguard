"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { TimePicker } from "@ui/TimePicker";

interface TimeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    label?: string;
    icon: import('lucide-react').LucideIcon;
}

export function TimeInput({ value, onChange, disabled, label, icon: Icon }: TimeInputProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        };
        if (isPickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPickerOpen]);

    return (
        <div ref={containerRef} className="relative group/time flex-1 min-w-[124px]">
            {label && (
                <div className="absolute -top-7 left-1 flex items-center gap-1.5 opacity-60 group-hover/time:opacity-100 transition-opacity">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    <span className="text-nano font-black text-text-muted dark:text-muted uppercase tracking-[0.25em]">
                        {label}
                    </span>
                </div>
            )}
            <button
                type="button"
                onClick={() => !disabled && setIsPickerOpen(!isPickerOpen)}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-3 px-4 md:px-6 w-full h-16 bg-surface-card dark:bg-surface-card/[0.03] backdrop-blur-md border border-subtle dark:border-subtle rounded-[2.5rem] transition-all duration-500 text-left outline-none",
                    !disabled && "hover:bg-surface-card dark:hover:bg-surface-card/[0.08] hover:border-accent/40 group-focus-within/time:border-accent",
                    isPickerOpen && "border-accent ring-4 ring-accent/10 shadow-2xl",
                    disabled && "opacity-20 grayscale cursor-not-allowed"
                )}
            >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <Icon className="w-4 h-4 text-text-muted transition-colors group-focus-within/time:text-accent shrink-0" strokeWidth={2.5} />
                    <span className="text-2xl font-serif font-black italic text-text-primary tracking-tighter">
                        {value || '--:--'}
                    </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-surface-bg dark:bg-surface-card/5 flex items-center justify-center transition-all opacity-40 group-hover/time:opacity-100 group-hover/time:rotate-180">
                    <Clock className="w-3 h-3 text-text-muted transition-colors group-hover/time:text-accent" />
                </div>
            </button>

            <AnimatePresence>
                {isPickerOpen && (
                    <TimePicker
                        value={value}
                        onChange={onChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
