/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { getDefaultRestaurantEmail, getInstanceDisplayName, whiteLabelInstanceConfig } from '@/config/instance';
import {
    GlobalSettings,
    BusinessIdentity,
    BusinessContact,
    SocialMedia,
    DaySchedule,
    ServiceSettings,
    ReservationSlotSettings,
    ReservationSettings,
    POSSettings,
    ReceiptTemplate,
    ClickCollectSettings,
    SessionSettings,
    ThemeSettings,
    PerformanceGoals,
    StaffConfig,
    PlanningConfig,
    RecipesConfig,
    AccountingConfig,
    HACCPConfig,
    SecurityConfig,
    NotificationsConfig,
    IntegrationsConfig,
    InventoryConfig,
    LegalConfig,
    CustomerConfig
} from '@nexus/contracts';

export const defaultIdentity: BusinessIdentity = {
    ...whiteLabelInstanceConfig.identityDefaults,
};

export const defaultContact: BusinessContact = {
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    phoneMain: whiteLabelInstanceConfig.supportPhone,
    emailGeneral: getDefaultRestaurantEmail(),
    website: `https://${whiteLabelInstanceConfig.defaultDomain.replace(/^https?:\/\//, '')}`,
};

export const defaultSocial: SocialMedia = {};

export const defaultSchedule: DaySchedule[] = [
    { day: 'monday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'tuesday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'wednesday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'thursday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '22:30' },
    { day: 'friday', isOpen: true, lunchOpen: '12:00', lunchClose: '14:30', dinnerOpen: '19:00', dinnerClose: '23:00' },
    { day: 'saturday', isOpen: true, lunchOpen: '12:00', lunchClose: '15:00', dinnerOpen: '19:00', dinnerClose: '23:00' },
    { day: 'sunday', isOpen: false },
];

export const defaultService: ServiceSettings = {
    avgMealDurationLunch: 75,
    avgMealDurationDinner: 105,
    lastArrivalBeforeClose: 30,
};

export const defaultReservationSlots: ReservationSlotSettings = {
    slotDuration: 15,
    intervalBetweenSlots: 15,
    maxCoversPerSlot: 20,
};

export const defaultReservationConfig: ReservationSettings = {
    minAdvanceHours: 2,
    maxAdvanceDays: 60,
    defaultDuration: 90,
    overbookingAllowed: false,
    autoConfirm: false,
    requireDeposit: false,
    emailReminderHours: 24,
    noShowDelayMinutes: 15,
    confirmationMessage: 'Votre réservation est confirmée.',
    reminderMessage: 'Rappel : vous avez une réservation demain.',
    cancellationMessage: 'Votre réservation a été annulée.',
    cancellationPolicy: 'Annulation gratuite 24h avant.',
    terms: '',
    cardImprintEnabled: false,
    cardImprintCondition: 'group',
    cardImprintGroupMin: 5,
    cardImprintAmountMin: 100,
    cardImprintPenaltyAmount: 20,
    cardImprintCancelHours: 24,
    mgrNotifNewReservation: true,
    mgrNotifCancellation: true,
    mgrNotifNoShow: true,
    mgrNotifModification: false,
    mgrNotifChannels: ['email'],
    mgrNotifEmail: '',
    mgrNotifPhone: '',
    clientNotifConfirmation: true,
    clientNotifReminder: true,
    clientReminderHours: 24,
    clientNotifCancellation: true,
    clientNotifChannels: ['email'],
};

export const defaultPOS: POSSettings = {
    currency: 'EUR',
    priceFormat: 'with_cents',
    displayMode: 'ttc',
    roundingRule: 'none',
    serviceMode: 'table',
    buttonSize: 'medium',
    showImages: true,
    theme: 'light',
    notificationSound: true,
    autoPrintReceipt: true,
    receiptCopies: 1,
    tipsEnabled: true,
    tipSuggestions: [10, 15, 20],
};

export const defaultReceipt: ReceiptTemplate = {
    businessName: getInstanceDisplayName(),
    address: '',
    siret: '',
    vatNumber: '',
    showDetailedTax: true,
    format: '80mm',
};

export const defaultClickCollect: ClickCollectSettings = {
    enabled: false,
    minPrepTime: 30,
    slotsPerHour: 4,
    maxOrdersPerSlot: 5,
};

export const defaultSession: SessionSettings = {
    autoLogoutMinutes: 30,
    requireMFA: false,
    maxConcurrentSessions: 3,
    logRetentionDays: 90,
};

export const defaultTheme: ThemeSettings = {
    primaryColor: '#C5A059',
    secondaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    mode: 'light',
    fontPrimary: 'Outfit',
    fontHeadings: 'Outfit',
    borderRadius: 'large',
    buttonStyle: 'gradient',
    animationsEnabled: true,
};

export const defaultGoals: PerformanceGoals = {};

export const defaultStaffConfig: StaffConfig = {
    maxHoursPerWeek: 35,
    maxOvertimePerWeek: 11,
    minRestBetweenShiftsHours: 11,
    nightShiftStart: '21:00',
    nightShiftBonusPercent: 25,
    sundayBonusPercent: 50,
    holidayBonusPercent: 100,
    paidBreaks: false,
    autoScheduling: false,
    contractTypes: ['cdi', 'cdd', 'extra'],
};

export const defaultPlanningConfig: PlanningConfig = {
    weekStartDay: 1,
    defaultView: 'week',
    minHoursBetweenShifts: 11,
    maxHoursPerDay: 10,
    maxHoursPerWeek: 35,
    notifyOnPublish: true,
    absenceRequestApproval: true,
    swapRequestApproval: true,
    overtimeEnabled: false,
    staffToCoversRatio: 0.1,
};

export const defaultRecipesConfig: RecipesConfig = {
    defaultYield: 4,
    defaultUnit: 'portions',
    showCostsToChefs: true,
    showMarginsToManagers: true,
    autoCalculateCosts: true,
    includeWastePercentage: true,
    defaultWastePercent: 5,
    showNutrition: true,
    showAllergens: true,
    printFormat: 'a4',
    showPhotosInRecipe: true,
    showTimersInRecipe: true,
    targetFoodCostPercent: 30,
    targetGrossMargin: 70,
};

export const defaultAccountingConfig: AccountingConfig = {
    fiscalYearStart: '2024-01-01',
    accountingMethod: 'accrual',
    defaultPaymentTerms: 30,
    vatRates: [
        { rate: 20, name: 'Normal', category: 'Standard' },
        { rate: 10, name: 'Intermédiaire', category: 'Restauration' },
        { rate: 5.5, name: 'Réduit', category: 'Alimentaire' },
    ],
    invoicePrefix: 'INV-',
    invoiceNextNumber: 1,
    bankName: '',
    iban: '',
    bic: '',
    exportFormat: 'pdf',
    complexityMode: 'SIMPLE',
    electronicInvoicingEnabled: false,
    vatIdNumber: '',
    siren: '',
    pdpEndpoint: '',
    facturXProfile: 'minimum',
};

export const defaultHACCPSettings: HACCPConfig = {
    tempCheckFrequencyHours: 4,
    tempAlertDelay: 15,
    tempCriticalDelay: 60,
    autoTempRecording: true,
    sensorIntegration: true,
    tempLogRetentionDays: 90,
    digitalChecklist: true,
    photoRequired: false,
    signatureRequired: true,
    supervisorValidation: true,
    correctiveActionRequired: true,
    alertOnNonConformity: true,
    alertSupervisor: true,
    alertEmail: getDefaultRestaurantEmail('haccp'),
    alertSMS: true,
    alertPhone: '+33 6 12 34 56 78',
    escalationDelay: 30,
    lotTrackingEnabled: true,
    supplierTrackingEnabled: true,
    productionDateRequired: true,
    expiryDateRequired: true,
    allergenTracking: true,
    autoGenerateReports: true,
    reportFrequency: 'weekly',
    pdfExport: true,
    cloudBackup: true,
    retentionYears: 5,
    trainingReminders: true,
    trainingFrequencyMonths: 6,
    certificationTracking: true,
    internalAuditFrequency: 'monthly',
    externalAuditReminder: true,
    auditScoreTarget: 95,
    nonConformityTracking: true,
    temperatureZones: [],
};

export const defaultSecurityConfig: SecurityConfig = {
    require2FA: true,
    twoFactorFrequency: 'weekly',
    allowEmailRescue: true,
    allowMultiplePhones: true,
    sessionTimeout: 30,
    logRetention: 90,
    allowSupportAccess: false
};

export const defaultNotificationsConfig: NotificationsConfig = {
    globalSound: true,
    doNotDisturb: false,
    dndStartTime: '22:00',
    dndEndTime: '08:00',
};

export const defaultIntegrationsConfig: IntegrationsConfig = {
    stripePublicKey: 'pk_live_xxxxxxxxxxxxx',
    stripeSecretKey: 'sk_live_xxxxxxxxxxxxx',
    stripeWebhookSecret: 'whsec_xxxxxxxxxxxxx',
    webhooks: [
        { id: '1', event: 'EVENT_ORDER_COMMIT', url: 'https://projection.nexus.io/v1/signals', isActive: true },
        { id: '2', event: 'EVENT_RESERVATION_ACK', url: 'https://sync.thefork.pro/webhooks', isActive: true },
        { id: '3', event: 'EVENT_CLIENT_MUTATION', url: 'https://hub.mailchimp.com/sync', isActive: false },
    ],
};

import type { NexusAIConfig } from '@nexus/contracts/settings/nexus';
 
import { AI_MODELS } from '@/modules/intelligence';

export const defaultInventory: InventoryConfig = {
    lowStockThreshold: 1000,
    autoReorder: false,
    locations: [
        { id: 'loc-1', name: 'Cuisine', type: 'dry' },
        { id: 'loc-2', name: 'Chambre Froide', type: 'cold' }
    ]
};

export const defaultCustomer: CustomerConfig = {
    loyaltyEnabled: false,
    pointsPerEuro: 1
};

export const defaultLegal: LegalConfig = {
    legalEntityName: '',
    siret: '',
    registrationCity: ''
};

export const defaultNexusConfig: NexusAIConfig = {
    aiName: 'NEXUS',
    voiceId: 'aoede',
    personality: 'expert',
    macros: [],
    historyEnabled: true,
    autoLanguage: true,
};

export const defaultSettings: GlobalSettings = {

    identity: defaultIdentity,
    contact: defaultContact,
    social: defaultSocial,

    schedule: defaultSchedule,
    service: defaultService,
    reservationSlots: defaultReservationSlots,
    closedPeriods: [],

    menuCategories: [],
    products: [],
    supplements: [],
    formules: [],

    recipes: [],
    recipeSteps: [],
    recipeIngredients: [],

    ingredients: [],
    suppliers: [],
    inventory: defaultInventory,

    employees: [],
    positions: [],
    staffConfig: defaultStaffConfig,
    shiftTemplates: [],
    absences: [],
    planningConfig: defaultPlanningConfig,

    reservationSettings: defaultReservationConfig,
    reservationConfig: defaultReservationConfig,

    clients: [],
    loyaltyPrograms: [],
    customer: defaultCustomer,

    posSettings: defaultPOS,
    pos: defaultPOS,
    paymentMethods: [],
    receiptTemplate: defaultReceipt,
    receipt: defaultReceipt,

    accounting: defaultAccountingConfig,
    accountingConfig: defaultAccountingConfig,
    recipesConfig: defaultRecipesConfig,

    haccp: defaultHACCPSettings,
    haccpConfig: defaultHACCPSettings,
    controlPoints: [],
    nonConformities: [],

    deliveryZones: [],
    clickCollect: defaultClickCollect,

    alerts: [],
    notifications: defaultNotificationsConfig,
    notificationsConfig: defaultNotificationsConfig,
    reportSchedules: [],

    roles: [],
    session: defaultSession,
    security: defaultSecurityConfig,
    securityConfig: defaultSecurityConfig,

    theme: defaultTheme,
    goals: defaultGoals,

    integrations: [],
    integrationsConfig: defaultIntegrationsConfig,

    legal: defaultLegal,

    legalEntityName: '',
    legalForm: '',
    siret: '',
    vatNumber: '',
    registrationCity: '',
    capital: '',
    insuranceDetails: '',
    licenseIV: '',

    slmConfig: {
        enabled: false,
        endpoint: '',
        apiKey: '',
        modelId: AI_MODELS.fast,
        fallbackThreshold: 0.5,
        fallbackTriggerWord: 'FORCE_GEMINI_FALLBACK',
        experts: [
            { id: 'exp-inv', domain: 'inventory', name: 'Expert Inventaire', enabled: true, minRole: 'admin', modelId: AI_MODELS.fast },
            { id: 'exp-haccp', domain: 'haccp', name: 'Expert Hygiène', enabled: true, minRole: 'admin', modelId: AI_MODELS.fast },
            { id: 'exp-recipes', domain: 'recipes', name: 'Expert Recettes', enabled: true, minRole: 'admin', modelId: AI_MODELS.fast },
            { id: 'exp-sales', domain: 'sales', name: 'Expert Croissance', enabled: true, minRole: 'admin', modelId: AI_MODELS.fast }
        ],
    },
    nexusConfig: defaultNexusConfig,
};

