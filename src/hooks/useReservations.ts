"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { reservationsNodeAtom, tenantIdAtom } from "@/store/operationalAtoms";
import { upsertReservationAction } from "@/app/actions/reservations";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";

/**
 * 📅 useReservations - Grade VI Atomic Bridge
 * Centralisation des réservations et optimisation du taux d'occupation.
 */
export function useReservations() {
    useVisibilityPurge('reservations');
    const node = useAtomValue(reservationsNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    const reservations = node.data || [];
    
    return { 
        data: reservations, 
        reservations,
        isLoading: node.loading, 
        error: node.error,
        getReservationsForTable: useCallback((tableId: string) => 
            reservations.filter((r: any) => r.tableId === tableId && r.status !== 'cancelled'),
            [reservations]
        ),
        addReservation: (data: any) => upsertReservationAction(tenantId, data)
    };
}
