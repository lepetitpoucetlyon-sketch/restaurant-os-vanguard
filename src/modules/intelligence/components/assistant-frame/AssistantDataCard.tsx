"use client";

import React from "react";
import { 
    Thermometer, 
    FileText, 
    DollarSign, 
    Package, 
    Wrench, 
    Bed, 
    ShieldCheck, 
    CheckCircle2, 
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";

export interface AssistantDataPayload {
    type: 'fridge_stock' | 'supplier_invoices' | 'financial_snapshot' | 'repair_order' | 'room_rack' | 'generic';
    title: string;
    items?: Array<{ label: string; value: string; status?: 'ok' | 'warning' | 'critical' }>;
    meta?: Record<string, string | number>;
}

interface AssistantDataCardProps {
    data: AssistantDataPayload;
}

export function AssistantDataCard({ data }: AssistantDataCardProps) {
    const getIcon = () => {
        switch (data.type) {
            case 'fridge_stock':
                return <Thermometer className="w-4 h-4 text-sky-400" />;
            case 'supplier_invoices':
                return <FileText className="w-4 h-4 text-amber-400" />;
            case 'financial_snapshot':
                return <DollarSign className="w-4 h-4 text-emerald-400" />;
            case 'repair_order':
                return <Wrench className="w-4 h-4 text-purple-400" />;
            case 'room_rack':
                return <Bed className="w-4 h-4 text-indigo-400" />;
            default:
                return <Package className="w-4 h-4 text-accent" />;
        }
    };

    return (
        <div className="my-2.5 rounded-xl border border-border/80 bg-bg-tertiary/80 backdrop-blur-md overflow-hidden shadow-lg shadow-black/20">
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-bg-secondary/60">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-bg-tertiary border border-border">
                        {getIcon()}
                    </div>
                    <span className="text-xs font-bold text-text-primary">
                        {data.title}
                    </span>
                </div>

                <div className="flex items-center gap-1 text-nano text-accent font-semibold px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Données Certifiées Nexus</span>
                </div>
            </div>

            {/* Content List */}
            {data.items && data.items.length > 0 && (
                <div className="p-3 space-y-2">
                    {data.items.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="flex items-center justify-between p-2 rounded-lg bg-bg-secondary/40 border border-border/40 hover:border-accent/30 transition-colors text-xs"
                        >
                            <span className="text-text-secondary font-medium">
                                {item.label}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                                {item.status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                {item.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                                {item.status === 'critical' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                                <span className={cn(
                                    "font-mono font-semibold",
                                    item.status === 'critical' ? "text-rose-400" :
                                    item.status === 'warning' ? "text-amber-400" :
                                    "text-text-primary"
                                )}>
                                    {item.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Meta Footer */}
            {data.meta && (
                <div className="px-3.5 py-2 border-t border-border/40 bg-bg-secondary/30 flex items-center justify-between text-nano text-text-muted">
                    {Object.entries(data.meta).map(([k, v]) => (
                        <span key={k}>
                            {k}: <strong className="text-text-secondary font-mono">{v}</strong>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
