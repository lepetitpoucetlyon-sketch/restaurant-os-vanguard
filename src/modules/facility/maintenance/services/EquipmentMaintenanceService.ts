import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export type EquipmentCategory =
  | 'HVAC'
  | 'COLD_STORAGE'
  | 'COOKING'
  | 'WASHING'
  | 'POS_HARDWARE'
  | 'PLUMBING';

export type EquipmentStatus = 'OPERATIONAL' | 'WARNING' | 'OUT_OF_ORDER';

export interface EquipmentItem {
  id: string;
  tenantId: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  serialNumber: string;
  location: string;
  installedAt: number;
  lastMaintenanceAt?: number;
  nextMaintenanceDueAt: number;
  status: EquipmentStatus;
  warrantyExpiresAt?: number;
}

export interface MaintenanceIntervention {
  id: string;
  tenantId: string;
  equipmentId: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'LEGAL_INSPECTION';
  technicianName: string;
  technicianCompany: string;
  performedAt: number;
  costInMicrounits: number;
  description: string;
  cerfaDocUrl?: string;
  partsReplaced?: string[];
}

/**
 * 🛠️ EquipmentMaintenanceService — Zone 9 Facility
 * Hub de gestion du parc d'équipements, révisions préventives et registre légal de maintenance.
 */
export class EquipmentMaintenanceService {
  /**
   * Enregistre un nouvel équipement au parc matériel.
   */
  static async registerEquipment(
    tenantId: string,
    data: Omit<EquipmentItem, 'id' | 'tenantId' | 'status'>
  ): Promise<EquipmentItem> {
    const id = `eq_${data.category.toLowerCase()}_${Date.now()}`;
    const equipment: EquipmentItem = {
      ...data,
      id,
      tenantId,
      status: 'OPERATIONAL',
    };

    await Nexus.adapter.set(`tenants/${tenantId}/equipment/${id}`, equipment);
    logger.info(`[Facility] Équipement enregistré : ${equipment.name} (${id})`);

    return equipment;
  }

  /**
   * Enregistre une intervention technique (préventive, curative ou contrôle réglementaire CERFA).
   */
  static async logIntervention(
    tenantId: string,
    data: Omit<MaintenanceIntervention, 'id' | 'tenantId' | 'performedAt'>,
    nextIntervalDays: number = 90
  ): Promise<MaintenanceIntervention> {
    const interventionId = `int_${Date.now()}`;
    const now = Date.now();

    const intervention: MaintenanceIntervention = {
      ...data,
      id: interventionId,
      tenantId,
      performedAt: now,
    };

    // 1. Sauvegarder l'intervention
    await Nexus.adapter.set(`tenants/${tenantId}/maintenanceLogs/${interventionId}`, intervention);

    // 2. Mettre à jour l'équipement
    const equipment = await Nexus.adapter.get<EquipmentItem>(`tenants/${tenantId}/equipment/${data.equipmentId}`);
    if (equipment) {
      const updatedEquipment: EquipmentItem = {
        ...equipment,
        lastMaintenanceAt: now,
        nextMaintenanceDueAt: now + nextIntervalDays * 24 * 60 * 60 * 1000,
        status: 'OPERATIONAL',
      };
      await Nexus.adapter.set(`tenants/${tenantId}/equipment/${data.equipmentId}`, updatedEquipment);
    }

    empireAudit.log({
      module: 'facility',
      action: 'MAINTENANCE_INTERVENTION_LOGGED',
      details: {
        equipmentId: data.equipmentId,
        type: data.type,
        technician: data.technicianName,
        costInMicrounits: data.costInMicrounits,
      },
      severity: 'low',
      timestamp: new Date(now),
    });

    logger.info(`[Facility] Intervention ${interventionId} enregistrée pour équipement ${data.equipmentId}`);
    return intervention;
  }

  /**
   * Déclare une panne matérielle et place l'équipement hors-service.
   */
  static async flagBreakdown(
    tenantId: string,
    equipmentId: string,
    reason: string,
    severity: 'minor' | 'critical' = 'critical'
  ): Promise<EquipmentItem> {
    const equipment = await Nexus.adapter.get<EquipmentItem>(`tenants/${tenantId}/equipment/${equipmentId}`);
    if (!equipment) {
      throw new Error(`Équipement introuvable: ${equipmentId}`);
    }

    const updated: EquipmentItem = {
      ...equipment,
      status: 'OUT_OF_ORDER',
    };

    await Nexus.adapter.set(`tenants/${tenantId}/equipment/${equipmentId}`, updated);

    // Découplage Télémétrie Hardware vs Software (Invariant #6)
    await NexusEventBus.emit('facility.hardware_fault', {
      v: 1,
      tenantId,
      deviceId: equipmentId,
      faultType: 'device_offline',
      severity: severity === 'minor' ? 'low' : 'critical',
      occurredAt: Date.now(),
    } as never);

    empireAudit.log({
      module: 'facility',
      action: 'EQUIPMENT_BREAKDOWN_DECLARED',
      details: { equipmentId, reason, severity },
      severity: severity === 'critical' ? 'high' : 'medium',
      timestamp: new Date(),
    });

    logger.warn(`[Facility] Panne déclarée sur ${equipment.name} (${equipmentId}) : ${reason}`);
    return updated;
  }

  /**
   * Récupère la liste des équipements nécessitant une révision préventive urgente.
   */
  static async getOverdueMaintenance(tenantId: string): Promise<EquipmentItem[]> {
    const items = (await Nexus.adapter.get<Record<string, EquipmentItem>>(`tenants/${tenantId}/equipment`)) || {};
    const now = Date.now();

    return Object.values(items).filter(
      (item) => item && typeof item === 'object' && item.nextMaintenanceDueAt <= now
    );
  }
}
