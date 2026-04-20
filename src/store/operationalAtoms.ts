// 🔑 FOUNDATION TOOLS (Grade VI)
export { createNexusNode, updateNexusNode, createProxyDomain, useNexusNode } from './nexusNodeFactory';

// 🔑 AUTH & IDENTITY
export {
    currentUserAtom, isAuthenticatedAtom, userRoleAtom,
    tenantConfigAtom, rolePermissionsAtom, userPermissionsAtom,
    canDoAtom, updateRolePermissionsAtom
} from './authAtoms';

// 📊 ACCOUNTING & FINANCE
export {
    journalEntriesNodeAtom, journalEntriesAtom,
    accountsNodeAtom, accountsAtom,
    bankTransactionsNodeAtom, bankTransactionsAtom,
    expenseClaimsNodeAtom, expenseClaimsAtom,
    accountingViewModeAtom, isAccountingSyncingAtom, accountingLoadingAtom
} from './accountingAtoms';

// 🏛️ UI & PERSISTENCE
export {
    isSidebarCollapsedAtom, isLaunchpadOpenAtom, themeAtom, isTrainingModeAtom,
    notificationsAtom, unreadNotificationsCountAtom,
    isCommandOpenAtom, isMobileMenuOpenAtom, isDocsOpenAtom, isMap3DOpenAtom,
    addToastAtom
} from './uiAtoms';

// 🍽️ ORDERS DOMAIN
export {
    ordersNodeAtom, ordersAtom, ordersLoadingAtom,
    tablesNodeAtom, tablesAtom, tablesLoadingAtom,
    activeCartAtom,
    availableTablesAtom, pendingOrdersAtom, pendingModificationsAtom
} from './orderAtoms';

// 📅 RESERVATIONS & EVENTS DOMAIN
export {
    reservationsNodeAtom, reservationsAtom, reservationsLoadingAtom,
    groupsNodeAtom, groupsAtom, groupsLoadingAtom,
    reservationStatsAtom, isReservationSyncingAtom
} from './reservationAtoms';

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
} from './inventoryAtoms';

// 👥 STAFF & HR DOMAIN
export {
    staffMembersNodeAtom, staffMembersAtom,
    shiftsNodeAtom, shiftsAtom,
    activeShiftsNodeAtom, activeShiftsAtom,
    shiftLogsNodeAtom, shiftLogsAtom,
    leaveRequestsNodeAtom, leaveRequestsAtom,
    leaveBalancesNodeAtom, leaveBalancesAtom,
    hrLoadingAtom
} from './staffAtoms';

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
} from './complianceAtoms';

// 📢 MARKETING & CRM DOMAIN
export {
    seoProfileAtom,
    marketingCampaignsNodeAtom, marketingCampaignsAtom,
    marketingSegmentsNodeAtom, marketingSegmentsAtom,
    scheduledPostsNodeAtom, scheduledPostsAtom,
    socialAccountsNodeAtom, socialAccountsAtom,
    quotesNodeAtom, quotesAtom, quotesLoadingAtom,
    customersNodeAtom, customersAtom, customersLoadingAtom,
    seoLoadingAtom, isMarketingSyncingAtom
} from './marketingAtoms';

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
} from './analyticsAtoms';
