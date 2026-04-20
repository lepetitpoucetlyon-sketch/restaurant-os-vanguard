// @ts-nocheck
import { atom } from 'jotai';
import { Customer } from '@/types';

/**
 * ⚛️ CRM ATOMS - Grade VI Stability
 * Global state for the CRM module to eliminate local useState bloat.
 */

// 1. Search & Filter State
export const crmSearchQueryAtom = atom('');
export const crmFilterSegmentAtom = atom<string | null>(null);

// 2. UI & Selection State
export const crmSelectedCustomerAtom = atom<Customer | null>(null);
export const crmNewCustomerModalAtom = atom(false);
export const crmSecurityModalAtom = atom(false);
export const crmCustomerToDeleteAtom = atom<Customer | null>(null);

// 3. New Customer Form State (Atomic Form)
export interface CRMFormState {
    name: string;
    phone: string;
    email: string;
    birthday: string;
    segment: string;
    notes: string;
}

export const crmInitialFormState: CRMFormState = {
    name: '',
    phone: '',
    email: '',
    birthday: '',
    segment: 'new',
    notes: ''
};

export const crmFormAtom = atom<CRMFormState>(crmInitialFormState);

// 4. Derived Atoms (Selectors)
export const crmFilteredCountAtom = atom((get) => {
    // This will be used for displaying counts in the sidebar
    // Real filtering happens in the list component for performance
    return 0; // Placeholder
});
