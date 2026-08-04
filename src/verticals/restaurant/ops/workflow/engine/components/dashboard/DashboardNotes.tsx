import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Cloud } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

export const HandDrawnBorder = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("relative p-6 border-2 border-default rounded-[2rem] bg-surface-card/50 backdrop-blur-sm shadow-sm", className)}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none">
            <motion.path
                d="M 20 0 Q 30 5 100 0 Q 200 -5 300 0 Q 450 5 480 0 L 500 20 Q 495 50 500 100 Q 505 200 500 300 Q 495 450 500 480 L 480 500 Q 450 495 300 500 Q 200 505 100 500 Q 30 495 20 500 L 0 480 Q 5 450 0 300 Q -5 200 0 100 Q 5 30 0 20 Z"
                fill="none"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />
        </svg>
        {children}
    </div>
);

export function DashboardNotes() {
    return (
        <div className="col-span-3 space-y-10">
            <HandDrawnBorder className="bg-surface-card/80">
                <div className="flex items-center gap-3 mb-6">
                    <PenTool className="w-5 h-5 text-brand" />
                    <h3 className="text-lg font-bold">Notes du Jour</h3>
                </div>
                <div className="space-y-4 text-sm text-secondary leading-relaxed italic">
                    <p>• Vérifier le stock de nappage pour le Carré 2.</p>
                    <p>• Le Salon 301 nécessite une Mise en Place VIP.</p>
                    <p>• Prise de poste Brigade à 14h.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-dashed border-subtle">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-muted">
                        <span>Occupation Totale</span>
                        <span>84%</span>
                    </div>
                    <div className="h-1 bg-surface-bg rounded-full mt-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '84%' }}
                            className="h-full bg-action-primary"
                        />
                    </div>
                </div>
            </HandDrawnBorder>

            <div className="p-6 relative overflow-hidden group">
                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-4 -top-4 opacity-10"
                >
                    <Cloud className="w-32 h-32" />
                </motion.div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Météo Locale</h4>
                <div className="flex items-center gap-4">
                    <div className="text-4xl font-black">18°C</div>
                    <div className="text-sm text-secondary italic">Ensoleillé avec quelques nuages</div>
                </div>
            </div>
        </div>
    );
}
