"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Thermometer, Activity } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// --- Compliance View ---

interface ComplianceAlert {
    id: string;
    userName: string;
    message: string;
}

export const ComplianceView: React.FC<{ alerts: ComplianceAlert[] }> = ({ alerts }) => {
    const router = useRouter();
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <div className="bg-error/10 p-6 rounded-[2.5rem] border border-error/20 flex items-center gap-4">
                <AlertTriangle className="w-10 h-10 text-error" />
                <div>
                    <h3 className="text-xl font-serif font-black italic text-error">Anomalie Convention</h3>
                    <p className="text-[9px] font-black uppercase opacity-60 text-text-muted">Réajustement légal requis</p>
                </div>
            </div>
            <div className="space-y-3">
                {alerts.map(alert => (
                    <div key={alert.id} className="bg-white dark:bg-bg-secondary p-6 rounded-[2.5rem] border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-serif font-bold italic text-text-primary">{alert.userName}</h4>
                            <div className="px-2 py-0.5 bg-error text-white text-[7px] font-black uppercase rounded-full">Violation</div>
                        </div>
                        <p className="text-xs text-text-muted mb-4 leading-relaxed">{alert.message}</p>
                        <Button 
                            className="w-full h-11 bg-bg-tertiary text-text-primary rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-bg-primary transition-colors" 
                            onClick={() => router.push('/planning')}
                        >
                            Corriger au Planning
                        </Button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// --- IoT View ---

interface IoTMetric {
    id: string;
    name: string;
    value: number;
    type: 'temperature' | 'hz';
    anomalous: boolean;
}

export const IoTView: React.FC<{ metrics: IoTMetric[] }> = ({ metrics }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-2 gap-4">
                {metrics.map(m => (
                    <div key={m.id} className="bg-white dark:bg-bg-secondary p-6 rounded-[2.5rem] border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.anomalous ? "bg-error/10 text-error" : "bg-success/10 text-success")}>
                                {m.type === 'temperature' ? <Thermometer className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest truncate text-text-primary">{m.name}</span>
                        </div>
                        <div className="text-3xl font-serif font-black italic text-text-primary">
                            {m.value}{m.type === 'temperature' ? '°' : 'Hz'}
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-text-primary p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/20 blur-[60px]" />
                <h3 className="text-2xl font-serif italic font-black mb-2">Moteur Prédictif</h3>
                <p className="text-sm opacity-60 font-light mb-6 leading-relaxed">
                    Oracle détecte une usure prématurée sur le groupe froid n°4. Maintenance préventive suggérée pour éviter une rupture de chaîne du froid.
                </p>
                <Button className="w-full h-14 bg-accent-gold text-bg-primary rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-colors">
                    Planifier Technicien
                </Button>
            </div>
        </motion.div>
    );
};
