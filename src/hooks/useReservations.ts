"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { reservationsNodeAtom } from "@/store/operationalAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";
import { useNexusMutation } from "./useNexusMutation";

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
            reservations.filter((r: any) => r.tableId === tableId && r.status !== 'cancelled'),
            [reservations]
        ),
        
        // --- Forge Actions ---
        addReservation: (data: any) => {
            const id = data.id || `res_${Date.now()}`;
            return reservationForge.mutate('SET', id, data);
        },
        updateReservation: (id: string, data: any) => reservationForge.mutate('UPDATE', id, data),
        deleteReservation: (id: string) => reservationForge.mutate('DELETE', id, {}),
        updateStatus: (id: string, status: string) => reservationForge.mutate('UPDATE', id, { status })
    };
}
