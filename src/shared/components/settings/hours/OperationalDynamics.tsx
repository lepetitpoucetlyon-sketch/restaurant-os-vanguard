"use client";

import { motion, Variants } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { ServiceSettings } from "@nexus/contracts";

interface OperationalDynamicsProps {
    service: ServiceSettings;
    onChange: (updates: Partial<ServiceSettings>) => void;
}

const cinematicItem: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
};

export function OperationalDynamics({ service, onChange }: OperationalDynamicsProps) {
    const items = [
        { label: 'Durée Moyenne Midi', key: 'avgMealDurationLunch', value: service.avgMealDurationLunch },
        { label: 'Durée Moyenne Soir', key: 'avgMealDurationDinner', value: service.avgMealDurationDinner },
        { label: 'Dernière Arrivée Autorisée', key: 'lastArrivalBeforeClose', value: service.lastArrivalBeforeClose },
    ];

    return (
        <motion.div
            variants={cinematicItem}
            className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
        >
            <div className="flex items-center gap-4 mb-10">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    className="w-14 h-14 rounded-2xl bg-surface-card dark:bg-surface-card/5 flex items-center justify-center border border-black/5 dark:border-subtle text-accent shadow-premium"
                >
                    <ShieldAlert className="w-7 h-7" />
                </motion.div>
                <div>
                    <h3 className="text-3xl font-serif text-text-primary uppercase tracking-tighter italic">
                        Vélocités Opérationnelles
                    </h3>
                    <p className="text-nano font-black text-text-muted uppercase tracking-[0.4em] ml-1">Optimisation des Flux & Marges de Sécurité</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                    <div key={item.key} className="space-y-3">
                        <label className="block text-nano font-bold text-text-muted uppercase tracking-[0.2em] px-1">
                            {item.label}
                        </label>
                        <div className="relative group/input">
                            <input
                                type="number"
                                value={item.value}
                                onChange={(e) => onChange({ [item.key]: Number(e.target.value) })}
                                className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif italic outline-none text-xl shadow-sm focus:border-accent/50 transition-colors"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-nano font-bold text-text-muted uppercase">Minutes</span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
