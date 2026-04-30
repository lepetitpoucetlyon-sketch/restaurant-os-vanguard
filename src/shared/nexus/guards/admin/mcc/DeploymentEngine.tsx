"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, GitCommit, RefreshCw, ShieldCheck, AlertCircle, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface GitStatus {
    branch: string;
    modifiedCount: number;
    lastCommit: string;
}

export default function DeploymentEngine() {
    const [status, setStatus] = useState<GitStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPushing, setIsPushing] = useState(false);
    const [pushProgress, setPushProgress] = useState(0);
    const [lastResult, setLastResult] = useState<{ success: boolean; msg: string } | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/admin/git/status');
            const data = await res.json();
            if (data.success) {
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch git status');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handlePush = async () => {
        setIsPushing(true);
        setPushProgress(10);
        setLastResult(null);

        try {
            const res = await fetch('/api/admin/git/push', { method: 'POST' });
            const data = await res.json();

            setPushProgress(100);

            if (data.success) {
                setLastResult({ success: true, msg: 'Synchronisation Terminée' });
                await fetchStatus();
            } else {
                setLastResult({ success: false, msg: 'Échec de Synchronisation' });
            }
        } catch (error) {
            setLastResult({ success: false, msg: 'Erreur Réseau' });
        } finally {
            setIsPushing(false);
            setPushProgress(0);
        }
    };

    return (
        <div className="p-6 bg-[#161618] border border-white/5 rounded-3xl relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all pointer-events-none" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <GitBranch className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Deployment Engine</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Source Control Extension</p>
                    </div>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                    status && status.modifiedCount > 0 
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" 
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                    {isLoading ? 'Scanning...' : (status && status.modifiedCount > 0 ? `${status.modifiedCount} Changes` : 'Synced')}
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg-primary/50 border border-white/5 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Active Branch</p>
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-3 h-3 text-indigo-400" />
                            <span className="text-xs font-mono font-bold text-gray-300">{status?.branch || '...'}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-bg-primary/50 border border-white/5 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Master Status</p>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-tighter">Injected</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-bg-primary/30 border border-white/5 rounded-2xl space-y-2">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                        <GitCommit className="w-3 h-3" /> Latest Snapshot
                    </p>
                    <p className="text-[11px] font-medium text-gray-400 italic line-clamp-1">
                        "{status?.lastCommit || 'Waiting for first scan...'}"
                    </p>
                </div>

                {isPushing ? (
                    <div className="space-y-4 py-2">
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${pushProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-indigo-400 animate-pulse uppercase tracking-[0.2em]">Engaging Sync Protocol...</span>
                            <span className="text-[10px] font-mono text-gray-500">{pushProgress}%</span>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={handlePush}
                        disabled={isLoading || status?.modifiedCount === 0}
                        className={cn(
                            "w-full group/btn relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 transform active:scale-[0.98]",
                            status && status.modifiedCount > 0
                                ? "bg-white text-black shadow-xl shadow-white/5 hover:bg-gray-200"
                                : "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                status && status.modifiedCount > 0 ? "bg-black/5" : "bg-white/5"
                            )}>
                                <RefreshCw className={cn("w-4 h-4", isPushing ? "animate-spin" : "")} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.1em]">Engage Global Sync</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                )}

                <AnimatePresence>
                    {lastResult && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border",
                                lastResult.success 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}
                        >
                            {lastResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {lastResult.msg}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
