import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import {
  EquipmentAsset,
  EquipmentAssetSchema,
  EquipmentPurchaseInfo,
  EquipmentStatus,
  EquipmentBreakdown,
  EquipmentBreakdownSchema,
} from '../assets/domain/schemas/equipment';

export interface DepreciationYear {
  yearIndex: number;
  year: number;
  annualDepreciationInMicrounits: number;
  accumulatedDepreciationInMicrounits: number;
  bookValueInMicrounits: number;
}

/**
 * 🛠️ EquipmentAssetService — Hub de Gestion du Parc Matériel & Factures d'Achat
 */
export class EquipmentAssetService {
  private static basePath(tenantId: string): string {
    return `tenants/${tenantId}/equipmentAssets`;
  }

  private static breakdownPath(tenantId: string): string {
    return `tenants/${tenantId}/equipmentBreakdowns`;
  }

  /**
   * Enregistre un nouvel équipement avec sa facture et sa garantie.
   */
  static async registerAsset(
    tenantId: string,
    data: Omit<EquipmentAsset, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    operatorId: string = 'system'
  ): Promise<EquipmentAsset> {
    const id = `eq_${data.category.toLowerCase()}_${Date.now()}`;
    const now = new Date().toISOString();

    const asset: EquipmentAsset = EquipmentAssetSchema.parse({
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });

    await Nexus.adapter.set(`${this.basePath(tenantId)}/${id}`, asset);

    // Événement EventBus
    await NexusEventBus.emitDurable('facility.equipment_registered', {
      tenantId,
      equipmentId: id,
      name: asset.name,
      category: asset.category,
      registeredBy: operatorId,
      registeredAt: now,
    } as never);

    empireAudit.log({
      module: 'facility',
      action: 'EQUIPMENT_ASSET_REGISTERED',
      details: {
        equipmentId: id,
        name: asset.name,
        brand: asset.brand,
        model: asset.model,
        hasInvoice: !!asset.purchase?.invoiceUrl,
        purchasePrice: asset.purchase?.purchasePriceInMicrounits,
      },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(`[Facility] Équipement enregistré : ${asset.name} (${id})`);
    return asset;
  }

  /**
   * Récupère tous les équipements d'un tenant.
   */
  static async getAllAssets(tenantId: string): Promise<EquipmentAsset[]> {
    const list = await Nexus.adapter.query<EquipmentAsset>(this.basePath(tenantId));
    return list || [];
  }

  /**
   * Récupère un équipement par son ID.
   */
  static async getAssetById(tenantId: string, equipmentId: string): Promise<EquipmentAsset | null> {
    return Nexus.adapter.get<EquipmentAsset>(`${this.basePath(tenantId)}/${equipmentId}`);
  }

  /**
   * Met à jour les informations d'un équipement.
   */
  static async updateAsset(
    tenantId: string,
    equipmentId: string,
    updates: Partial<Omit<EquipmentAsset, 'id' | 'tenantId' | 'createdAt'>>,
    operatorId: string = 'system'
  ): Promise<EquipmentAsset> {
    const current = await this.getAssetById(tenantId, equipmentId);
    if (!current) {
      throw new Error(`Équipement ${equipmentId} introuvable pour le tenant ${tenantId}`);
    }

    const updated: EquipmentAsset = EquipmentAssetSchema.parse({
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await Nexus.adapter.set(`${this.basePath(tenantId)}/${equipmentId}`, updated);

    empireAudit.log({
      module: 'facility',
      action: 'EQUIPMENT_ASSET_UPDATED',
      details: { equipmentId, updates, operatorId },
      severity: 'low',
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Déclare une panne et place l'appareil hors-service ou en mode dégradé.
   */
  static async declareBreakdown(
    tenantId: string,
    equipmentId: string,
    data: {
      symptom: string;
      severity: 'minor' | 'degraded' | 'critical';
      errorCode?: string;
      photoUrl?: string;
      declaredBy: string;
    }
  ): Promise<EquipmentBreakdown> {
    const equipment = await this.getAssetById(tenantId, equipmentId);
    if (!equipment) {
      throw new Error(`Équipement ${equipmentId} introuvable.`);
    }

    const breakdownId = `brk_${Date.now()}`;
    const now = new Date().toISOString();

    const breakdown: EquipmentBreakdown = EquipmentBreakdownSchema.parse({
      id: breakdownId,
      tenantId,
      equipmentId,
      equipmentName: equipment.name,
      severity: data.severity,
      errorCode: data.errorCode,
      symptom: data.symptom,
      declaredBy: data.declaredBy,
      declaredAt: now,
      status: 'OPEN',
      photoUrl: data.photoUrl,
      partsReplaced: [],
    });

    await Nexus.adapter.set(`${this.breakdownPath(tenantId)}/${breakdownId}`, breakdown);

    // Mettre à jour le statut de l'équipement
    const newStatus: EquipmentStatus = data.severity === 'critical' ? 'OUT_OF_ORDER' : 'DEGRADED';
    await this.updateAsset(tenantId, equipmentId, { status: newStatus }, data.declaredBy);

    // Invariant #6 : Émission télémétrie EventBus
    await NexusEventBus.emitDurable('facility.equipment_breakdown', {
      tenantId,
      equipmentId,
      equipmentName: equipment.name,
      severity: data.severity,
      errorCode: data.errorCode,
      reason: data.symptom,
      declaredBy: data.declaredBy,
      declaredAt: now,
    } as never);

    empireAudit.log({
      module: 'facility',
      action: 'EQUIPMENT_BREAKDOWN_DECLARED',
      details: { breakdownId, equipmentId, severity: data.severity, errorCode: data.errorCode },
      severity: data.severity === 'critical' ? 'high' : 'medium',
      timestamp: new Date(),
    });

    return breakdown;
  }

  /**
   * Clôture une panne / intervention de réparation.
   */
  static async resolveBreakdown(
    tenantId: string,
    breakdownId: string,
    resolution: {
      technicianName: string;
      resolutionNotes: string;
      costInMicrounits: number;
      partsReplaced?: string[];
    }
  ): Promise<EquipmentBreakdown> {
    const breakdown = await Nexus.adapter.get<EquipmentBreakdown>(`${this.breakdownPath(tenantId)}/${breakdownId}`);
    if (!breakdown) {
      throw new Error(`Panne ${breakdownId} introuvable.`);
    }

    const now = new Date().toISOString();
    const updatedBreakdown: EquipmentBreakdown = {
      ...breakdown,
      status: 'RESOLVED',
      resolvedAt: now,
      resolutionNotes: resolution.resolutionNotes,
      costInMicrounits: resolution.costInMicrounits,
      partsReplaced: resolution.partsReplaced || [],
    };

    await Nexus.adapter.set(`${this.breakdownPath(tenantId)}/${breakdownId}`, updatedBreakdown);

    // Rétablir l'équipement en OPERATIONAL
    await this.updateAsset(
      tenantId,
      breakdown.equipmentId,
      {
        status: 'OPERATIONAL',
        lastMaintenanceAt: now,
      },
      resolution.technicianName
    );

    await NexusEventBus.emitDurable('facility.equipment_repaired', {
      tenantId,
      equipmentId: breakdown.equipmentId,
      technicianName: resolution.technicianName,
      costInMicrounits: resolution.costInMicrounits,
      resolvedAt: now,
      partsReplaced: resolution.partsReplaced,
    } as never);

    return updatedBreakdown;
  }

  /**
   * Détecte les équipements dont la garantie constructeur expire bientôt (J-30 par défaut).
   */
  static async checkExpiringWarranties(
    tenantId: string,
    withinDays: number = 30
  ): Promise<Array<{ asset: EquipmentAsset; daysRemaining: number }>> {
    const assets = await this.getAllAssets(tenantId);
    const nowMs = Date.now();
    const thresholdMs = nowMs + withinDays * 24 * 60 * 60 * 1000;
    const expiring: Array<{ asset: EquipmentAsset; daysRemaining: number }> = [];

    for (const asset of assets) {
      if (asset.purchase?.warrantyExpiresAt) {
        const warrantyMs = new Date(asset.purchase.warrantyExpiresAt).getTime();
        if (warrantyMs >= nowMs && warrantyMs <= thresholdMs) {
          const daysRemaining = Math.ceil((warrantyMs - nowMs) / (24 * 60 * 60 * 1000));
          expiring.push({ asset, daysRemaining });

          NexusEventBus.emit('facility.warranty_expiring_soon', {
            tenantId,
            equipmentId: asset.id,
            equipmentName: asset.name,
            warrantyExpiresAt: asset.purchase.warrantyExpiresAt,
            daysRemaining,
          } as never);
        }
      }
    }

    return expiring;
  }

  /**
   * Calcule le tableau d'amortissement linéaire d'une machine.
   */
  static calculateDepreciationSchedule(purchase: EquipmentPurchaseInfo): DepreciationYear[] {
    const purchaseYear = new Date(purchase.purchaseDate).getFullYear();
    const totalMicrounits = purchase.purchasePriceInMicrounits;
    const years = Math.max(1, purchase.depreciationPeriodYears);
    const annualDepreciation = Math.floor(totalMicrounits / years);
    const schedule: DepreciationYear[] = [];

    let accumulated = 0;

    for (let i = 1; i <= years; i++) {
      const isLast = i === years;
      const annual = isLast ? totalMicrounits - accumulated : annualDepreciation;
      accumulated += annual;
      const bookValue = totalMicrounits - accumulated;

      schedule.push({
        yearIndex: i,
        year: purchaseYear + i - 1,
        annualDepreciationInMicrounits: annual,
        accumulatedDepreciationInMicrounits: accumulated,
        bookValueInMicrounits: Math.max(0, bookValue),
      });
    }

    return schedule;
  }
}
