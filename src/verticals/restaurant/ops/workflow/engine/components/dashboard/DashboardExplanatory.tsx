import React from 'react';
import { motion } from 'framer-motion';
import { User, Layers, Home, TrendingUp } from 'lucide-react';

const ExplanatoryCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-8 bg-surface-card rounded-[2.5rem] border border-subtle shadow-sm group relative overflow-hidden"
    >
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-24 h-24 rotate-12" />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-surface-bg flex items-center justify-center mb-6 group-hover:bg-surface-sidebar group-hover:text-text-primary transition-colors">
            <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-black italic mb-3">{title}</h4>
        <p className="text-xs text-muted leading-relaxed font-sans">{description}</p>

        {/* Sketch Simulation - Decorative Line */}
        <motion.div
            className="absolute bottom-6 left-8 right-8 h-[1px] bg-surface-bg"
            whileHover={{ backgroundColor: '#000' }}
        />
    </motion.div>
);

export function DashboardExplanatory() {
    return (
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-subtle">
            <h3 className="text-2xl font-black italic mb-10 tracking-tight">Dessins Explicatifs des Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <ExplanatoryCard
                    title="Flux d'Arrivée"
                    description="Parcours client digitalisé de la réservation à l'accueil à table."
                    icon={User}
                />
                <ExplanatoryCard
                    title="Smart Mise en Place"
                    description="Affectation dynamique des tâches selon l'affluence réelle."
                    icon={Layers}
                />
                <ExplanatoryCard
                    title="Multi-Site Sync"
                    description="Synchronisation multi-site pour les groupes de restauration."
                    icon={Home}
                />
                <ExplanatoryCard
                    title="Yield Manager"
                    description="Algorithme de yield management pour optimiser la rentabilité."
                    icon={TrendingUp}
                />
            </div>
        </div>
    );
}
