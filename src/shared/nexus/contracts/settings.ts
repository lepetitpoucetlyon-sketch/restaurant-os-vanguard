// ===========================================
// RESTAURANT OS - SETTINGS TYPES (CONSOLIDATED)
// ===========================================

import {
    BusinessIdentity, BusinessContact, SocialMedia,
    DaySchedule, ServiceSettings, ReservationSlotSettings, ClosedPeriod,
    MenuCategory, ProductSettings, Supplement, MenuFormule,
    RecipesConfig, RecipeSettings, RecipeStep, RecipeIngredient,
    IngredientSettings, SupplierSettings, InventoryConfig,
    EmployeeSettings, PositionSettings, StaffConfig, ShiftTemplate, AbsenceSettings, PlanningConfig,
    ReservationSettings,
    ClientSettings, LoyaltyProgram,
    POSSettings, PaymentMethod, ReceiptTemplate,
    AccountingConfig,
    HACCPConfig, ControlPoint, NonConformity,
    DeliveryZone, ClickCollectSettings,
    AlertRouting, NotificationsConfig, ReportSchedule,
    RoleSettings, SessionSettings, SecurityConfig,
    ThemeSettings,
    PerformanceGoals,
    IntegrationSettings, IntegrationsConfig
} from './settings/index';

// Re-export all sub-modules
export * from './settings/index';

export interface LegalConfig {
    legalEntityName?: string;
    legalForm?: string;
    siret?: string;
    vatNumber?: string;
    registrationCity?: string;
    capital?: string;
    insuranceDetails?: string;
    licenseIV?: string;
}

export interface CustomerConfig {
    loyaltyEnabled: boolean;
    pointsPerEuro: number;
}

// ============ GLOBAL SETTINGS CONTAINER ============

export interface GlobalSettings {
    // 1. Identity & Contact
    identity: BusinessIdentity;
    contact: BusinessContact;
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
    inventory: InventoryConfig;

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

    // 8. Customer & Clients
    clients: ClientSettings[];
    loyaltyPrograms: LoyaltyProgram[];
    customer: CustomerConfig;

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
    legal: LegalConfig;
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
    [key: string]: unknown;
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
    [key: string]: unknown;
}
