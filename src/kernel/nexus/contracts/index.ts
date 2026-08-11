/* eslint-disable no-restricted-imports -- aggregator: must use deep paths for cycle prevention */
/**
 * 🏛️ NEXUS SHARED CONTRACTS - Universal SaaS Registry
 * Version Grade X - Sovereign Alignment
 */

export type { SovereignField, SovereignNode } from '@/shared/nexus-contract';
export * from '@/shared/genome.types';

// --- 🏛️ DOMAIN AUTHORITIES ---

// 1. Identity & Access
export type { 
    User, 
    UserRole, 
    UserStatus, 
    CategoryKey, 
    RolePermissions,
    AuthCredentials,
    AuthResponse
} from './auth.types';

// 2. Physical Models (Neutral Ground)
export type {
    Table,
    Order,
    Reservation,
    OrderItem,
    OrderItemModification,
    TableStatus,
    OrderStatus,
    GroupEventStatus,
    TableShape
} from './ops.types';

export type {
    Product,
    Recipe,
    Customer,
    ModuleId,
    RecipeIngredient,
    Floor,
    Zone,
    Quote,
    Order as LegacyOrder
} from './nexus-internal-mapper';

export { NexusInternalMapper, canAccessModule } from './nexus-internal-mapper';

// 3. Specialized Domains
export * from './fleet.types';
export * from './finance.types';
export * from './hr.types';
export * from './logistics';
export * from './oracle.types';
export * from './customer.types';
export * from './settings';
export * from './ops.types';
export * from './recruitment';
export * from './registre.types';
export * from './compliance.types';
export * from './commerce.types';
export * from './onboarding.types';

// 4. Operations Bridge (POS & Groups)
export type { CartItem, GroupEvent } from './ops.types';

// --- 🛠️ UTILITIES & UI (Selective Export) ---
export type { 
    Notification, 
    NotificationType, 
    Option, 
    OptionGroup, 
    ProductIngredient,
    RecipeStep,
    SEOProfile,
    IntelligenceConfig,
    RecipeContextType,
    Category,
    WasteLog,
    PrepTask,
    MiseEnPlaceTask,
    MenuAnalysis,
    AuditLog,
    SentimentType,
    SocialReview,
    EquipmentMetric,
    PredictiveAlert,
    IngredientPricePoint,
    ProfitabilityAlert,
    SimulationScenario,
    DocCategory
} from './common.types';

// --- 🌿 HYGIENE & COMPLIANCE (HACCP) ---
export * from './settings/haccp';
export * from './haccp.types';

// --- ⚙️ SETTINGS REGISTRY ---
export * from './settings/accounting';
export * from './settings/catalog';
export * from './settings/delivery';
export * from './settings/hr';
export * from './settings/identity';
export * from './settings/integrations';
export * from './settings/inventory';
export * from './settings/nexus';
export * from './settings/notifications';
export * from './settings/performance';
export * from './settings/pos';
export * from './settings/recipes';
export * from './settings/reservations';
export * from './settings/schedule';
export * from './settings/security';
export * from './settings/theme';

// --- 🏁 FINAL RESOLUTIONS ---
export type { ThemeMode, AccentColor, UIDensity, BorderRadius } from './theme.types';
export { defaultSettings } from './settings.defaults';
export * from './nexus.types';
export * from './errors.types';
export type { GlobalSettings } from './settings';
export type { SovereignData } from '@/shared/nexus-contract';
export * from './tenant';
export * from './license';
export * from './modules';
export * from './supportTicket';
export * from './users';
export * from './rbac';
export type { InventoryMovement } from './logistics';
export * from './marketing.types';
export * from './delivery';
export * from './cash';
export * from './inventory';
export * from './supplier-invoice.schemas';
