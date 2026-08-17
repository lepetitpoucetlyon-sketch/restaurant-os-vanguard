"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { startOfWeek, addDays, addWeeks, subWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useReservations, useGroups } from '../../../../ops/providers/hooks/commerceHooks';
import { useTables } from '../../../../ops/providers/hooks/floorHooks';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
import { useCRM } from '../../../../ops/providers/hooks/commerceHooks';
import { useActionPermission } from "@/shared/hooks/useActionPermission";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { authedFetch } from "@/lib/client/authedFetch";

import type { Table, Reservation } from "@nexus/contracts";
import type { Table as OpsTable } from "@/modules/ops";
import type { Customer } from "@nexus/contracts";
import type { GroupFormData } from "../components/GroupFormModal";
import { JsonObject } from "@/shared/types/json";

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

    // Émission EventBus (P0-1.8 & 7.3)
    await NexusEventBus.emitDurable('reservation.no_show', {
        v: 1,
        tenantId,
        reservationId,
        customerId: res?.customerId,
    });

    if (!res?.customerId) return;
    const crmRecord = customers.find((c: Customer) => c.id === res.customerId);
    if (!crmRecord) return;
    const currentNoShows = (crmRecord as JsonObject)["noShows"] as number ?? 0;
    await Nexus.adapter.update(`tenants/${tenantId}/ops_relations/${crmRecord.id}`, { noShows: currentNoShows + 1, updatedAt: new Date().toISOString() });
}

async function cancelReservationById(
    id: string,
    tenantId: string,
    updateReservation: (id: string, data: Partial<Reservation> & Record<string, unknown>) => Promise<void>
): Promise<void> {
    try {
        await updateReservation(id, { status: "cancelled", cancelledAt: new Date().toISOString() } as Partial<Reservation> & { cancelledAt: string });
        
        // Émission EventBus (P0-1.8)
        await NexusEventBus.emitDurable('reservation.cancelled', {
            v: 1,
            tenantId,
            reservationId: id,
            reason: 'Annulation client',
        });

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
        const resTime = new Date(`${res.date}T${res.time || "12:00"}`).getTime();
        const path = `tenants/${tenantId}/ops_tables/${res.tableId}`;
        if (isNaN(resTime)) continue;

        if (res.status === "seated") {
            updates.push(Nexus.adapter.update(path, { isOccupied: true, activeReservationId: res.id, status: "occupied", updatedAt: ts }));
        } else if (resTime >= now && resTime <= in15Min) {
            updates.push(Nexus.adapter.update(path, { status: "reserved", activeReservationId: res.id, updatedAt: ts }));
        }
    }
    await Promise.allSettled(updates);
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
            setPinModal({ open: true, action: "cancel_reservation", reservationId: id, onConfirm: () => cancelReservationById(id, tenantId, updateReservation) });
        } else {
            await cancelReservationById(id, tenantId, updateReservation);
        }
    }, [cancelResPerm, tenantId, updateReservation]);

    const handleSaveReservation = useCallback(async (data: Partial<Reservation> & { suggestedTable?: OpsTable }) => {
        try {
            const { suggestedTable: _st, ...resData } = data;
            const newResId = Nexus.adapter.generateId(`tenants/${tenantId}/ops_relations`);
            await addReservation({ ...resData, id: newResId, type: "reservation", updatedAt: new Date().toISOString() } as Parameters<typeof addReservation>[0]);

            // Émission EventBus (P0-1.8)
            await NexusEventBus.emitDurable('reservation.created', {
                v: 1,
                tenantId,
                reservationId: newResId,
                guestName: resData.customerName ?? 'Client Inconnu',
                partySize: resData.covers ?? 1,
                scheduledAt: Date.now(),
                hasDeposit: false,
            });

            toast.success(`Réservation confirmée pour ${resData.customerName}`);

            // Gate acompte grands groupes — vérifie si empreinte requise (non-bloquant)
            const covers = resData.covers ?? 0;
            if (covers >= 1) {
                authedFetch('/api/reservations/card-imprint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'setup', reservationId: newResId, tenantId, covers }),
                }).then(r => r.json()).then((result: { required?: boolean }) => {
                    if (result.required) {
                        toast.info(`Empreinte bancaire requise pour ce groupe (${covers} couverts) — à collecter dans la fiche de réservation`);
                        Nexus.adapter.update(`tenants/${tenantId}/reservations/${newResId}`, {
                            requiresCardImprint: true,
                        }).catch(() => { /* non-critique */ });
                    }
                }).catch(() => { /* non-bloquant */ });
            }

            const customer = customers.find((c: Customer) => c.id === resData.customerId);
            if (customer?.email) {
                authedFetch("/api/email/reservation-confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ to: customer.email, name: `${customer.firstName} ${customer.lastName}`, date: resData.date, time: resData.time, covers: resData.covers, businessName: "Restaurant OS" }),
                }).catch(() => { /* email failure is non-blocking */ });
            }
        } catch { toast.error("Erreur lors de la création de la réservation"); }
    }, [tenantId, customers, addReservation]);

    const handleUpdateReservation = useCallback(async (id: string, updates: Partial<Reservation>) => {
        try {
            await updateReservation(id, updates);
            await NexusEventBus.emitDurable('reservation.updated', {
                v: 1,
                tenantId,
                reservationId: id,
                updates: updates as Record<string, unknown>,
            });
            toast.success("Réservation mise à jour");
        } catch { toast.error("Erreur lors de la mise à jour"); }
    }, [updateReservation, tenantId]);

    const handleCreateGroup = useCallback(async (formData: GroupFormData) => {
        try {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            const id = `grp_${arr[0].toString(36)}`;
            await Nexus.adapter.set(`tenants/${tenantId}/ops_relations/${id}`, { id, name: formData.name, minCovers: formData.minCovers, maxCovers: formData.maxCovers, notes: formData.notes, type: "group", status: "pending", updatedAt: new Date().toISOString() });
            toast.success(`Groupe "${formData.name}" créé`);
        } catch { toast.error("Erreur lors de la création du groupe"); throw new Error("Nexus write failed"); }
    }, [tenantId]);

    const handleMarkArrived = useCallback(async (id: string) => {
        try {
            await markArrived(id);
            const res = reservations.find((r: Reservation) => r.id === id);
            const customer = customers.find((c: Customer) => c.id === res?.customerId);

            await NexusEventBus.emitDurable('reservation.matched', {
                v: 1,
                tenantId,
                reservationId: id,
                customerId: res?.customerId,
                tableId: res?.tableId ?? 'table_default',
                allergens: customer ? ((customer as Record<string, unknown>).allergens as string[] ?? []) : [],
                covers: res?.covers ?? 2,
                matchedAt: Date.now(),
            });

            toast.success("Client accueilli à la table");
        } catch { toast.error("Erreur lors de la validation d'arrivée"); }
    }, [markArrived, reservations, customers, tenantId]);

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
        isLoading, markArrived: handleMarkArrived,
        // computed
        weekDays, todayReservations, tablesByZone, weekLabel, displayDate,
        // handlers
        handleTerraceToggle,
        handleMarkNoShow,
        handleCancelReservation,
        handleSaveReservation,
        handleUpdateReservation,
        handleCreateGroup,
        handlePinConfirm,
        // permissions
        overrideCapacityPerm,
    };
}
