import { GlobalSettings } from '@/types/settings';

/**
 * RESTAURANT OS - GRADE VI DEFAULT SETTINGS
 * 
 * This file serves as the sovereign source of truth for all modules
 * when no remote configuration is present.
 */
export const defaultSettings: GlobalSettings = {
    identity: {
        name: "Restaurant OS Elite",
        slogan: "Intelligence Gastronomique",
        cuisineType: "Modern Gastronomy",
        category: "gastronomique",
        shortDescription: "Système d'exploitation haute performance pour établissements d'excellence.",
        logo: ""
    },
    contact: {
        address: "123 Avenue de l'Innovation",
        city: "Paris",
        postalCode: "75001",
        phoneMain: "+33 1 23 45 67 89",
        emailGeneral: "contact@nexus-restaurant.os",
        website: "https://nexus-restaurant.os"
    },
    social: {
        instagram: "",
        facebook: "",
        google: "",
        tripadvisor: ""
    },
    schedule: [],
    service: {
        paxMin: 1,
        paxMax: 10,
        intervalMinutes: 15,
        autoConfirm: true
    },
    reservationSlots: {
        morning: { start: "12:00", end: "14:30" },
        evening: { start: "19:00", end: "22:30" }
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
    employees: [],
    positions: [],
    staffConfig: {
        maxHoursPerWeek: 35,
        autoScheduling: true
    },
    shiftTemplates: [],
    absences: [],
    planningConfig: {
        startDay: 1,
        autoValidation: false
    },
    reservationSettings: {
        enabled: true,
        maxAdvanceDays: 30,
        minAdvanceHours: 2,
        requireDeposit: false
    },
    reservationConfig: {
        enabled: true,
        maxAdvanceDays: 30,
        minAdvanceHours: 2,
        requireDeposit: false
    },
    clients: [],
    loyaltyPrograms: [],
    posSettings: {
        currency: "EUR",
        priceFormat: "with_cents",
        displayMode: "ttc",
        isTrainingMode: false,
        autoPrintReceipt: true,
        tipsEnabled: true,
        receiptCopies: 1
    },
    pos: {
        currency: "EUR",
        priceFormat: "with_cents",
        displayMode: "ttc",
        isTrainingMode: false,
        autoPrintReceipt: true,
        tipsEnabled: true,
        receiptCopies: 1
    },
    paymentMethods: [
        { id: "cash", label: "Espèces", enabled: true, type: "cash" },
        { id: "card", label: "CB", enabled: true, type: "card" }
    ],
    receiptTemplate: {
        header: "Merci de votre visite",
        footer: "À bientôt !",
        showLogo: true,
        showVat: true
    },
    receipt: {
        header: "Merci de votre visite",
        footer: "À bientôt !",
        showLogo: true,
        showVat: true
    },
    accounting: {
        fiscalYearStart: "01-01",
        accountingMethod: "accrual",
        vatIdNumber: ""
    },
    haccp: {
        tempCheckFrequencyHours: 4,
        lotTrackingEnabled: true,
        supplierTrackingEnabled: true
    },
    clickCollect: {
        enabled: false,
        minPrepTime: 20
    },
    deliveryZones: [],
    alerts: [],
    notifications: {
        globalSound: true,
        doNotDisturb: false
    },
    reportSchedules: [],
    roles: [],
    session: {
        timeoutMinutes: 60
    },
    security: {
        require2FA: false,
        sessionTimeout: 60
    },
    theme: {
        primaryColor: "#C5A059",
        secondaryColor: "#111111",
        mode: "light",
        animationsEnabled: true
    },
    goals: {
        monthlyRevenue: 50000,
        averageTicket: 45
    },
    integrations: [],
    integrationsConfig: {
        nexusSyncEnabled: true
    },
    nexusConfig: {
        aiName: "NEXUS",
        assistantTone: "professional",
        features: ["voice", "vision", "automation"]
    }
};
