import { atom } from 'jotai';
import { createProxyDomain } from '@/store/nexusNodeFactory';
import { User, Shift, LeaveRequest, LeaveBalance, ShiftLog } from '@nexus/contracts';
import { ShiftEntry } from '@domain/schemas/hr';

// --- 👥 STAFF & HR DOMAIN (Personnel, Shifts, Congés) ---

const _staffMembers = createProxyDomain<User>('users', []);
export const staffMembersNodeAtom = _staffMembers.node;
export const staffMembersAtom = _staffMembers.data;

const _shifts = createProxyDomain<Shift>('shifts');
export const shiftsNodeAtom = _shifts.node;
export const shiftsAtom = _shifts.data;

const _activeShifts = createProxyDomain<ShiftEntry>('activeShifts');
export const activeShiftsNodeAtom = _activeShifts.node;
export const activeShiftsAtom = _activeShifts.data;

const _shiftLogs = createProxyDomain<ShiftLog>('shiftLogs');
export const shiftLogsNodeAtom = _shiftLogs.node;
export const shiftLogsAtom = _shiftLogs.data;

const _leaveRequests = createProxyDomain<LeaveRequest>('leaveRequests');
export const leaveRequestsNodeAtom = _leaveRequests.node;
export const leaveRequestsAtom = _leaveRequests.data;

const _leaveBalances = createProxyDomain<LeaveBalance>('leaveBalances');
export const leaveBalancesNodeAtom = _leaveBalances.node;
export const leaveBalancesAtom = _leaveBalances.data;

import { Candidate } from '@nexus/contracts';
export const staffSearchQueryAtom = atom('');
export const staffStatusFilterAtom = atom<'all' | 'new' | 'interview' | 'trial' | 'hired' | 'refused'>('all');
export const staffCandidateModalOpenAtom = atom(false);
export const staffEditingCandidateAtom = atom<Candidate | null>(null);

// 4. HR LOADING AGGREGATOR
export const hrStaffLoadingAtom = atom((get) => 
    get(shiftsNodeAtom).loading || get(activeShiftsNodeAtom).loading || get(leaveRequestsNodeAtom).loading
);
