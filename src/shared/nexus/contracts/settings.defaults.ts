import type { GlobalSettings } from './settings';

/**
 * 🏛️ NEXUS CANONICAL DEFAULT SETTINGS (GRADE X)
 *
 * Sovereign source of truth for GlobalSettings when no remote configuration is
 * present. Lives in the nexus-contracts layer (next to the GlobalSettings type)
 * so both the config layer (config/defaults) and the state layer (settingsAtoms)
 * can consume it without the state layer reaching down into `config/`.
 */
export const defaultSettings: GlobalSettings = {
    identity: {
        id: "",
        name: "",
        slogan: "",
        cuisineType: "",
        category: "gastronomique",
        shortDescription: "",
        logo: ""
    },
    contact: {
        address: "",
        city: "",
        postalCode: "",
        country: "France",
        phoneMain: "",
        emailGeneral: "",
        website: ""
    },
    social: {
        instagram: "",
        facebook: "",
        google: "",
        tripadvisor: ""
    },
    schedule: [],
    service: {
        avgMealDurationLunch: 90,
        avgMealDurationDinner: 120,
        lastArrivalBeforeClose: 30
    },
    reservationSlots: {
        slotDuration: 30,
        intervalBetweenSlots: 15,
        maxCoversPerSlot: 10
    },
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
    inventory: {
        lowStockThreshold: 1000,
        autoReorder: false,
        locations: [
            { id: 'loc-1', name: 'Cuisine', type: 'dry' },
            { id: 'loc-2', name: 'Chambre Froide', type: 'cold' }
        ]
    },
    employees: [],
    positions: [],
    staffConfig: {
        maxHoursPerWeek: 35,
        maxOvertimePerWeek: 10,
        minRestBetweenShiftsHours: 11,
        nightShiftStart: "22:00",
        nightShiftBonusPercent: 20,
        sundayBonusPercent: 50,
        holidayBonusPercent: 100,
        paidBreaks: true,
        autoScheduling: true,
        contractTypes: ["cdi", "cdd", "extra"]
    },
    shiftTemplates: [],
    absences: [],
    planningConfig: {
        weekStartDay: 1,
        defaultView: "week",
        minHoursBetweenShifts: 11,
        maxHoursPerDay: 10,
        maxHoursPerWeek: 48,
        notifyOnPublish: true,
        absenceRequestApproval: true,
        swapRequestApproval: true,
        overtimeEnabled: true,
        staffToCoversRatio: 0.15
    },
    reservationSettings: {
        minAdvanceHours: 2,
        maxAdvanceDays: 30,
        defaultDuration: 90,
        overbookingAllowed: false,
        autoConfirm: true,
        requireDeposit: false,
        emailReminderHours: 24,
        noShowDelayMinutes: 20,
        confirmationMessage: "Votre réservation est confirmée.",
        reminderMessage: "Rappel de votre réservation demain.",
        cancellationMessage: "Annulation confirmée.",
        cancellationPolicy: "Annulation gratuite jusqu'à 2h avant.",
        terms: "En réservant, vous acceptez nos CGU."
    },
    reservationConfig: {
        minAdvanceHours: 2,
        maxAdvanceDays: 30,
        defaultDuration: 90,
        overbookingAllowed: false,
        autoConfirm: true,
        requireDeposit: false,
        emailReminderHours: 24,
        noShowDelayMinutes: 20,
        confirmationMessage: "Votre réservation est confirmée.",
        reminderMessage: "Rappel de votre réservation demain.",
        cancellationMessage: "Annulation confirmée.",
        cancellationPolicy: "Annulation gratuite jusqu'à 2h avant.",
        terms: "En réservant, vous acceptez nos CGU."
    },
    clients: [],
    loyaltyPrograms: [],
    customer: {
        loyaltyEnabled: false,
        pointsPerEuro: 1
    },
    posSettings: {
        currency: "EUR",
        priceFormat: "with_cents",
        displayMode: "ttc",
        roundingRule: "none",
        serviceMode: "table",
        buttonSize: "medium",
        showImages: true,
        theme: "light",
        notificationSound: true,
        autoPrintReceipt: true,
        receiptCopies: 1,
        tipsEnabled: true,
        tipSuggestions: [5, 10, 15]
    },
    pos: {
        currency: "EUR",
        priceFormat: "with_cents",
        displayMode: "ttc",
        roundingRule: "none",
        serviceMode: "table",
        buttonSize: "medium",
        showImages: true,
        theme: "light",
        notificationSound: true,
        autoPrintReceipt: true,
        receiptCopies: 1,
        tipsEnabled: true,
        tipSuggestions: [5, 10, 15]
    },
    paymentMethods: [
        { id: "cash", name: "Espèces", enabled: true, type: "cash", order: 1 },
        { id: "card", name: "CB", enabled: true, type: "card", order: 2 }
    ],
    receiptTemplate: {
        logo: "",
        restaurantName: "Restaurant OS Elite",
        address: "123 Avenue de l'Innovation, 75001 Paris",
        siret: "",
        vatNumber: "",
        welcomeMessage: "Merci de votre visite",
        thankYouMessage: "À bientôt !",
        footer: "Nexus Restaurant OS",
        showDetailedTax: true,
        format: "80mm"
    },
    receipt: {
        logo: "",
        restaurantName: "Restaurant OS Elite",
        address: "123 Avenue de l'Innovation, 75001 Paris",
        siret: "",
        vatNumber: "",
        welcomeMessage: "Merci de votre visite",
        thankYouMessage: "À bientôt !",
        footer: "Nexus Restaurant OS",
        showDetailedTax: true,
        format: "80mm"
    },
    accounting: {
        fiscalYearStart: "01-01",
        accountingMethod: "accrual",
        vatIdNumber: "",
        defaultPaymentTerms: 30,
        vatRates: [
            { rate: 20, name: "TVA 20%", category: "standard" },
            { rate: 10, name: "TVA 10%", category: "intermediate" },
            { rate: 5.5, name: "TVA 5.5%", category: "reduced" }
        ],
        invoicePrefix: "FACT-",
        invoiceNextNumber: 1,
        bankName: "",
        iban: "",
        bic: "",
        exportFormat: "pdf",
        complexityMode: "EXPERT",
        electronicInvoicingEnabled: false,
        siren: "",
        pdpEndpoint: "",
        facturXProfile: "basic"
    },
    haccp: {
        tempCheckFrequencyHours: 4,
        tempAlertDelay: 30,
        tempCriticalDelay: 60,
        autoTempRecording: false,
        sensorIntegration: false,
        tempLogRetentionDays: 365,
        digitalChecklist: true,
        photoRequired: false,
        signatureRequired: true,
        supervisorValidation: false,
        correctiveActionRequired: true,
        alertOnNonConformity: true,
        alertSupervisor: true,
        alertEmail: "",
        alertSMS: false,
        alertPhone: "",
        escalationDelay: 120,
        lotTrackingEnabled: true,
        supplierTrackingEnabled: true,
        productionDateRequired: true,
        expiryDateRequired: true,
        allergenTracking: true,
        autoGenerateReports: true,
        reportFrequency: "daily",
        pdfExport: true,
        cloudBackup: true,
        retentionYears: 5,
        trainingReminders: true,
        trainingFrequencyMonths: 12,
        certificationTracking: true,
        internalAuditFrequency: "monthly",
        externalAuditReminder: true,
        auditScoreTarget: 95,
        nonConformityTracking: true,
        temperatureZones: []
    },
    controlPoints: [],
    nonConformities: [],
    clickCollect: {
        enabled: false,
        minPrepTime: 20,
        slotsPerHour: 4,
        maxOrdersPerSlot: 5
    },
    deliveryZones: [],
    alerts: [],
    notifications: {
        globalSound: true,
        doNotDisturb: false,
        dndStartTime: "23:00",
        dndEndTime: "07:00"
    },
    reportSchedules: [],
    roles: [],
    session: {
        autoLogoutMinutes: 60,
        requireMFA: false,
        maxConcurrentSessions: 1,
        logRetentionDays: 90
    },
    security: {
        require2FA: false,
        twoFactorFrequency: "always",
        allowEmailRescue: true,
        allowMultiplePhones: false,
        sessionTimeout: 60,
        logRetention: 90,
        allowSupportAccess: true
    },
    theme: {
        primaryColor: "#C5A059",
        secondaryColor: "#111111",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        mode: "light",
        fontPrimary: "Inter",
        fontHeadings: "Outfit",
        borderRadius: "medium",
        buttonStyle: "flat",
        animationsEnabled: true
    },
    goals: {
        monthlyRevenue: 50000,
        avgTicket: 45
    },
    integrations: [],
    integrationsConfig: {
        stripePublicKey: "",
        stripeSecretKey: "",
        stripeWebhookSecret: "",
        webhooks: []
    },
    legal: {
        legalEntityName: "",
        siret: "",
        registrationCity: ""
    },
    nexusConfig: {
        aiName: "NEXUS",
        voiceId: "aoede",
        personality: "expert",
        macros: [],
        historyEnabled: true,
        autoLanguage: true
    }
};
