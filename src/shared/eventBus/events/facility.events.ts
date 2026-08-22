export interface FACILITYEvents {
  'facility.floor_plan_updated': { tenantId: string; floorId: string; tables: { id: string; capacity: number; x: number; y: number }[] };

  'facility.maintenance_required': { tenantId: string; assetId: string; assetType: string; description: string };

  'facility.equipment_registered': { tenantId: string; equipmentId: string; name: string; category: string; registeredBy: string; registeredAt: string };

  'facility.equipment_breakdown': { tenantId: string; equipmentId: string; equipmentName: string; severity: 'minor' | 'degraded' | 'critical'; errorCode?: string; reason: string; declaredBy: string; declaredAt: string };

  'facility.equipment_repaired': { tenantId: string; equipmentId: string; technicianName: string; costInMicrounits: number; resolvedAt: string; partsReplaced?: string[] };

  'facility.guide_attached': { tenantId: string; equipmentId: string; guideId: string; guideType: string; title: string; addedBy: string };

  'facility.warranty_expiring_soon': { tenantId: string; equipmentId: string; equipmentName: string; warrantyExpiresAt: string; daysRemaining: number };

  'facility.device_overheated': { v:1; tenantId: string; deviceId: string; temperatureCelsius: number; targetFailoverTerminalId: string; failoverAt: number };
}
