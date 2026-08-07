/* eslint-disable no-restricted-imports */
// 🤝 COMMERCE PILLAR — Reservations, Groups, Quotes & Marketing (fusion de marketing.ts)
// ⚠️ Ré-exports depuis les fichiers SOURCES des atomes, jamais depuis le
// barrel `@/modules/commerce` : la couche état ne doit pas importer les barrels
// de modules (cycle store → module → hooks/components → store, TDZ au build SSR).

export {
    reservationsNodeAtom,     // COMMERCE
    reservationsAtom,         // COMMERCE
    reservationsLoadingAtom,  // COMMERCE
    groupsNodeAtom,           // COMMERCE
    groupsAtom,               // COMMERCE
    groupsLoadingAtom,        // COMMERCE
    reservationStatsAtom,     // COMMERCE
    isReservationSyncingAtom, // COMMERCE
} from '@/modules/commerce/relation/reservations/store/reservationAtoms';

export {
    menuAnalysisSelector,     // COMMERCE
    staffPerformanceSelector, // COMMERCE
    laborCostRatioSelector,   // COMMERCE
} from '@/modules/commerce/acquisition/marketing/store/analyticsAtoms';

export {
    quotesNodeAtom,           // COMMERCE
    quotesAtom,               // COMMERCE
    quotesLoadingAtom,        // COMMERCE
    // Marketing (fusionné depuis store/pillars/marketing.ts — domaine de commerce/acquisition)
    seoProfileAtom,
    marketingCampaignsNodeAtom,
    marketingCampaignsAtom,
    marketingSegmentsNodeAtom,
    marketingSegmentsAtom,
    scheduledPostsNodeAtom,
    scheduledPostsAtom,
    socialAccountsNodeAtom,
    socialAccountsAtom,
    crmsNodeAtom,
    crmsAtom,
    crmsLoadingAtom,
    selectedCRMAtom,
    seoLoadingAtom,
    isMarketingSyncingAtom,
} from '@/modules/commerce/acquisition/marketing/store/marketingAtoms';
