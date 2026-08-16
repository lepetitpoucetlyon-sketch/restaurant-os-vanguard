import { z } from 'zod';
import { PermissionRole } from '@/shared/nexus/contracts/permissions.types';

export const RestaurantZoneSchema = z.enum([
  'ALL',                  // L'entièreté de l'établissement
  'KITCHEN_HOT',          // Cuisine Chaude (Fours, pianos, friteuses, extraction)
  'KITCHEN_COLD',         // Cuisine Froide & Préparation (Chambres froides, armoires, robots)
  'BAR_BEVERAGE',         // Bar & Comptoir (Machines espresso, tireuses, moulins)
  'DINING_ROOM_POS',      // Salle & Caisse (TPE, imprimantes tickets, tiroir-caisse, KDS)
  'DISHWASHING_HYGIENE',  // Plonge & Laverie (Lave-vaisselle, adoucisseurs)
  'STORAGE_CELLAR',       // Réserve, Économat & Cave à Vin
  'HVAC_FACILITY',        // Locaux Techniques, CVC & Extraction
  'TERRACE_OUTDOOR',      // Terrasse & Extérieur
]);

export type RestaurantZone = z.infer<typeof RestaurantZoneSchema>;

export const RESTAURANT_ZONE_LABELS: Record<RestaurantZone, string> = {
  ALL: '🏢 L entièreté du restaurant (Vue Globale)',
  KITCHEN_HOT: '🔥 Cuisine Chaude & Cuisson',
  KITCHEN_COLD: '❄️ Cuisine Froide & Chambres Froides',
  BAR_BEVERAGE: '☕ Bar, Comptoir & Boissons',
  DINING_ROOM_POS: '🖥️ Salle, Encaissement & TPE',
  DISHWASHING_HYGIENE: '🧼 Plonge, Laverie & Hygiène',
  STORAGE_CELLAR: '📦 Réserve, Économat & Cave',
  HVAC_FACILITY: '💨 Extraction, CVC & Locaux Techniques',
  TERRACE_OUTDOOR: '🌿 Terrasse & Extérieur',
};

export const MaintenanceAlertTypeSchema = z.enum([
  'EQUIPMENT_BREAKDOWN',       // Panne déclarée (critique, dégradée)
  'PREVENTIVE_OVERDUE',        // Révision préventive dépassée ou imminente
  'WARRANTY_EXPIRING',         // Échéance de garantie constructeur (J-30)
  'TEMPERATURE_ANOMALY',       // Alerte sonde IoT température froid
  'HARDWARE_FAULT',            // Incident TPE, imprimante caisse, tiroir
  'CLEANING_HACCP_OVERDUE',    // Nettoyage/détartrage machine obligatoire non validé
]);

export type MaintenanceAlertType = z.infer<typeof MaintenanceAlertTypeSchema>;

export const NotificationChannelSchema = z.enum([
  'IN_APP',
  'EMAIL',
  'SMS',
  'PUSH',
]);

export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

/**
 * Destinataire d'une règle d'alerte
 */
export const AlertRecipientSchema = z.object({
  id: z.string(),
  name: stringOrOptional(z.string()),
  targetType: z.enum(['ROLE', 'USER', 'EXTERNAL_PROVIDER']),
  role: z.string().optional(), // ex: 'directeur', 'manager', 'chef_cuisinier', 'barman'
  userId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  channels: z.array(NotificationChannelSchema).default(['IN_APP']),
  minSeverity: z.enum(['minor', 'degraded', 'critical']).default('degraded'),
  active: z.boolean().default(true),
});

function stringOrOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema.optional();
}

export type AlertRecipient = z.infer<typeof AlertRecipientSchema>;

/**
 * Règle d'alerte maintenance
 */
export const MaintenanceAlertRuleSchema = z.object({
  id: z.string(),
  alertType: MaintenanceAlertTypeSchema,
  label: z.string(),
  description: z.string(),
  enabled: z.boolean().default(true),
  applicableZones: z.array(RestaurantZoneSchema).default(['ALL']),
  notifyPreventiveDaysBefore: z.number().int().default(7), // J-7
  notifyWarrantyDaysBefore: z.number().int().default(30),  // J-30
  recipients: z.array(AlertRecipientSchema).default([]),
});

export type MaintenanceAlertRule = z.infer<typeof MaintenanceAlertRuleSchema>;

/**
 * Configuration Globale Maintenance & Alertes du Restaurant
 */
export const MaintenanceSettingsConfigSchema = z.object({
  tenantId: z.string(),
  autoAlertOnCriticalBreakdown: z.boolean().default(true),
  defaultPreventiveIntervalDays: z.number().int().default(90),
  warrantyAlertThresholdDays: z.number().int().default(30),
  rules: z.array(MaintenanceAlertRuleSchema),
  externalProviders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      specialty: z.string(), // 'Froid', 'Cuisson', 'Plomberie', 'Caisse/TPE'
      phone: z.string(),
      email: z.string().email().optional(),
      contractNumber: z.string().optional(),
      assignedZones: z.array(RestaurantZoneSchema).default(['ALL']),
    })
  ).default([]),
  updatedAt: z.string(),
  updatedBy: z.string().default('system'),
});

export type MaintenanceSettingsConfig = z.infer<typeof MaintenanceSettingsConfigSchema>;
