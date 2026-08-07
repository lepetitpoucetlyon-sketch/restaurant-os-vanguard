'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function ClinicDashboard() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 h-full min-h-screen bg-bg-primary"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-4xl font-serif font-black text-text-primary tracking-tight">Clinic Operations</h1>
                    <p className="text-text-muted mt-2 text-lg">Health OS (Sovereign Grade X)</p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-3xl bg-bg-primary/80 backdrop-blur-3xl border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-lg font-bold text-text-muted uppercase tracking-widest">Salle d'Attente</h2>
                        <p className="text-5xl font-black text-accent mt-4">8</p>
                        <p className="text-sm text-text-muted mt-2">Patients en attente</p>
                    </motion.div>
                    
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-3xl bg-bg-primary/80 backdrop-blur-3xl border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-lg font-bold text-text-muted uppercase tracking-widest">Urgences</h2>
                        <p className="text-5xl font-black text-status-error mt-4">1</p>
                        <p className="text-sm text-text-muted mt-2">Cas prioritaires</p>
                    </motion.div>
                    
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-3xl bg-bg-primary/80 backdrop-blur-3xl border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-lg font-bold text-text-muted uppercase tracking-widest">Consultations</h2>
                        <p className="text-5xl font-black text-status-success mt-4">32</p>
                        <p className="text-sm text-text-muted mt-2">Rendez-vous prévus</p>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
