"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { reservationsNodeAtom } from "@/store/operationalAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";
import { useNexusMutation } from "@/shared/hooks/useNexusMutation";
import { Reservation } from "../reservations.types";

/**
 * 📅 useReservations - Grade VI Atomic Bridge
 * Centralisation des réservations et optimisation du taux d'occupation.
 */
export function useReservations() {
    useVisibilityPurge('reservations');
    const node = useAtomValue(reservationsNodeAtom);
    const reservations = node.data || [];
    
    // --- 🔨 LA FORGE ---
    const reservationForge = useNexusMutation(reservationsNodeAtom, 'reservations', 'RESERVATIONS');
    
    return { 
        data: reservations, 
        reservations,
        isLoading: node.loading, 
        error: node.error,
        getReservationsForTable: useCallback((tableId: string) => 
            reservations.filter((r: Reservation) => r.tableId === tableId && r.status !== 'cancelled'),
            [reservations]
        ),
        
        // --- Forge Actions ---
        addReservation: (data: Partial<Reservation>) => {
            const id = data.id || `res_${Date.now()}`;
            return reservationForge.mutate('SET', id, data);
        },
        updateReservation: (id: string, data: Partial<Reservation>) => reservationForge.mutate('UPDATE', id, data),
        deleteReservation: (id: string) => reservationForge.mutate('DELETE', id, {}),
        updateStatus: (id: string, status: Reservation['status']) => reservationForge.mutate('UPDATE', id, { status })
    };
}
