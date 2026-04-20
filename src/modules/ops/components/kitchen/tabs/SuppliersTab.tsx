
"use client";

import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cinematicContainer, fadeInUp, cinematicItem } from "@/lib/motion";

export function SuppliersTab() {
    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-full"
        >
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-serif font-semibold text-text-primary tracking-tight">Réseau Fournisseurs</h2>
                    <p className="text-text-muted text-[13px] mt-2 font-medium">Gestion du catalogue partenaires et pilotage de la chaîne logistique</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="btn-elegant-primary h-12 px-8 shadow-lg shadow-accent/10">
                        <Truck strokeWidth={1.5} className="w-4 h-4 mr-3" />
                        Nouveau Partenaire
                    </Button>
                </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { name: 'Rungis Express', category: 'Fruits & Légumes', contact: '01 45 67 89 00', email: 'contact@rungis.fr', rating: 4.8, color: '#C5A059' },
                    { name: 'Boucherie Dupont', category: 'Viandes d\'Origine', contact: '01 23 45 67 89', email: 'pro@dupont.fr', rating: 4.5, color: '#FF4D4D' },
                    { name: 'Marée Fraîche', category: 'Poissons & Crustacés', contact: '01 98 76 54 32', email: 'commande@maree.fr', rating: 4.9, color: '#007AFF' },
                    { name: 'Laiterie Bio', category: 'Produits Laitiers', contact: '01 11 22 33 44', email: 'bio@laiterie.fr', rating: 4.3, color: '#FF9500' },
                    { name: 'Épicerie Fine', category: 'Épicerie & Condiments', contact: '01 55 66 77 88', email: 'fine@epicerie.fr', rating: 4.7, color: '#9B59B6' },
                    { name: 'Caves du Terroir', category: 'Vins & Spiritueux', contact: '01 99 88 77 66', email: 'caves@terroir.fr', rating: 4.6, color: '#1A1A1A' },
                ].map((supplier, idx) => (
                    <motion.div
                        key={idx}
                        variants={cinematicItem}
                        whileHover={{ y: -5 }}
                        className="group bg-bg-secondary rounded-xl p-8 border border-border shadow-sm hover:shadow-2xl dark:shadow-none transition-all duration-500 cursor-pointer overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-bg-tertiary dark:bg-bg-tertiary/50 -mr-12 -mt-12 rounded-full opacity-50 group-hover:scale-150 transition-all duration-700" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.8 }}
                                className="w-14 h-14 rounded-lg flex items-center justify-center border border-border bg-bg-tertiary dark:bg-bg-tertiary/50 group-hover:bg-accent group-hover:text-white transition-all duration-300 shadow-inner"
                            >
                                <Truck strokeWidth={1.5} className="w-7 h-7" style={{ color: supplier.color }} />
                            </motion.div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-white shadow-xl shadow-accent/20">
                                <span className="text-[12px]">★</span>
                                <span className="text-[11px] font-mono leading-none">{supplier.rating}</span>
                            </div>
                        </div>
                        <h3 className="font-serif font-semibold text-xl text-text-primary mb-2 group-hover:text-accent transition-colors">{supplier.name}</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-8">{supplier.category}</p>
                        <div className="space-y-4 text-[13px] relative z-10">
                            <div className="flex items-center gap-3 text-text-muted group-hover:text-text-primary transition-colors">
                                <span className="opacity-60 text-base">📞</span>
                                <span className="font-medium tracking-tight">{supplier.contact}</span>
                            </div>
                            <div className="flex items-center gap-3 text-text-muted group-hover:text-text-primary transition-colors">
                                <span className="opacity-60 text-base">✉️</span>
                                <span className="font-medium tracking-tight break-all">{supplier.email}</span>
                            </div>
                        </div>
                        <Button className="w-full mt-8 h-12 bg-bg-tertiary dark:bg-bg-tertiary/50 hover:bg-accent text-text-primary hover:text-white rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all duration-300 border border-border/50 group-hover:border-accent">
                            Catalogue & Tarifs
                        </Button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
