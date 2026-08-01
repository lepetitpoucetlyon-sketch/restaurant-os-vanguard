"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { startOfWeek, addDays, addWeeks, subWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { useReservations, useTables, useGroups } from "@/modules/ops/providers";
import { useCRM } from "@/modules/commerce";
import { useActionPermission } from "@/shared/hooks/useActionPermission";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { authedFetch } from "@/lib/client/authedFetch";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";

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

export function computeWeekAnchor(base: Date, weekOffset: number): Date {
    if (weekOffset > 0) return addWeeks(base, weekOffset);
    if (weekOffset < 0) return subWeeks(base, Math.abs(weekOffset));
    return base;
}

export function groupTablesByZone(tables: Table[]): Record<string, ZoneTable[]> {
    return tables.reduce((acc: Record<string, ZoneTable[]>, table: Table) => {
        const zone = table.zoneId ?? "STANDARD";
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(mapTableToZoneTable(table));
        return acc;
    }, {});
}

function applyTerraceState(stored: { open?: boolean } | null, setTerraceClosed: (v: boolean) => void): void {
    if (stored != null && typeof stored.open === "boolean") setTerraceClosed(!stored.open);
}

function getWeekDays(anchor: Date): Date[] {
    const monday = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function mapTableToZoneTable(table: Table): ZoneTable {
    const isTerrace = TERRACE_ZONE_IDS.some((z) => table.zoneId?.toLowerCase().includes(z));
    return {
        id: table.number,
        seats: table.seats ?? 4,
        type: table.zoneId === "VIP" ? "vip" : isTerrace ? "terrace" : "standard",
        status: table.status === "free" ? "available" : table.status === "seated" ? "occupied" : "reserved",
        number: table.number,
    };
}

function computeTableStatus(res: Reservation, now: number, in15Min: number): string | null {
    const resDateTime = (() => { try { return new Date(`${res.date}T${res.time}:00`).getTime(); } catch { return NaN; } })();
    if (isNaN(resDateTime)) return null;
    if (res.status === "seated") return "occupied";
    if ((res.status as string) === "completed") return "free";
    if (resDateTime <= in15Min && resDateTime >= now) return "reserved";
    return null;
}

async function recordNoShow(
    reservationId: string, reservations: Reservation[], customers: Customer[],
    tenantId: string, updateReservation: (id: string, data: Partial<Reservation> & Record<string, unknown>) => Promise<void>
) {
    await updateReservation(reservationId, { status: "no_show", noShowAt: Date.now() } as Partial<Reservation> & { noShowAt: number });
    const res = reservations.find((r: Reservation) => r.id === reservationId);
    if (!res?.customerId) return;
    const crmRecord = customers.find((c: Customer) => c.id === res.customerId);
    if (!crmRecord) return;
    const currentNoShows = (crmRecord as Record<string, unknown>)["noShows"] as number ?? 0;
    await Nexus.adapter.update(`tenants/${tenantId}/ops_relations/${crmRecord.id}`, { noShows: currentNoShows + 1, updatedAt: new Date().toISOString() });
    await NexusEventBus.emit('reservation.no_show', { reservationId, customerId: res.customerId, tenantId });
}

async function cancelReservationById(
    id: string,
    updateReservation: (id: string, data: Partial<Reservation> & Record<string, unknown>) => Promise<void>
): Promise<void> {
    try {
        await updateReservation(id, { status: "cancelled", cancelledAt: new Date().toISOString() } as Partial<Reservation> & { cancelledAt: string });
        toast.success("Réservation annulée");
    } catch { toast.error("Erreur lors de l'annulation"); }
}

async function syncFloorPlan(reservations: Reservation[], tenantId: string) {
    const now = Date.now();
    const in15Min = now + 15 * 60 * 1000;
    const ts = new Date().toISOString();
    const updates: Array<Promise<void>> = [];
    for (const res of reservations) {
        if (!res.tableId || res.status === "cancelled" || res.status === "no_show") continue;
        const newStatus = computeTableStatus(res, now, in15Min);
        if (newStatus) {
            updates.push(Nexus.adapter.update(`tenants/${tenantId}/ops_nodes/${res.tableId}`, { status: newStatus, updatedAt: ts }));
        }
    }
    await Promise.all(updates);
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
    const isLoading = [reservationsLoading, customersLoading, tablesLoading].some(Boolean);

    const weekAnchor = useMemo(() => computeWeekAnchor(new Date(selectedDate), weekOffset), [selectedDate, weekOffset]);

    const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
    const dayStr = format(selectedDate, "yyyy-MM-dd");
    const todayReservations = useMemo(() => reservations.filter((r: Reservation) => r.date === dayStr), [reservations, dayStr]);
    const weekLabel = useMemo(() => {
        const start = weekDays[0];
        const end = weekDays[6];
        return `${format(start, "d MMM", { locale: fr })} — ${format(end, "d MMM yyyy", { locale: fr })}`;
    }, [weekDays]);
    const displayDate = format(selectedDate, "EEEE d MMMM", { locale: fr });
    const opsTables = tables as unknown as OpsTable[];

    const tablesByZone = useMemo(() => groupTablesByZone(tables), [tables]);

    useEffect(() => {
        if (!tenantId) return;
        Nexus.adapter.get<{ open: boolean }>(`tenants/${tenantId}/${TERRASSE_SETTINGS_PATH}`)
            .then((stored) => applyTerraceState(stored, setTerraceClosed))
            .catch(() => { /* no stored preference yet */ });
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || reservations.length === 0) return;
        const run = () => syncFloorPlan(reservations, tenantId);
        run();
        const interval = setInterval(run, 60_000);
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
            await recordNoShow(id, reservations, customers, tenantId, updateReservation);
            toast.success("No-show enregistré");
        } catch { toast.error("Erreur lors de l'enregistrement du no-show"); }
    }, [reservations, customers, tenantId, updateReservation]);

    const handleCancelReservation = useCallback(async (id: string) => {
        if (!cancelResPerm.allowed) { toast.error("Permission insuffisante pour annuler une réservation"); return; }
        if (cancelResPerm.requiresPin) {
            setPinError(undefined);
            setPinModal({ open: true, action: "cancel_reservation", reservationId: id, onConfirm: () => cancelReservationById(id, updateReservation) });
        } else {
            await cancelReservationById(id, updateReservation);
        }
    }, [cancelResPerm, updateReservation]);

    const handleSaveReservation = useCallback(async (data: Partial<Reservation> & { suggestedTable?: OpsTable }) => {
        try {
            const { suggestedTable: _st, ...resData } = data;
            await addReservation({ ...resData, type: "reservation", updatedAt: new Date().toISOString() } as Parameters<typeof addReservation>[0]);
            toast.success(`Réservation confirmée pour ${resData.customerName}`);
            const customer = customers.find((c: Customer) => c.id === resData.customerId);
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
