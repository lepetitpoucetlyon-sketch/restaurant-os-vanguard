import React from 'react';
import { Package, Check, X, Thermometer, Info, Calendar, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useQuality } from '@/hooks/useQuality';
import { QualityControlItem } from '@/domain/types/quality';
import { FreshnessRating } from './FreshnessRating';
import { DLCAlertBadge } from './DLCAlertBadge';

export const ProductControlList: React.FC = () => {
    const { activeControl, updateControlItem } = useQuality();
    const items = activeControl?.items || [];

    const handleToggleStatus = (item: QualityControlItem, status: 'pass' | 'fail') => {
        updateControlItem({
            ...item,
            status: status,
            is_rejected: status === 'fail',
            decision: status === 'pass' ? 'accepted' : 'rejected'
        });
    };

    const handleFreshnessChange = (item: QualityControlItem, score: number) => {
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
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Détail des Produits</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Unitaire ({items.length} articles)</p>
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    Live Sync
                </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                {items.map((item) => (
                    <div key={item.id} className={cn(
                        "bg-white p-8 rounded-[3rem] border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-8 group relative overflow-hidden",
                        item.is_rejected ? "border-rose-100 bg-rose-50/10 shadow-lg shadow-rose-500/5" : "border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-200"
                    )}>
                        <div className="flex items-start gap-6">
                            <div className={cn(
                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-inner relative shrink-0",
                                item.is_rejected ? "bg-rose-500 text-white" : 
                                item.status === 'pass' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-50 text-slate-300"
                            )}>
                                <Package className="w-8 h-8" />
                                {item.is_rejected && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                                        <X className="w-3 h-3 text-rose-500" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="font-serif font-black text-xl text-slate-900 tracking-tight leading-none mb-1">{item.product_name}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                            {item.quantity_delivered} {item.unit || 'U'}
                                        </span>
                                        {item.batch_number && (
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                                : "bg-rose-50 border-rose-100 text-rose-600"
                                        )}>
                                            <Thermometer className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{item.checks.temperature.measured}°C</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                            <FreshnessRating 
                                value={item.checks.freshness.score || 3} 
                                onChange={(val) => handleFreshnessChange(item, val)}
                                className="w-full md:w-auto"
                            />
                            
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => handleToggleStatus(item, 'pass')}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group-active:scale-95",
                                        item.status === 'pass' && !item.is_rejected
                                            ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                                            : "bg-slate-50 text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 border border-slate-100"
                                    )}
                                >
                                    <Check className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(item, 'fail')}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group-active:scale-95",
                                        item.is_rejected
                                            ? "bg-rose-500 text-white shadow-rose-500/30" 
                                            : "bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 border border-slate-100"
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
                <div className="py-20 bg-white p-8 rounded-[3.5rem] border border-dashed border-slate-200 text-center shadow-inner">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PackageSearch className="w-8 h-8 text-slate-200" />
                    </div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">En attente de scanning</h4>
                    <p className="max-w-xs mx-auto text-[10px] font-bold text-slate-300 uppercase leading-relaxed tracking-widest">
                        Utilisez le module OCR pour charger les données de la livraison ou saisissez manuellement les articles.
                    </p>
                </div>
            )}
        </div>
    );
};
