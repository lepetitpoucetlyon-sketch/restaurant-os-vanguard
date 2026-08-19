"use client";

import React, { useEffect, useState } from 'react';
import { db, DeadLetterEntry } from '@/lib/offline/offline-store';
import { NexusEventBus, NexusEventName } from '@/shared/eventBus/NexusEventBus';
import { PayloadMigrator } from '@/shared/eventBus/PayloadMigrator';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import type { JsonObject } from '@/shared/types/json';
import { 
    AlertTriangle, 
    CheckCircle2, 
    RefreshCw, 
    Trash2, 
    ShieldAlert, 
    Clock, 
    ChevronDown, 
    ChevronUp,
    Zap,
    History
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * 🛠️ DLQDiagnosticPanel — Observabilité & Résilience Événementielle (Chantier β-2)
 *
 * Permet au gérant ou au technicien de visualiser en temps réel les rares événements
 * asynchrones / requêtes hors-ligne tombés en échec et de les rejouer en 1 clic.
 */
export const DLQDiagnosticPanel: React.FC = () => {
    const [entries, setEntries] = useState<DeadLetterEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [isRetryingAll, setIsRetryingAll] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const loadEntries = async () => {
        try {
            const list = await db.deadLetterEvents.toArray();
            setEntries(list.sort((a, b) => b.failedAt - a.failedAt));
        } catch (err) {
            logger.error('[DLQDiagnosticPanel] Erreur de chargement de la DLQ', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEntries();
        const interval = setInterval(loadEntries, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleRetry = async (entry: DeadLetterEntry) => {
        setRetryingId(entry.id);
        const MAX_ATTEMPTS = 5;
        const nextAttempt = (entry.attempts || 0) + 1;

        try {
            logger.info(`[DLQDiagnosticPanel] Relance manuelle de l'événement ${entry.eventName}#${entry.id}`);
            const payload = PayloadMigrator.migrate(entry.eventName as NexusEventName, entry.payload as JsonObject);
            
            // Rejeu sur le bus en sautant la double écriture DLQ
            await NexusEventBus.emit(entry.eventName as NexusEventName, payload, { skipDLQWrite: true });
            
            // Succès : purge immédiate de la file DLQ
            await db.deadLetterEvents.delete(entry.id);
            toast.success(`Événement ${entry.eventName} rejoué avec succès !`);
        } catch (err) {
            const errorMsg = toError(err).message;
            logger.error(`[DLQDiagnosticPanel] Échec de relance pour ${entry.id}`, err);
            
            await db.deadLetterEvents.update(entry.id, {
                attempts: nextAttempt,
                status: nextAttempt >= MAX_ATTEMPTS ? 'quarantine' : 'retry',
                error: `[Relance manuelle ${nextAttempt}/${MAX_ATTEMPTS}] ${errorMsg}`,
                failedAt: Date.now(),
            });
            toast.error(`Échec de la relance : ${errorMsg}`);
        } finally {
            setRetryingId(null);
            await loadEntries();
        }
    };

    const handleRetryAll = async () => {
        if (entries.length === 0) return;
        setIsRetryingAll(true);
        let successCount = 0;
        let failCount = 0;

        for (const entry of entries) {
            try {
                const payload = PayloadMigrator.migrate(entry.eventName as NexusEventName, entry.payload as JsonObject);
                await NexusEventBus.emit(entry.eventName as NexusEventName, payload, { skipDLQWrite: true });
                await db.deadLetterEvents.delete(entry.id);
                successCount++;
            } catch {
                failCount++;
            }
        }

        setIsRetryingAll(false);
        await loadEntries();

        if (failCount === 0) {
            toast.success(`Toutes les ${successCount} opérations ont été réexécutées avec succès !`);
        } else {
            toast.warning(`${successCount} réussites, ${failCount} échecs restants en quarantaine.`);
        }
    };

    const handleClearResolved = async () => {
        try {
            await db.deadLetterEvents.clear();
            await loadEntries();
            toast.info('File d\'attente des anomalies vidée.');
        } catch (err) {
            toast.error('Erreur lors de la purge : ' + toError(err).message);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-text-muted flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-accent-gold" />
                <span>Diagnostic de la file d'attente en cours...</span>
            </div>
        );
    }

    const quarantineCount = entries.filter(e => e.status === 'quarantine').length;
    const retryCount = entries.filter(e => e.status === 'retry').length;

    return (
        <div className="space-y-6">
            {/* Header Statut */}
            <div className="bg-surface-elevated/40 border border-border-base/50 rounded-xl p-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            entries.length === 0 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                            {entries.length === 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-bold text-text-primary flex items-center gap-2">
                                Tour de Contrôle Résilience & DLQ
                                {entries.length === 0 ? (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        Système 100% Sain
                                    </span>
                                ) : (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                        {entries.length} anomalie{entries.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-text-muted mt-1">
                                Surveille les transactions réseau asynchrones, la file hors-ligne Dexie et garantit zéro perte de commande.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadEntries}
                            className="p-2.5 rounded-lg border border-border-base/60 bg-surface-base text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                            title="Actualiser la file"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        {entries.length > 0 && (
                            <>
                                <button
                                    onClick={handleRetryAll}
                                    disabled={isRetryingAll}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
                                >
                                    <Zap className="w-4 h-4" />
                                    {isRetryingAll ? 'Relance en cours...' : 'Tout Réessayer'}
                                </button>
                                <button
                                    onClick={handleClearResolved}
                                    className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    title="Purger la liste"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border-base/40">
                    <div className="bg-surface-base/50 p-3.5 rounded-lg border border-border-base/30">
                        <div className="text-xs text-text-muted">Total En File</div>
                        <div className="text-xl font-bold text-text-primary mt-0.5">{entries.length}</div>
                    </div>
                    <div className="bg-surface-base/50 p-3.5 rounded-lg border border-border-base/30">
                        <div className="text-xs text-amber-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> En attente de relance
                        </div>
                        <div className="text-xl font-bold text-amber-400 mt-0.5">{retryCount}</div>
                    </div>
                    <div className="bg-surface-base/50 p-3.5 rounded-lg border border-border-base/30 col-span-2 sm:col-span-1">
                        <div className="text-xs text-red-400 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> En Quarantaine
                        </div>
                        <div className="text-xl font-bold text-red-400 mt-0.5">{quarantineCount}</div>
                    </div>
                </div>
            </div>

            {/* Liste des anomalies */}
            {entries.length === 0 ? (
                <div className="border border-dashed border-border-base/50 rounded-xl p-12 text-center bg-surface-base/20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
                    <h4 className="text-base font-medium text-text-primary">Aucun incident détecté</h4>
                    <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
                        Toutes les écritures comptables, commandes KDS et synchronisations d'états sont passées avec succès.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Événements en attente de résolution ({entries.length})
                    </div>
                    {entries.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        const isRetrying = retryingId === entry.id;

                        return (
                            <div 
                                key={entry.id}
                                className="bg-surface-base border border-border-base/70 rounded-xl overflow-hidden transition-all hover:border-accent-gold/40 shadow-sm"
                            >
                                <div className="p-4 flex items-start justify-between gap-4">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-accent-gold">
                                                {entry.eventName}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                                                entry.status === 'quarantine' 
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                                {entry.status === 'quarantine' ? 'Quarantaine' : 'À Relancer'}
                                            </span>
                                            <span className="text-[11px] text-text-muted">
                                                Tentatives : {entry.attempts || 0}
                                            </span>
                                        </div>
                                        <div className="text-xs text-red-300 font-mono truncate">
                                            {entry.error || 'Erreur non spécifiée'}
                                        </div>
                                        <div className="text-[10px] text-text-muted">
                                            Échec : {new Date(entry.failedAt).toLocaleString('fr-FR')} • ID : <span className="font-mono">{entry.id}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleRetry(entry)}
                                            disabled={isRetrying}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                                            {isRetrying ? 'Relance...' : 'Réessayer'}
                                        </button>
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-hover"
                                        >
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-surface-elevated/80 border-t border-border-base/50 p-4 space-y-2 text-xs">
                                        <div className="text-text-muted font-semibold">Détail du Payload :</div>
                                        <pre className="p-3 bg-black/40 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                                            {JSON.stringify(entry.payload, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
