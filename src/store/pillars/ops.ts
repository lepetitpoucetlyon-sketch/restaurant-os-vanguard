// 🍽️ OPS PILLAR — Orders, POS, KDS & Floor Plan
// Source: @modules/ops

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
} from '@modules/ops';

export {
    floorsAtom,               // OPS
    zonesAtom,                // OPS
    zonesLockedAtom,          // OPS
    currentFloorIdAtom,       // OPS
} from '@nexus/state/SovereignGenome';
