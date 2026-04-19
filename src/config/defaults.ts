import { GlobalSettings } from '@/types/settings';

/**
 * RESTAURANT OS - GRADE VI DEFAULT SETTINGS
 * 
 * This file serves as the sovereign source of truth for all modules
 * when no remote configuration is present.
 */
export const defaultSettings: GlobalSettings = {
    identity: {
        id: "restaurant-os-elite-main",
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
        country: "France",
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
    controlPoints: [],
    nonConformities: [],
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
        sessionTimeout: 60,
        twoFactorFrequency: "every_login",
        allowEmailRescue: true,
        allowMultiplePhones: false,
        logRetention: 90,
        allowSupportAccess: true
    },
    theme: {
        primaryColor: "#C5A059",
        secondaryColor: "#111111",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        fontPrimary: "Inter",
        fontHeadings: "Outfit",
        mode: "light",
        animationsEnabled: true
    },
    goals: {
        monthlyRevenue: 50000,
        avgTicket: 45
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
