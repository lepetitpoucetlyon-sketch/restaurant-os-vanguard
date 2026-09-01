import { z } from 'zod';
import { TimestampSchema } from '@/shared/schemas/primitives';
import { PLATFORM_VARIANTS, VERTICAL_META, type PlatformVariant } from '@/kernel/contracts/tenant';

export { PLATFORM_VARIANTS, VERTICAL_META, type PlatformVariant };
export const PlatformVariantSchema = z.enum(PLATFORM_VARIANTS);

export const TenantThemeSchema = z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    logoUrl: z.string(),
    borderRadius: z.string(),
    appearance: z.enum(['light', 'dark']),
    /** Famille de police détectée par le scrape (P0 CompanyScrapeAgent). Optionnel. */
    fontFamily: z.string().optional(),
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
                displayDepth: z.enum(['essential', 'manager', 'enterprise']).optional(),
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


// ── AI Settings (enriched, Phase C — ADR-008) ─────────────────────────────────

const AIProviderConfigSchema = z.object({
    provider: z.enum(['gemini', 'anthropic', 'openai', 'mistral', 'sovereign', 'ollama']),
    model: z.string(),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
});

/** Configuration IA enrichie d'un tenant (Layer 4 — ADR-008). */
export const AISettingsSchema = z.object({
    mode: z.enum(['cloud', 'souverain', 'mix']).default('cloud'),
    providers: z.object({
        reasoning: AIProviderConfigSchema,
        fast: AIProviderConfigSchema,
        vision: AIProviderConfigSchema,
    }).optional(),
    fallbackChain: z
        .array(z.enum(['gemini', 'anthropic', 'openai', 'mistral', 'sovereign', 'ollama']))
        .default(['gemini', 'anthropic']),
    quotas: z.object({
        monthlyTokens: z.number().optional(),
        alertThreshold: z.number().optional(),
    }).optional(),
    overridePrompts: z.record(z.string(), z.string()).optional(),
});

export type AISettings = z.infer<typeof AISettingsSchema>;

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
        /** @deprecated Utiliser aiSettings (ADR-008). Lu en backward-compat si aiSettings absent. */
        ai: z
            .object({
                enabled: z.boolean(),
                model: z.string().optional(),
                quota: z.number().optional(),
                llmApiKey: z.string().optional(),
            })
            .optional(),
        /** Configuration IA enrichie par tenant (ADR-008 — Layer 4). */
        aiSettings: AISettingsSchema.optional(),
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
