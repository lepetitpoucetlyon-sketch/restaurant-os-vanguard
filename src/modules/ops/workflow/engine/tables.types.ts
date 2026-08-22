// Re-export from canonical location (facility pillar)
 
// eslint-disable-next-line no-restricted-imports -- cycle prevention: facility imports from ops, so we can't use the barrel
export type { TableStatus, TableShape, ZoneId, Floor, Zone, Table, Area } from '@/modules/facility/spaces/types';
