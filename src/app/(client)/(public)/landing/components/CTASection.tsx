"use client";

import { motion } from "framer-motion";
import { Zap, Phone } from "lucide-react";

export function CTASection() {
    return (
        <section className="relative py-32 px-6 bg-surface-sidebar overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-action-primary/10 via-transparent to-[#007AFF]/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-action-primary/10 rounded-full blur-[150px]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 max-w-4xl mx-auto text-center"
            >
                <h2 className="text-4xl md:text-6xl font-brand font-semibold text-text-primary mb-6">
                    Prêt à transformer<br />votre établissement ?
                </h2>
                <p className="text-xl text-text-primary/50 max-w-2xl mx-auto mb-12">
                    Rejoignez les restaurateurs visionnaires qui ont choisi l'excellence opérationnelle.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(201, 162, 39, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        className="group px-10 py-5 bg-accent text-primary font-bold text-lg rounded-2xl shadow-xl shadow-[#C9A227]/30 flex items-center gap-3"
                    >
                        Commencer Maintenant
                        <Zap className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-10 py-5 text-text-primary/80 font-bold text-lg flex items-center gap-3 hover:text-text-primary transition-colors"
                    >
                        <Phone className="w-5 h-5" />
                        Parler à un Expert
                    </motion.button>
                </div>
            </motion.div>
        </section>
    );
}
