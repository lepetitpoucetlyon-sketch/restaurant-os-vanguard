"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { startOfWeek, addDays, addWeeks, subWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { useReservations, useCRM, useTables } from "@modules/ops";
import { useGroups } from "@/engines/ops/NexusOpsProvider";
import { useActionPermission } from "@/hooks/useActionPermission";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { authedFetch } from "@/lib/client/authedFetch";

import type { Table, Reservation } from "@nexus/contracts";
import type { Table as OpsTable } from "@/domain/schemas/ops";
import type { Customer } from "@nexus/contracts";
import type { GroupFormData } from "@/modules/commerce/reservations/components/GroupFormModal";

const TERRACE_ZONE_IDS = ["zone-terrasse", "terrace"];
const TERRASSE_SETTINGS_PATH = "settings/terrasse";

export interface ZoneTable {
    id: string;
    seats: number;
    type: "vip" | "terrace" | "standard";
    status: "available" | "occupied" | "reserved";
    number: string;
}

function getWeekDays(anchor: Date): Date[] {
    const monday = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function useReservationsPage() {
    const [activeSection, setActiveSection] = useState<"reservations" | "customers" | "groups">("reservations");
    const [view, setView] = useState<"day" | "week">("day");
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [weekOffset, setWeekOffset] = useState(0);
    const [isNewResOpen, setIsNewResOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isEventQuoteOpen, setIsEventQuoteOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [noShowConfirmId, setNoShowConfirmId] = useState<string | null>(null);
    const [terraceClosed, setTerraceClosed] = useState(false);
    const [pinModal, setPinModal] = useState<{
        open: boolean;
        action: "override_capacity" | "cancel_reservation" | null;
        reservationId?: string;
        onConfirm?: () => void;
    }>({ open: false, action: null });
    const [pinError, setPinError] = useState<string | undefined>();

    const overrideCapacityPerm = useActionPermission("reservations", "override_capacity");
    const cancelResPerm = useActionPermission("reservations", "cancel_reservation");

    const tenantId = useAtomValue(tenantIdAtom) as string;
    const { data: reservations = [], isLoading: reservationsLoading, markArrived, update: updateReservation, add: addReservation } = useReservations();
    const { data: customers = [], isLoading: customersLoading } = useCRM();
    const { tables = [], isLoading: tablesLoading } = useTables();
    const { data: groups = [] } = useGroups();
    const isLoading = reservationsLoading || customersLoading || tablesLoading;

    const weekAnchor = useMemo(() => {
        const base = new Date(selectedDate);
        if (weekOffset > 0) return addWeeks(base, weekOffset);
        if (weekOffset < 0) return subWeeks(base, Math.abs(weekOffset));
        return base;
    }, [selectedDate, weekOffset]);

    const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
    const dayStr = format(selectedDate, "yyyy-MM-dd");
    const todayReservations = useMemo(() => reservations.filter((r) => r.date === dayStr), [reservations, dayStr]);
    const weekLabel = useMemo(() => {
        const start = weekDays[0];
        const end = weekDays[6];
        return `${format(start, "d MMM", { locale: fr })} — ${format(end, "d MMM yyyy", { locale: fr })}`;
    }, [weekDays]);
    const displayDate = format(selectedDate, "EEEE d MMMM", { locale: fr });
    const opsTables = tables as unknown as OpsTable[];

    const tablesByZone = useMemo(
        () => tables.reduce((acc: Record<string, ZoneTable[]>, table: Table) => {
            const zone = table.zoneId ?? "STANDARD";
            if (!acc[zone]) acc[zone] = [];
            acc[zone].push({
                id: table.number,
                seats: table.seats ?? 4,
                type: table.zoneId === "VIP" ? "vip"
                    : TERRACE_ZONE_IDS.some((z) => table.zoneId?.toLowerCase().includes(z)) ? "terrace"
                    : "standard",
                status: table.status === "free" ? "available" : table.status === "seated" ? "occupied" : "reserved",
                number: table.number,
            });
            return acc;
        }, {}),
        [tables]
    );

    useEffect(() => {
        if (!tenantId) return;
        Nexus.adapter.get<{ open: boolean }>(`tenants/${tenantId}/${TERRASSE_SETTINGS_PATH}`)
            .then((stored) => { if (stored != null && typeof stored.open === "boolean") setTerraceClosed(!stored.open); })
            .catch(() => { /* no stored preference yet */ });
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || reservations.length === 0) return;
        const syncFloorPlan = async () => {
            const now = Date.now();
            const in15Min = now + 15 * 60 * 1000;
            for (const res of reservations) {
                if (!res.tableId) continue;
                if (res.status === "cancelled" || res.status === "no_show") continue;
                const resDateTime = (() => { try { return new Date(`${res.date}T${res.time}:00`).getTime(); } catch { return NaN; } })();
                if (isNaN(resDateTime)) continue;
                const tablePath = `tenants/${tenantId}/ops_nodes/${res.tableId}`;
                if (res.status === "seated") {
                    await Nexus.adapter.update(tablePath, { status: "occupied", updatedAt: new Date().toISOString() });
                } else if ((res.status as string) === "completed") {
                    await Nexus.adapter.update(tablePath, { status: "free", updatedAt: new Date().toISOString() });
                } else if (resDateTime <= in15Min && resDateTime >= now) {
                    await Nexus.adapter.update(tablePath, { status: "reserved", updatedAt: new Date().toISOString() });
                }
            }
        };
        syncFloorPlan();
        const interval = setInterval(syncFloorPlan, 60_000);
        return () => clearInterval(interval);
    }, [reservations, tenantId]);

    const handleTerraceToggle = useCallback(async () => {
        const newClosed = !terraceClosed;
        setTerraceClosed(newClosed);
        try {
            await Nexus.adapter.set(`tenants/${tenantId}/${TERRASSE_SETTINGS_PATH}`, { open: !newClosed, updatedAt: new Date().toISOString() });
            toast.success(newClosed ? "Terrasse fermée" : "Terrasse ouverte");
        } catch {
            toast.error("Impossible de sauvegarder la préférence terrasse");
        }
    }, [terraceClosed, tenantId]);

    const handleMarkNoShow = useCallback(async (id: string) => {
        try {
            await updateReservation(id, { status: "no_show", noShowAt: Date.now() } as Partial<Reservation> & { noShowAt: number });
            const res = reservations.find((r) => r.id === id);
            if (res?.customerId) {
                const crmRecord = customers.find((c) => c.id === res.customerId);
                if (crmRecord) {
                    const currentNoShows = (crmRecord as Record<string, unknown>)["noShows"] as number ?? 0;
                    await Nexus.adapter.update(`tenants/${tenantId}/ops_relations/${crmRecord.id}`, { noShows: currentNoShows + 1, updatedAt: new Date().toISOString() });
                }
            }
            toast.success("No-show enregistré");
        } catch {
            toast.error("Erreur lors de l'enregistrement du no-show");
        }
    }, [reservations, customers, tenantId, updateReservation]);

    const handleCancelReservation = useCallback(async (id: string) => {
        if (!cancelResPerm.allowed) { toast.error("Permission insuffisante pour annuler une réservation"); return; }
        const doCancel = async () => {
            try {
                await updateReservation(id, { status: "cancelled", cancelledAt: new Date().toISOString() } as Partial<Reservation> & { cancelledAt: string });
                toast.success("Réservation annulée");
            } catch { toast.error("Erreur lors de l'annulation"); }
        };
        if (cancelResPerm.requiresPin) {
            setPinError(undefined);
            setPinModal({ open: true, action: "cancel_reservation", reservationId: id, onConfirm: doCancel });
        } else {
            await doCancel();
        }
    }, [cancelResPerm, updateReservation]);

    const handleSaveReservation = useCallback(async (data: Partial<Reservation> & { suggestedTable?: OpsTable }) => {
        try {
            const { suggestedTable: _st, ...resData } = data;
            await addReservation({ ...resData, type: "reservation", updatedAt: new Date().toISOString() } as Parameters<typeof addReservation>[0]);
            toast.success(`Réservation confirmée pour ${resData.customerName}`);
            const customer = customers.find((c) => c.id === resData.customerId);
            if (customer?.email) {
                authedFetch("/api/email/reservation-confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ to: customer.email, name: `${customer.firstName} ${customer.lastName}`, date: resData.date, time: resData.time, covers: resData.covers, restaurantName: "Restaurant OS" }),
                }).catch(() => { /* email failure is non-blocking */ });
            }
        } catch { toast.error("Erreur lors de la création de la réservation"); }
    }, [tenantId, customers, addReservation]);

    const handleCreateGroup = useCallback(async (formData: GroupFormData) => {
        try {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            const id = `grp_${arr[0].toString(36)}`;
            await Nexus.adapter.set(`tenants/${tenantId}/ops_relations/${id}`, { id, name: formData.name, minCovers: formData.minCovers, maxCovers: formData.maxCovers, notes: formData.notes, type: "group", status: "pending", updatedAt: new Date().toISOString() });
            toast.success(`Groupe "${formData.name}" créé`);
        } catch { toast.error("Erreur lors de la création du groupe"); throw new Error("Nexus write failed"); }
    }, [tenantId]);

    const handlePinConfirm = useCallback((_pin: string) => {
        pinModal.onConfirm?.();
        setPinModal({ open: false, action: null });
        setPinError(undefined);
    }, [pinModal]);

    return {
        // state
        activeSection, setActiveSection,
        view, setView,
        selectedDate, setSelectedDate,
        weekOffset, setWeekOffset,
        isNewResOpen, setIsNewResOpen,
        isGroupModalOpen, setIsGroupModalOpen,
        isEventQuoteOpen, setIsEventQuoteOpen,
        selectedCustomer, setSelectedCustomer,
        noShowConfirmId, setNoShowConfirmId,
        terraceClosed,
        pinModal, setPinModal,
        pinError, setPinError,
        // data
        reservations, customers, tables, groups, opsTables,
        isLoading, markArrived,
        // computed
        weekDays, todayReservations, tablesByZone, weekLabel, displayDate,
        // handlers
        handleTerraceToggle,
        handleMarkNoShow,
        handleCancelReservation,
        handleSaveReservation,
        handleCreateGroup,
        handlePinConfirm,
        // permissions
        overrideCapacityPerm,
    };
}
