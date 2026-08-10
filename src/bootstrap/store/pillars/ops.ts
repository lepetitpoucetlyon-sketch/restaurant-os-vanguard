/* eslint-disable no-restricted-imports */
// 🍽️ OPS PILLAR — Orders, POS, KDS & Floor Plan
// ⚠️ Ré-exports depuis les fichiers SOURCES des atomes, jamais depuis le
// barrel `@modules/ops` : la couche état ne doit pas importer les barrels
// de modules (cycle store → module → hooks/components → store, TDZ au build SSR).

export {
    ordersNodeAtom,           // OPS
    ordersAtom,               // OPS
    ordersLoadingAtom,        // OPS
    tablesNodeAtom,           // OPS
    tablesAtom,               // OPS
    tablesLoadingAtom,        // OPS
    activeCartAtom,           // OPS
    availableTablesAtom,      // OPS
    pendingOrdersAtom,        // OPS
    pendingModificationsAtom, // OPS
} from '@/modules/ops/service/pos/store/orderAtoms';

export {
    floorsAtom,               // OPS
    zonesAtom,                // OPS
    zonesLockedAtom,          // OPS
    currentFloorIdAtom,       // OPS
} from '@nexus/state/SovereignGenome';
