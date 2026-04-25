// 🔑 FOUNDATION TOOLS (Grade VI)
export { createNexusNode, updateNexusNode, createProxyDomain, useNexusNode } from './nexusNodeFactory';
export { nexusPulseAtom, emitPulseAtom } from './pulseAtoms';
export type { NexusPulse } from './pulseAtoms';

// 🔑 AUTH & IDENTITY
export {
    currentUserAtom, isAuthenticatedAtom, userRoleAtom,
    rolePermissionsAtom, userPermissionsAtom,
    canDoAtom, updateRolePermissionsAtom
} from '@/modules/auth/store/authAtoms';

export { tenantConfigAtom } from './masterAtoms';

// 📊 ACCOUNTING & FINANCE
export {
    journalEntriesNodeAtom, journalEntriesAtom,
    accountsNodeAtom, accountsAtom,
    bankTransactionsNodeAtom, bankTransactionsAtom,
    expenseClaimsNodeAtom, expenseClaimsAtom,
    accountingViewModeAtom, isAccountingSyncingAtom, accountingLoadingAtom
} from '@/modules/finance/store/accountingAtoms';

// 🏛️ UI & PERSISTENCE
export {
    isSidebarCollapsedAtom, isLaunchpadOpenAtom, themeAtom, isTrainingModeAtom,
    notificationsAtom, unreadNotificationsCountAtom,
    isCommandOpenAtom, isMobileMenuOpenAtom, isDocsOpenAtom, isMap3DOpenAtom,
    addToastAtom, performanceModeAtom
} from './uiAtoms';

// 🍽️ ORDERS DOMAIN
export {
    ordersNodeAtom, ordersAtom, ordersLoadingAtom,
    tablesNodeAtom, tablesAtom, tablesLoadingAtom,
    activeCartAtom,
    availableTablesAtom, pendingOrdersAtom, pendingModificationsAtom
} from '@/modules/ops/store/orderAtoms';

// 📅 RESERVATIONS & EVENTS DOMAIN
export {
    reservationsNodeAtom, reservationsAtom, reservationsLoadingAtom,
    groupsNodeAtom, groupsAtom, groupsLoadingAtom,
    reservationStatsAtom, isReservationSyncingAtom
} from '@/modules/ops/store/reservationAtoms';

// 📦 INVENTORY & KITCHEN DOMAIN
export {
    stockItemsNodeAtom, stockItemsAtom, stockLoadingAtom,
    categoriesNodeAtom, categoriesAtom, categoriesLoadingAtom,
    productsNodeAtom, productsAtom, productsLoadingAtom,
    recipesNodeAtom, recipesAtom, recipesLoadingAtom,
    ingredientsNodeAtom, ingredientsAtom,
    preparationsNodeAtom, preparationsAtom,
    supplierOrdersNodeAtom, supplierOrdersAtom,
    storageLocationsNodeAtom, storageLocationsAtom,
    prepTasksNodeAtom, prepTasksAtom, prepLoadingAtom,
    miseEnPlaceTargetSelector, calculateRecipeCostSelector
} from '@/modules/inventory/store/inventoryAtoms';

// 👥 STAFF & HR DOMAIN
export {
    staffMembersNodeAtom, staffMembersAtom,
    shiftsNodeAtom, shiftsAtom,
    activeShiftsNodeAtom, activeShiftsAtom,
    shiftLogsNodeAtom, shiftLogsAtom,
    leaveRequestsNodeAtom, leaveRequestsAtom,
    leaveBalancesNodeAtom, leaveBalancesAtom,
    hrStaffLoadingAtom as hrLoadingAtom
} from '@/modules/hr/store/staffAtoms';

// 🛡️ COMPLIANCE DOMAIN (Fiscal + Guard/HACCP)
export {
    fiscalLedgerNodeAtom, fiscalLedgerAtom, fiscalLoadingAtom,
    hygieneLabelsNodeAtom, hygieneLabelsAtom,
    maintenanceLogsNodeAtom, maintenanceLogsAtom,
    deliveriesNodeAtom, deliveriesAtom,
    hygieneLogsNodeAtom, hygieneLogsAtom,
    receptionLogsNodeAtom, receptionLogsAtom,
    oilLogsNodeAtom, oilLogsAtom,
    wasteLogsNodeAtom, wasteLogsAtom,
    guardLoadingAtom
} from '@/modules/haccp/store/complianceAtoms';

// 📢 MARKETING & CUSTOMERS DOMAIN
export {
    seoProfileAtom,
    marketingCampaignsNodeAtom, marketingCampaignsAtom,
    marketingSegmentsNodeAtom, marketingSegmentsAtom,
    scheduledPostsNodeAtom, scheduledPostsAtom,
    socialAccountsNodeAtom, socialAccountsAtom,
    quotesNodeAtom, quotesAtom, quotesLoadingAtom,
    crmsNodeAtom, crmsAtom, crmsLoadingAtom, selectedCRMAtom,
    seoLoadingAtom, isMarketingSyncingAtom
} from '@/modules/marketing/store/marketingAtoms';

// 🛰️ FLEET & MULTI-TENANCY
export {
    tenantIdAtom, fleetSnapshotAtom,
    fleetBloomFilterAtom, activeTenantSlotsAtom,
    activeFleetTenantAtom, focusedTenantDetailsAtom,
    floorsAtom, zonesAtom, zonesLockedAtom, currentFloorIdAtom
} from './fleetAtoms';

// 📈 ANALYTICS (Cross-domain selectors)
export {
    menuAnalysisSelector,
    staffPerformanceSelector,
    laborCostRatioSelector
} from '@/modules/marketing/store/analyticsAtoms';
