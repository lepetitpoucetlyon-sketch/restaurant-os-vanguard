import { useAtom, useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { hrShiftsAtom, hrProcessingAtom } from '@/store/hrAtoms';
import { 
    leaveRequestsAtom, 
    leaveBalancesAtom, 
    hrLoadingAtom,
    updateNexusNode
} from '@/store/operationalAtoms';

/**
 * 👨‍💼 useHumanResources - Grade VI Atomic Bridge
 * Orchestre la gestion du personnel, le planning et les absences.
 */
export function useHumanResources() {
    const [shifts, setShifts] = useAtom(hrShiftsAtom);
    const [isProcessing, setIsProcessing] = useAtom(hrProcessingAtom);
    
    // Grade VI Atomic Data
    const [leaveRequests, setLeaveRequests] = useAtom(leaveRequestsAtom);
    const [leaveBalances, setLeaveBalances] = useAtom(leaveBalancesAtom);
    const isLoading = useAtomValue(hrLoadingAtom);

    const addShift = useCallback((shift: any) => {
        setShifts(prev => [...prev, { ...shift, id: Math.random().toString(36).substring(2, 9) }]);
    }, [setShifts]);

    const updateShift = useCallback((id: string, data: any) => {
        setShifts(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    }, [setShifts]);

    const deleteShift = useCallback((id: string) => {
        setShifts(prev => prev.filter(s => s.id !== id));
    }, [setShifts]);

    const publishShifts = useCallback((ids: string[]) => {
        setShifts(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: 'published' } : s));
    }, [setShifts]);

    // --- LEAVE MANAGEMENT ---
    
    const approveLeaveRequest = useCallback(async (id: string) => {
        setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    }, [setLeaveRequests]);

    const rejectLeaveRequest = useCallback(async (id: string, reason?: string) => {
        setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r));
    }, [setLeaveRequests]);

    const createLeaveRequest = useCallback(async (request: any) => {
        const newRequest = { 
            ...request, 
            id: `leave_${Math.random().toString(36).substring(2, 9)}`,
            status: request.status || 'pending_approval'
        };
        setLeaveRequests(prev => [newRequest, ...prev]);
    }, [setLeaveRequests]);

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
