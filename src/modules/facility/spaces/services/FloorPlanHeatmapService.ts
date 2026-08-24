import type { Order } from '@nexus/contracts/nexus-internal-mapper';

export interface TableSpatialConfig {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  posX?: number;
  posY?: number;
}

export interface TableHeatmapMetrics {
  tableId: string;
  tableName: string;
  zone: string;
  capacity: number;
  totalOrders: number;
  totalRevenueInMicrounits: number;
  revenuePerSeatInMicrounits: number;
  turnRate: number;
  thermalIndex: number;
  performanceCategory: 'HOT_SPOT' | 'OPTIMAL' | 'UNDERPERFORMING' | 'DEAD_ZONE';
}

export interface FloorPlanHeatmapSummary {
  businessDate: string;
  totalTables: number;
  totalSeats: number;
  totalRevenueInMicrounits: number;
  averageTurnRate: number;
  averageRevenuePerSeatInMicrounits: number;
  hotSpotsCount: number;
  deadZonesCount: number;
  tableMetrics: TableHeatmapMetrics[];
  recommendations: string[];
}

interface RawTableMetric {
  tableId: string;
  tableName: string;
  zone: string;
  capacity: number;
  totalOrders: number;
  totalRevenueInMicrounits: number;
  revenuePerSeatInMicrounits: number;
  turnRate: number;
}

interface RawMetricsBucket {
  rawMetrics: RawTableMetric[];
  totalRevenue: number;
  totalSeats: number;
  totalTurns: number;
}

function emptyHeatmapSummary(businessDate: string): FloorPlanHeatmapSummary {
  return {
    businessDate,
    totalTables: 0,
    totalSeats: 0,
    totalRevenueInMicrounits: 0,
    averageTurnRate: 0,
    averageRevenuePerSeatInMicrounits: 0,
    hotSpotsCount: 0,
    deadZonesCount: 0,
    tableMetrics: [],
    recommendations: ['Aucune table configurée sur le plan de salle.'],
  };
}

function groupOrdersByTable(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    if (!order.tableId) continue;
    const existing = map.get(order.tableId) ?? [];
    existing.push(order);
    map.set(order.tableId, existing);
  }
  return map;
}

function computeRawMetrics(
  tables: TableSpatialConfig[],
  ordersByTable: Map<string, Order[]>,
): RawMetricsBucket {
  let totalRevenue = 0;
  let totalSeats = 0;
  let totalTurns = 0;

  const rawMetrics = tables.map<RawTableMetric>((tbl) => {
    const tblOrders = ordersByTable.get(tbl.id) ?? [];
    const tblRevenue = tblOrders.reduce((sum, o) => sum + ((o.totalInCents ?? 0) * 10000), 0);
    const capacity = Math.max(1, tbl.capacity || 2);
    const revPerSeat = Math.round(tblRevenue / capacity);
    const turns = tblOrders.length;

    totalRevenue += tblRevenue;
    totalSeats += capacity;
    totalTurns += turns;

    return {
      tableId: tbl.id,
      tableName: tbl.name,
      zone: tbl.zone || 'Salle Principale',
      capacity,
      totalOrders: turns,
      totalRevenueInMicrounits: tblRevenue,
      revenuePerSeatInMicrounits: revPerSeat,
      turnRate: turns,
    };
  });

  return { rawMetrics, totalRevenue, totalSeats, totalTurns };
}

function categorizeThermalIndex(idx: number): TableHeatmapMetrics['performanceCategory'] {
  if (idx >= 0.8) return 'HOT_SPOT';
  if (idx >= 0.4) return 'OPTIMAL';
  if (idx >= 0.15) return 'UNDERPERFORMING';
  return 'DEAD_ZONE';
}

function buildRecommendations(hotSpotsCount: number, deadZonesCount: number): string[] {
  const recs: string[] = [];
  if (deadZonesCount > 0) {
    recs.push(
      `${deadZonesCount} table(s) identifiée(s) en zone morte (< 15% du CA max/couvert). Envisager un repositionnement de l'éclairage ou une réorganisation des passages.`,
    );
  }
  if (hotSpotsCount > 0) {
    recs.push(
      `${hotSpotsCount} table(s) sur-performante(s) (Hot-Spots). Privilégier ces emplacements pour les réservations VIP ou groupes à forte marge.`,
    );
  }
  return recs;
}

/**
 * 🗺️ FloorPlanHeatmapService — Zone 9 Facility
 * Calcul spatio-temporel d'occupation des tables et carte thermique de rentabilité au m².
 */
export class FloorPlanHeatmapService {
  /**
   * Calcule la carte thermique (Heatmap) de la salle pour une date ou un service donné.
   */
  static generateHeatmap(
    businessDate: string,
    tables: TableSpatialConfig[],
    orders: Order[],
  ): FloorPlanHeatmapSummary {
    if (tables.length === 0) return emptyHeatmapSummary(businessDate);

    const ordersByTable = groupOrdersByTable(orders);
    const { rawMetrics, totalRevenue, totalSeats, totalTurns } = computeRawMetrics(tables, ordersByTable);
    const maxRevPerSeat = Math.max(1, ...rawMetrics.map((m) => m.revenuePerSeatInMicrounits));

    let hotSpotsCount = 0;
    let deadZonesCount = 0;

    const tableMetrics: TableHeatmapMetrics[] = rawMetrics.map((m) => {
      const thermalIndex = Number((m.revenuePerSeatInMicrounits / maxRevPerSeat).toFixed(2));
      const category = categorizeThermalIndex(thermalIndex);
      if (category === 'HOT_SPOT') hotSpotsCount++;
      else if (category === 'DEAD_ZONE') deadZonesCount++;
      return { ...m, thermalIndex, performanceCategory: category };
    });

    return {
      businessDate,
      totalTables: tables.length,
      totalSeats,
      totalRevenueInMicrounits: totalRevenue,
      averageTurnRate: tables.length > 0 ? Number((totalTurns / tables.length).toFixed(1)) : 0,
      averageRevenuePerSeatInMicrounits: totalSeats > 0 ? Math.round(totalRevenue / totalSeats) : 0,
      hotSpotsCount,
      deadZonesCount,
      tableMetrics,
      recommendations: buildRecommendations(hotSpotsCount, deadZonesCount),
    };
  }
}
