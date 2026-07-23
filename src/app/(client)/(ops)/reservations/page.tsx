"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import {
    startOfWeek,
    addDays,
    addWeeks,
    subWeeks,
    format,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    LayoutGrid,
    Users,
    Calendar,
    CalendarDays,
    Umbrella,
    UmbrellaOff,
    FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { useReservations, useCRM, useTables } from "@modules/ops";
import { useGroups } from "@/engines/ops/NexusOpsProvider";
import { useActionPermission } from "@/hooks/useActionPermission";
import { PinModal } from "@modules/commerce/ui/pos/PinModal";
import { DailyListView } from "@/components/reservations/DailyListView";
import { WeeklyView } from "@/components/reservations/WeeklyView";
import { GroupFormModal } from "@/components/reservations/GroupFormModal";
import { EventQuoteModal } from "@/components/reservations/EventQuoteModal";
import { ReservationCreateDialog } from "@/components/reservations/ReservationCreateDialog";
import { ReservationSidebar } from "@modules/commerce";
import { TableGrid } from "@modules/commerce";
import { CustomerCustomerView } from "@modules/commerce";
import { CustomerDetailPanel } from "@modules/commerce";

import { Nexus } from "@/lib/nexus/NexusAdapter";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { cn } from "@/lib/ui.foundations";
import { authedFetch } from "@/lib/client/authedFetch";

import type { Table, Reservation } from "@nexus/contracts";
import type { Table as OpsTable } from "@/domain/schemas/ops";
import type { Customer } from "@nexus/contracts";
import type { GroupFormData } from "@/components/reservations/GroupFormModal";

// ── Constants ──────────────────────────────────────────────────────────────
const TERRACE_ZONE_IDS = ["zone-terrasse", "terrace"];
const TERRASSE_SETTINGS_PATH = "settings/terrasse";

// ── Helpers ────────────────────────────────────────────────────────────────
function getWeekDays(anchor: Date): Date[] {
    const monday = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

interface ZoneTable {
    id: string;
    seats: number;
    type: "vip" | "terrace" | "standard";
    status: "available" | "occupied" | "reserved";
    number: string;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ReservationsPage() {
    // ── Section / view state ─────────────────────────────────────────────
    const [activeSection, setActiveSection] = useState<"reservations" | "customers" | "groups">("reservations");
    const [view, setView] = useState<"day" | "week">("day");

    // ── Date navigation ──────────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [weekOffset, setWeekOffset] = useState(0);
    const weekAnchor = useMemo(() => {
        const base = new Date(selectedDate);
        if (weekOffset > 0) return addWeeks(base, weekOffset);
        if (weekOffset < 0) return subWeeks(base, Math.abs(weekOffset));
        return base;
    }, [selectedDate, weekOffset]);
    const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);

    // ── UI state ─────────────────────────────────────────────────────────
    const [isSidebarVisible] = useState(true);
    const [isNewResOpen, setIsNewResOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isEventQuoteOpen, setIsEventQuoteOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [noShowConfirmId, setNoShowConfirmId] = useState<string | null>(null);

    // ── Terrasse toggle ──────────────────────────────────────────────────
    const [terraceClosed, setTerraceClosed] = useState(false);

    // ── PIN modal state ──────────────────────────────────────────────────
    const [pinModal, setPinModal] = useState<{
        open: boolean;
        action: "override_capacity" | "cancel_reservation" | null;
        reservationId?: string;
        onConfirm?: () => void;
    }>({ open: false, action: null });
    const [pinError, setPinError] = useState<string | undefined>();

    // ── RBAC hooks ───────────────────────────────────────────────────────
    const overrideCapacityPerm = useActionPermission("reservations", "override_capacity");
    const cancelResPerm = useActionPermission("reservations", "cancel_reservation");

    // ── Data hooks ───────────────────────────────────────────────────────
    const tenantId = useAtomValue(tenantIdAtom) as string;
    const {
        data: reservations = [],
        isLoading: reservationsLoading,
        markArrived,
        update: updateReservation,
        add: addReservation,
    } = useReservations();
    const { data: customers = [], isLoading: customersLoading } = useCRM();
    const { tables = [], isLoading: tablesLoading } = useTables();
    const isLoading = reservationsLoading || customersLoading || tablesLoading;
    const { data: groups = [] } = useGroups();

    // ── Load terrasse preference from Nexus ──────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const stored = await Nexus.adapter.get<{ open: boolean }>(
                    `tenants/${tenantId}/${TERRASSE_SETTINGS_PATH}`
                );
                if (stored != null && typeof stored.open === "boolean") {
                    setTerraceClosed(!stored.open);
                }
            } catch {
                // First load — no stored preference yet, default to open
            }
        };
        if (tenantId) load();
    }, [tenantId]);

    // ── Terrasse toggle handler ───────────────────────────────────────────
    const handleTerraceToggle = useCallback(async () => {
        const newClosed = !terraceClosed;
        setTerraceClosed(newClosed);
        try {
            await Nexus.adapter.set(`tenants/${tenantId}/${TERRASSE_SETTINGS_PATH}`, {
                open: !newClosed,
                updatedAt: new Date().toISOString(),
            });
            toast.success(newClosed ? "Terrasse fermée" : "Terrasse ouverte");
        } catch {
            toast.error("Impossible de sauvegarder la préférence terrasse");
        }
    }, [terraceClosed, tenantId]);

    // ── Filter reservations for the selected day ─────────────────────────
    const dayStr = format(selectedDate, "yyyy-MM-dd");
    const todayReservations = useMemo(
        () => reservations.filter((r) => r.date === dayStr),
        [reservations, dayStr]
    );

    // ── res-5: No-show tracking + CRM update ─────────────────────────────
    const handleMarkNoShow = useCallback(
        async (id: string) => {
            try {
                // Update reservation
                await updateReservation(id, {
                    status: "no_show",
                    noShowAt: Date.now(),
                } as Partial<Reservation> & { noShowAt: number });

                // Find customer in CRM by matching reservation
                const res = reservations.find((r) => r.id === id);
                if (res?.customerId) {
                    const crmRecord = customers.find((c) => c.id === res.customerId);
                    if (crmRecord) {
                        const currentNoShows = (crmRecord as Record<string, unknown>)["noShows"] as number ?? 0;
                        await Nexus.adapter.update(
                            `tenants/${tenantId}/ops_relations/${crmRecord.id}`,
                            {
                                noShows: currentNoShows + 1,
                                updatedAt: new Date().toISOString(),
                            }
                        );
                    }
                }
                toast.success("No-show enregistré");
            } catch {
                toast.error("Erreur lors de l'enregistrement du no-show");
            }
        },
        [reservations, customers, tenantId, updateReservation]
    );

    // ── rbac-3: Cancel with permission guard ─────────────────────────────
    const handleCancelReservation = useCallback(
        async (id: string) => {
            if (!cancelResPerm.allowed) {
                toast.error("Permission insuffisante pour annuler une réservation");
                return;
            }
            const doCancel = async () => {
                try {
                    await updateReservation(id, {
                        status: "cancelled",
                        cancelledAt: new Date().toISOString(),
                    } as Partial<Reservation> & { cancelledAt: string });
                    toast.success("Réservation annulée");
                } catch {
                    toast.error("Erreur lors de l'annulation");
                }
            };
            if (cancelResPerm.requiresPin) {
                setPinError(undefined);
                setPinModal({ open: true, action: "cancel_reservation", reservationId: id, onConfirm: doCancel });
            } else {
                await doCancel();
            }
        },
        [cancelResPerm, updateReservation]
    );

    // ── rbac-3: Override capacity guard ──────────────────────────────────
    // TODO(rbac-3): helper prêt mais non branché — reste à déclencher depuis
    // le flux de création quand une réservation dépasse la capacité d'une table.
    const _requestOverrideCapacity = useCallback(
        (onAllowed: () => void) => {
            if (!overrideCapacityPerm.allowed) {
                toast.error("Permission insuffisante pour dépasser la capacité");
                return;
            }
            if (overrideCapacityPerm.requiresPin) {
                setPinError(undefined);
                setPinModal({ open: true, action: "override_capacity", onConfirm: onAllowed });
            } else {
                onAllowed();
            }
        },
        [overrideCapacityPerm]
    );
    void _requestOverrideCapacity;

    const handlePinConfirm = useCallback(
        (_pin: string) => {
            // In production verify PIN server-side; here we accept any 4-digit code
            if (pinModal.onConfirm) {
                pinModal.onConfirm();
            }
            setPinModal({ open: false, action: null });
            setPinError(undefined);
        },
        [pinModal]
    );

    // ── res-3: Save reservation + send confirmation email ─────────────────
    const handleSaveReservation = useCallback(
        async (data: Partial<Reservation> & { suggestedTable?: OpsTable }) => {
            try {
                 
                const { suggestedTable: _st, ...resData } = data;
                await addReservation({
                    ...resData,
                    type: "reservation",
                    updatedAt: new Date().toISOString(),
                } as Parameters<typeof addReservation>[0]);

                toast.success(`Réservation confirmée pour ${resData.customerName}`);

                // Send confirmation email if customer has an email
                const customer = customers.find((c) => c.id === resData.customerId);
                if (customer?.email) {
                    try {
                        await authedFetch("/api/email/reservation-confirm", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                to: customer.email,
                                name: `${customer.firstName} ${customer.lastName}`,
                                date: resData.date,
                                time: resData.time,
                                covers: resData.covers,
                                restaurantName: "Restaurant OS",
                            }),
                        });
                    } catch {
                        // Email failure is non-blocking
                    }
                }
            } catch {
                toast.error("Erreur lors de la création de la réservation");
            }
        },
        [tenantId, customers, addReservation]
    );

    // ── res-7: Create group ───────────────────────────────────────────────
    const handleCreateGroup = useCallback(
        async (formData: GroupFormData) => {
            try {
                const arr = new Uint32Array(1);
                crypto.getRandomValues(arr);
                const id = `grp_${arr[0].toString(36)}`;
                await Nexus.adapter.set(`tenants/${tenantId}/ops_relations/${id}`, {
                    id,
                    name: formData.name,
                    minCovers: formData.minCovers,
                    maxCovers: formData.maxCovers,
                    notes: formData.notes,
                    type: "group",
                    status: "pending",
                    updatedAt: new Date().toISOString(),
                });
                toast.success(`Groupe "${formData.name}" créé`);
            } catch {
                toast.error("Erreur lors de la création du groupe");
                throw new Error("Nexus write failed");
            }
        },
        [tenantId]
    );

    // ── res-13: Realtime floor plan sync (60s interval) ──────────────────
    useEffect(() => {
        const syncFloorPlan = async () => {
            const now = Date.now();
            const in15Min = now + 15 * 60 * 1000;

            for (const res of reservations) {
                if (!res.tableId) continue;
                if (res.status === "cancelled" || res.status === "no_show") continue;

                const resDateTime = (() => {
                    try {
                        return new Date(`${res.date}T${res.time}:00`).getTime();
                    } catch {
                        return NaN;
                    }
                })();
                if (isNaN(resDateTime)) continue;

                const tablePath = `tenants/${tenantId}/ops_nodes/${res.tableId}`;

                if (res.status === "seated") {
                    await Nexus.adapter.update(tablePath, {
                        status: "occupied",
                        updatedAt: new Date().toISOString(),
                    });
                } else if ((res.status as string) === "completed") {
                    await Nexus.adapter.update(tablePath, {
                        status: "free",
                        updatedAt: new Date().toISOString(),
                    });
                } else if (resDateTime <= in15Min && resDateTime >= now) {
                    // Reservation starting in <= 15 min — mark table as reserved
                    await Nexus.adapter.update(tablePath, {
                        status: "reserved",
                        updatedAt: new Date().toISOString(),
                    });
                }
            }
        };

        if (tenantId && reservations.length > 0) {
            syncFloorPlan();
            const interval = setInterval(syncFloorPlan, 60_000);
            return () => clearInterval(interval);
        }
    }, [reservations, tenantId]);

    // ── Table data for the floor plan grid ───────────────────────────────
    const tablesByZone = useMemo(
        () =>
            tables.reduce((acc: Record<string, ZoneTable[]>, table: Table) => {
                const zone = table.zoneId ?? "STANDARD";
                if (!acc[zone]) acc[zone] = [];
                acc[zone].push({
                    id: table.number,
                    seats: table.seats ?? 4,
                    type:
                        table.zoneId === "VIP"
                            ? "vip"
                            : TERRACE_ZONE_IDS.some((z) => table.zoneId?.toLowerCase().includes(z))
                            ? "terrace"
                            : "standard",
                    status:
                        table.status === "free"
                            ? "available"
                            : table.status === "seated"
                            ? "occupied"
                            : "reserved",
                    number: table.number,
                });
                return acc;
            }, {}),
        [tables]
    );

    // ── Week navigator label ─────────────────────────────────────────────
    const weekLabel = useMemo(() => {
        const start = weekDays[0];
        const end = weekDays[6];
        return `${format(start, "d MMM", { locale: fr })} — ${format(end, "d MMM yyyy", { locale: fr })}`;
    }, [weekDays]);

    const displayDate = format(selectedDate, "EEEE d MMMM", { locale: fr });

    // ── OpsTable type cast for ReservationCreateDialog ───────────────────
    const opsTables = tables as unknown as OpsTable[];

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden">

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap items-center justify-between gap-4 bg-bg-secondary/50 backdrop-blur-md border-b border-border px-6 py-3 z-40 shrink-0 sticky top-0"
            >
                {/* Left side */}
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Section tabs */}
                    <div className="flex items-center bg-bg-tertiary p-1 rounded-full border border-border">
                        {(["reservations", "customers", "groups"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setActiveSection(s)}
                                className={cn(
                                    "h-9 px-5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    activeSection === s
                                        ? "bg-bg-primary text-text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                {s === "reservations" ? (
                                    <><LayoutGrid className="w-3 h-3" /> Plan</>
                                ) : s === "customers" ? (
                                    <><Users className="w-3 h-3" /> Clients</>
                                ) : (
                                    <><Calendar className="w-3 h-3" /> Groupes</>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Date navigator (day view) */}
                    {view === "day" && activeSection === "reservations" && (
                        <div className="flex items-center gap-3 bg-bg-tertiary/50 px-4 py-2 rounded-full border border-border/50">
                            <button
                                onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
                                className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-serif font-medium italic text-text-primary capitalize min-w-[140px] text-center">
                                {displayDate}
                            </span>
                            <button
                                onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                                className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Week navigator (week view) */}
                    {view === "week" && activeSection === "reservations" && (
                        <div className="flex items-center gap-3 bg-bg-tertiary/50 px-4 py-2 rounded-full border border-border/50">
                            <button
                                onClick={() => setWeekOffset((o) => o - 1)}
                                className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-serif italic text-text-primary min-w-[180px] text-center">
                                {weekLabel}
                            </span>
                            <button
                                onClick={() => setWeekOffset((o) => o + 1)}
                                className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* res-15: Terrasse toggle */}
                    <button
                        onClick={handleTerraceToggle}
                        title={terraceClosed ? "Terrasse fermée — cliquer pour ouvrir" : "Terrasse ouverte — cliquer pour fermer"}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                            terraceClosed
                                ? "bg-status-error/10 border-status-error/30 text-status-error hover:bg-status-error/20"
                                : "bg-status-success/10 border-status-success/30 text-status-success hover:bg-status-success/20"
                        )}
                    >
                        {terraceClosed ? (
                            <><UmbrellaOff className="w-3.5 h-3.5" /> Terrasse fermée</>
                        ) : (
                            <><Umbrella className="w-3.5 h-3.5" /> Terrasse ouverte</>
                        )}
                    </button>

                    {/* View switcher */}
                    {activeSection === "reservations" && (
                        <div className="flex items-center bg-bg-tertiary p-1 rounded-full border border-border">
                            {(["day", "week"] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={cn(
                                        "h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                                        view === v
                                            ? "bg-bg-primary text-text-primary shadow-sm"
                                            : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    {v === "day" ? <><Calendar className="w-3 h-3" /> Jour</> : <><CalendarDays className="w-3 h-3" /> Semaine</>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* New reservation / new group */}
                    {activeSection === "reservations" && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setIsEventQuoteOpen(true)}
                                className="h-10 px-5 bg-bg-secondary text-text-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm flex items-center gap-2 border border-border hover:border-accent/40 hover:text-accent transition-all"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Devis événement
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setIsNewResOpen(true)}
                                className="h-10 px-6 bg-accent text-bg-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center gap-2 border border-amber-300/20 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Réserver
                            </motion.button>
                        </>
                    )}
                    {activeSection === "groups" && (
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setIsGroupModalOpen(true)}
                            className="h-10 px-6 bg-accent text-bg-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/10 flex items-center gap-2 border border-amber-300/20 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Nouveau groupe
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* ── Main content ───────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* RESERVATIONS section */}
                    {activeSection === "reservations" && (
                        <motion.div
                            key={`res-${view}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex overflow-hidden"
                        >
                            {view === "day" ? (
                                <>
                                    {/* Sidebar */}
                                    <ReservationSidebar
                                        isVisible={isSidebarVisible}
                                        reservations={reservations}
                                        onMarkArrived={markArrived}
                                    />

                                    {/* Day list + floor plan */}
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <DailyListView
                                            reservations={todayReservations}
                                            isLoading={isLoading}
                                            onMarkArrived={markArrived}
                                            onMarkNoShow={handleMarkNoShow}
                                            onCancel={handleCancelReservation}
                                            noShowConfirmId={noShowConfirmId}
                                            setNoShowConfirmId={setNoShowConfirmId}
                                        />
                                    </div>

                                    {/* Floor plan (right panel) */}
                                    <div className="hidden xl:flex w-[420px] border-l border-border overflow-auto p-6 bg-bg-primary shrink-0">
                                        <TableGrid
                                            tables={tablesByZone}
                                            onTableClick={() => setIsNewResOpen(true)}
                                        />
                                    </div>
                                </>
                            ) : (
                                /* Week view */
                                <WeeklyView
                                    reservations={reservations}
                                    weekDays={weekDays}
                                    selectedDate={selectedDate}
                                    onDateClick={(d) => {
                                        setSelectedDate(d);
                                        setView("day");
                                    }}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* CUSTOMERS section */}
                    {activeSection === "customers" && (
                        <motion.div
                            key="crm-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 overflow-hidden"
                        >
                            <CustomerCustomerView
                                customers={customers}
                                isLoading={isLoading}
                                onCustomerClick={(c) => setSelectedCustomer(c)}
                            />
                        </motion.div>
                    )}

                    {/* GROUPS section */}
                    {activeSection === "groups" && (
                        <motion.div
                            key="groups-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 overflow-y-auto p-6"
                        >
                            {groups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                                    <div className="w-16 h-16 rounded-[2rem] bg-bg-tertiary flex items-center justify-center mb-6 border border-border">
                                        <Users strokeWidth={1} className="w-8 h-8 text-text-muted/40" />
                                    </div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-4">
                                        Aucun groupe enregistré
                                    </p>
                                    <button
                                        onClick={() => setIsGroupModalOpen(true)}
                                        className="h-10 px-6 bg-accent text-bg-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/10 flex items-center gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Créer un groupe
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groups.map((g) => (
                                        <div
                                            key={g.id}
                                            className="bg-bg-secondary border border-border rounded-2xl p-5 hover:border-accent/30 transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                                    <Users className="w-5 h-5 text-accent" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted border border-border rounded-full px-2 py-0.5">
                                                    {g.status ?? "en attente"}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-text-primary text-sm truncate">{g.name}</h3>
                                            {Boolean((g as Record<string, unknown>)["minCovers"]) && (
                                                <p className="text-[10px] text-text-muted mt-1">
                                                    {String((g as Record<string, unknown>)["minCovers"] ?? "")}–{String((g as Record<string, unknown>)["maxCovers"] ?? "")} couverts
                                                </p>
                                            )}
                                            {Boolean((g as Record<string, unknown>)["notes"]) && (
                                                <p className="text-[10px] text-text-muted mt-2 line-clamp-2 italic">
                                                    {String((g as Record<string, unknown>)["notes"] ?? "")}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Customer detail panel ────────────────────────────── */}
            {selectedCustomer && (
                <CustomerDetailPanel
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    onNewReservation={() => {
                        setSelectedCustomer(null);
                        setActiveSection("reservations");
                        setIsNewResOpen(true);
                    }}
                />
            )}

            {/* ── New Reservation Dialog ───────────────────────────── */}
            <ReservationCreateDialog
                isOpen={isNewResOpen}
                onClose={() => setIsNewResOpen(false)}
                onSave={handleSaveReservation}
                customers={customers}
                tables={opsTables}
                terraceClosed={terraceClosed}
            />

            {/* ── Group Modal ──────────────────────────────────────── */}
            <GroupFormModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onSave={handleCreateGroup}
            />

            {/* ── Event Quote Modal (res-8) ─────────────────────── */}
            <EventQuoteModal
                isOpen={isEventQuoteOpen}
                onClose={() => setIsEventQuoteOpen(false)}
                tenantId={tenantId}
            />

            {/* ── PIN Modal (rbac-3) ───────────────────────────────── */}
            <PinModal
                isOpen={pinModal.open}
                title={
                    pinModal.action === "override_capacity"
                        ? "Dépassement capacité"
                        : "Annulation réservation"
                }
                error={pinError}
                onConfirm={handlePinConfirm}
                onClose={() => {
                    setPinModal({ open: false, action: null });
                    setPinError(undefined);
                }}
            />
        </div>
    );
}

// Export the requestOverrideCapacity helper so child components could call it
// (not exported — internal page logic; expose via context if needed)
