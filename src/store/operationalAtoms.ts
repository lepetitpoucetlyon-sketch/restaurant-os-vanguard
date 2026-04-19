/**
 * ⚛️ OPERATIONAL ATOMS - BARREL FILE (Grade VI - Mesh Architecture)
 * 
 * Ce fichier est un "barrel" : il ré-exporte tous les atomes des domaines métier.
 * Tous les fichiers existants qui importent depuis '@/store/operationalAtoms'
 * continueront de fonctionner sans aucune modification.
 * 
 * Architecture maillée (post God-Node scission) :
 * 
 *   nexusNodeFactory.ts  ← Fondation (NexusNode, createNexusNode, updateNexusNode)
 *        ↓
 *   ┌────────────┬───────────────┬──────────────┬──────────────────┬──────────────┐
 *   │ orderAtoms │ inventoryAtoms│ staffAtoms   │ complianceAtoms  │ marketingAtoms│
 *   └────────────┴───────────────┴──────────────┴──────────────────┴──────────────┘
 *        ↓               ↓              ↓
 *   analyticsAtoms.ts  ← Selectors cross-domaine (Menu Engineering, Performance)
 *        ↓
 *   fleetAtoms.ts  ← Infrastructure multi-tenant
 */

// 🏗️ FACTORY (Core)
export { 
    type NexusNode, 
    createNexusNode, 
    updateNexusNode, 
    orphanNodesRegistry,
    createProxyDomain 
} from './nexusNodeFactory';

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
    fleetBloomFilterAtom, fleetClusterAtomFamily,
    activeFleetTenantAtom, focusedTenantDetailsAtom,
    floorsAtom, zonesAtom, zonesLockedAtom, currentFloorIdAtom
} from './fleetAtoms';

// 📈 ANALYTICS (Cross-domain selectors)
export {
    menuAnalysisSelector,
    staffPerformanceSelector,
    laborCostRatioSelector
} from './analyticsAtoms';
