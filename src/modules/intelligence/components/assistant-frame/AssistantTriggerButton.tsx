"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AssistantTriggerButtonProps {
    onClick: () => void;
}

export function AssistantTriggerButton({ onClick }: AssistantTriggerButtonProps) {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-bg-secondary/90 border border-accent/40 shadow-2xl backdrop-blur-md text-text-primary hover:border-accent hover:shadow-accent/20 transition-all group"
            title="Ouvrir le Copilote IA (Cmd+K)"
        >
            <div className="relative w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-bg-primary transition-colors">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent ring-2 ring-bg-primary" />
            </div>

            <div className="text-left hidden sm:block">
                <span className="text-xs font-bold block leading-none text-text-primary">Copilote IA</span>
                <span className="text-[10px] text-text-muted font-mono">⌘K</span>
            </div>
        </motion.button>
    );
}
