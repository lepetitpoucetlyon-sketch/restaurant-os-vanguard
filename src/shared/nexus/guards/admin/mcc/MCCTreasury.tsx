"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Wallet, 
    TrendingUp, 
    Cpu,
    ArrowUpRight, 
    Package, 
    Sparkles, 
    ShoppingBag,
    ArrowRight
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { TreasuryEngine } from '@domain/services/TreasuryEngine';

export function MCCTreasury() {
    const { instances } = useFleet();
    
    const report = useMemo(() => {
        return TreasuryEngine.generateFleetReport(instances);
    }, [instances]);

    return (
        <div className="space-y-8 pb-12">
            {/* Main Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* Global MRR Card */}
                <FinancialCard 
                    label="Empire Monthly Revenue (MRR)"
                    value={`€${Math.round(report.totalMRR).toLocaleString()}`}
                    trend="+12.4% vs last month"
                    icon={<Wallet className="text-status-success" />}
                    chartColor="rgba(16, 185, 129, 0.2)"
                />

                {/* AI Consumption Cost */}
                <FinancialCard 
                    label="AI Infrastructure Overhead"
                    value={`€${Math.round(report.totalAICosts).toLocaleString()}`}
                    trend="0.002€ per token (Elite Tier optimized)"
                    icon={<Cpu className="text-brand" />}
                    chartColor="rgba(99, 102, 241, 0.2)"
                />

                {/* Collective Savings */}
                <FinancialCard 
                    label="Collective Bargaining Power"
                    value={`€${Math.round(report.collectiveSavings).toLocaleString()}`}
                    trend="Coalition discount: 15.4% active"
                    icon={<Sparkles className="text-status-warning" />}
                    chartColor="rgba(245, 158, 11, 0.2)"
                    isSpecial
                />
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Marketplace Collective Intelligence */}
                <div className="col-span-12 lg:col-span-7 bg-[#161618] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-action-primary/5 blur-[80px] -mr-32 -mt-32" />
                    
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight uppercase">Fleet Coalition Procurement</h3>
                            <p className="text-xs text-secondary font-medium tracking-widest mt-1">Industrial Bulk Negotiation Status</p>
                        </div>
                        <div className="p-3 bg-surface-card/5 rounded-2xl">
                            <ShoppingBag className="w-5 h-5 text-brand" />
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <ProcurementRow 
                            category="High-End Spirits & Wines" 
                            volume={42500} 
                            unit="bottles" 
                            discount={22} 
                            status="NEGOTIATED" 
                        />
                        <ProcurementRow 
                            category="Organic Produce (Consolidated)" 
                            volume={12400} 
                            unit="kg" 
                            discount={12} 
                            status="ACTIVE" 
                        />
                        <ProcurementRow 
                            category="Bio-Degradable Packaging" 
                            volume={150000} 
                            unit="units" 
                            discount={18} 
                            status="COMPLETED" 
                        />
                    </div>

                    <div className="mt-10 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between opacity-40 select-none">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-secondary" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Master Supply Portal</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-secondary border border-white/10 px-2 py-0.5 rounded-full">Bientôt</span>
                    </div>
                </div>

                {/* Net Margin / Health */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <div className="flex-1 bg-gradient-to-br from-[#161618] to-[#0d0d0f] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                        <h3 className="text-xs font-black text-secondary uppercase tracking-[0.3em] mb-6">Net Empire Margin</h3>
                        <div className="text-5xl font-black mb-4 tracking-tighter">
                            €{Math.round(report.netMargin).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-secondary leading-relaxed font-medium">
                            Calculated after infrastructure overhead, collective procurement savings, and real-time AI consumption. Current margin: <span className="text-status-success font-bold">28.4%</span>.
                        </p>
                        
                        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-secondary">
                                 <span>Operational Health</span>
                                 <span className="text-white">OPTIMAL</span>
                             </div>
                             <div className="w-full h-1 bg-surface-card/5 rounded-full overflow-hidden">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '82%' }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-action-primary" 
                                />
                             </div>
                        </div>
                    </div>

                    <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 flex items-center justify-between opacity-40 select-none">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Package className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-tight">Inter-Site Logistics</h4>
                                <p className="text-[10px] text-secondary font-medium uppercase tracking-tighter">Module non activé</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-secondary border border-white/10 px-2 py-0.5 rounded-full">Bientôt</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FinancialCardProps {
    label: string;
    value: string;
    trend: string;
    icon: React.ReactNode;
    chartColor: string;
    isSpecial?: boolean;
}

function FinancialCard({ label, value, trend, icon, chartColor, isSpecial = false }: FinancialCardProps) {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className={`p-8 rounded-3xl border border-white/5 bg-[#161618] relative overflow-hidden group transition-all ${isSpecial ? 'ring-1 ring-focus/20' : ''}`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-surface-card/5 rounded-2xl group-hover:bg-surface-card/10 transition-all">
                    {icon}
                </div>
                {isSpecial && <div className="px-2 py-1 rounded bg-action-primary/10 border border-focus/20 text-[8px] font-black text-brand uppercase tracking-widest">Premium Power</div>}
            </div>
            
            <h3 className="text-secondary text-[10px] font-black uppercase tracking-widest mb-2">{label}</h3>
            <div className="text-3xl font-black mb-2 tracking-tighter">{value}</div>
            <p className="text-[10px] font-medium text-secondary uppercase tracking-tighter">{trend}</p>

            {/* Faux Sparkline Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 group-hover:opacity-40 transition-all" style={{ backgroundColor: chartColor, maskImage: 'linear-gradient(to top, black, transparent)' }} />
        </motion.div>
    );
}

interface ProcurementRowProps {
    category: string;
    volume: number;
    unit: string;
    discount: number;
    status: 'NEGOTIATED' | 'ACTIVE' | 'COMPLETED';
}

function ProcurementRow({ category, volume, unit, discount, status }: ProcurementRowProps) {
    return (
        <div className="grid grid-cols-12 items-center py-4 border-b border-white/5 last:border-0 hover:bg-surface-card/[0.01] transition-all rounded-lg px-2">
            <div className="col-span-5">
                <span className="text-xs font-bold text-muted group-hover:text-brand transition-colors uppercase">{category}</span>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-secondary uppercase">{volume.toLocaleString()} {unit}</span>
                </div>
            </div>
            <div className="col-span-3">
                <div className="text-[10px] font-black text-status-success uppercase">-{discount}%</div>
                <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Max Savings</span>
            </div>
            <div className="col-span-4 text-right">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${status === 'NEGOTIATED' ? 'bg-action-primary/10 border-focus/30 text-brand' : 'bg-surface-card/5 border-subtle text-secondary'}`}>
                    {status}
                </span>
            </div>
        </div>
    );
}
