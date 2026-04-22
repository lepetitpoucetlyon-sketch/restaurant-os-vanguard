import { z } from 'zod';

/**
 * 👑 Empire Global Types & Contracts
 * This file serves as the single source of truth for multi-instance orchestration.
 */

export const ServiceTierSchema = z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'EMPIRE-LIMITLESS']);

export const InstanceStatusSchema = z.enum([
  'PROVISIONING', 
  'ONLINE', 
  'OFFLINE', 
  'MAINTENANCE', 
  'LOCKED', 
  'CRITICAL'
]);

/**
 * The DNA of a Restaurant Instance
 */
export const EmpireInstanceSchema = z.object({
  id: z.string(),
  key: z.string(), // slug used for subdomains/paths (e.g. 'bistro-lyon')
  name: z.string(),
  status: InstanceStatusSchema,
  tier: ServiceTierSchema,
  version: z.string(),
  createdAt: z.string().datetime(),
  lastHeartbeat: z.string().datetime(),
  
  // Real-time Fleet Metrics
  metrics: z.object({
    activeUsers: z.number().default(0),
    dailyRevenue: z.number().default(0),
    revenue24h: z.number().default(0), // Alias for UI compatibility
    aiUsageCost: z.number().default(0), // New telemetry field
    healthScore: z.number().min(0).max(100).default(100),
    errorRate: z.number().optional().default(0),
    uptime: z.number().optional().default(99.9),
    lowStockAlerts: z.number().default(0),
    expiringItemsCount: z.number().optional().default(0),
    complianceScore: z.number().min(0).max(100).default(100)
  }),

  // Branding & Configuration (The "Vibe")
  branding: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
    tagline: z.string().optional()
  }),

  // Feature Flags (SaaS Control)
  featureFlags: z.record(z.string(), z.boolean()).default({}),

  // Distributed Project Config (Master Registry)
  firebaseConfig: z.object({
    apiKey: z.string(),
    authDomain: z.string(),
    projectId: z.string(),
    storageBucket: z.string(),
    messagingSenderId: z.string(),
    appId: z.string()
  }).optional(),

  // Security & Legal (Empire Armory)
  security: z.object({
    twoFactorEnabled: z.boolean().default(true),
    nf525Certified: z.boolean().default(true),
    maintenanceAccessGranted: z.boolean().default(false),
    maintenanceGrantedUntil: z.string().datetime().optional(),
    // Privacy Shield: Support-on-Demand Access
    supportAccessGranted: z.boolean().default(false),
    supportAccessUntil: z.string().datetime().optional()
  }).passthrough()
}).passthrough();

export type EmpireInstance = z.infer<typeof EmpireInstanceSchema>;

/**
 * Data needed to "Clone" a new instance
 */
export const ProvisioningDNA = z.object({
  name: z.string().min(3),
  key: z.string().regex(/^[a-z0-9-]+$/),
  ownerEmail: z.string().email(),
  initialPrimaryColor: z.string().default('#6366f1'),
  tier: ServiceTierSchema.default('STANDARD'),
  copyBaseTemplates: z.boolean().default(true)
}).passthrough();

export type ProvisioningDNA = z.infer<typeof ProvisioningDNA>;

/**
 * Global Empire Stats (MCC View)
 */
export interface EmpireGlobalMetrics {
  totalInstances: number;
  activeFleetCount: number;
  fleetTotalRevenue: number;
  averageHealthScore: number;
  averageComplianceScore: number;
  totalActiveUsers: number;
  criticalAlerts: number;
  totalRisks: number;
  
  // Economy Metrics
  totalMRR: number;
  averageDiscount: number;
  lockedInstances: number;
}

