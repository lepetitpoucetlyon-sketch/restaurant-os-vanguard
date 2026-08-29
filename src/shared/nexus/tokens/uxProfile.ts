// src/shared/nexus/tokens/uxProfile.ts
import { z } from 'zod';

/**
 * 🛡️ UXProfileSchema - Le contrat de souveraineté des workflows UX.
 * Permet de piloter la navigation, les feature flags et les expériences utilisateur par tenant.
 */

export const UXProfileTypeSchema = z.enum([
  'fast_food',
  'gastronomic',
  'bar_nightclub',
  'dark_kitchen',
  'cocktail_bar',
  'street_food',
  'custom',
]);

export type UXProfileType = z.infer<typeof UXProfileTypeSchema>;

export const defaultModuleSwitchboard = {
  enableRAGAI:            true,
  enableAmbientAudio:     true,
  enableHapticFeedback:   true,
  enableFloorPlan3D:      true,
  enableOrderPacing:      false,
  enableBarTabs:          false,
  enableKDSFocusMode:     false,
  enableCustomerDisplay:  false,
};

export const ModuleSwitchboardSchema = z.object({
  enableRAGAI:            z.boolean().default(true),
  enableAmbientAudio:     z.boolean().default(true),
  enableHapticFeedback:   z.boolean().default(true),
  enableFloorPlan3D:      z.boolean().default(true),
  enableOrderPacing:      z.boolean().default(false),
  enableBarTabs:          z.boolean().default(false),
  enableKDSFocusMode:     z.boolean().default(false),
  enableCustomerDisplay:  z.boolean().default(false),
});

export type ModuleSwitchboard = z.infer<typeof ModuleSwitchboardSchema>;

export const defaultLayoutNavigation = {
  primaryTab:             'pos',
  navigationOrder:        ['pos', 'tables', 'kitchen', 'finance', 'staff'],
  quickShortcuts:         [],
};

export const LayoutNavigationSchema = z.object({
  primaryTab:             z.string().default('pos'),
  navigationOrder:        z.array(z.string()).default(['pos', 'tables', 'kitchen', 'finance', 'staff']),
  quickShortcuts:         z.array(z.string()).default([]),
});

export type LayoutNavigation = z.infer<typeof LayoutNavigationSchema>;

export const UXProfileSchema = z.object({
  tenantId:               z.string().min(1),
  profileType:            UXProfileTypeSchema.default('custom'),
  switchboard:            ModuleSwitchboardSchema.default(defaultModuleSwitchboard),
  navigation:             LayoutNavigationSchema.default(defaultLayoutNavigation),
  updatedAt:              z.string().optional(),
});

export type UXProfileConfig = z.infer<typeof UXProfileSchema>;

export const defaultUXProfile: UXProfileConfig = {
  tenantId: 'default',
  profileType: 'custom',
  switchboard: defaultModuleSwitchboard,
  navigation: defaultLayoutNavigation,
};
