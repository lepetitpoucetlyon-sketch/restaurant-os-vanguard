import { z } from 'zod';
import { TimestampSchema } from '@/shared/schemas/primitives';

export const PLATFORM_VARIANTS = [
    'restaurant',
    'hotel',
    'bakery',
    'garage',
    'salon',
    'clinic',
    'retail',
    'custom',
] as const;

export const PlatformVariantSchema = z.enum(PLATFORM_VARIANTS);
export type PlatformVariant = z.infer<typeof PlatformVariantSchema>;

export const VERTICAL_META: Record<PlatformVariant, { emoji: string; label: string }> = {
    restaurant: { emoji: '🍽️', label: 'Restaurant' },
    hotel: { emoji: '🏨', label: 'Hôtel' },
    bakery: { emoji: '🥐', label: 'Boulangerie' },
    garage: { emoji: '🔧', label: 'Garage' },
    salon: { emoji: '✂️', label: 'Salon' },
    clinic: { emoji: '🏥', label: 'Clinique' },
    retail: { emoji: '🛍️', label: 'Retail' },
    custom: { emoji: '🏢', label: 'Custom' },
};

export const TenantThemeSchema = z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    logoUrl: z.string(),
    borderRadius: z.string(),
    appearance: z.enum(['light', 'dark']),
});

export const OrchestratorSignalSchema = z
    .object({
        maintenanceMode: z.boolean(),
        killSwitch: z.boolean(),
        licenceStatus: z.enum(['ACTIVE', 'LOCKED', 'TRIAL']),
        layoutType: z.enum(['default', 'kiosk', 'hud', 'admin', 'sidebar', 'topbar']),
        updatedAt: TimestampSchema,
        economy: z.object({
            basePrice: z.number(),
            currency: z.string(),
            billingStatus: z.string(),
            discountMultiplier: z.number().optional(),
        }),
        businessLaws: z
            .object({
                node_capacity: z.number(),
                fiscal_coefficient: z.number(),
                currency: z.string(),
                pmsEnabled: z.boolean(),
            })
            .catchall(z.any()),
        expert: z
            .object({
                role: z.string(),
                modelId: z.string(),
                isConfigured: z.boolean(),
                isAuthorized: z.boolean(),
            })
            .optional(),
        targetVersion: z.string().optional(),
        otaUrl: z.string().optional(),
        targetState: z.enum(['stable', 'beta', 'bleeding-edge']).optional(),
        priceMultiplier: z.number().optional(),
        lastSignalId: z.string().optional(),
    })
    .catchall(z.any());

export const TenantOverridesSchema = z
    .object({
        ui: z
            .object({
                buttonRadius: z.string().optional(),
                buttonVariant: z.enum(['solid', 'outline', 'ghost']).optional(),
                primaryColor: z.string().optional(),
                accentColor: z.string().optional(),
                layoutType: z
                    .enum(['default', 'kiosk', 'hud', 'admin', 'sidebar', 'topbar'])
                    .optional(),
                fontScale: z.number().min(0.5).max(2).optional(),
            })
            .optional(),
        debug: z
            .object({
                enabled: z.boolean(),
                level: z.enum(['info', 'verbose', 'trace']).default('info'),
                showBoundaries: z.boolean().optional(),
            })
            .optional(),
        /**
         * Feature flags de branding contrôlés depuis le MCC.
         * mod_brand_basic : logo, couleur, favicon, splash — true par défaut (absent = true).
         * mod_brand_plus  : configurateur avancé, AI import, presets — false par défaut (absent = false).
         */
        capabilities: z.record(z.string(), z.boolean()).optional(),
        custom: z.record(z.string(), z.unknown()).optional(),
    })
    .catchall(z.any());

export type TenantOverrides = z.infer<typeof TenantOverridesSchema>;

export const TenantConfigSchema = z
    .object({
        id: z.string(),
        variant: PlatformVariantSchema.optional(),
        name: z.string().optional(),
        tier: z.enum(['CLIENT', 'DEMO', 'TEST', 'REFERENCE']).optional().default('CLIENT'),
        billing: z
            .object({
                status: z.string(),
                plan: z.string(),
                nextBillingDate: z.string().optional(),
            })
            .catchall(z.any())
            .optional(),
        marketplace: z
            .object({
                enabledModules: z.array(z.string()),
            })
            .catchall(z.any())
            .optional(),
        ai: z
            .object({
                enabled: z.boolean(),
                model: z.string().optional(),
                quota: z.number().optional(),
                llmApiKey: z.string().optional(),
            })
            .optional(),
        branding: TenantThemeSchema.optional(),
        capabilities: z.record(z.string(), z.boolean()).optional(),
        features: z.record(z.string(), z.boolean()).optional(),
        theme: TenantThemeSchema.optional(),
        status: OrchestratorSignalSchema.optional(),
        metadata: z
            .object({
                name: z.string(),
                version: z.string(),
                description: z.string().optional(),
                ownerId: z.string().optional(),
                createdAt: TimestampSchema.optional(),
                subscriptionTier: z.string().optional(),
            })
            .optional(),
        overrides: TenantOverridesSchema.optional(),
        customFeatures: z.record(z.string(), z.boolean()).optional(),
        firebase: z.record(z.string(), z.string().optional()).optional(),
    })
    .catchall(z.any());

export type TenantConfig = z.infer<typeof TenantConfigSchema>;
export type OrchestratorSignal = z.infer<typeof OrchestratorSignalSchema>;
export type TenantTheme = z.infer<typeof TenantThemeSchema>;
