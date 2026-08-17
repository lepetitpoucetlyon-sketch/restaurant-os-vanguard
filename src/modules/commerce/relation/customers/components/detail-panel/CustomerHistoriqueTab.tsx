"use client";

import { Clock, TrendingUp, Calendar, ShoppingBag } from "lucide-react";
import type { Customer } from "@nexus/contracts";
import { useCustomerHistory } from "./useCustomerHistory";

export function CustomerHistoriqueTab({ customer }: { customer: Customer }) {
    const { data, loading } = useCustomerHistory(customer);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-text-primary/30">
                <Clock className="w-5 h-5 animate-pulse mr-2" />
                <span className="text-sm">Chargement...</span>
            </div>
        );
    }

    if (!data) return null;

    const totalVisits = data.reservations.length || customer.visitCount;

    return (
        <div className="p-8 space-y-10">
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-surface-card/5 border border-subtle text-center">
                    <p className="text-2xl font-mono font-light text-accent italic">{totalVisits}</p>
                    <p className="text-[9px] font-black text-text-primary/40 uppercase tracking-widest mt-1">Visites</p>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card/5 border border-subtle text-center">
                    <p className="text-2xl font-mono font-light text-text-primary italic">{data.avgSpend.toFixed(0)}€</p>
                    <p className="text-[9px] font-black text-text-primary/40 uppercase tracking-widest mt-1">Moy. ticket</p>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card/5 border border-subtle text-center">
                    <p className="text-2xl font-mono font-light text-text-primary italic">{data.orders.length}</p>
                    <p className="text-[9px] font-black text-text-primary/40 uppercase tracking-widest mt-1">Commandes</p>
                </div>
            </div>

            {/* Top Products */}
            {data.topProducts.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-black text-text-primary/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-accent" /> Top 3 plats
                    </h4>
                    <div className="space-y-2">
                        {data.topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-card/5 border border-subtle">
                                <div className="flex items-center gap-3">
                                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-black flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-text-primary font-medium">{p.name}</span>
                                </div>
                                <span className="text-xs font-mono text-text-primary/50">{p.count}×</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reservations Timeline */}
            {data.reservations.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-black text-text-primary/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-accent" /> Réservations récentes
                    </h4>
                    <div className="space-y-2">
                        {data.reservations.slice(0, 8).map((r) => {
                            const date = new Date(r.date);
                            const isUpcoming = date >= new Date();
                            return (
                                <div
                                    key={r.id}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-card/5 border border-subtle"
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        isUpcoming ? "bg-accent" : "bg-white/20"
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-text-primary font-mono">
                                            {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                                            {" "}<span className="text-text-primary/40">{r.time}</span>
                                        </p>
                                        <p className="text-[10px] text-text-primary/40 mt-0.5 capitalize">
                                            {r.status} · {r.partySize} pers.
                                        </p>
                                    </div>
                                    {isUpcoming && (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-black uppercase tracking-wide">
                                            À venir
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {data.reservations.length === 0 && data.orders.length === 0 && (
                <div className="text-center py-10 text-text-primary/30">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucun historique trouvé</p>
                </div>
            )}
        </div>
    );
}
