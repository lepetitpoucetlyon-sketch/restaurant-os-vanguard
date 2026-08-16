import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import {
  MaintenanceSettingsConfig,
  MaintenanceSettingsConfigSchema,
  MaintenanceAlertRule,
  RestaurantZone,
  MaintenanceAlertType,
} from '../assets/domain/schemas/maintenanceAlerts';

export interface DispatchAlertParams {
  tenantId: string;
  alertType: MaintenanceAlertType;
  severity: 'minor' | 'degraded' | 'critical';
  zone: RestaurantZone;
  equipmentId?: string;
  equipmentName: string;
  message: string;
  details?: Record<string, unknown>;
}

export class MaintenanceAlertConfigService {
  /**
   * Retourne la configuration par défaut avec des règles de routage réalistes pour la restauration.
   */
  static getDefaultConfig(tenantId: string): MaintenanceSettingsConfig {
    const defaultRules: MaintenanceAlertRule[] = [
      {
        id: 'rule_critical_breakdown',
        alertType: 'EQUIPMENT_BREAKDOWN',
        label: 'Panne Machine Critique ou Dégradée',
        description: 'Déclenchée dès qu un équipement tombe en panne ou passe en mode dégradé.',
        enabled: true,
        applicableZones: ['ALL'],
        notifyPreventiveDaysBefore: 7,
        notifyWarrantyDaysBefore: 30,
        recipients: [
          {
            id: 'rec_dir_breakdown',
            name: 'Direction Générale',
            targetType: 'ROLE',
            role: 'directeur',
            channels: ['IN_APP', 'EMAIL', 'SMS'],
            minSeverity: 'critical',
            active: true,
          },
          {
            id: 'rec_mgr_breakdown',
            name: 'Managers de Service',
            targetType: 'ROLE',
            role: 'manager',
            channels: ['IN_APP', 'EMAIL'],
            minSeverity: 'degraded',
            active: true,
          },
        ],
      },
      {
        id: 'rule_preventive_due',
        alertType: 'PREVENTIVE_OVERDUE',
        label: 'Échéance Révision Préventive & Entretien',
        description: 'Alerte à J-7 avant la date d entretien préventif ou de contrôle périodique.',
        enabled: true,
        applicableZones: ['ALL'],
        notifyPreventiveDaysBefore: 7,
        notifyWarrantyDaysBefore: 30,
        recipients: [
          {
            id: 'rec_mgr_prev',
            name: 'Responsable Technique / Manager',
            targetType: 'ROLE',
            role: 'manager',
            channels: ['IN_APP', 'EMAIL'],
            minSeverity: 'degraded',
            active: true,
          },
        ],
      },
      {
        id: 'rule_warranty_expiring',
        alertType: 'WARRANTY_EXPIRING',
        label: 'Fin de Garantie Constructeur (J-30)',
        description: 'Notification proactive 30 jours avant l expiration de la garantie machine.',
        enabled: true,
        applicableZones: ['ALL'],
        notifyPreventiveDaysBefore: 7,
        notifyWarrantyDaysBefore: 30,
        recipients: [
          {
            id: 'rec_dir_warr',
            name: 'Direction & Achats',
            targetType: 'ROLE',
            role: 'directeur',
            channels: ['IN_APP', 'EMAIL'],
            minSeverity: 'minor',
            active: true,
          },
        ],
      },
      {
        id: 'rule_temp_anomaly',
        alertType: 'TEMPERATURE_ANOMALY',
        label: 'Anomalie Température Chambres Froides IoT',
        description: 'Déviation thermique critique sur les enceintes froides positives ou négatives.',
        enabled: true,
        applicableZones: ['KITCHEN_COLD', 'STORAGE_CELLAR'],
        notifyPreventiveDaysBefore: 7,
        notifyWarrantyDaysBefore: 30,
        recipients: [
          {
            id: 'rec_chef_temp',
            name: 'Chef Cuisinier & Responsable Hygiène',
            targetType: 'ROLE',
            role: 'chef_cuisinier',
            channels: ['IN_APP', 'SMS'],
            minSeverity: 'critical',
            active: true,
          },
          {
            id: 'rec_mgr_temp',
            name: 'Manager d Astreinte',
            targetType: 'ROLE',
            role: 'manager',
            channels: ['IN_APP', 'SMS'],
            minSeverity: 'critical',
            active: true,
          },
        ],
      },
      {
        id: 'rule_pos_fault',
        alertType: 'HARDWARE_FAULT',
        label: 'Incident Caisse, TPE & Imprimante Tickets',
        description: 'Coupure TPE, fin de rouleau ou déconnexion de l imprimante de caisse.',
        enabled: true,
        applicableZones: ['DINING_ROOM_POS'],
        notifyPreventiveDaysBefore: 7,
        notifyWarrantyDaysBefore: 30,
        recipients: [
          {
            id: 'rec_mgr_pos',
            name: 'Manager de Salle',
            targetType: 'ROLE',
            role: 'manager',
            channels: ['IN_APP'],
            minSeverity: 'minor',
            active: true,
          },
        ],
      },
      {
        id: 'rule_cleaning_overdue',
        alertType: 'CLEANING_HACCP_OVERDUE',
        label: 'Détartrage / Nettoyage Machine HACCP en Retard',
        description: 'Cycle d entretien quotidien ou hebdomadaire non complété dans les temps.',
        enabled: true,
        applicableZones: ['KITCHEN_HOT', 'BAR_BEVERAGE', 'DISHWASHING_HYGIENE'],
        notifyPreventiveDaysBefore: 1,
        notifyWarrantyDaysBefore: 30,
        recipients: [
          {
            id: 'rec_mgr_cleaning',
            name: 'Superviseur de Clôture',
            targetType: 'ROLE',
            role: 'manager',
            channels: ['IN_APP'],
            minSeverity: 'minor',
            active: true,
          },
        ],
      },
    ];

    return {
      tenantId,
      autoAlertOnCriticalBreakdown: true,
      defaultPreventiveIntervalDays: 90,
      warrantyAlertThresholdDays: 30,
      rules: defaultRules,
      externalProviders: [
        {
          id: 'prov_froid',
          name: 'Froid Express SAV 24/7',
          specialty: 'Chambres Froides & Groupes Réfrigérés',
          phone: '+33 4 72 00 11 22',
          email: 'urgence@froid-express.fr',
          contractNumber: 'CTR-FROID-2026',
          assignedZones: ['KITCHEN_COLD', 'STORAGE_CELLAR'],
        },
        {
          id: 'prov_cuisson',
          name: 'Grandes Cuisines Lyonnaises',
          specialty: 'Fours mixtes, Pianos & Friteuses',
          phone: '+33 4 78 99 88 77',
          email: 'sav@gcl-restauration.fr',
          contractNumber: 'CTR-GCL-892',
          assignedZones: ['KITCHEN_HOT', 'DISHWASHING_HYGIENE'],
        },
      ],
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }

  /**
   * Récupère la configuration des alertes du tenant (ou initialise avec les valeurs par défaut).
   */
  static async getConfig(tenantId: string): Promise<MaintenanceSettingsConfig> {
    const raw = await Nexus.adapter.get<MaintenanceSettingsConfig>(`tenants/${tenantId}/settings/maintenance_alerts`);
    if (!raw || !raw.rules || raw.rules.length === 0) {
      const defaultCfg = this.getDefaultConfig(tenantId);
      await Nexus.adapter.set(`tenants/${tenantId}/settings/maintenance_alerts`, defaultCfg);
      return defaultCfg;
    }
    return raw;
  }

  /**
   * Met à jour la configuration des alertes et destinataires avec validation Zod stricte.
   */
  static async updateConfig(
    tenantId: string,
    updates: Partial<MaintenanceSettingsConfig>,
    operatorId: string
  ): Promise<MaintenanceSettingsConfig> {
    const current = await this.getConfig(tenantId);
    const merged: MaintenanceSettingsConfig = {
      ...current,
      ...updates,
      tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy: operatorId,
    };

    const validated = MaintenanceSettingsConfigSchema.parse(merged);
    await Nexus.adapter.set(`tenants/${tenantId}/settings/maintenance_alerts`, validated);

    empireAudit.log({
      module: 'facility',
      action: 'MAINTENANCE_ALERT_CONFIG_UPDATED',
      instanceId: tenantId,
      userId: operatorId,
      details: { rulesCount: validated.rules.length, providersCount: validated.externalProviders.length },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(`[Facility] Configuration alertes maintenance mise à jour pour tenant ${tenantId}`);
    return validated;
  }

  private static readonly SEVERITY_ORDER: Record<string, number> = { minor: 1, degraded: 2, critical: 3 };

  private static async notifyRecipient(
    params: DispatchAlertParams,
    recipient: MaintenanceAlertRule['recipients'][number],
    channelsUsed: Set<string>
  ): Promise<number> {
    const { tenantId, alertType, severity, zone, equipmentId, equipmentName, message } = params;
    let count = 0;
    if (recipient.channels.includes('IN_APP')) {
      await NexusEventBus.emit('notification.created', {
        v: 1, tenantId,
        id: `alert-${alertType}-${equipmentId || 'generic'}-${Date.now()}`,
        type: severity === 'critical' ? 'alert' : 'warning',
        title: `🛠️ [${zone}] Alerte Maintenance : ${equipmentName}`,
        message,
        priority: severity === 'critical' ? 'critical' : 'high',
        read: false, timestamp: new Date().toISOString(),
      });
      channelsUsed.add('IN_APP');
      count++;
    }
    if (recipient.channels.includes('EMAIL') && recipient.email) {
      channelsUsed.add('EMAIL');
      logger.info(`[Maintenance Alert] 📧 Email envoyé à ${recipient.email} : ${message}`);
    }
    if (recipient.channels.includes('SMS') && recipient.phone) {
      channelsUsed.add('SMS');
      logger.info(`[Maintenance Alert] 📱 SMS envoyé à ${recipient.phone} : ${message}`);
    }
    return count;
  }

  /**
   * Distribue une alerte de maintenance aux destinataires appropriés en fonction des règles et de la zone.
   */
  static async dispatchAlert(params: DispatchAlertParams): Promise<{
    dispatched: boolean;
    recipientsNotified: number;
    channelsUsed: string[];
  }> {
    const { tenantId, alertType, severity, zone } = params;
    const config = await this.getConfig(tenantId);

    const rule = config.rules.find((r) => r.alertType === alertType && r.enabled);
    if (!rule) {
      logger.warn(`[Facility Alert] Aucune règle active pour ${alertType} (Zone: ${zone})`);
      return { dispatched: false, recipientsNotified: 0, channelsUsed: [] };
    }

    if (!rule.applicableZones.includes('ALL') && !rule.applicableZones.includes(zone)) {
      logger.info(`[Facility Alert] Règle ${rule.id} ignorée pour la zone non ciblée ${zone}`);
      return { dispatched: false, recipientsNotified: 0, channelsUsed: [] };
    }

    const alertSevLevel = this.SEVERITY_ORDER[severity] || 1;
    let recipientsNotified = 0;
    const channelsUsedSet = new Set<string>();

    for (const recipient of rule.recipients) {
      if (!recipient.active) continue;
      if (alertSevLevel < (this.SEVERITY_ORDER[recipient.minSeverity] || 1)) continue;
      try {
        recipientsNotified += await this.notifyRecipient(params, recipient, channelsUsedSet);
      } catch (err) {
        logger.error(`[Maintenance Alert] Échec de notification pour destinataire ${recipient.id}`, err);
        await Nexus.adapter.set(
          `tenants/${tenantId}/dlq/maintenanceAlerts/failed_${Date.now()}`,
          { recipient, params, error: String(err), timestamp: Date.now() }
        );
      }
    }

    return { dispatched: recipientsNotified > 0, recipientsNotified, channelsUsed: Array.from(channelsUsedSet) };
  }
}
