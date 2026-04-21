import { atom } from 'jotai';
import { Reservation } from '@/types/reservations.types';
import { GroupEvent } from '@/types';
import { createProxyDomain } from '@/store/nexusNodeFactory';

// --- 🏨 RESERVATIONS DOMAIN (Grade IX - Industrial) ---

const _reservations = createProxyDomain<Reservation>('reservations');
export const reservationsNodeAtom = _reservations.node;
export const reservationsAtom = _reservations.data;
export const reservationsLoadingAtom = _reservations.loading;

const _groups = createProxyDomain<GroupEvent>('groups');
export const groupsNodeAtom = _groups.node;
export const groupsAtom = _groups.data;
export const groupsLoadingAtom = _groups.loading;

// --- 📊 INDUSTRIAL STATS ---
export const reservationStatsAtom = atom((get) => {
    const reservations = get(reservationsAtom);
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => r.date === today);

    return {
        total: reservations.length,
        todayCount: todayReservations.length,
        todayCovers: todayReservations.reduce((sum, r) => sum + r.covers, 0),
        pending: reservations.filter(r => r.status === 'confirmed').length,
        seated: reservations.filter(r => r.status === 'seated').length,
        noShow: reservations.filter(r => r.status === 'no-show').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
    };
});

// --- 🛰️ SYNC & TELEMETRY ---
export const isReservationSyncingAtom = atom(false);
