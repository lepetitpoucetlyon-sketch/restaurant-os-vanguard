"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Thermometer,
    Snowflake,
    Flame,
    History,
    CheckCircle2,
    AlertTriangle,
    Minus,
    Plus
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";;
import { EQUIPMENT_CONFIG, EquipmentConfig } from '@modules/compliance/haccp/types';
import { useHygieneLogs, useCreateHygieneLog } from '@nexus/guards/NexusGuardProvider';
import { useNotifications } from '@/context/NotificationsContext';
import { BottomSheet } from '@ui/BottomSheet';
import { Button } from '@ui/button';

export function ReleveTemperatures() {
    const { data: logs = [] } = useHygieneLogs();
    const { mutateAsync: createLog } = useCreateHygieneLog();
    const { addNotification } = useNotifications();

    const [recordingEq, setRecordingEq] = useState<EquipmentConfig | null>(null);
    const [tempValue, setTempValue] = useState<number>(0);

    const todaysLogs = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return logs.filter(l => l.createdAt.startsWith(todayStr) && l.type === 'temperature');
    }, [logs]);

    const handleOpenRecord = (eq: EquipmentConfig) => {
        setRecordingEq(eq);
        // Preset with median of allowed range or last recorded
        const lastLog = todaysLogs.find(l => l.item === eq.id);
        if (lastLog && lastLog.value) {
            setTempValue(parseFloat(lastLog.value));
        } else {
            setTempValue(Math.round((eq.min + eq.max) / 2));
        }
    };

    const submitRecord = async () => {
        if (!recordingEq) return;
        const isAlert = tempValue < recordingEq.min || tempValue > recordingEq.max;

        try {
            await createLog({
                id: `temp_${Date.now()}`,
                type: 'temperature',
                item: recordingEq.id,
                zone: recordingEq.zone,
                value: tempValue.toString(),
                status: isAlert ? 'alert' : 'ok',
                user: 'Admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            if (isAlert) {
                addNotification({ type: 'critical', title: 'Température Anormale', message: `Alerte de température sur ${recordingEq.label}.` });
            } else {
                addNotification({ type: 'success', title: 'Relevé enregistré', message: `Température de ${recordingEq.label} validée.` });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRecordingEq(null);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[22px] bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/5">
                    <Thermometer size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Relevé de Température</h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Surveillance continue des enceintes thermiques</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EQUIPMENT_CONFIG.map(eq => {
                    const eqLogs = todaysLogs.filter(l => l.item === eq.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    const lastLog = eqLogs[0];
                    const isAlert = lastLog?.status === 'alert';

                    return (
                        <div key={eq.id} className="bg-bg-primary rounded-[32px] border border-border p-6 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                    eq.max < 0 ? "bg-cyan-500/10 text-cyan-500" : eq.min > 10 ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                                )}>
                                    {eq.max < 0 ? <Snowflake size={24} /> : eq.min > 10 ? <Flame size={24} /> : <Thermometer size={24} />}
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Dernier Relevé</div>
                                    <div className={cn(
                                        "text-2xl font-serif italic font-black",
                                        !lastLog ? "text-text-muted" : isAlert ? "text-rose-500" : "text-emerald-500"
                                    )}>
                                        {lastLog ? `${lastLog.value}°C` : '--'}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight mb-1">{eq.label}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-2 py-0.5 rounded-md bg-bg-tertiary border border-border text-[9px] font-black uppercase text-text-muted">
                                    Zone: <span className="text-text-primary">{eq.zone}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-bg-tertiary border border-border text-[9px] font-black uppercase text-text-muted">
                                    Plage: <span className="text-text-primary">{eq.min}° à {eq.max}°</span>
                                </span>
                            </div>

                            <Button
                                onClick={() => handleOpenRecord(eq)}
                                className={cn(
                                    "w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                    !lastLog
                                        ? "bg-text-primary text-bg-primary hover:scale-[1.02] shadow-xl"
                                        : "bg-bg-tertiary text-text-primary border border-border hover:border-text-primary"
                                )}
                            >
                                {lastLog ? 'Nouveau Relevé' : 'Effectuer le Relevé'}
                            </Button>

                            {/* Alert Indicator */}
                            {isAlert && (
                                <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
                            )}
                        </div>
                    );
                })}
            </div>

            <BottomSheet
                isOpen={!!recordingEq}
                onClose={() => setRecordingEq(null)}
                title="Saisie Thermique"
                subtitle={recordingEq?.label}
            >
                {recordingEq && (
                    <div className="space-y-8 pt-4 pb-6">
                        <div className="flex justify-between items-center px-4">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Plage Conforme</span>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{recordingEq.min}°C à {recordingEq.max}°C</span>
                        </div>

                        <div className="flex items-center justify-center gap-8 py-8">
                            <button
                                onClick={() => setTempValue(prev => prev - 0.5)}
                                className="w-16 h-16 rounded-[24px] bg-bg-tertiary border border-border flex items-center justify-center text-text-muted hover:bg-bg-primary hover:text-text-primary hover:border-text-primary transition-all active:scale-95 shadow-sm"
                            >
                                <Minus size={24} />
                            </button>
                            <div className="text-center w-32 relative">
                                <span className={cn(
                                    "text-6xl font-serif font-black italic tracking-tighter transition-colors",
                                    (tempValue < recordingEq.min || tempValue > recordingEq.max) ? "text-rose-500" : "text-text-primary"
                                )}>
                                    {tempValue.toFixed(1)}
                                </span>
                                <span className="absolute top-0 -right-2 text-2xl font-black text-text-muted">°</span>
                            </div>
                            <button
                                onClick={() => setTempValue(prev => prev + 0.5)}
                                className="w-16 h-16 rounded-[24px] bg-bg-tertiary border border-border flex items-center justify-center text-text-muted hover:bg-bg-primary hover:text-text-primary hover:border-text-primary transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        {(tempValue < recordingEq.min || tempValue > recordingEq.max) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3"
                            >
                                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                                <div>
                                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Alerte de Non-Conformité</h4>
                                    <p className="text-xs font-medium text-rose-500/80 mt-1">La température saisie est hors des limites acceptables. Cet incident nécessitera une action corrective.</p>
                                </div>
                            </motion.div>
                        )}

                        <Button
                            onClick={submitRecord}
                            className={cn(
                                "w-full h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all",
                                (tempValue < recordingEq.min || tempValue > recordingEq.max)
                                    ? "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600"
                                    : "bg-text-primary text-bg-primary"
                            )}
                        >
                            {(tempValue < recordingEq.min || tempValue > recordingEq.max) ? "Consigner l'Anomalie" : "Valider le Relevé"}
                        </Button>
                    </div>
                )}
            </BottomSheet>
        </div>
    );
}
