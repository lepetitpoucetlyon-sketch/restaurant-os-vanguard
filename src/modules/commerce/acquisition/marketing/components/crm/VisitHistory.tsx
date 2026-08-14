"use client";

import { useEffect, useState } from "react";
import {
    Calendar,
    Users,
    CreditCard,
    Clock,
    TrendingUp,
    Receipt,
} from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import type { Reservation } from "@nexus/contracts";
import type { Order } from "@/modules/ops";
import { logger } from "@/lib/logger";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VisitHistoryProps {
    customerId: string;
    email: string;
    phone?: string;
}

interface HistoryState {
    totalVisits: number;
    avgSpendEuros: number;
    lastVisitDate: string | null;
    reservations: Reservation[];
    loading: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

const STATUS_LABELS: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    arrived: "Arrivée",
    seated: "Installée",
    cancelled: "Annulée",
    no_show: "No show",
};

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-status-warning/15 text-status-warning",
    confirmed: "bg-status-success/15 text-status-success",
    arrived: "bg-action-primary/15 text-action-primary",
    seated: "bg-action-primary/15 text-action-primary",
    cancelled: "bg-status-danger/15 text-status-danger",
    no_show: "bg-text-muted/15 text-text-muted",
};

type ReservationWithContact = Reservation & { customerEmail?: string; customerPhone?: string };

async function fetchContactFallback(email: string, phone: string | undefined): Promise<Reservation[]> {
    if (!email && !phone) return [];
    const all = await Nexus.adapter
        .query<ReservationWithContact>("reservations", {
            orderBy: { field: "date", direction: "desc" },
            limit: 200,
        })
        .catch(() => [] as ReservationWithContact[]);
    return all.filter((r) => {
        const rEmail = r.customerEmail ?? "";
        const rPhone = r.customerPhone ?? "";
        return (email && rEmail.toLowerCase() === email.toLowerCase()) || (phone && rPhone === phone);
    });
}

function sumOrderMicrounits(orders: Order[]): number {
    return orders.reduce((sum, o) => {
        const mu = o.totalInMicrounits ?? (o.totalInCents ? o.totalInCents * 10_000 : 0);
        return sum + (typeof mu === 'number' ? mu : 0);
    }, 0);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function VisitHistory({ customerId, email, phone }: VisitHistoryProps) {
    const [state, setState] = useState<HistoryState>({
        totalVisits: 0,
        avgSpendEuros: 0,
        lastVisitDate: null,
        reservations: [],
        loading: true,
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setState((s) => ({ ...s, loading: true }));
            try {
                // ── Query reservations by customerId (primary) ─────────────────
                const reservationsByCustomerId = await Nexus.adapter
                    .query<Reservation & { customerEmail?: string; customerPhone?: string }>(
                        "reservations",
                        {
                            where: [
                                {
                                    field: "customerId",
                                    operator: "==",
                                    value: customerId,
                                },
                            ],
                            orderBy: { field: "date", direction: "desc" },
                            limit: 50,
                        }
                    )
                    .catch(() => [] as Reservation[]);

                // ── Fallback: client-side match on email / phone ───────────────
                const fallbackReservations = reservationsByCustomerId.length === 0
                    ? await fetchContactFallback(email, phone)
                    : [];

                const reservations = (
                    reservationsByCustomerId.length > 0
                        ? reservationsByCustomerId
                        : fallbackReservations
                ).sort((a, b) => {
                    const da = new Date(a.date).getTime();
                    const db = new Date(b.date).getTime();
                    return db - da;
                });

                // ── Query orders by customerId ─────────────────────────────────
                const orders = await Nexus.adapter
                    .query<Order>("orders", {
                        where: [
                            {
                                field: "customerId",
                                operator: "==",
                                value: customerId,
                            },
                        ],
                        orderBy: { field: "createdAt", direction: "desc" },
                        limit: 100,
                    })
                    .catch(() => [] as Order[]);

                // ── Compute stats ──────────────────────────────────────────────
                const paidOrders = orders.filter(
                    (o) => o.status === "paid" || o.status === "served"
                );
                const totalMicrounits = sumOrderMicrounits(paidOrders);
                const avgSpendEuros =
                    paidOrders.length > 0
                        ? totalMicrounits / paidOrders.length / 1_000_000
                        : 0;

                const totalVisits = reservations.filter(
                    (r) =>
                        r.status === "arrived" ||
                        r.status === "seated" ||
                        r.status === "confirmed"
                ).length;

                const lastVisitDate = reservations[0]?.date ?? null;

                if (!cancelled) {
                    setState({
                        totalVisits,
                        avgSpendEuros,
                        lastVisitDate,
                        reservations,
                        loading: false,
                    });
                }
            } catch (err) {
                logger.warn('[VisitHistory] Chargement historique visites échoué', { customerId, error: err });
                if (!cancelled) setState((s) => ({ ...s, loading: false }));
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [customerId, email, phone]);

    if (state.loading) {
        return (
            <div className="py-8 text-center text-text-muted text-sm animate-pulse">
                Chargement de l'historique…
            </div>
        );
    }

    const recentReservations = state.reservations.slice(0, 5);

    return (
        <div className="space-y-4">
            {/* ── KPI strip ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard
                    icon={<Users className="w-4 h-4" />}
                    label="Visites"
                    value={String(state.totalVisits)}
                />
                <StatCard
                    icon={<CreditCard className="w-4 h-4" />}
                    label="Panier moyen"
                    value={
                        state.avgSpendEuros > 0
                            ? `${state.avgSpendEuros.toFixed(0)} €`
                            : "—"
                    }
                />
                <StatCard
                    icon={<Clock className="w-4 h-4" />}
                    label="Dernière visite"
                    value={state.lastVisitDate ? formatDate(state.lastVisitDate) : "—"}
                />
            </div>

            {/* ── Reservations list ─────────────────────────────────────── */}
            <div className="bg-surface-base rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <TrendingUp className="w-4 h-4 text-action-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                        5 dernières réservations
                    </span>
                </div>

                {recentReservations.length === 0 ? (
                    <div className="py-6 text-center text-sm text-text-muted">
                        Aucune réservation trouvée
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {recentReservations.map((res) => {
                            const covers = res.covers ?? res.partySize;
                            const statusLabel =
                                STATUS_LABELS[res.status] ?? res.status;
                            const statusColor =
                                STATUS_COLORS[res.status] ??
                                "bg-text-muted/10 text-text-muted";

                            return (
                                <li
                                    key={res.id}
                                    className="flex items-center justify-between px-4 py-3 gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Calendar className="w-4 h-4 shrink-0 text-text-muted" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {formatDate(res.date)}
                                                {res.time
                                                    ? ` · ${res.time}`
                                                    : ""}
                                            </p>
                                            <p className="text-xs text-text-muted flex items-center gap-1">
                                                <Receipt className="w-3 h-3" />
                                                {covers} couvert
                                                {covers > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}
                                    >
                                        {statusLabel}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="bg-surface-base rounded-xl border border-border p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-text-muted">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                    {label}
                </span>
            </div>
            <p className="text-lg font-bold text-text-primary">{value}</p>
        </div>
    );
}
