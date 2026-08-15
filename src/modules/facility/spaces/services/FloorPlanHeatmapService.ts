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
  turnRate: number; // Rotations par table
  thermalIndex: number; // 0.0 (froid / inoccupé) à 1.0 (très chaud / sur-performant)
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
    orders: Order[]
  ): FloorPlanHeatmapSummary {
    if (tables.length === 0) {
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

    const tableOrdersMap = new Map<string, Order[]>();
    for (const order of orders) {
      if (order.tableId) {
        const existing = tableOrdersMap.get(order.tableId) || [];
        existing.push(order);
        tableOrdersMap.set(order.tableId, existing);
      }
    }

    let totalRevenue = 0;
    let totalSeats = 0;
    let totalTurns = 0;

    // Calcul préliminaire des métriques brutes
    const rawMetrics = tables.map((tbl) => {
      const tblOrders = tableOrdersMap.get(tbl.id) || [];
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

    // Recherche du maximum de chiffre d'affaires par couvert pour normaliser l'indice thermique
    const maxRevPerSeat = Math.max(1, ...rawMetrics.map((m) => m.revenuePerSeatInMicrounits));

    let hotSpotsCount = 0;
    let deadZonesCount = 0;

    const tableMetrics: TableHeatmapMetrics[] = rawMetrics.map((m) => {
      const thermalIndex = Number((m.revenuePerSeatInMicrounits / maxRevPerSeat).toFixed(2));
      let category: TableHeatmapMetrics['performanceCategory'];

      if (thermalIndex >= 0.8) {
        category = 'HOT_SPOT';
        hotSpotsCount++;
      } else if (thermalIndex >= 0.4) {
        category = 'OPTIMAL';
      } else if (thermalIndex >= 0.15) {
        category = 'UNDERPERFORMING';
      } else {
        category = 'DEAD_ZONE';
        deadZonesCount++;
      }

      return {
        ...m,
        thermalIndex,
        performanceCategory: category,
      };
    });

    const recommendations: string[] = [];
    if (deadZonesCount > 0) {
      recommendations.push(
        `${deadZonesCount} table(s) identifiée(s) en zone morte (< 15% du CA max/couvert). Envisager un repositionnement de l'éclairage ou une réorganisation des passages.`
      );
    }
    if (hotSpotsCount > 0) {
      recommendations.push(
        `${hotSpotsCount} table(s) sur-performante(s) (Hot-Spots). Privilégier ces emplacements pour les réservations VIP ou groupes à forte marge.`
      );
    }

    const avgRevenuePerSeat = totalSeats > 0 ? Math.round(totalRevenue / totalSeats) : 0;
    const avgTurnRate = tables.length > 0 ? Number((totalTurns / tables.length).toFixed(1)) : 0;

    return {
      businessDate,
      totalTables: tables.length,
      totalSeats,
      totalRevenueInMicrounits: totalRevenue,
      averageTurnRate: avgTurnRate,
      averageRevenuePerSeatInMicrounits: avgRevenuePerSeat,
      hotSpotsCount,
      deadZonesCount,
      tableMetrics,
      recommendations,
    };
  }
}
