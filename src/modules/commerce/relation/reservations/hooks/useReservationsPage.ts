"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { useReservations, useGroups, useCRM } from '../../../../ops/providers/hooks/commerceHooks';
import { useTables } from '../../../../ops/providers/hooks/floorHooks';
import { useActionPermission } from "@/shared/hooks/useActionPermission";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { authedFetch } from "@/lib/client/authedFetch";

import type { Reservation, Customer } from "@nexus/contracts";
import type { Table as OpsTable } from "@/modules/ops";
import type { GroupFormData } from "../components/GroupFormModal";

import {
    type ZoneTable,
    TERRASSE_SETTINGS_PATH,
    computeWeekAnchor,
    mapTableToZoneTable,
    groupTablesByZone,
    applyTerraceState,
    getWeekDays,
    computeTableStatus,
    recordNoShow,
    cancelReservationById,
    syncFloorPlan,
} from "./reservationsPageHelpers";

export type { ZoneTable };
export { computeWeekAnchor, mapTableToZoneTable, groupTablesByZone, getWeekDays, computeTableStatus };

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

            await NexusEventBus.emitDurable('reservation.created', {
                v: 1,
                tenantId,
                reservationId: newResId,
                guestName: resData.customerName ?? 'Client Inconnu',
                partySize: resData.covers ?? 1,
                scheduledAt: Date.now(),
                hasDeposit: false,
            });

            // PLAN LOGIQUE MÉTIER LOT C.2 (P1-9) : le parcours interne considère
            // une réservation créée comme immédiatement confirmée (pas de workflow
            // d'approbation). AVANT, seul AntiCorruptionLayerHandler (canaux
            // externes type TheFork) émettait reservation.confirmed — la
            // notification cuisine ne partait donc que pour les réservations
            // externes. Corrigé : émission systématique après création.
            await NexusEventBus.emitDurable('reservation.confirmed', {
                v: 1,
                tenantId,
                reservationId: newResId,
                customerName: resData.customerName ?? 'Client Inconnu',
                covers: resData.covers ?? 1,
                date: resData.date ?? new Date().toISOString().slice(0, 10),
                time: resData.time ?? '',
            });

            toast.success(`Réservation confirmée pour ${resData.customerName}`);

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
            const res = reservations.find((r: Reservation) => r.id === id);
            const customer = customers.find((c: Customer) => c.id === res?.customerId);
            // PLAN LOGIQUE MÉTIER LOT C.4 (P1-10) : fail-closed sans tableId réel.
            // AVANT : `tableId: res?.tableId ?? 'table_default'` fabriquait un
            // identifiant fantôme → handlers avals (allergènes) recevaient une
            // table qui n'existe pas.
            if (!res?.tableId) {
                toast.error("Cette réservation n'a pas de table assignée — assigner une table avant l'arrivée.");
                return;
            }
            await markArrived(id);
            await NexusEventBus.emitDurable('reservation.matched', {
                v: 1,
                tenantId,
                reservationId: id,
                customerId: res?.customerId,
                tableId: res.tableId,
                allergens: customer ? ((customer as Record<string, unknown>).allergens as string[] ?? []) : [],
                covers: res?.covers ?? 2,
                matchedAt: Date.now(),
            });
            // PLAN LOGIQUE MÉTIER LOT C.3 (P1-7) : émettre table.assigned à
            // l'assignation ferme pour que TableTurnoverAnalyzerHandler mesure
            // le début de rotation.
            await NexusEventBus.emitDurable('table.assigned', {
                v: 1,
                tenantId,
                tableId: res.tableId,
                partySize: res?.covers ?? 2,
                reservationId: id,
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
        reservations, customers, tables, groups, opsTables,
        isLoading, markArrived: handleMarkArrived,
        weekDays, todayReservations, tablesByZone, weekLabel, displayDate,
        handleTerraceToggle,
        handleMarkNoShow,
        handleCancelReservation,
        handleSaveReservation,
        handleUpdateReservation,
        handleCreateGroup,
        handlePinConfirm,
        overrideCapacityPerm,
    };
}
