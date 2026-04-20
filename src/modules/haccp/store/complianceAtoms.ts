import { atom } from 'jotai';
import { createProxyDomain } from './nexusNodeFactory';
import { 
    JournalEntry, 
    HygieneLabel, 
    HygieneLog,
    ReceptionLog,
    OilLog,
    RegulatoryWasteLog,
    SupplierOrder,
    MaintenanceLog,
    Delivery
} from '@/types';

// --- 🛡️ COMPLIANCE DOMAIN (Fiscal NF525, Guard/HACCP, Maintenance, Livraisons) ---

// FISCAL
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
export const guardLoadingAtom = atom((get) => 
    get(hygieneLabelsNodeAtom).loading || 
    get(maintenanceLogsNodeAtom).loading || 
    get(deliveriesNodeAtom).loading ||
    get(hygieneLogsNodeAtom).loading ||
    get(receptionLogsNodeAtom).loading ||
    get(oilLogsNodeAtom).loading ||
    get(wasteLogsNodeAtom).loading
);
// ⚡ HARDWARE SIMULATION (Electrification)
export interface SensorReading {
    id: string;
    name: string;
    type: 'temperature' | 'vibration' | 'humidity';
    value: number | null; // null simulates hardware cut
    unit: string;
    lastUpdated: string;
}

export const sensorsAtom = atom<Record<string, SensorReading>>({
    'ROTISSERIE_CORE_TEMP': {
        id: 'ROTISSERIE_CORE_TEMP',
        name: 'Sonde Cœur Poulet',
        type: 'temperature',
        value: 75,
        unit: '°C',
        lastUpdated: new Date().toISOString()
    }
});
