import { describe, it, expect } from 'vitest';
import { FloorPlanHeatmapService, type TableSpatialConfig } from '@/modules/facility/spaces/services/FloorPlanHeatmapService';
import type { Order } from '@nexus/contracts/nexus-internal-mapper';

describe('Zone 9 Facility : Heatmap d Occupation & Optimisation Floor-Plan', () => {
  const businessDate = '2026-08-15';

  const mockTables: TableSpatialConfig[] = [
    { id: 't1', name: 'Table 1 (Terrasse)', zone: 'Terrasse', capacity: 4 },
    { id: 't2', name: 'Table 2 (Centre)', zone: 'Salle', capacity: 2 },
    { id: 't3', name: 'Table 3 (Fond sombre)', zone: 'Salle', capacity: 4 },
  ];

  const mockOrders: Partial<Order>[] = [
    // Table 1 : 3 rotations à fort montant (3 x 120€ = 360€ pour 4 places = 90€/couvert)
    { id: 'o1', tableId: 't1', totalInCents: 12000 },
    { id: 'o2', tableId: 't1', totalInCents: 12000 },
    { id: 'o3', tableId: 't1', totalInCents: 12000 },
    // Table 2 : 2 rotations moyennes (2 x 40€ = 80€ pour 2 places = 40€/couvert)
    { id: 'o4', tableId: 't2', totalInCents: 4000 },
    { id: 'o5', tableId: 't2', totalInCents: 4000 },
    // Table 3 : 0 commande (Zone Morte)
  ];

  it('devrait générer la carte thermique spatiale et classifier correctement les zones chaudes et mortes', () => {
    const report = FloorPlanHeatmapService.generateHeatmap(
      businessDate,
      mockTables,
      mockOrders as Order[]
    );

    expect(report.totalTables).toBe(3);
    expect(report.totalSeats).toBe(10);
    expect(report.hotSpotsCount).toBe(1);
    expect(report.deadZonesCount).toBe(1);

    const t1Metrics = report.tableMetrics.find((m) => m.tableId === 't1');
    expect(t1Metrics?.performanceCategory).toBe('HOT_SPOT');
    expect(t1Metrics?.thermalIndex).toBe(1.0);

    const t3Metrics = report.tableMetrics.find((m) => m.tableId === 't3');
    expect(t3Metrics?.performanceCategory).toBe('DEAD_ZONE');
    expect(t3Metrics?.thermalIndex).toBe(0.0);

    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});
