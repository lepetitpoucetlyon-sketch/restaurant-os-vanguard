// 👥 HUMAN PILLAR — Staff, Planning & Shifts
// ⚠️ Ré-exports depuis le fichier SOURCE des atomes, jamais depuis le barrel (anti-cycle SSR).

export {
    staffMembersNodeAtom,     // HUMAN
    staffMembersAtom,         // HUMAN
    shiftsNodeAtom,           // HUMAN
    shiftsAtom,               // HUMAN
    activeShiftsNodeAtom,     // HUMAN
    activeShiftsAtom,         // HUMAN
    shiftLogsNodeAtom,        // HUMAN
    shiftLogsAtom,            // HUMAN
    leaveRequestsNodeAtom,    // HUMAN
    leaveRequestsAtom,        // HUMAN
    leaveBalancesNodeAtom,    // HUMAN
    leaveBalancesAtom,        // HUMAN
    hrStaffLoadingAtom,       // HUMAN (Original mapping: hrLoadingAtom)
} from '@modules/human/hr/store/staffAtoms';
