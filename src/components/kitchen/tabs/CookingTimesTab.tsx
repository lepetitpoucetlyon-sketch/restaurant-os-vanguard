// @ts-nocheck

"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;
import { cinematicContainer, fadeInUp, cinematicItem } from "@/lib/motion";

export function CookingTimesTab() {
    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-full"
        >
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-text-primary">Temps de Cuisson</h2>
                    <p className="text-text-muted text-sm mt-1">Référentiel des temps de cuisson standards</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="h-12 bg-text-primary text-bg-primary px-6 rounded-xl font-bold">
                        + Ajouter Référence
                    </Button>
                </motion.div>
            </motion.div>

            {/* Cooking Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    {
                        title: 'Viandes',
                        icon: '🥩',
                        bg: 'bg-error-soft dark:bg-error/10',
                        accent: 'text-error',
                        items: [
                            { name: 'Filet de bœuf (saignant)', temp: '54°C', time: '3-4 min/côté' },
                            { name: 'Filet de bœuf (à point)', temp: '60°C', time: '5-6 min/côté' },
                            { name: 'Magret de canard', temp: '58°C', time: '8 min peau' },
                            { name: 'Côte de veau', temp: '62°C', time: '7-8 min/côté' },
                            { name: 'Poulet rôti', temp: '74°C', time: '45-50 min' },
                        ]
                    },
                    {
                        title: 'Poissons & Fruits de mer',
                        icon: '🐟',
                        bg: 'bg-accent/10',
                        accent: 'text-accent',
                        items: [
                            { name: 'Saumon (mi-cuit)', temp: '52°C', time: '4-5 min' },
                            { name: 'Cabillaud', temp: '60°C', time: '8-10 min' },
                            { name: 'Saint-Jacques', temp: '55°C', time: '2 min/côté' },
                            { name: 'Homard', temp: '62°C', time: '12-15 min' },
                            { name: 'Sole meunière', temp: '58°C', time: '3-4 min/côté' },
                        ]
                    },
                    {
                        title: 'Légumes',
                        icon: '🥦',
                        bg: 'bg-success-soft dark:bg-success/10',
                        accent: 'text-success',
                        items: [
                            { name: 'Asperges vertes', temp: '95°C', time: '3-4 min (blanchi)' },
                            { name: 'Haricots verts', temp: '95°C', time: '5-6 min' },
                            { name: 'Pommes de terre rissolées', temp: '180°C', time: '20-25 min' },
                            { name: 'Carottes glacées', temp: '100°C', time: '15 min' },
                            { name: 'Champignons poêlés', temp: '200°C', time: '4-5 min' },
                        ]
                    },
                    {
                        title: 'Pâtes & Féculents',
                        icon: '🍝',
                        bg: 'bg-warning-soft dark:bg-warning/10',
                        accent: 'text-warning',
                        items: [
                            { name: 'Spaghetti al dente', temp: '100°C', time: '8-9 min' },
                            { name: 'Risotto', temp: '90°C', time: '18-20 min' },
                            { name: 'Riz basmati', temp: '100°C', time: '12 min' },
                            { name: 'Gnocchis frais', temp: '100°C', time: '3-4 min' },
                            { name: 'Polenta crémeuse', temp: '85°C', time: '25-30 min' },
                        ]
                    }
                ].map((cat, idx) => (
                    <motion.div
                        key={idx}
                        variants={cinematicItem}
                        className="bg-bg-secondary rounded-3xl p-6 border border-border shadow-sm group hover:shadow-xl transition-all duration-500"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cat.bg)}
                            >
                                <span className="text-xl">{cat.icon}</span>
                            </motion.div>
                            <h3 className="font-black text-lg text-text-primary">{cat.title}</h3>
                        </div>
                        <div className="space-y-3">
                            {cat.items.map((item, iIdx) => (
                                <motion.div
                                    key={iIdx}
                                    whileHover={{ x: 5 }}
                                    className="flex items-center justify-between py-3 border-b border-[#F1F3F5] dark:border-border last:border-0"
                                >
                                    <span className="font-bold text-sm text-text-primary">{item.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black", cat.bg, cat.accent)}>{item.temp}</span>
                                        <span className="text-[11px] font-bold text-text-muted">{item.time}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
