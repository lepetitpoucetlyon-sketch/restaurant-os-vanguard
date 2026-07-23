import React from 'react';
import { motion } from 'framer-motion';
import { Link2, Search, BarChart3, MapPin } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

export const SettingsTab = () => {
    return (
        <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="p-8 rounded-[2.5rem] bg-bg-secondary border border-border">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Intégrations</h3>
                </div>
                <div className="space-y-4">
                    {[
                        { name: 'Google Search Console', desc: 'Suivi des performances de recherche', icon: Search, connected: true },
                        { name: 'Google Analytics 4', desc: 'Analyse du trafic web', icon: BarChart3, connected: true },
                        { name: 'Google Business Profile', desc: 'Présence locale et avis', icon: MapPin, connected: true }
                    ].map((integration, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-bg-tertiary border border-border hover:border-text-muted/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center">
                                    <integration.icon className="w-5 h-5 text-text-muted" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary">{integration.name}</p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-widest">{integration.desc}</p>
                                </div>
                            </div>
                            <span className={cn(
                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                integration.connected
                                    ? "bg-[#00D9A6]/10 text-[#00D9A6] border-[#00D9A6]/20"
                                    : "bg-bg-tertiary text-text-muted border-border"
                            )}>
                                {integration.connected ? 'Connecté' : 'Non configuré'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
