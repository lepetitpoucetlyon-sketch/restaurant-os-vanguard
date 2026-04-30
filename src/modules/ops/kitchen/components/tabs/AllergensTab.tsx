
"use client";

import { motion } from "framer-motion";
import { cinematicContainer, fadeInUp, cinematicItem } from "@/lib/motion";

export function AllergensTab() {
    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-full"
        >
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-text-primary">Allergènes & Régimes</h2>
                    <p className="text-text-muted text-sm mt-1">Conformité réglementaire et information client</p>
                </div>
            </motion.div>

            {/* Allergen Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { name: 'Gluten', count: 12, icon: '🌾', color: '#FF9500' },
                    { name: 'Lactose', count: 8, icon: '🥛', color: '#007AFF' },
                    { name: 'Œufs', count: 6, icon: '🥚', color: '#FFD700' },
                    { name: 'Fruits à coque', count: 4, icon: '🥜', color: '#8B4513' },
                    { name: 'Crustacés', count: 3, icon: '🦐', color: '#FF4D4D' },
                    { name: 'Poisson', count: 5, icon: '🐟', color: '#007AFF' },
                    { name: 'Soja', count: 2, icon: '🫘', color: '#C5A059' },
                    { name: 'Céleri', count: 7, icon: '🥬', color: '#C5A059' },
                ].map((allergen, idx) => (
                    <motion.div
                        key={idx}
                        variants={cinematicItem}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-bg-secondary rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{allergen.icon}</span>
                            <span className="font-bold text-sm text-text-primary">{allergen.name}</span>
                        </div>
                        <p className="text-[11px] text-[#ADB5BD]">{allergen.count} plats concernés</p>
                    </motion.div>
                ))}
            </div>

            {/* Dietary Options */}
            <motion.div variants={fadeInUp} className="bg-bg-secondary rounded-3xl p-6 border border-border shadow-sm">
                <h3 className="font-black text-lg text-text-primary mb-6">Options Régimes Alimentaires</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: 'Végétarien', count: 15, icon: '🥗', color: '#C5A059' },
                        { name: 'Végan', count: 8, icon: '🌱', color: '#C5A059' },
                        { name: 'Sans Gluten', count: 12, icon: '🚫🌾', color: '#FF9500' },
                        { name: 'Sans Lactose', count: 10, icon: '🚫🥛', color: '#007AFF' },
                        { name: 'Halal', count: 6, icon: '☪️', color: '#C5A059' },
                        { name: 'Casher', count: 4, icon: '✡️', color: '#007AFF' },
                    ].map((diet, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-4 bg-bg-primary dark:bg-bg-tertiary/50 rounded-xl"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{diet.icon}</span>
                                <span className="font-bold text-sm text-text-primary">{diet.name}</span>
                            </div>
                            <span className="bg-bg-secondary px-3 py-1 rounded-lg text-[11px] font-black text-text-primary shadow-sm">{diet.count} plats</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
