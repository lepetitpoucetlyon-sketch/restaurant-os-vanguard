"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Camera,
    ShieldCheck
} from 'lucide-react';
import { HACCPVisionScanner } from './HACCPVisionScanner';
import { cn } from "@/lib/ui.foundations";;
import { ZONES_CONFIG, CleaningTask } from '../../types';
import { useHygieneLogs, useCreateHygieneLog, useDeleteHygieneLog } from '@nexus/guards/NexusGuardProvider';
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import { BottomSheet } from '@ui/BottomSheet';
import { Button } from '@ui/button';

export function PlanNettoyage() {
    const { data: logs = [] } = useHygieneLogs();
    const { mutateAsync: createLog } = useCreateHygieneLog();
    const { mutateAsync: deleteLog } = useDeleteHygieneLog();
    const { addNotification } = useNotifications();

    const [selectedZoneId, setSelectedZoneId] = useState<string>(ZONES_CONFIG[0].id);
    const [reportingTask, setReportingTask] = useState<{ task: CleaningTask; zoneId: string } | null>(null);
    const [reportNote, setReportNote] = useState('');
    const [activeVisionTask, setActiveVisionTask] = useState<{ id: string; name: string } | null>(null);

    const todaysLogs = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return logs.filter(l => l.createdAt.startsWith(todayStr));
    }, [logs]);

    const handleToggleTask = async (task: CleaningTask, zoneId: string) => {
        const existingLog = todaysLogs.find(l => l.type === 'cleaning' && l.item === task.label && l.zone === zoneId);
        try {
            if (existingLog) {
                await deleteLog(existingLog.id);
            } else {
                await createLog({
                    id: `log_${Date.now()}`,
                    type: 'cleaning',
                    item: task.label,
                    zone: zoneId,
                    status: 'done',
                    user: 'Admin',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }
        } catch (e) {
            console.error(e);
            addNotification({ type: 'critical', title: 'Erreur', message: 'Impossible de mettre à jour la tâche de nettoyage.' });
        }
    };

    const submitReport = async () => {
        if (!reportingTask || !reportNote) return;
        try {
            await createLog({
                id: `log_${Date.now()}_inc`,
                type: 'incident',
                item: reportingTask.task.label,
                zone: reportingTask.zoneId,
                status: 'alert',
                notes: reportNote,
                user: 'Admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            addNotification({ type: 'warning', title: 'Incident consigné', message: 'L\'anomalie a été enregistrée avec succès.' });
        } catch (e) {
            console.error(e);
            addNotification({ type: 'critical', title: 'Erreur', message: 'Impossible de consigner l\'incident.' });
        } finally {
            setReportingTask(null);
            setReportNote('');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[22px] bg-status-success/10 text-status-success flex items-center justify-center shadow-lg shadow-emerald-500/5">
                    <ClipboardCheck size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-primary dark:text-text-primary tracking-tight uppercase">Plan de Nettoyage</h2>
                    <p className="text-[10px] font-black text-muted dark:text-secondary uppercase tracking-widest mt-1">Maintenance sanitaire des zones de production</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {ZONES_CONFIG.map(zone => {
                    const isSelected = selectedZoneId === zone.id;
                    const tasks = zone.tasks;
                    const done = tasks.filter(t => todaysLogs.some(l => l.type === 'cleaning' && l.item === t.label && l.zone === zone.id)).length;
                    const progress = Math.round((done / tasks.length) * 100);

                    return (
                        <button
                            key={zone.id}
                            onClick={() => setSelectedZoneId(zone.id)}
                            className={cn(
                                "p-6 rounded-[32px] border transition-all text-left flex flex-col items-center gap-4 group relative overflow-hidden",
                                isSelected
                                    ? "bg-surface-card dark:bg-bg-secondary border-accent-gold shadow-glow text-accent-gold"
                                    : "bg-bg-primary border-border hover:border-text-primary text-text-muted hover:text-text-primary"
                            )}
                        >
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                {/* Circular Progress */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle
                                        cx="32" cy="32" r="28"
                                        className="stroke-border"
                                        strokeWidth="4"
                                        fill="transparent"
                                    />
                                    <motion.circle
                                        cx="32" cy="32" r="28"
                                        className={cn(isSelected ? "stroke-emerald-500" : "stroke-current")}
                                        strokeWidth="4"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        initial={{ strokeDasharray: 2 * Math.PI * 28, strokeDashoffset: 2 * Math.PI * 28 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - progress / 100) }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className={cn(
                                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                    isSelected ? "bg-status-success/10 text-status-success" : "bg-bg-tertiary text-current"
                                )}>
                                    <zone.icon size={20} />
                                </div>
                            </div>
                            <div className="text-center relative z-10">
                                <h3 className={cn("text-[11px] font-black uppercase tracking-widest leading-tight", isSelected ? "text-text-primary" : "text-text-muted")}>
                                    {zone.label}
                                </h3>
                                <div className="mt-2 text-[10px] font-black text-text-muted tracking-tighter">
                                    {done} / {tasks.length} TÂCHES
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-bg-primary rounded-[32px] border border-border p-6 shadow-sm">
                <div className="space-y-3">
                    {ZONES_CONFIG.find(z => z.id === selectedZoneId)?.tasks.map(task => {
                        const isDone = todaysLogs.some(l => l.type === 'cleaning' && l.item === task.label && l.zone === selectedZoneId);
                        const hasIncident = todaysLogs.some(l => l.type === 'incident' && l.item === task.label && l.zone === selectedZoneId);

                        return (
                            <motion.div
                                key={task.id}
                                whileHover={{ scale: 1.01, x: 5 }}
                                onClick={() => handleToggleTask(task, selectedZoneId)}
                                className={cn(
                                    "group p-4 rounded-2xl border transition-all flex items-center justify-between mb-2 cursor-pointer",
                                    isDone
                                        ? "bg-status-success/5 border-emerald-500/10"
                                        : hasIncident
                                            ? "bg-status-danger/5 border-rose-500/20"
                                            : "bg-bg-tertiary border-border hover:border-text-primary"
                                )}
                            >
                                <div className="flex items-center gap-4 flex-grow">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        isDone
                                            ? "bg-status-success text-text-primary shadow-lg shadow-emerald-500/20"
                                            : "bg-surface-card dark:bg-bg-secondary border border-border text-text-muted group-hover:border-emerald-500/30"
                                    )}>
                                        {isDone ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-md border-2 border-current opacity-20" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className={cn("text-sm font-black transition-colors", isDone ? "text-status-success" : "text-text-primary")}>
                                                {task.label}
                                            </h4>
                                            {isDone && (
                                                <div className="flex items-center gap-1 bg-status-success/10 px-2 py-0.5 rounded-full">
                                                    <ShieldCheck size={10} className="text-status-success" />
                                                    <span className="text-[8px] font-black text-status-success uppercase">Audit IA</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2 py-0.5 rounded-lg border border-border bg-surface-card dark:bg-bg-secondary">
                                                {task.frequency}
                                            </span>
                                            {isDone && (
                                                <span className="text-[9px] font-black uppercase text-status-success/70 flex items-center gap-1">
                                                    <Clock size={10} /> Complété
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {!isDone && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveVisionTask({ id: task.id, name: task.label });
                                            }}
                                            className="w-10 h-10 rounded-xl bg-status-warning/10 text-status-warning flex items-center justify-center hover:bg-status-warning hover:text-text-primary transition-all shadow-lg shadow-amber-500/5 group/vision"
                                        >
                                            <Camera size={18} className="group-hover/vision:scale-110 transition-transform" />
                                        </button>
                                    )}
                                    {hasIncident ? (
                                        <div className="px-3 py-1.5 bg-status-danger/10 border border-rose-500/20 rounded-xl text-[10px] font-black text-status-danger flex items-center gap-2">
                                            <AlertTriangle size={12} />
                                            ANOMALIE SIGNALÉE
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReportingTask({ task, zoneId: selectedZoneId });
                                            }}
                                            className="w-10 h-10 rounded-full border-2 border-rose-500/30 flex items-center justify-center text-status-danger hover:bg-status-danger hover:text-text-primary transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <AlertTriangle size={18} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <BottomSheet
                isOpen={!!reportingTask}
                onClose={() => setReportingTask(null)}
                title="Signaler une Anomalie"
                subtitle={reportingTask?.task.label}
            >
                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Note de l'incident</label>
                        <textarea
                            value={reportNote}
                            onChange={e => setReportNote(e.target.value)}
                            placeholder="Décrivez l'anomalie..."
                            className="w-full h-32 bg-bg-tertiary border border-border rounded-2xl p-4 text-sm font-medium outline-none resize-none focus:border-accent-gold transition-colors"
                        />
                    </div>
                    <Button
                        onClick={submitReport}
                        disabled={!reportNote.trim()}
                        className="w-full h-14 bg-status-danger hover:bg-status-danger text-text-primary rounded-2xl shadow-xl shadow-rose-500/20 font-black tracking-widest uppercase text-[10px] transition-all"
                    >
                        Enregistrer l'anomalie
                    </Button>
                </div>
            </BottomSheet>

            <AnimatePresence>
                {activeVisionTask && (
                    <HACCPVisionScanner 
                        taskId={activeVisionTask.id}
                        taskName={activeVisionTask.name}
                        onClose={() => setActiveVisionTask(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
