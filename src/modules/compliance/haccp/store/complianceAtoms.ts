import { atom } from 'jotai';
import { createProxyDomain } from '@/store/nexusNodeFactory';
import { 
    JournalEntry, 
    HygieneLabel, 
    HygieneLog,
    ReceptionLog,
    OilLog,
    RegulatoryWasteLog,
    MaintenanceLog,
    Delivery,
    SensorReading
} from '@nexus/contracts';

// --- 🛡️ COMPLIANCE DOMAIN (Fiscal NF525, Guard/HACCP, Maintenance, Livraisons) ---

// FISCAL (Grade X Suture: Ledger must track JournalEntry)
const _fiscalLedger = createProxyDomain<JournalEntry>('fiscalLedger');
export const fiscalLedgerNodeAtom = _fiscalLedger.node;
export const fiscalLedgerAtom = _fiscalLedger.data;
export const fiscalLoadingAtom = _fiscalLedger.loading;

// GUARD / HACCP
const _hygieneLabels = createProxyDomain<HygieneLabel>('hygieneLabels');
export const hygieneLabelsNodeAtom = _hygieneLabels.node;
export const hygieneLabelsAtom = _hygieneLabels.data;

const _maintenanceLogs = createProxyDomain<MaintenanceLog>('maintenanceLogs');
export const maintenanceLogsNodeAtom = _maintenanceLogs.node;
export const maintenanceLogsAtom = _maintenanceLogs.data;

const _deliveries = createProxyDomain<Delivery>('deliveries');
export const deliveriesNodeAtom = _deliveries.node;
export const deliveriesAtom = _deliveries.data;


const _hygieneLogs = createProxyDomain<HygieneLog>('hygieneLogs');
export const hygieneLogsNodeAtom = _hygieneLogs.node;
export const hygieneLogsAtom = _hygieneLogs.data;

const _receptionLogs = createProxyDomain<ReceptionLog>('receptionLogs');
export const receptionLogsNodeAtom = _receptionLogs.node;
export const receptionLogsAtom = _receptionLogs.data;

const _oilLogs = createProxyDomain<OilLog>('oilLogs');
export const oilLogsNodeAtom = _oilLogs.node;
export const oilLogsAtom = _oilLogs.data;

const _wasteLogs = createProxyDomain<RegulatoryWasteLog>('wasteLogs');
export const wasteLogsNodeAtom = _wasteLogs.node;
export const wasteLogsAtom = _wasteLogs.data;

// GUARD LOADING AGGREGATOR
export const guardLoadingAtom = atom((get) => {
    const nodes = [
        hygieneLabelsNodeAtom,
        maintenanceLogsNodeAtom,
        deliveriesNodeAtom,
        hygieneLogsNodeAtom,
        receptionLogsNodeAtom,
        oilLogsNodeAtom,
        wasteLogsNodeAtom
    ];
    return nodes.some(node => (get(node as import("jotai").Atom<{ loading: boolean }>)).loading);
});

// P2: QUARANTINED PRODUCTS (HACCP Alert -> QuarantineHandler -> POS ProductGrid)
export const quarantinedProductsAtom = atom<Record<string, { reason: string; timestamp: number }>>({});

// ⚡ HARDWARE SIMULATION (Electrification)
// SensorReading moved to central types.ts

export const sensorsAtom = atom<Record<string, SensorReading>>({
    'ROTISSERIE_CORE_TEMP': {
        id: 'ROTISSERIE_CORE_TEMP',
        name: 'Sonde Cœur Poulet',
        type: 'temperature',
        value: 75,
        unit: '°C',
        status: 'ok',
        lastUpdated: new Date()
    }
});
