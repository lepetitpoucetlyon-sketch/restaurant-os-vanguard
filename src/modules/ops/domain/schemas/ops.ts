export {
  TableShapeSchema,
  TableSchema,
  ReservationSchema,
  FloorSchema,
  ZoneSchema,
  type Table,
  type Reservation,
  type Floor,
  type Zone,
  type TableStatus,
  type TableShape
} from '@nexus/contracts';

export interface FloorTable {
    id: string;
    number: string;
    seats: number;
    status: TableStatus;
    shape: TableShape;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    zoneId: string;
    floorId?: string;
    lastService?: string;
    revenueTodayInCents?: number;
    revenueTodayInMicrounits?: number;
}
