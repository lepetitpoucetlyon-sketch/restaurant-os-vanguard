import { atom } from 'jotai';
import { ordersNodeAtom, stockItemsNodeAtom } from './operationalAtoms';

/**
 * ⚛️ DASHBOARD ATOMS - Grade VI
 * Centralized selectors for the Empire Cockpit.
 */

// 1. KPI: Revenue (CA du jour)
export const dashboardRevenueSelector = atom((get) => {
    const orders = get(ordersNodeAtom).data || [];
    const today = new Date().toISOString().split('T')[0];
    
    const paidToday = orders.filter(o => 
        o.status === 'paid' && 
        o.updatedAt && String(o.updatedAt).startsWith(today)
    );
    
    return paidToday.reduce((sum, o) => sum + (o.totalInCents || 0), 0);
});

// 2. KPI: HACCP Alerts (Produits périmés ou proches)
export const dashboardHACCPAlertsSelector = atom((get) => {
    const stockItems = get(stockItemsNodeAtom).data || [];
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return stockItems.filter(s => {
        const dlc = new Date(s.dlc);
        return dlc <= threeDaysFromNow && (s as any).status !== 'discarded' && s.status !== 'depleted';
    }).length;
});

// 3. KPI: Stock Ruptures (Produits en dessous du seuil critique)
export const dashboardStockRupturesSelector = atom((get) => {
    const stockItems = get(stockItemsNodeAtom).data || [];
    
    return stockItems.filter(s => 
        (s.quantity <= 0 || s.status === 'depleted')
    ).length;
});

// 4. KPI: Active Tables
export const dashboardActiveTablesSelector = atom((get) => {
    const orders = get(ordersNodeAtom).data || [];
    return orders.filter(o => o.status === 'new' || (o as any).status === 'ordered').length;
});
