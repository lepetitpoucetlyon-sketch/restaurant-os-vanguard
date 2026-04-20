"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Droplet, 
    FlaskConical, 
    RefreshCcw, 
    History, 
    CheckCircle2, 
    AlertCircle, 
    Trash2,
    Calendar,
    User,
    ChevronRight,
    Search
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";;
import { useOilLogs, useCreateOilLog } from '@/engines/guard/NexusGuardProvider';
import { useNotifications } from '@/context/NotificationsContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function GestionHuiles() {
    const { data: logs = [] } = useOilLogs();
    const { mutateAsync: createLog } = useCreateOilLog();
    const { addNotification } = useNotifications();

    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        fryerName: 'Friteuse A',
        tpomValue: 12.5,
        action: 'control' as 'control' | 'fitering' | 'changing',
        status: 'ok' as 'ok' | 'warning' | 'critical',
        user: 'Chef Paul'
    });

    const getStatusFromTPOM = (value: number): 'ok' | 'warning' | 'critical' => {
        if (value < 19) return 'ok';
        if (value < 25) return 'warning';
        return 'critical';
    };

    const handleTPOMChange = (value: number) => {
        const status = getStatusFromTPOM(value);
        setFormData({ ...formData, tpomValue: value, status });
    };

    const handleSubmit = async () => {
        try {
            await createLog(formData);
            addNotification({ 
                type: formData.status === 'ok' ? 'success' : 'warning', 
                title: 'Contrôle Huile', 
                message: `Le relevé pour ${formData.fryerName} a été enregistré.` 
            });
            setIsAdding(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[22px] bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/5">
                        <Droplet size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Gestion des Huiles</h2>
                        <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Suivi des composés polaires (TPOM)</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdding(true)}
                    className="h-12 px-6 rounded-[24px] bg-text-primary text-bg-primary font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2"
                >
                    <FlaskConical size={16} />
                    Mesurer TPOM
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {['Friteuse A', 'Friteuse B', 'Friteuse C', 'Pôele à Frire'].map((fryer) => {
                    const lastLog = logs.find(l => l.fryerName === fryer);
                    return (
                        <motion.div
                            key={fryer}
                            whileHover={{ y: -5 }}
                            className="bg-bg-primary rounded-[32px] border border-border p-6 shadow-sm overflow-hidden relative group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[30px] -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors" />
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center border border-border">
                                    <Droplet size={18} className="text-amber-500" />
                                </div>
                                {lastLog ? (
                                    <StatusBadge status={lastLog.status === 'ok' ? 'success' : lastLog.status === 'warning' ? 'warning' : 'error'} label={lastLog.status} />
                                ) : (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Aucun Relevé</span>
                                )}
                            </div>

                            <h3 className="text-md font-serif italic font-black text-text-primary mb-1">{fryer}</h3>
                            <div className="text-[14px] font-black text-text-muted">
                                {lastLog ? `${lastLog.tpomValue}% TPOM` : '--%'}
                            </div>

                            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-text-muted">
                                <span>{lastLog ? new Date(lastLog.createdAt).toLocaleDateString() : 'Première utilisation'}</span>
                                <ChevronRight size={12} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="bg-bg-primary rounded-[40px] border border-border overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History size={18} className="text-text-muted" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-text-primary italic">Historique des Interventions</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-bg-tertiary px-4 py-2 rounded-full border border-border">
                        <Search size={14} className="text-text-muted" />
                        <input type="text" placeholder="Filtrer..." className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-24" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-bg-tertiary/50">
                                <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Date</th>
                                <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Équipement</th>
                                <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Valeur</th>
                                <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Action</th>
                                <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Par</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-bg-secondary/50 transition-colors">
                                    <td className="px-8 py-5 text-[11px] font-black text-text-primary">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                                    <td className="px-8 py-5 text-[11px] font-serif italic font-black text-text-primary">{log.fryerName}</td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "text-xs font-black px-2 py-1 rounded-lg",
                                            log.status === 'ok' ? "bg-emerald-500/10 text-emerald-600" :
                                            log.status === 'warning' ? "bg-amber-500/10 text-amber-600" :
                                            "bg-rose-500/10 text-rose-600"
                                        )}>
                                            {log.tpomValue}%
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-text-muted">
                                            {log.action === 'changing' && <RefreshCcw size={12} className="text-blue-500" />}
                                            {log.action === 'changing' ? 'Renouvellement' : log.action === 'fitering' ? 'Filtration' : 'Contrôle Simple'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-[10px] font-black uppercase text-text-muted">{log.user}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-muted italic text-sm">
                                        Aucun historique disponible
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BottomSheet
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                title="Contrôle de l'Huile"
                subtitle="Mesure des composés polaires et maintenance"
            >
                <div className="space-y-6 pt-4 pb-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Équipement</label>
                        <select 
                            value={formData.fryerName}
                            onChange={(e) => setFormData({ ...formData, fryerName: e.target.value })}
                            className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-black outline-none focus:border-accent-gold appearance-none"
                        >
                            <option>Friteuse A</option>
                            <option>Friteuse B</option>
                            <option>Friteuse C</option>
                            <option>Pôele à Frire</option>
                        </select>
                    </div>

                    <div className="space-y-4 px-1">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Taux de Composés Polaires (%)</label>
                            <span className={cn(
                                "text-2xl font-black italic font-serif",
                                formData.status === 'ok' ? "text-emerald-500" :
                                formData.status === 'warning' ? "text-amber-500" :
                                "text-rose-500"
                            )}>
                                {formData.tpomValue}%
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="40" 
                            step="0.5"
                            value={formData.tpomValue}
                            onChange={(e) => handleTPOMChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-gold"
                        />
                        <div className="flex justify-between text-[8px] font-black text-text-muted uppercase tracking-tighter">
                            <span className="text-emerald-500">CONFORME (&lt;19%)</span>
                            <span className="text-amber-500">LIMITE (19-25%)</span>
                            <span className="text-rose-500">CRITIQUE (&gt;25%)</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 text-center">Action Effectuée</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['control', 'fitering', 'changing'] as const).map((action) => (
                                <button
                                    key={action}
                                    onClick={() => setFormData({ ...formData, action })}
                                    className={cn(
                                        "h-14 rounded-2xl border transition-all text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1",
                                        formData.action === action
                                            ? "bg-accent-gold/10 border-accent-gold text-accent-gold" 
                                            : "bg-bg-tertiary border-border text-text-muted"
                                    )}
                                >
                                    {action === 'control' && <FlaskConical size={14} />}
                                    {action === 'fitering' && <Search size={14} />}
                                    {action === 'changing' && <RefreshCcw size={14} />}
                                    {action === 'control' ? 'Contrôle' : action === 'fitering' ? 'Filtrage' : 'Vidange'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        className="w-full h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl transition-all bg-amber-500 text-white hover:bg-amber-600 border border-amber-500/20"
                    >
                        Valider l'Intervention
                    </Button>
                </div>
            </BottomSheet>
        </div>
    );
}
