"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, GitCommit, RefreshCw, ShieldCheck, AlertCircle, ChevronRight, CheckCircle2, Brain, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { logger } from '@/lib/logger';
import { authedFetch } from '@/lib/client/authedFetch';

interface GitStatus {
    branch: string;
    modifiedCount: number;
    lastCommit: string;
}

interface RagHealth {
    status: 'online' | 'offline' | 'error';
    version?: string;
    documentCount?: number;
    latencyMs: number;
}

export function DeploymentEngine() {
    const [status, setStatus] = useState<GitStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPushing, setIsPushing] = useState(false);
    const [pushProgress, setPushProgress] = useState(0);
    const [lastResult, setLastResult] = useState<{ success: boolean; msg: string } | null>(null);

    // ── Sovereign RAG state ──────────────────────────────────────────────────
    const [ragHealth, setRagHealth] = useState<RagHealth | null>(null);
    const [isRagIndexing, setIsRagIndexing] = useState(false);
    const [ragResult, setRagResult] = useState<{ success: boolean; msg: string } | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await authedFetch('/api/admin/git/status');
            const data = await res.json();
            if (data.success) {
                setStatus(data);
            }
        } catch (error) {
            logger.warn('[DeploymentEngine] Failed to fetch git status', String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRagHealth = async () => {
        try {
            const res = await authedFetch('/api/admin/fleet/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'health' }),
            });
            const data = await res.json();
            if (data.success) setRagHealth(data.health as RagHealth);
        } catch (error) {
            logger.warn('[DeploymentEngine] RAG health check failed', String(error));
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchRagHealth();
        const interval = setInterval(fetchStatus, 30000);
        const ragInterval = setInterval(fetchRagHealth, 60000);
        return () => { clearInterval(interval); clearInterval(ragInterval); };
    }, []);

    const handleRagReindexFleet = async () => {
        setIsRagIndexing(true);
        setRagResult(null);
        try {
            const res = await authedFetch('/api/admin/fleet/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'push_version' }),
            });
            const data = await res.json();
            setRagResult({ success: data.success, msg: data.success ? 'Réindexation lancée sur la flotte' : 'Échec de réindexation' });
        } catch {
            setRagResult({ success: false, msg: 'Erreur réseau' });
        } finally {
            setIsRagIndexing(false);
            await fetchRagHealth();
        }
    };

    const handlePush = async () => {
        setIsPushing(true);
        setPushProgress(10);
        setLastResult(null);

        const steps = [30, 60, 90];
        const stepTimers = steps.map((pct, i) =>
            setTimeout(() => setPushProgress(pct), (i + 1) * 800),
        );

        try {
            const res = await authedFetch('/api/admin/git/push', { method: 'POST' });
            const data = await res.json();

            stepTimers.forEach(clearTimeout);
            setPushProgress(100);

            if (data.success) {
                setLastResult({ success: true, msg: 'Synchronisation Terminée' });
                await fetchStatus();
            } else {
                setLastResult({ success: false, msg: 'Échec de Synchronisation' });
            }
        } catch (_error) {
            stepTimers.forEach(clearTimeout);
            setLastResult({ success: false, msg: 'Erreur Réseau' });
        } finally {
            setIsPushing(false);
            setPushProgress(0);
        }
    };

    return (
        <div className="p-6 bg-surface-card border border-border-subtle rounded-3xl relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-action-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-action-primary/10 transition-all pointer-events-none" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-action-primary/10 flex items-center justify-center border border-focus/20">
                        <GitBranch className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Moteur de Déploiement</h3>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Extension Contrôle Source</p>
                    </div>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                    status && status.modifiedCount > 0 
                        ? "bg-status-warning/10 text-status-warning border-action-primary/20 animate-pulse" 
                        : "bg-status-success/10 text-status-success border-emerald-500/20"
                )}>
                    {isLoading ? 'Analyse...' : (status && status.modifiedCount > 0 ? `${status.modifiedCount} Modifications` : 'Synchronisé')}
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg-primary/50 border border-border-subtle rounded-2xl">
                        <p className="text-[9px] font-black text-secondary uppercase mb-1 tracking-widest">Active Branch</p>
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-3 h-3 text-brand" />
                            <span className="text-xs font-mono font-bold text-muted">{status?.branch || '...'}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-bg-primary/50 border border-border-subtle rounded-2xl">
                        <p className="text-[9px] font-black text-secondary uppercase mb-1 tracking-widest">Master Status</p>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-status-success" />
                            <span className="text-xs font-bold text-muted uppercase tracking-tighter">Injected</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-bg-primary/30 border border-border-subtle rounded-2xl space-y-2">
                    <p className="text-[9px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                        <GitCommit className="w-3 h-3" /> Latest Snapshot
                    </p>
                    <p className="text-[11px] font-medium text-muted italic line-clamp-1">
                        "{status?.lastCommit || 'Waiting for first scan...'}"
                    </p>
                </div>

                {isPushing ? (
                    <div className="space-y-4 py-2">
                        <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-action-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${pushProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-brand animate-pulse uppercase tracking-[0.2em]">Engaging Sync Protocol...</span>
                            <span className="text-[10px] font-mono text-secondary">{pushProgress}%</span>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={handlePush}
                        disabled={isLoading || status?.modifiedCount === 0}
                        className={cn(
                            "w-full group/btn relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 transform active:scale-[0.98]",
                            status && status.modifiedCount > 0
                                ? "bg-surface-card text-primary shadow-xl shadow-white/5 hover:bg-surface-bg"
                                : "bg-surface-card text-secondary border border-border-subtle cursor-not-allowed"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                status && status.modifiedCount > 0 ? "bg-surface-card" : "bg-surface-card"
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
                                    ? "bg-status-success/10 text-status-success border-emerald-500/20"
                                    : "bg-status-danger/10 text-status-danger border-red-500/20"
                            )}
                        >
                            {lastResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {lastResult.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Sovereign RAG Panel ─────────────────────────────────── */}
                <div className="pt-4 border-t border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5 text-brand" />
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Sovereign RAG</span>
                        </div>
                        <div className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                            ragHealth?.status === 'online'
                                ? "bg-status-success/10 text-status-success border-emerald-500/20"
                                : ragHealth?.status === 'offline'
                                ? "bg-status-danger/10 text-status-danger border-red-500/20"
                                : "bg-surface-card text-secondary border-border-subtle"
                        )}>
                            {ragHealth?.status ?? 'Checking...'}
                        </div>
                    </div>

                    {ragHealth && (
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 bg-bg-primary/30 border border-border-subtle rounded-xl text-center">
                                <p className="text-[8px] font-black text-secondary uppercase tracking-widest">Docs</p>
                                <p className="text-xs font-bold text-muted">{ragHealth.documentCount ?? '—'}</p>
                            </div>
                            <div className="p-2.5 bg-bg-primary/30 border border-border-subtle rounded-xl text-center">
                                <p className="text-[8px] font-black text-secondary uppercase tracking-widest">Latence</p>
                                <p className="text-xs font-bold text-muted">{ragHealth.latencyMs}ms</p>
                            </div>
                            <div className="p-2.5 bg-bg-primary/30 border border-border-subtle rounded-xl text-center">
                                <p className="text-[8px] font-black text-secondary uppercase tracking-widest">Version</p>
                                <p className="text-xs font-bold text-muted">{ragHealth.version ?? '—'}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleRagReindexFleet}
                            disabled={isRagIndexing}
                            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-card border border-border-subtle text-[9px] font-black uppercase tracking-widest text-muted hover:border-brand hover:text-brand transition-all disabled:opacity-50"
                        >
                            <RotateCcw className={cn("w-3.5 h-3.5", isRagIndexing && "animate-spin")} />
                            Réindexer flotte
                        </button>
                        <button
                            onClick={fetchRagHealth}
                            className="p-3 rounded-xl bg-surface-card border border-border-subtle text-muted hover:text-text-primary transition-all"
                        >
                            <Zap className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {ragResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={cn(
                                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border",
                                    ragResult.success
                                        ? "bg-status-success/10 text-status-success border-emerald-500/20"
                                        : "bg-status-danger/10 text-status-danger border-red-500/20"
                                )}
                            >
                                {ragResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {ragResult.msg}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
