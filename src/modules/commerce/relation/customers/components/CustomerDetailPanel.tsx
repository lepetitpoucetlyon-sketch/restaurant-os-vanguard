"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Customer, Reservation } from "@nexus/contracts";
import { Order } from "@/modules/ops";
import { Button } from "@ui/button";
import { ScrollArea } from "@ui/scroll-area";
import { Phone, Mail, Star, Calendar, Clock, ShoppingBag, TrendingUp, History } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { LoyaltyCard } from '../../../acquisition/marketing/components/crm/LoyaltyCard';
import { useTenant } from "@/kernel/hooks";
import type { PlatformVariant } from "@nexus/contracts";
import { labelFor } from "@/verticals/_shared/labels";

interface CustomerDetailPanelProps {
    customer: Customer;
    onClose: () => void;
    onNewReservation: () => void;
}

type DetailTab = "profil" | "historique" | "fidelite";

interface CustomerHistory {
    reservations: Reservation[];
    orders: Order[];
    avgSpend: number;
    topProducts: { name: string; count: number }[];
}

function useCustomerHistory(customer: Customer): { data: CustomerHistory | null; loading: boolean } {
    const [data, setData] = useState<CustomerHistory | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                // Query reservations by customerId
                const reservations = await Nexus.adapter.query<Reservation>("reservations", {
                    where: [{ field: "customerId", operator: "==", value: customer.id }],
                    orderBy: { field: "date", direction: "desc" },
                    limit: 20,
                }).catch(() => [] as Reservation[]);

                // Query orders by customerId
                const orders = await Nexus.adapter.query<Order>("orders", {
                    where: [{ field: "customerId", operator: "==", value: customer.id }],
                    orderBy: { field: "createdAt", direction: "desc" },
                    limit: 50,
                }).catch(() => [] as Order[]);

                if (cancelled) return;

                // Average spend in euros
                const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "served");
                const totalMicrounits = paidOrders.reduce((sum, o) => {
                    const mu = o.totalInMicrounits ?? (o.totalInCents ? o.totalInCents * 10_000 : 0);
                    return sum + mu;
                }, 0);
                const avgSpend = paidOrders.length > 0
                    ? totalMicrounits / paidOrders.length / 1_000_000
                    : (customer.averageSpendInMicrounits ?? (customer.averageSpendInCents ? customer.averageSpendInCents * 10_000 : 0)) / 1_000_000;

                // Top products from order items
                const productCount: Record<string, { name: string; count: number }> = {};
                for (const order of orders) {
                    for (const item of order.items) {
                        const key = item.productId;
                        productCount[key] = productCount[key]
                            ? { name: item.name, count: productCount[key].count + item.quantity }
                            : { name: item.name, count: item.quantity };
                    }
                }
                const topProducts = Object.values(productCount)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);

                setData({ reservations, orders, avgSpend, topProducts });
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [customer.id, customer.averageSpendInMicrounits, customer.averageSpendInCents]);

    return { data, loading };
}

function HistoriqueTab({ customer }: { customer: Customer }) {
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
                        <TrendingUp className="w-3.5 h-3.5 text-accent" /> Top 3 {recipeLabelPlural}
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

export function CustomerDetailPanel({
    customer,
    onClose,
    onNewReservation,
}: CustomerDetailPanelProps) {
    const { activeTenantConfig } = useTenant();
    const variant = (activeTenantConfig?.variant ?? 'restaurant') as PlatformVariant;
    const recipeLabelPlural = `${labelFor('recipeLabel', variant)}s`;

    const [activeTab, setActiveTab] = useState<DetailTab>("profil");

    const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
        { id: "profil", label: "Profil", icon: Star },
        { id: "historique", label: "Historique", icon: History },
        { id: "fidelite", label: "Fidélité", icon: TrendingUp },
    ];

    return (
        <div
            className="fixed inset-0 bg-surface-sidebar/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 md:p-8 animate-in fade-in duration-500"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-bg-primary rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.6)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-subtle"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-surface-sidebar p-6 md:p-10 relative overflow-hidden text-text-primary border-b border-white/5">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] bg-surface-card/5 backdrop-blur-md border border-subtle flex items-center justify-center text-2xl md:text-4xl font-serif font-light italic shadow-2xl text-accent">
                            {(customer.firstName || "").charAt(0)}
                            {(customer.lastName || "").charAt(0)}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-text-primary/40 mb-2">
                                Profil Client Executive Intelligence
                            </p>
                            <h2 className="text-2xl md:text-4xl font-serif font-light tracking-tight italic">
                                {customer.firstName} {customer.lastName}
                            </h2>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mt-4 md:mt-6">
                                {customer.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-accent text-bg-primary shadow-lg shadow-amber-500/20"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-surface-sidebar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                                    active
                                        ? "text-accent border-b-2 border-accent"
                                        : "text-text-primary/30 hover:text-text-primary/60"
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <ScrollArea className="flex-1 elegant-scrollbar bg-bg-primary">
                    {activeTab === "profil" && (
                        <div className="flex flex-col">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 border-b border-white/5 bg-bg-primary">
                                <div className="p-10 text-center border-r border-white/5">
                                    <p className="text-3xl font-mono font-light text-accent italic">
                                        {customer.visitCount}
                                    </p>
                                    <p className="text-[10px] font-black text-text-primary/40 uppercase tracking-widest mt-3">
                                        Passages
                                    </p>
                                </div>
                                <div className="p-10 text-center border-r border-white/5">
                                    <p className="text-3xl font-mono font-light text-text-primary italic">
                                        {((customer.totalSpentInMicrounits ?? (customer.totalSpentInCents ? customer.totalSpentInCents * 10_000 : 0)) / 1_000_000).toFixed(0)}€
                                    </p>
                                    <p className="text-[10px] font-black text-text-primary/40 uppercase tracking-widest mt-3">
                                        CA Réalisé
                                    </p>
                                </div>
                                <div className="p-10 text-center">
                                    <p className="text-3xl font-mono font-light text-text-primary italic">
                                        {((customer.averageSpendInMicrounits ?? (customer.averageSpendInCents ? customer.averageSpendInCents * 10_000 : 0)) / 1_000_000).toFixed(0)}€
                                    </p>
                                    <p className="text-[10px] font-black text-text-primary/40 uppercase tracking-widest mt-3">
                                        Engagement
                                    </p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-10 space-y-12">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-8 rounded-3xl bg-surface-card/5 border border-subtle shadow-sm group hover:border-accent/40 transition-all">
                                        <p className="text-[9px] font-black text-text-primary/40 uppercase tracking-widest mb-4">
                                            Ligne Directe
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-surface-card/5 flex items-center justify-center">
                                                <Phone strokeWidth={1.5} className="w-5 h-5 text-accent" />
                                            </div>
                                            <span className="text-base font-mono font-bold text-text-primary tracking-tight">
                                                {customer.phone}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-3xl bg-surface-card/5 border border-subtle shadow-sm group hover:border-accent/40 transition-all">
                                        <p className="text-[9px] font-black text-text-primary/40 uppercase tracking-widest mb-4">
                                            Canal Privilégié
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-surface-card/5 flex items-center justify-center">
                                                <Mail strokeWidth={1.5} className="w-5 h-5 text-accent" />
                                            </div>
                                            <span className="text-base font-bold text-text-primary truncate italic">
                                                {customer.email || "Non renseigné"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Preferences */}
                                <div>
                                    <h3 className="text-[11px] font-black text-text-primary/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                                        <Star strokeWidth={2} className="w-4 h-4 text-accent" />
                                        ANALYSE DES HABITUDES &amp; PRÉFÉRENCES
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {customer.preferences.map((pref, i) => (
                                            <span
                                                key={i}
                                                className="px-6 py-3 bg-surface-card/5 rounded-2xl text-[12px] font-bold text-text-primary border border-subtle shadow-sm italic"
                                            >
                                                {pref}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "historique" && <HistoriqueTab customer={customer} />}

                    {activeTab === "fidelite" && (
                        <div className="p-8">
                            <LoyaltyCard customerId={customer.id} customerName={`${customer.firstName} ${customer.lastName}`} />
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="p-10 border-t border-white/5 bg-bg-primary flex gap-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-text-primary/40 hover:text-text-primary border border-subtle transition-all"
                    >
                        Fermer le Profil
                    </Button>
                    <Button
                        onClick={onNewReservation}
                        className="flex-1 h-16 bg-accent hover:bg-surface-card text-bg-primary rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-amber-500/10 transition-all flex items-center justify-center gap-4"
                    >
                        <Calendar strokeWidth={1.5} className="w-5 h-5" />
                        Programmer une Nouvelle Table
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
