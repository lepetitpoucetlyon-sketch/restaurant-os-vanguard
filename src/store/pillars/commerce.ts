// 🤝 COMMERCE PILLAR — Reservations, Groups & Quotes
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
} from '@/modules/commerce/acquisition/marketing/store/marketingAtoms';
