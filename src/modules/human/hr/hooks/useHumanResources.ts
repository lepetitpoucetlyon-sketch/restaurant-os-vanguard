"use client";

import { useAtom, useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { hrLoadingAtom as hrProcessingAtom } from '../store/hrAtoms';
import { 
    leaveRequestsNodeAtom, 
    leaveBalancesAtom, 
    hrStaffLoadingAtom as hrLoadingAtom,
    shiftsNodeAtom
} from '../store/staffAtoms';
import { useNexusMutation } from "@shared/hooks/useNexusMutation";
import { Shift, LeaveRequest, LeaveBalance, RejectionReason } from "@nexus/contracts";
import { SovereignData } from '@/shared/nexus-contract';

/**
 * 👨‍💼 useHumanResources - Grade X Atomic Mapper
 * Orchestre la gestion du personnel, le planning et les absences.
 */
export function useHumanResources() {
    const [isProcessing, setIsProcessing] = useAtom(hrProcessingAtom);
    
    // Grade X Atomic Data
    const leaveRequestsNode = useAtomValue(leaveRequestsNodeAtom);
    const leaveRequests = (leaveRequestsNode.data || []);
    
    const leaveBalances = (useAtomValue(leaveBalancesAtom) || []);
    const isLoading = useAtomValue(hrLoadingAtom);
    const shiftsNode = useAtomValue(shiftsNodeAtom);
    const shifts = (shiftsNode.data || []);

    // --- 🔨 LA FORGE ---
    const leaveForge = useNexusMutation<LeaveRequest>(leaveRequestsNodeAtom, 'leaveRequests', 'HR');
    const shiftForge = useNexusMutation<Shift>(shiftsNodeAtom, 'shifts', 'HR');

    const addShift = useCallback((shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = `shift_${Date.now()}`;
        const now = new Date().toISOString();
        const newShift: Shift = { 
            ...shift, 
            id,
            createdAt: now,
            updatedAt: now
        } as unknown as Shift;
        return shiftForge.mutate('SET', id, newShift as unknown as SovereignData);
    }, [shiftForge]);

    const updateShift = useCallback((id: string, data: Partial<Shift>) => {
        return shiftForge.mutate('UPDATE', id, {
            ...data,
            updatedAt: new Date().toISOString()
        });
    }, [shiftForge]);

    const deleteShift = useCallback((id: string) => {
        return shiftForge.mutate('DELETE', id, {} as unknown as SovereignData);
    }, [shiftForge]);

    const publishShifts = useCallback(async (ids: string[]) => {
        const now = new Date().toISOString();
        return Promise.all(ids.map(id => 
            shiftForge.mutate('UPDATE', id, { 
                status: 'published',
                updatedAt: now 
            } as unknown as SovereignData)
        ));
    }, [shiftForge]);

    // --- LEAVE MANAGEMENT ---
    
    const approveLeaveRequest = useCallback(async (id: string) => {
        const now = new Date().toISOString();
        return leaveForge.mutate('UPDATE', id, { 
            status: 'approved',
            updatedAt: now
        } as unknown as SovereignData);
    }, [leaveForge]);

    const rejectLeaveRequest = useCallback(async (id: string, reason: RejectionReason, details?: string) => {
        const now = new Date().toISOString();
        return leaveForge.mutate('UPDATE', id, { 
            status: 'rejected',
            rejectionReason: reason,
            updatedAt: now
        } as unknown as SovereignData);
    }, [leaveForge]);

    const createLeaveRequest = useCallback(async (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = `leave_${Date.now()}`;
        const now = new Date().toISOString();
        const newRequest: LeaveRequest = { 
            ...request, 
            id,
            status: 'pending', // Align with contract
            createdAt: now,
            updatedAt: now
        } as unknown as LeaveRequest;
        return leaveForge.mutate('SET', id, newRequest as unknown as SovereignData);
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
        createLeaveRequest
    };
}

export const usePlanning = useHumanResources;

