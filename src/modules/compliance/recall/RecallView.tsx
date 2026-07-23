'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, Search, Package, Utensils, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useTenant, useAuth } from '@/hooks';
import { RecallService } from './RecallService';
import { toast } from 'sonner';

interface RecallResult {
    lotId: string;
    preparations: Array<{ recipeId: string; recipeName: string }>;
    orderLines: Array<{
        orderId: string;
        productName: string;
        quantity: number;
        tableId?: string;
        timestamp: string;
    }>;
    affectedSubjectIds: string[];
    totalCovers: number;
}

export function RecallView() {
    const { tenantId } = useTenant();
    const { currentUser } = useAuth();
    const [lotId, setLotId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RecallResult | null>(null);
    const [recalled, setRecalled] = useState(false);

    const handleTrace = useCallback(async () => {
        if (!tenantId || !lotId.trim()) return;
        setLoading(true);
        setRecalled(false);
        try {
            const impact = await RecallService.traceFromLot(tenantId, lotId.trim());
            setResult(impact);
        } catch {
            toast.error('Erreur lors du traçage');
        } finally {
            setLoading(false);
        }
    }, [tenantId, lotId]);

    const handleInitiateRecall = useCallback(async () => {
        if (!tenantId || !lotId.trim() || !reason.trim() || !currentUser?.id) return;
        setLoading(true);
        try {
            await RecallService.initiateRecall(tenantId, lotId.trim(), currentUser.id, reason.trim());
            setRecalled(true);
            toast.success('Procédure de rappel initiée et tracée');
        } catch {
            toast.error('Erreur lors du rappel');
        } finally {
            setLoading(false);
        }
    }, [tenantId, lotId, reason, currentUser]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-status-error/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-status-error" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                        Retrait-Rappel Produit
                    </h3>
                    <p className="text-[10px] text-text-muted">
                        Traçabilité lot → plats → clients
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 border border-border rounded-xl px-4 h-11 bg-bg-primary focus-within:border-status-error/50 transition-colors">
                    <Package className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <input
                        type="text"
                        value={lotId}
                        onChange={(e) => setLotId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
                        placeholder="N° de lot"
                        className="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                    />
                </div>
                <button
                    onClick={handleTrace}
                    disabled={loading || !lotId.trim()}
                    className="h-11 px-5 rounded-xl bg-status-error text-white text-[10px] font-black uppercase tracking-widest hover:bg-status-error/90 transition-colors disabled:opacity-30"
                >
                    <Search className="w-4 h-4" />
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-status-error/30 border-t-status-error rounded-full animate-spin" />
                </div>
            )}

            {result && !loading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-border p-3 text-center">
                            <Utensils className="w-4 h-4 text-text-muted mx-auto mb-1" />
                            <div className="text-lg font-black text-text-primary">{result.preparations.length}</div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Recettes</div>
                        </div>
                        <div className="rounded-xl border border-border p-3 text-center">
                            <FileText className="w-4 h-4 text-text-muted mx-auto mb-1" />
                            <div className="text-lg font-black text-text-primary">{result.orderLines.length}</div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Commandes</div>
                        </div>
                        <div className="rounded-xl border border-border p-3 text-center">
                            <Users className="w-4 h-4 text-text-muted mx-auto mb-1" />
                            <div className="text-lg font-black text-text-primary">{result.totalCovers}</div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Couverts</div>
                        </div>
                    </div>

                    {result.preparations.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Recettes impactées</p>
                            <div className="space-y-1">
                                {result.preparations.map((p) => (
                                    <div key={p.recipeId} className="flex items-center gap-2 text-[11px] text-text-primary px-3 py-2 rounded-lg bg-bg-tertiary">
                                        <Utensils className="w-3 h-3 text-status-error" />
                                        {p.recipeName}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.orderLines.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Commandes affectées</p>
                            <div className="max-h-48 overflow-auto space-y-1 elegant-scrollbar">
                                {result.orderLines.map((line, i) => (
                                    <div key={`${line.orderId}-${i}`} className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-bg-tertiary">
                                        <span className="text-text-primary font-bold">{line.productName} ×{line.quantity}</span>
                                        <span className="text-text-muted font-mono text-[10px]">
                                            {line.timestamp ? new Date(line.timestamp).toLocaleDateString('fr-FR') : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!recalled && (
                        <div className="space-y-3 pt-2">
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Motif du rappel"
                                className="w-full h-11 rounded-xl border border-border bg-bg-primary px-4 text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-status-error/50"
                            />
                            <button
                                onClick={handleInitiateRecall}
                                disabled={!reason.trim() || loading}
                                className={cn(
                                    "w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                    "bg-status-error text-white hover:bg-status-error/90 disabled:opacity-30"
                                )}
                            >
                                Initier la procédure de rappel
                            </button>
                        </div>
                    )}

                    {recalled && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-status-success/10 border border-status-success/20 text-status-success text-[11px] font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            Procédure de rappel tracée dans le journal d'audit
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
