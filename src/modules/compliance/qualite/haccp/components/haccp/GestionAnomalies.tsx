"use client";

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    ShieldAlert,
    Filter
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";;
import { useHygieneLogs, useUpdateHygieneLog } from '@nexus/guards/NexusGuardProvider';
import { useNotifications } from '@/shared/hooks';

export function GestionAnomalies() {
    const { data: logs = [] } = useHygieneLogs();
    const { mutateAsync: updateLog } = useUpdateHygieneLog();
    const { addNotification } = useNotifications();

    const incidentLogs = useMemo(() => {
        return logs.filter(l => l.type === 'incident' || l.status === 'alert').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [logs]);

    const activeAlerts = incidentLogs.filter(l => l.status === 'alert');
    const resolvedAlerts = incidentLogs.filter(l => l.status === 'done' || l.status === 'ok');

    const handleResolve = async (id: string) => {
        try {
            await updateLog(id, { status: 'done', notes: 'Résolu par l\'administrateur' });
            addNotification({ type: 'success', title: 'Anomalie résolue', message: 'L\'incident a été archivé dans le registre de conformité.' });
        } catch (e) {
            console.error(e);
            addNotification({ type: 'critical', title: 'Erreur', message: 'Impossible de résoudre l\'anomalie.' });
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[22px] bg-status-danger/10 text-status-danger flex items-center justify-center shadow-lg shadow-rose-500/5 relative">
                        <ShieldAlert size={24} />
                        {activeAlerts.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-status-danger rounded-full border-2 border-white dark:border-bg-primary animate-pulse" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-primary dark:text-text-primary tracking-tight uppercase">Registre des Anomalies</h2>
                        <p className="text-[10px] font-black text-muted dark:text-secondary uppercase tracking-widest mt-1">Actions Correctives & Déviations</p>
                    </div>
                </div>

                <div className="flex bg-bg-tertiary rounded-full p-1 border border-border">
                    <div className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-surface-card dark:bg-bg-secondary shadow-sm text-text-primary flex items-center gap-2">
                        <Filter size={12} />
                        Tous les Incidents
                    </div>
                </div>
            </div>

            {activeAlerts.length > 0 && (
                <div className="space-y-4 mb-10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-status-danger px-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
                        Incidents Actifs ({activeAlerts.length})
                    </h3>
                    <AnimatePresence>
                        {activeAlerts.map((incident, idx) => (
                            <motion.div
                                key={incident.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-status-danger/5 rounded-[32px] border border-rose-500/20 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-[20px] bg-status-danger/10 flex items-center justify-center text-status-danger shrink-0">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-serif italic font-black text-status-danger">{incident.item}</h4>
                                        <p className="text-sm font-medium text-text-primary mt-1">{incident.notes || 'Déviation détectée sans description.'}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-[9px] font-black uppercase text-status-danger flex items-center gap-1 bg-surface-card dark:bg-bg-primary px-2 py-0.5 rounded border border-rose-500/20">
                                                <AlertTriangle size={10} /> {incident.zone}
                                            </span>
                                            <span className="text-[9px] font-black uppercase text-text-muted flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(incident.createdAt).toLocaleString('fr-FR', {
                                                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleResolve(incident.id)}
                                    className="w-full md:w-auto h-12 px-6 rounded-[20px] bg-status-success text-text-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} />
                                    Signaler comme Résolu
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-muted px-2">
                    Historique de Conformité
                </h3>
                {resolvedAlerts.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-[32px] bg-bg-primary/50 text-center px-4">
                        <CheckCircle2 size={48} className="text-status-success/30 mb-4" />
                        <h3 className="text-xl font-serif italic text-status-success mb-1">Aucune anomalie enregistrée</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">L'intégrité de vos processus est de 100%.</p>
                    </div>
                ) : (
                    <div className="bg-bg-primary border border-border rounded-[32px] overflow-hidden">
                        {resolvedAlerts.map((incident, idx) => (
                            <div
                                key={incident.id}
                                className={cn(
                                    "p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-bg-tertiary",
                                    idx !== resolvedAlerts.length - 1 && "border-b border-border"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-status-success/10 text-status-success flex items-center justify-center">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-text-primary">{incident.item}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{incident.zone}</span>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                                {new Date(incident.createdAt).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-bg-tertiary px-3 py-1 rounded-full border border-border">
                                    Action Corrective Appliquée
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
