// @ts-nocheck
// ===========================================
// RESTAURANT OS - SETTINGS TYPES (CONSOLIDATED)
// ===========================================

import { RestaurantIdentity, RestaurantContact, SocialMedia } from './settings/identity';
import { DaySchedule, ServiceSettings, ReservationSlotSettings, ClosedPeriod } from './settings/schedule';
import { MenuCategory, ProductSettings, Supplement, MenuFormule } from './settings/catalog';
import { RecipesConfig, RecipeSettings, RecipeStep, RecipeIngredient } from './settings/recipes';
import { IngredientSettings, SupplierSettings } from './settings/inventory';
import { EmployeeSettings, PositionSettings, StaffConfig, ShiftTemplate, AbsenceSettings, PlanningConfig } from './settings/hr';
import { ReservationSettings } from './settings/reservations';
import { ClientSettings, LoyaltyProgram } from './settings/crm';
import { POSSettings, PaymentMethod, ReceiptTemplate } from './settings/pos';
import { AccountingConfig } from './settings/accounting';
import { HACCPConfig, ControlPoint, NonConformity } from './settings/haccp';
import { DeliveryZone, ClickCollectSettings } from './settings/delivery';
import { AlertRouting, NotificationsConfig, ReportSchedule } from './settings/notifications';
import { RoleSettings, SessionSettings, SecurityConfig } from './settings/security';
import { ThemeSettings } from './settings/theme';
import { PerformanceGoals } from './settings/performance';
import { IntegrationSettings, IntegrationsConfig } from './settings/integrations';

// Re-export all sub-modules
export * from './settings/identity';
export * from './settings/schedule';
export * from './settings/catalog';
export * from './settings/recipes';
export * from './settings/inventory';
export * from './settings/hr';
export * from './settings/reservations';
export * from './settings/crm';
export * from './settings/pos';
export * from './settings/accounting';
export * from './settings/haccp';
export * from './settings/delivery';
export * from './settings/notifications';
export * from './settings/security';
export * from './settings/theme';
export * from './settings/performance';
export * from './settings/integrations';

// ============ GLOBAL SETTINGS CONTAINER ============

export interface GlobalSettings {
    // 1. Identity & Contact
    identity: RestaurantIdentity;
    contact: RestaurantContact;
    social: SocialMedia;

    // 2. Hours & Availability
    schedule: DaySchedule[];
    service: ServiceSettings;
    reservationSlots: ReservationSlotSettings;
    closedPeriods: ClosedPeriod[];

    // 3. Menu & Products
    menuCategories: MenuCategory[];
    products: ProductSettings[];
    supplements: Supplement[];
    formules: MenuFormule[];

    // 4. Recipes
    recipes: RecipeSettings[];
    recipeSteps: RecipeStep[];
    recipeIngredients: RecipeIngredient[];

    // 5. Inventory
    ingredients: IngredientSettings[];
    suppliers: SupplierSettings[];

    // 6. Staff & HR
    employees: EmployeeSettings[];
    positions: PositionSettings[];
    staffConfig: StaffConfig;
    shiftTemplates: ShiftTemplate[];
    absences: AbsenceSettings[];
    planningConfig: PlanningConfig;

    // 7. Reservations
    reservationSettings: ReservationSettings;
    reservationConfig: ReservationSettings;

    // 8. CRM & Clients
    clients: ClientSettings[];
    loyaltyPrograms: LoyaltyProgram[];

    // 9. POS & Accounting
    posSettings: POSSettings;
    pos: POSSettings;
    paymentMethods: PaymentMethod[];
    receiptTemplate: ReceiptTemplate;
    receipt: ReceiptTemplate;
    accounting: AccountingConfig;
    accountingConfig?: AccountingConfig;
    recipesConfig?: RecipesConfig;

    // 10. HACCP & Safety
    haccp: HACCPConfig;
    haccpConfig?: HACCPConfig;
    controlPoints: ControlPoint[];
    nonConformities: NonConformity[];

    // 11. Delivery & Online
    deliveryZones: DeliveryZone[];
    clickCollect: ClickCollectSettings;

    // 12. Notifications
    alerts: AlertRouting[];
    notifications: NotificationsConfig;
    notificationsConfig?: NotificationsConfig;
    reportSchedules: ReportSchedule[];

    // 13. Security
    roles: RoleSettings[];
    session: SessionSettings;
    security: SecurityConfig;
    securityConfig?: SecurityConfig;

    // 14. Appearance
    theme: ThemeSettings;

    // 15. Goals & KPIs
    goals: PerformanceGoals;

    // 16. Integrations
    integrations: IntegrationSettings[];
    integrationsConfig: IntegrationsConfig;
    
    // 17. Legal & Fiscal
    legalEntityName?: string;
    legalForm?: string;
    siret?: string;
    vatNumber?: string;
    registrationCity?: string;
    capital?: string;
    insuranceDetails?: string;
    licenseIV?: string;

    // AI & Intelligence
    slmConfig?: SLMConfig;
    nexusConfig?: import('./settings/nexus').NexusAIConfig;


    // Compatibility Aliases
    haccpControlPoints?: ControlPoint[];
    notificationRoutings?: AlertRouting[];
}

export interface SLMExpert {
    id: string;
    domain: string;
    name: string;
    enabled: boolean;
    minRole: string;
    modelId?: string;
}

export interface SLMConfig {
    apiKey?: string;
    endpoint?: string;
    modelId?: string;
    isAuthorized?: boolean;
    enabled?: boolean;
    fallbackThreshold?: number;
    fallbackTriggerWord?: string;
    experts?: SLMExpert[];
}
