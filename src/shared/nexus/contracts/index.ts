/**
 * 🏛️ NEXUS SHARED CONTRACTS - Universal SaaS Registry
 * Version Grade X - Sovereign Alignment
 */

export * from '../../nexus-contract';
export * from '../../genome.types';

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
    Ingredient,
    Order,
    Product,
    Recipe,
    Customer,
    Table,
    ModuleId,
    Reservation,
    OrderStatus,
    OrderItem,
    OrderItemModification,
    Floor,
    Zone,
    Order as LegacyOrder
} from './nexus-internal-mapper';

export { NexusInternalMapper, canAccessModule } from './nexus-internal-mapper';

// 3. Specialized Domains
export * from './fleet.types';
export * from './finance.types';
export * from './logistics';
export * from './oracle.types';
export * from './customer.types';
export * from './settings';

// 4. Operations Bridge (POS & Groups)
export type { CartItem } from '@/modules/ops/engine/types';
export type { GroupEvent } from '@/modules/ops/engine/groups.types';

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
export * from '@/modules/compliance/haccp/types';

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
export * from './nexus.types';
export * from './errors.types';
export type { GlobalSettings } from './settings';
