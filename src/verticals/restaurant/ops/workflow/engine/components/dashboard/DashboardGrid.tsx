import React from 'react';
import { motion } from 'framer-motion';
import { Key, Home, ArrowRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/ui.foundations";
import { OperationalArea } from './types';

interface DashboardGridProps {
    areas: OperationalArea[];
    selectedArea: OperationalArea | null;
    setSelectedArea: (area: OperationalArea | null) => void;
}

export function DashboardGrid({ areas, selectedArea, setSelectedArea }: DashboardGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {areas.map((area: OperationalArea, idx: number) => (
                <motion.div
                    key={area.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedArea(area)}
                    className={cn(
                        "relative p-8 rounded-[2.5rem] bg-surface-card border border-subtle shadow-sm cursor-pointer group transition-all overflow-hidden",
                        selectedArea?.id === area.id && "ring-2 ring-default border-transparent shadow-2xl"
                    )}
                >
                    {/* Small Sketch Decoration */}
                    <div className="absolute top-4 right-4 text-muted group-hover:text-muted transition-colors">
                        {area.type === 'suite' ? <Key className="w-12 h-12 rotate-45" /> : <Home className="w-12 h-12" />}
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-surface-bg border border-subtle italic">No. {area.number}</span>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                area.status === 'vacant' ? "bg-status-success" :
                                    area.status === 'busy' ? "bg-action-primary" :
                                        area.status === 'maintenance' ? "bg-status-danger" : "bg-status-warning"
                            )} />
                        </div>
                        <h3 className="text-2xl font-black text-primary mb-1 capitalize group-hover:italic transition-all">{area.type}</h3>
                        <p className="text-xs text-muted font-sans font-bold uppercase tracking-wider mb-6">{area?.status}</p>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] text-muted font-sans font-bold uppercase tracking-widest mb-1 italic">Tarif / Service</p>
                                <p className="text-xl font-sans font-black">€{area.price}</p>
                            </div>
                            <button className="w-10 h-10 rounded-2xl bg-surface-sidebar text-text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-lg">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Hand-drawn style decorative element */}
                    <motion.div
                        className="absolute bottom-0 left-0 h-1 bg-surface-sidebar"
                        initial={{ width: 0 }}
                        whileHover={{ width: '100%' }}
                    />
                </motion.div>
            ))}

            <button
                onClick={() => toast.info("Gérez vos unités depuis Admin → Paramètres → Plan de salle")}
                className="border-2 border-dashed border-default rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-default hover:bg-surface-bg transition-all min-h-[220px] group"
            >
                <div className="w-12 h-12 rounded-full bg-surface-bg flex items-center justify-center text-muted group-hover:bg-surface-sidebar group-hover:text-text-primary transition-all">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-muted group-hover:text-primary">Ajouter une Unité</span>
            </button>
        </div>
    );
}
