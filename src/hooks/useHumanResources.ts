"use client";

import { useAtom, useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { hrShiftsAtom, hrProcessingAtom } from '@/store/hrAtoms';
import { 
    leaveRequestsNodeAtom, 
    leaveBalancesAtom, 
    hrLoadingAtom,
    shiftsNodeAtom
} from '@/store/operationalAtoms';
import { useNexusMutation } from "./useNexusMutation";

/**
 * 👨‍💼 useHumanResources - Grade VI Atomic Bridge
 * Orchestre la gestion du personnel, le planning et les absences.
 */
export function useHumanResources() {
    const [isProcessing, setIsProcessing] = useAtom(hrProcessingAtom);
    
    // Grade VI Atomic Data
    const leaveRequestsNode = useAtomValue(leaveRequestsNodeAtom);
    const leaveRequests = leaveRequestsNode.data;
    
    const leaveBalances = useAtomValue(leaveBalancesAtom);
    const isLoading = useAtomValue(hrLoadingAtom);
    const shiftsNode = useAtomValue(shiftsNodeAtom);
    const shifts = shiftsNode.data;

    // --- 🔨 LA FORGE ---
    const leaveForge = useNexusMutation(leaveRequestsNodeAtom, 'leaveRequests', 'HR');
    const shiftForge = useNexusMutation(shiftsNodeAtom, 'shifts', 'HR');

    const addShift = useCallback((shift: any) => {
        const id = shift.id || `shift_${Date.now()}`;
        return shiftForge.mutate('SET', id, shift);
    }, [shiftForge]);

    const updateShift = useCallback((id: string, data: any) => {
        return shiftForge.mutate('UPDATE', id, data);
    }, [shiftForge]);

    const deleteShift = useCallback((id: string) => {
        return shiftForge.mutate('DELETE', id, {});
    }, [shiftForge]);

    const publishShifts = useCallback((ids: string[]) => {
        // En masse mutation pattern (not strictly standard in v1, but for v2)
        ids.forEach(id => {
            shiftForge.mutate('UPDATE', id, { status: 'published' });
        });
    }, [shiftForge]);

    // --- LEAVE MANAGEMENT ---
    
    const approveLeaveRequest = useCallback(async (id: string) => {
        return leaveForge.mutate('UPDATE', id, { status: 'approved' });
    }, [leaveForge]);

    const rejectLeaveRequest = useCallback(async (id: string, reason?: string) => {
        return leaveForge.mutate('UPDATE', id, { status: 'rejected', rejectionReason: reason });
    }, [leaveForge]);

    const createLeaveRequest = useCallback(async (request: any) => {
        const id = request.id || `leave_${Date.now()}`;
        return leaveForge.mutate('SET', id, { ...request, status: 'pending_approval' });
    }, [leaveForge]);

    return {
        isProcessing,
        setIsProcessing,
        shifts,
        leaveRequests,
        leaveBalances,
        isLoading,
        addShift,
        updateShift,
        deleteShift,
        publishShifts,
        approveLeaveRequest,
        rejectLeaveRequest,
        createLeaveRequest,
        usePlanning: () => ({
            shifts,
            addShift,
            updateShift,
            deleteShift,
            publishShifts
        })
    };
}

export const usePlanning = useHumanResources;
