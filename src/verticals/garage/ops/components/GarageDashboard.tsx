'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function GarageDashboard() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 h-full min-h-screen bg-bg-primary"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-4xl font-serif font-black text-text-primary tracking-tight">Garage Operations</h1>
                    <p className="text-text-muted mt-2 text-lg">Auto OS (Sovereign Grade X)</p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-3xl bg-bg-primary/80 backdrop-blur-3xl border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-lg font-bold text-text-muted uppercase tracking-widest">En Réparation</h2>
                        <p className="text-5xl font-black text-accent mt-4">14</p>
                        <p className="text-sm text-text-muted mt-2">Véhicules dans l'atelier</p>
                    </motion.div>
                    
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-3xl bg-bg-primary/80 backdrop-blur-3xl border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-lg font-bold text-text-muted uppercase tracking-widest">Pièces Manquantes</h2>
                        <p className="text-5xl font-black text-status-warning mt-4">3</p>
                        <p className="text-sm text-text-muted mt-2">Références en rupture</p>
                    </motion.div>
                    
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-3xl bg-bg-primary/80 backdrop-blur-3xl border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-lg font-bold text-text-muted uppercase tracking-widest">Devis Validés</h2>
                        <p className="text-5xl font-black text-status-success mt-4">7</p>
                        <p className="text-sm text-text-muted mt-2">Aujourd'hui</p>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
