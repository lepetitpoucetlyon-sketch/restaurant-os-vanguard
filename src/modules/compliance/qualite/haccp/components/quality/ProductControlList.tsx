import React from 'react';
import { Package, Check, X, Thermometer, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useQuality } from '../../hooks/useQuality';
import type { ActiveQualityControlItem, DecisionType } from '@nexus/contracts';
import { FreshnessRating } from './FreshnessRating';
import { DLCAlertBadge } from './DLCAlertBadge';

export const ProductControlList: React.FC = () => {
    const { activeControl, updateControlItem } = useQuality();
    const items = (activeControl?.items || []) as ActiveQualityControlItem[];

    const handleToggleStatus = (item: ActiveQualityControlItem, decision: DecisionType) => {
        updateControlItem({
            ...item,
            decision: decision,
            is_rejected: decision === 'rejected',
        });
    };

    const handleFreshnessChange = (item: ActiveQualityControlItem, score: number) => {
        updateControlItem({
            ...item,
            checks: {
                ...item.checks,
                freshness: {
                    ...item.checks.freshness,
                    score: score as 1 | 2 | 3 | 4 | 5,
                    performed: true
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end px-4">
                <div>
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest">Détail des Produits</h3>
                    <p className="text-nano font-bold text-muted uppercase tracking-widest mt-1">Audit Unitaire ({items.length} articles)</p>
                </div>
                <span className="text-nano font-black text-status-success bg-status-success px-3 py-1 rounded-full uppercase tracking-widest">
                    Live Sync
                </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                {items.map((item) => (
                    <div key={item.id} className={cn(
                        "bg-surface-card p-8 rounded-[3rem] border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-8 group relative overflow-hidden",
                        item.is_rejected ? "border-rose-100 bg-status-danger/10 shadow-lg shadow-rose-500/5" : "border-subtle hover:shadow-2xl hover:shadow-slate-200/50 hover:border-default"
                    )}>
                        <div className="flex items-start gap-6">
                            <div className={cn(
                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-inner relative shrink-0",
                                item.is_rejected ? "bg-status-danger text-text-primary" : 
                                item.decision === 'accepted' ? "bg-status-success text-text-primary shadow-emerald-500/20" : "bg-surface-bg text-muted"
                            )}>
                                <Package className="w-8 h-8" />
                                {item.is_rejected && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-surface-card rounded-full flex items-center justify-center shadow-md">
                                        <X className="w-3 h-3 text-status-danger" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="font-serif font-black text-xl text-primary tracking-tight leading-none mb-1">{item.product_name}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-nano font-black text-muted uppercase tracking-widest bg-surface-bg px-2.5 py-1 rounded-lg border border-subtle">
                                            {item.quantity_delivered} {item.unit || 'U'}
                                        </span>
                                        {item.batch_number && (
                                            <span className="text-nano font-black text-muted uppercase tracking-widest">
                                                Lot: {item.batch_number}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {item.expiry_date && (
                                        <DLCAlertBadge expiryDate={item.expiry_date} />
                                    )}
                                    {item.checks?.temperature?.measured !== undefined && (
                                        <div className={cn(
                                            "px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm",
                                            item.checks.temperature.status === 'pass' 
                                                ? "bg-status-success border-emerald-100 text-status-success" 
                                                : "bg-status-danger border-rose-100 text-status-danger"
                                        )}>
                                            <Thermometer className="w-3 h-3" />
                                            <span className="text-chip-label-sm">{item.checks.temperature.measured}°C</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 border-t md:border-t-0 md:border-l border-subtle pt-6 md:pt-0 md:pl-8">
                            <FreshnessRating 
                                value={item.checks.freshness.score || 3} 
                                onChange={(val) => handleFreshnessChange(item, val)}
                                className="w-full md:w-auto"
                            />
                            
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => handleToggleStatus(item, 'accepted')}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group-active:scale-95",
                                        item.decision === 'accepted' && !item.is_rejected
                                            ? "bg-status-success text-text-primary shadow-emerald-500/30" 
                                            : "bg-surface-bg text-muted hover:bg-status-success hover:text-status-success border border-subtle"
                                    )}
                                >
                                    <Check className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(item, 'rejected')}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group-active:scale-95",
                                        item.is_rejected
                                            ? "bg-status-danger text-text-primary shadow-rose-500/30" 
                                            : "bg-surface-bg text-muted hover:bg-status-danger hover:text-status-danger border border-subtle"
                                    )}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="py-20 bg-surface-card p-8 rounded-[3.5rem] border border-dashed border-default text-center shadow-inner">
                    <div className="w-16 h-16 bg-surface-bg rounded-full flex items-center justify-center mx-auto mb-6">
                        <PackageSearch className="w-8 h-8 text-muted" />
                    </div>
                    <h4 className="text-sm font-black text-muted uppercase tracking-widest mb-2">En attente de scanning</h4>
                    <p className="max-w-xs mx-auto text-nano font-bold text-muted uppercase leading-relaxed tracking-widest">
                        Utilisez le module OCR pour charger les données de la livraison ou saisissez manuellement les articles.
                    </p>
                </div>
            )}
        </div>
    );
};
