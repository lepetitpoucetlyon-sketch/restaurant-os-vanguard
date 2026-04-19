"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";

interface Message {
    id: string;
    role: "user" | "model" | "system";
    text: string;
}

interface ChatThreadProps {
    messages: Message[];
    isProcessing: boolean;
    formatText: (text: string) => string;
    scrollRef: React.RefObject<HTMLDivElement>;
}

export function ChatThread({ messages, isProcessing, formatText, scrollRef }: ChatThreadProps) {
    return (
        <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 elegant-scrollbar flex flex-col relative w-full h-full"
        >
            {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-8 h-8 bg-accent rounded-full blur-sm"
                        />
                    </div>
                    <p className="font-serif text-xl text-text-muted italic">Oracle est prêt.<br />Posez votre question.</p>
                </div>
            )}

            {messages.map((msg) => (
                <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "max-w-[85%] rounded-2xl p-4 relative",
                        msg.role === 'user'
                            ? "bg-bg-tertiary/80 text-text-primary self-end border border-border/50 rounded-tr-sm"
                            : "bg-accent/10 border border-accent/20 text-text-primary self-start rounded-tl-sm shadow-xl shadow-accent/5"
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50">
                            {msg.role === 'user' ? 'Vous' : 'Oracle Assistant'}
                        </p>
                    </div>
                    <div 
                        className="text-sm font-medium leading-relaxed prose prose-invert max-w-none text-text-primary prose-a:text-accent-gold" 
                        dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} 
                    />
                </motion.div>
            ))}
            {isProcessing && (
                <div className="self-start bg-accent/5 border border-accent/10 rounded-2xl p-3 animate-pulse">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <div className="w-1.5 h-1.5 rounded-full bg-accent delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-accent delay-150" />
                    </div>
                </div>
            )}
        </div>
    );
}
