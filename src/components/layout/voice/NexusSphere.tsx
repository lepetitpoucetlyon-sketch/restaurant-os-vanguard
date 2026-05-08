"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface NexusSphereProps {
    isActive: boolean;
    isProcessing: boolean;
    className?: string;
}

export function NexusSphere({ isActive, isProcessing, className }: NexusSphereProps) {
    return (
        <div className={cn("relative w-10 h-10 flex items-center justify-center", className)}>
            <motion.div
                animate={{
                    scale: isProcessing ? [1, 1.2, 1] : 1,
                    rotate: isProcessing ? 360 : 0,
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className={cn(
                    "absolute inset-0 rounded-full border-2",
                    isActive 
                        ? "border-success shadow-[0_0_15px_rgba(34,197,94,0.5)]" 
                        : isProcessing 
                            ? "border-accent shadow-[0_0_15px_rgba(197,160,89,0.5)]" 
                            : "border-default"
                )}
            />
            {isActive ? (
                <Zap className="w-5 h-5 text-success animate-pulse" />
            ) : (
                <div className={cn(
                    "w-3 h-3 rounded-full",
                    isProcessing ? "bg-accent animate-ping" : "bg-surface-card/40"
                )} />
            )}
        </div>
    );
}
