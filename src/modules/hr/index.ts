/**
 * 🧑‍🍳 Human Essence Module - Public API
 * Orchestrates the brigade, payroll integration, and workforce audits.
 */

export * from './hooks/useHumanResources';
export * from './hooks/useRecruitment';
export * from './hooks/useStaffAudit';
export * from './types';

export { 
    activeShiftsAtom, 
    hrLoadingAtom, 
    hrSelectedStaffIdAtom 
} from './store/hrAtoms';

export { 
    staffMembersNodeAtom, 
    staffMembersAtom, 
    shiftsNodeAtom, 
    shiftsAtom, 
    activeShiftsNodeAtom, 
    shiftLogsNodeAtom, 
    shiftLogsAtom, 
    leaveRequestsNodeAtom, 
    leaveRequestsAtom, 
    leaveBalancesNodeAtom, 
    leaveBalancesAtom, 
    staffSearchQueryAtom, 
    staffStatusFilterAtom, 
    staffCandidateModalOpenAtom, 
    staffEditingCandidateAtom,
    hrStaffLoadingAtom
} from './store/staffAtoms';

export {
    candidatesAtom,
    recruitmentLoadingAtom
} from './store/recruitmentAtoms';
