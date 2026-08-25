'use client';

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function StockSuccessView() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-24 h-24 rounded-[2.5rem] bg-text-primary flex items-center justify-center mb-10 shadow-premium"
            >
                <Check className="w-12 h-12 text-text-primary" strokeWidth={3} />
            </motion.div>
            <p className="text-4xl font-serif font-black text-text-primary italic">Stock Scellé avec Succès.</p>
            <p className="text-nano font-black text-accent-gold uppercase tracking-[0.4em] mt-4">Les ressources ont été intégrées à l&apos;archive maître</p>
        </div>
    );
}
