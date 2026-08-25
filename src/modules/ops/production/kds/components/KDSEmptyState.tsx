import { motion } from "framer-motion";
import { ChefHat } from "lucide-react";

export function KDSEmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center h-full relative z-10 py-20"
        >
            <div className="relative mb-12">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-border bg-bg-tertiary/20 flex items-center justify-center shadow-inner relative z-10 backdrop-blur-sm transition-all duration-500">
                    <ChefHat strokeWidth={0.5} className="w-16 h-16 md:w-20 md:h-20 text-text-muted/30" />
                </div>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-dashed rounded-full border-text-muted/10"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-6 border border-dotted rounded-full border-text-muted/5"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -inset-12 bg-success-soft/50 blur-3xl rounded-full"
                />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif italic tracking-tighter text-text-muted transition-colors">Cuisine en stase</h2>
            <p className="text-nano font-black uppercase tracking-[0.5em] mt-8 px-10 py-3 rounded-full border border-border bg-bg-tertiary text-text-muted/50 shadow-inner">
                Le flux de production est actuellement vide
            </p>
        </motion.div>
    );
}
