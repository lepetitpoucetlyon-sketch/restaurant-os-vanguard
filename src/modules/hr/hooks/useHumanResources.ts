"use client";

import { useAtom, useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { hrProcessingAtom } from '../store/hrAtoms';
import { 
    leaveRequestsNodeAtom, 
    leaveBalancesAtom, 
    hrLoadingAtom,
    shiftsNodeAtom
} from '../store/staffAtoms';
import { useNexusMutation } from "@/shared/hooks/useNexusMutation";
import { Shift, LeaveRequest, LeaveBalance } from "../types";

/**
 * 👨‍💼 useHumanResources - Grade X Atomic Bridge
 * Orchestre la gestion du personnel, le planning et les absences.
 */
export function useHumanResources() {
    const [isProcessing, setIsProcessing] = useAtom(hrProcessingAtom);
    
    // Grade X Atomic Data
    const leaveRequestsNode = useAtomValue(leaveRequestsNodeAtom);
    const leaveRequests = (leaveRequestsNode.data || []) as LeaveRequest[];
    
    const leaveBalances = (useAtomValue(leaveBalancesAtom) || []) as LeaveBalance[];
    const isLoading = useAtomValue(hrLoadingAtom);
    const shiftsNode = useAtomValue(shiftsNodeAtom);
    const shifts = (shiftsNode.data || []) as Shift[];

    // --- 🔨 LA FORGE ---
    const leaveForge = useNexusMutation<LeaveRequest>(leaveRequestsNodeAtom, 'leaveRequests', 'HR');
    const shiftForge = useNexusMutation<Shift>(shiftsNodeAtom, 'shifts', 'HR');

    const addShift = useCallback((shift: Shift) => {
        const id = shift.id || `shift_${Date.now()}`;
        return shiftForge.mutate('SET', id, shift);
    }, [shiftForge]);

    const updateShift = useCallback((id: string, data: Partial<Shift>) => {
        return shiftForge.mutate('UPDATE', id, data);
    }, [shiftForge]);

    const deleteShift = useCallback((id: string) => {
        return shiftForge.mutate('DELETE', id, {});
    }, [shiftForge]);

    const publishShifts = useCallback((ids: string[]) => {
        ids.forEach(id => {
            shiftForge.mutate('UPDATE', id, { status: 'published' });
        });
    }, [shiftForge]);

    // --- LEAVE MANAGEMENT ---
    
    const approveLeaveRequest = useCallback(async (id) => {
        return leaveForge.mutate('UPDATE', id, { status: 'approved' });
    }, [leaveForge]);

    const rejectLeaveRequest = useCallback(async (id, reason) => {
        return leaveForge.mutate('UPDATE', id, { status: 'rejected' });
    }, [leaveForge]);

    const createLeaveRequest = useCallback(async (request: LeaveRequest) => {
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
