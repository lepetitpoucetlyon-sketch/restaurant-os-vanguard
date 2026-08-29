/**
 * 📚 PageCatalogRegistry — Registre Exhaustif des 84 Pages de Restaurant OS Core
 * Indexe chaque écran avec son ID, route, catégorie, icône, description, et SceneGraph AST par défaut
 */

import { PageDocument, PenDocument } from '../schema/PenDocument';
import { ReactToPenTransformer, PageBlueprintSpec } from '../engine/ReactToPenTransformer';

export interface RegisteredPageMeta {
    id: string;
    route: string;
    name: string;
    category: 'operations' | 'commerce' | 'management' | 'admin' | 'marketing' | 'public';
    description: string;
    icon: string;
    devicePreset: 'desktop' | 'tablet' | 'mobile' | 'kds';
    widgets?: string[];
}

export const RESTAURANT_OS_PAGES_META: readonly RegisteredPageMeta[] = [
    // ── 1. OPÉRATIONS & EN-SALLE (14 pages) ──────────────────────────────────
    { id: 'page-pos', route: '/pos', name: 'Caisse Tactile POS', category: 'operations', description: 'Terminal de point de vente et encaissement tactile', icon: 'ShoppingCart', devicePreset: 'tablet', widgets: ['POS_CART', 'PRODUCT_GRID', 'FAST_PAY_PANEL'] },
    { id: 'page-pos-mobile', route: '/pos-mobile', name: 'POS Mobile / Pad Serveur', category: 'operations', description: 'Prise de commande mobile sur smartphone ou mini-pad', icon: 'Smartphone', devicePreset: 'mobile', widgets: ['MOBILE_CART', 'TABLE_SELECTOR'] },
    { id: 'page-kds', route: '/kds', name: 'KDS Cuisine & Production', category: 'operations', description: 'Système d affichage des commandes en cuisine avec cadençage', icon: 'ChefHat', devicePreset: 'kds', widgets: ['KDS_TICKETS_GRID', 'STATION_BAR'] },
    { id: 'page-kitchen', route: '/kitchen', name: 'Vue Cuisine & Fiches Recettes', category: 'operations', description: 'Fiches techniques et mercuriale des préparations', icon: 'Utensils', devicePreset: 'desktop', widgets: ['RECIPE_EXPLORER'] },
    { id: 'page-bar', route: '/bar', name: 'Poste Bar & Tireuses Connectées', category: 'operations', description: 'Monitoring des tirages boisson et gestion des commandes bar', icon: 'Wine', devicePreset: 'tablet', widgets: ['SPOUT_TELEMETRY', 'BAR_ORDERS'] },
    { id: 'page-kiosk', route: '/kiosk', name: 'Borne de Commande Kiosque', category: 'operations', description: 'Borne interactive en libre-service pour les clients', icon: 'MonitorSmartphone', devicePreset: 'tablet', widgets: ['KIOSK_FLOW'] },
    { id: 'page-floor-plan', route: '/floor-plan', name: 'Plan de Salle & Tables', category: 'operations', description: 'Éditeur et vue en direct 2D/3D de l occupation des tables', icon: 'Map', devicePreset: 'desktop', widgets: ['FLOOR_CANVAS', 'TABLE_DRAWER'] },
    { id: 'page-inventory', route: '/inventory', name: 'Gestion des Stocks & Inventaire', category: 'operations', description: 'Niveaux de stock, alertes de réapprovisionnement et fiches matières', icon: 'Package', devicePreset: 'desktop', widgets: ['STOCK_LEVELS_GRID', 'REORDER_ALERTS'] },
    { id: 'page-inventory-reception', route: '/admin/inventory/reception', name: 'Réception & Contrôle Fournisseurs', category: 'operations', description: 'Vérification OCR et validation des bons de livraison', icon: 'Receipt', devicePreset: 'desktop', widgets: ['OCR_SCANNER', 'DELIVERY_DIFF'] },
    { id: 'page-suppliers', route: '/suppliers', name: 'Hub Fournisseurs & Mercuriale', category: 'operations', description: 'Gestion des commandes, litiges et accords commerciaux', icon: 'Truck', devicePreset: 'desktop', widgets: ['SUPPLIERS_TABLE', 'PURCHASE_ORDERS'] },
    { id: 'page-timeclock', route: '/timeclock', name: 'Pointeuse & Pointage Staff', category: 'operations', description: 'Pointage tactile par PIN ou badge NFC avec isolation UTC', icon: 'Clock', devicePreset: 'tablet', widgets: ['PIN_PAD', 'SHIFT_STATUS'] },
    { id: 'page-facility', route: '/facility', name: 'Hub Équipements & Maintenance', category: 'operations', description: 'Parc machines, sondes IoT, contrats et interventions', icon: 'Wrench', devicePreset: 'desktop', widgets: ['EQUIPMENT_GRID', 'MAINTENANCE_LOG'] },
    { id: 'page-haccp', route: '/haccp', name: 'Conformité Sanitaire HACCP', category: 'operations', description: 'Relevés de températures, traçabilité des lots et huiles', icon: 'Microscope', devicePreset: 'desktop', widgets: ['TEMP_LOGS', 'CCP_ALERTS'] },
    { id: 'page-hygiene', route: '/hygiene', name: 'Plans de Nettoyage & Hygiène', category: 'operations', description: 'Checklists de nettoyage journalières et audits sanitaires', icon: 'ShieldCheck', devicePreset: 'desktop', widgets: ['CLEANING_CHECKLIST'] },

    // ── 2. COMMERCE, CLIENTS & RÉSERVATIONS (14 pages) ──────────────────────
    { id: 'page-reservations', route: '/reservations', name: 'Cahier de Réservations', category: 'commerce', description: 'Gestion des services, réservations en ligne et no-shows', icon: 'CalendarDays', devicePreset: 'desktop', widgets: ['RESA_TIMELINE', 'RESA_SHEET'] },
    { id: 'page-crm', route: '/crm', name: 'Fichier Clients & CRM Fidélité', category: 'commerce', description: 'Habitudes des clients, segmentation VIP et cagnottes', icon: 'Users', devicePreset: 'desktop', widgets: ['CUSTOMER_DIRECTORY', 'LOYALTY_TIERS'] },
    { id: 'page-marketing', route: '/marketing', name: 'Campagnes & Marketing', category: 'commerce', description: 'Campagnes SMS, emailings, avis clients et promotions', icon: 'Sparkles', devicePreset: 'desktop', widgets: ['CAMPAIGN_BUILDER', 'REVIEWS_RADAR'] },
    { id: 'page-marketing-seo', route: '/marketing/seo', name: 'Référencement Local & Google Maps', category: 'commerce', description: 'Visibilité locale, horaires et synchronisation Google Business', icon: 'Globe', devicePreset: 'desktop', widgets: ['LOCAL_SEO_SCORE'] },
    { id: 'page-menu-builder', route: '/menu-builder', name: 'Éditeur de Menus & Carte', category: 'commerce', description: 'Création des formules, plats, modificateurs et allergènes', icon: 'BookOpen', devicePreset: 'desktop', widgets: ['MENU_TREE_EDITOR', 'DISH_CARD'] },
    { id: 'page-menu-engineering', route: '/menu-engineering', name: 'Menu Engineering & Marges', category: 'commerce', description: 'Matrice BCG des plats (Stars, Plowhorses, Dogs, Puzzles)', icon: 'TrendingUp', devicePreset: 'desktop', widgets: ['MARGIN_MATRIX', 'FOOD_COST_CHART'] },
    { id: 'page-public-menu', route: '/menu/[tenantId]/[tableId]', name: 'Menu Digital sur Table', category: 'commerce', description: 'Consultation du menu et commande via QR code table', icon: 'Utensils', devicePreset: 'mobile', widgets: ['DIGITAL_MENU_VIEW', 'CALL_WAITER'] },
    { id: 'page-public-order', route: '/order/[tenantId]', name: 'Click & Collect / Livraison', category: 'commerce', description: 'Portail de commande à emporter et livraison directe', icon: 'ShoppingBag', devicePreset: 'mobile', widgets: ['ONLINE_STOREFRONT', 'CHECKOUT_STRIPE'] },
    { id: 'page-showcase', route: '/showcase', name: 'Vitrine Restaurant', category: 'commerce', description: 'Page publique avec photos, carte, ambiance et réservation', icon: 'Star', devicePreset: 'desktop', widgets: ['HERO_CAROUSEL', 'MENU_PREVIEW'] },
    { id: 'page-groups', route: '/groups', name: 'Privatisations & Groupes', category: 'commerce', description: 'Devis pour événements, mariages et banquets', icon: 'PartyPopper', devicePreset: 'desktop', widgets: ['EVENT_ESTIMATOR'] },
    { id: 'page-landing-public', route: '/landing', name: 'Portail Bienvenue Public', category: 'commerce', description: 'Hub de redirection client et choix de l expérience', icon: 'Store', devicePreset: 'desktop', widgets: ['DISCOVERY_TILES'] },
    { id: 'page-welcome', route: '/welcome', name: 'Accueil Expérience Client', category: 'commerce', description: 'Écran de bienvenue personnalisé pour les clients sur place', icon: 'Heart', devicePreset: 'mobile', widgets: ['GUEST_HERO'] },
    { id: 'page-dynamic-slug', route: '/[slug]', name: 'Page Restaurant Sur-Mesure', category: 'commerce', description: 'Page hébergée personnalisée par établissement', icon: 'Globe', devicePreset: 'desktop', widgets: ['BRANDED_LANDING'] },
    { id: 'page-dynamic-slug-resa', route: '/[slug]/reservations', name: 'Module Réservation Dédié', category: 'commerce', description: 'Widget autonome de réservation par restaurant', icon: 'CalendarRange', devicePreset: 'desktop', widgets: ['EMBED_BOOKING_WIDGET'] },

    // ── 3. MANAGEMENT, RH & FINANCE (16 pages) ──────────────────────────────
    { id: 'page-operations', route: '/operations', name: 'Cockpit & Tableau de Bord', category: 'management', description: 'Vue consolidée du service en cours, CA, couverts et alertes', icon: 'LayoutDashboard', devicePreset: 'desktop', widgets: ['SERVICE_COCKPIT', 'REVENUE_GAUGE'] },
    { id: 'page-analytics', route: '/analytics', name: 'Analytique & Rapports Financiers', category: 'management', description: 'Statistiques de vente, panier moyen, productivité horaire', icon: 'BarChart3', devicePreset: 'desktop', widgets: ['SALES_CHARTS', 'KPI_RADIAL'] },
    { id: 'page-intelligence', route: '/intelligence', name: 'Oracle IA & Prédictions', category: 'management', description: 'Prévisions d affluence, météo et recommandations de mise en place', icon: 'Bot', devicePreset: 'desktop', widgets: ['ORACLE_FORECAST', 'AI_PROMPTER'] },
    { id: 'page-finance', route: '/finance', name: 'Finance & Trésorerie', category: 'management', description: 'Rapprochement bancaire, flux de trésorerie et clôtures Z', icon: 'Wallet', devicePreset: 'desktop', widgets: ['CASH_FLOW_CHART', 'Z_CLOSINGS'] },
    { id: 'page-accounting-portal', route: '/accounting-portal', name: 'Portail Comptable & FEC', category: 'management', description: 'Export FEC, journaux de vente et déclarations de TVA', icon: 'FileSpreadsheet', devicePreset: 'desktop', widgets: ['FEC_EXPORTER', 'VAT_SUMMARY'] },
    { id: 'page-pms', route: '/pms', name: 'Intégration Hôtelière PMS', category: 'management', description: 'Facturation sur chambre et liaisons Opera/Mews', icon: 'Building2', devicePreset: 'desktop', widgets: ['ROOM_CHARGE_PANEL'] },
    { id: 'page-nf525', route: '/nf525', name: 'Conformité Fiscale NF525', category: 'management', description: 'Grand Total inaltérable, scellement SHA-256 et piste d audit', icon: 'Shield', devicePreset: 'desktop', widgets: ['NF525_SEAL_VERIFIER', 'GRAND_TOTAL_DISPLAY'] },
    { id: 'page-registre', route: '/registre', name: 'Registre Légal & Sanitaire', category: 'management', description: 'Registre unique du personnel, hygiène et sécurité', icon: 'ScrollText', devicePreset: 'desktop', widgets: ['LEGAL_REGISTRY_BOOK'] },
    { id: 'page-staff', route: '/staff', name: 'Équipe & Gestion du Personnel', category: 'management', description: 'Fiches salariés, contrats, rôles RBAC et compétences', icon: 'Users', devicePreset: 'desktop', widgets: ['STAFF_GRID', 'ROLE_ASSIGNER'] },
    { id: 'page-planning', route: '/planning', name: 'Planning & Grilles Horaires', category: 'management', description: 'Planning des shifts avec conformité droit du travail (HCR)', icon: 'CalendarRange', devicePreset: 'desktop', widgets: ['WEEKLY_SCHEDULE_GRID', 'LABOR_COST_TRACKER'] },
    { id: 'page-leaves', route: '/leaves', name: 'Congés & Absences', category: 'management', description: 'Demandes de congés, soldes et justificatifs médicaux', icon: 'Palmtree', devicePreset: 'desktop', widgets: ['LEAVES_CALENDAR', 'APPROVAL_QUEUE'] },
    { id: 'page-recruitment', route: '/recruitment', name: 'Recrutement & Candidatures', category: 'management', description: 'Suivi des offres, entretiens et onboarding des extras', icon: 'UserPlus', devicePreset: 'desktop', widgets: ['KANBAN_CANDIDATES'] },
    { id: 'page-mon-espace', route: '/mon-espace', name: 'Portail Salarié Mon Espace', category: 'management', description: 'Espace personnel employé : planning, pourboires et bulletins', icon: 'UserCog', devicePreset: 'mobile', widgets: ['MY_SHIFTS', 'MY_TIPS'] },
    { id: 'page-welcome-staff', route: '/welcome-staff', name: 'Parcours Onboarding Équipe', category: 'management', description: 'Guide d intégration des nouveaux collaborateurs', icon: 'Sparkles', devicePreset: 'desktop', widgets: ['TRAINING_CHECKLIST'] },
    { id: 'page-franchise', route: '/franchise', name: 'Console Réseau & Franchise', category: 'management', description: 'Comparatifs inter-établissements et indicateurs de réseau', icon: 'Building2', devicePreset: 'desktop', widgets: ['MULTI_UNIT_BENCHMARK'] },
    { id: 'page-vanguard-simulator', route: '/vanguard-simulator', name: 'Simulateur Vanguard & Stress Test', category: 'management', description: 'Simulation de rush, pannes réseau et tests de charge', icon: 'Gauge', devicePreset: 'desktop', widgets: ['LOAD_TEST_PANEL'] },

    // ── 4. CONFIGURATION, MARQUE & INTÉGRATIONS (6 pages) ────────────────────
    { id: 'page-settings-branding', route: '/settings/branding', name: 'Identité Visuelle & Thème', category: 'management', description: 'Personnalisation des couleurs, polices, logos et tickets', icon: 'Sparkles', devicePreset: 'desktop', widgets: ['BRAND_TOKEN_PICKER', 'PREVIEW_RECEIPT'] },
    { id: 'page-settings-security', route: '/settings/security', name: 'Sécurité & Accès', category: 'management', description: 'Mots de passe, biométrie WebAuthn, 2FA et sessions actives', icon: 'Lock', devicePreset: 'desktop', widgets: ['SECURITY_AUDIT', 'SESSION_LIST'] },
    { id: 'page-integrations', route: '/integrations', name: 'Connecteurs & Intégrations', category: 'management', description: 'UberEats, Deliveroo, Stripe, TPE Ingenico, QuickBooks', icon: 'Plug', devicePreset: 'desktop', widgets: ['CONNECTORS_HUB'] },
    { id: 'page-migration', route: '/migration', name: 'Assistant d Import & Migration', category: 'management', description: 'Importation depuis Lightspeed, Zelty, CSV ou carte papier', icon: 'Truck', devicePreset: 'desktop', widgets: ['DATA_IMPORT_WIZARD'] },
    { id: 'page-onboarding', route: '/onboarding', name: 'Guide de Mise en Route', category: 'management', description: 'Checklist pas-à-pas pour ouvrir le restaurant', icon: 'ClipboardCheck', devicePreset: 'desktop', widgets: ['ONBOARDING_STEPS'] },
    { id: 'page-aide', route: '/aide', name: 'Centre d Aide & Documentation', category: 'management', description: 'Tutoriels interactifs et base de connaissances', icon: 'HelpCircle', devicePreset: 'desktop', widgets: ['KB_SEARCH', 'SUPPORT_TICKETS'] },

    // ── 5. ADMINISTRATION PLATFORME & MCC FLEET (14 pages) ──────────────────
    { id: 'page-admin-dashboard', route: '/admin/dashboard', name: 'Admin Cockpit Général', category: 'admin', description: 'Statut de la flotte de restaurants et métriques globales', icon: 'LayoutDashboard', devicePreset: 'desktop', widgets: ['GLOBAL_FLEET_STATS'] },
    { id: 'page-admin-mcc', route: '/admin/mcc', name: 'MCC — Master Control Console', category: 'admin', description: 'Console d administration de 10 000+ instances Restaurant OS', icon: 'Gauge', devicePreset: 'desktop', widgets: ['TENANTS_TABLE', 'HEALTH_HEATMAP'] },
    { id: 'page-admin-mcc-dlq', route: '/admin/mcc/dlq', name: 'MCC Dead Letter Queue', category: 'admin', description: 'Gestion des événements en échec et outbox résiliente', icon: 'Activity', devicePreset: 'desktop', widgets: ['DLQ_MONITOR'] },
    { id: 'page-admin-agent', route: '/admin/agent', name: 'Superviseur Multi-Agents', category: 'admin', description: 'Surveillance des agents autonomes Atlas, Themis, Cronos', icon: 'Bot', devicePreset: 'desktop', widgets: ['AGENTS_LIVENESS'] },
    { id: 'page-admin-prospecting', route: '/admin/prospecting', name: 'Radar de Prospection & DNA Crawler', category: 'admin', description: 'Morphogenèse instantanée et scraping de cartes', icon: 'Sparkles', devicePreset: 'desktop', widgets: ['DNA_CRAWLER_UI'] },
    { id: 'page-admin-simulation', route: '/admin/simulation', name: 'Simulateur Écosystème Global', category: 'admin', description: 'Génération de flux de commandes de test pour démos', icon: 'Activity', devicePreset: 'desktop', widgets: ['SIMULATION_CONTROLS'] },
    { id: 'page-admin-blueprint', route: '/blueprint', name: 'Architecture & Blueprints', category: 'admin', description: 'Cartographie des dépendances et ADN de la plateforme', icon: 'Network', devicePreset: 'desktop', widgets: ['MIND_MAP_CANVAS'] },
    { id: 'page-admin-design-system', route: '/design-system', name: 'Design System Empire', category: 'admin', description: 'Vitrine des 22 primitives et tokens de l interface', icon: 'Sparkles', devicePreset: 'desktop', widgets: ['DS_GALLERY'] },
    { id: 'page-admin-system-map', route: '/system-map', name: 'Cartographie des Modules', category: 'admin', description: 'Topologie des 8 piliers et matrices de communication', icon: 'Map', devicePreset: 'desktop', widgets: ['MODULE_GRAPH'] },
    { id: 'page-admin-simulator', route: '/simulator', name: 'Simulateur d Événements', category: 'admin', description: 'Injection d événements Bus et vérification de propagation', icon: 'Activity', devicePreset: 'desktop', widgets: ['EVENT_BUS_INJECTOR'] },
    { id: 'page-admin-settings', route: '/settings', name: 'Paramètres Globaux Admin', category: 'admin', description: 'Configuration du compte et variables d environnement', icon: 'Settings', devicePreset: 'desktop', widgets: ['GLOBAL_SETTINGS_FORM'] },
    { id: 'page-account-settings', route: '/account-settings', name: 'Gestion du Compte & Facturation', category: 'admin', description: 'Abonnement Restaurant OS, cartes bancaires et factures', icon: 'CreditCard', devicePreset: 'desktop', widgets: ['SUBSCRIPTION_TIER_PANEL'] },
    { id: 'page-audit-portal', route: '/audit-portal', name: 'Portail d Audit Légal', category: 'admin', description: 'Rapports d intégrité, conformité DGFiP et vérifications WORM', icon: 'ShieldCheck', devicePreset: 'desktop', widgets: ['AUDIT_SUMMARY'] },
    { id: 'page-admin-docs-category', route: '/docs/[category]', name: 'Documentation Interactive', category: 'admin', description: 'Guides techniques et spécifications par pilier', icon: 'BookOpen', devicePreset: 'desktop', widgets: ['DOC_READER'] },

    // ── 6. MARKETING, TARIFS & LÉGAL (15 pages) ─────────────────────────────
    { id: 'page-marketing-home', route: '/', name: 'Page d Accueil Marketing', category: 'marketing', description: 'Landing page principale pour la commercialisation de la plateforme', icon: 'Store', devicePreset: 'desktop', widgets: ['MARKETING_HERO', 'FEATURE_GRID'] },
    { id: 'page-pricing', route: '/pricing', name: 'Grille Tarifaire & Abonnements', category: 'marketing', description: 'Tarifs transparents : Starter, Pro, Empire et options', icon: 'Banknote', devicePreset: 'desktop', widgets: ['PRICING_CARDS', 'FAQ_ACCORDION'] },
    { id: 'page-pricing-roi', route: '/pricing/roi-calculator', name: 'Calculateur de Rentabilité ROI', category: 'marketing', description: 'Simulation des économies de commission et gain de temps', icon: 'TrendingUp', devicePreset: 'desktop', widgets: ['ROI_SIMULATOR_SLIDER'] },
    { id: 'page-vs-lightspeed', route: '/pricing/vs-lightspeed', name: 'Comparatif vs Lightspeed', category: 'marketing', description: 'Tableau comparatif détaillé des fonctionnalités et coûts', icon: 'ShieldCheck', devicePreset: 'desktop', widgets: ['VS_COMPARISON_TABLE'] },
    { id: 'page-vs-zelty', route: '/pricing/vs-zelty', name: 'Comparatif vs Zelty', category: 'marketing', description: 'Tableau comparatif détaillé sur les fonctionnalités de franchise', icon: 'ShieldCheck', devicePreset: 'desktop', widgets: ['VS_COMPARISON_TABLE'] },
    { id: 'page-signup', route: '/signup', name: 'Création de Compte Restaurant', category: 'marketing', description: 'Formulaire d inscription et sélection de l offre', icon: 'UserPlus', devicePreset: 'desktop', widgets: ['SIGNUP_STEPPER'] },
    { id: 'page-signup-success', route: '/signup/success', name: 'Confirmation d Inscription', category: 'marketing', description: 'Remerciements et accès instantané à l instance', icon: 'Sparkles', devicePreset: 'desktop', widgets: ['SUCCESS_CELEBRATION'] },
    { id: 'page-verticales-slug', route: '/verticales/[slug]', name: 'Pages Métiers Dédiées', category: 'marketing', description: 'Landing pages pour Brasserie, Pizzeria, Bar, Gastronomique', icon: 'Utensils', devicePreset: 'desktop', widgets: ['VERTICAL_SHOWCASE'] },
    { id: 'page-legal-dpa', route: '/legal/dpa', name: 'Accord Traitement Données (DPA)', category: 'marketing', description: 'Contrat de sous-traitance des données personnelles RGPD', icon: 'Shield', devicePreset: 'desktop', widgets: ['LEGAL_TEXT_VIEW'] },
    { id: 'page-legal-nf525-mkt', route: '/legal/nf525', name: 'Certificat de Conformité Fiscale', category: 'marketing', description: 'Engagement légal et attestation NF525 éditeur', icon: 'ShieldCheck', devicePreset: 'desktop', widgets: ['CERTIFICATE_SEAL'] },
    { id: 'page-legal-security-mkt', route: '/legal/security', name: 'Engagements de Sécurité & Cloud', category: 'marketing', description: 'Chiffrement, sauvegardes et souveraineté des données', icon: 'Lock', devicePreset: 'desktop', widgets: ['SECURITY_BADGES'] },
    { id: 'page-public-demo', route: '/demo', name: 'Démonstration Interactive Gratuite', category: 'public', description: 'Visite guidée sans compte avec données d exemple', icon: 'Sparkles', devicePreset: 'desktop', widgets: ['INTERACTIVE_WALKTHROUGH'] },
    { id: 'page-public-status', route: '/status', name: 'Statut du Réseau & Disponibilité', category: 'public', description: 'Disponibilité des serveurs et temps de réponse en direct', icon: 'Activity', devicePreset: 'desktop', widgets: ['STATUS_UPTIME_GRAPH'] },
    { id: 'page-login', route: '/login', name: 'Connexion Espace Restaurant', category: 'public', description: 'Écran d authentification gérant et personnel', icon: 'Lock', devicePreset: 'desktop', widgets: ['LOGIN_FORM'] },
    { id: 'page-logout', route: '/auth/logout', name: 'Déconnexion Sécurisée', category: 'public', description: 'Clôture de session et nettoyage du cache local', icon: 'Lock', devicePreset: 'desktop', widgets: ['LOGOUT_CONFIRM'] },

    // ── 7. PAGES LÉGALES PUBLIQUES & SYSTÈME (5 pages) ───────────────────────
    { id: 'page-legal-cgu', route: '/legal/cgu', name: 'Conditions Générales d Utilisation', category: 'public', description: 'CGU applicables aux utilisateurs de la plateforme', icon: 'ScrollText', devicePreset: 'desktop', widgets: ['LEGAL_TEXT_VIEW'] },
    { id: 'page-legal-cgv', route: '/legal/cgv', name: 'Conditions Générales de Vente', category: 'public', description: 'CGV pour les abonnements et services Restaurant OS', icon: 'ScrollText', devicePreset: 'desktop', widgets: ['LEGAL_TEXT_VIEW'] },
    { id: 'page-legal-mentions', route: '/legal/mentions', name: 'Mentions Légales', category: 'public', description: 'Informations juridiques de l éditeur et hébergeur', icon: 'ScrollText', devicePreset: 'desktop', widgets: ['LEGAL_TEXT_VIEW'] },
    { id: 'page-legal-rgpd', route: '/legal/rgpd', name: 'Politique de Confidentialité RGPD', category: 'public', description: 'Droits des utilisateurs et cookies', icon: 'Shield', devicePreset: 'desktop', widgets: ['LEGAL_TEXT_VIEW'] },
    { id: 'page-offline', route: '/offline', name: 'Mode Hors-Ligne & Secours', category: 'public', description: 'Page de secours lors des coupures internet', icon: 'Activity', devicePreset: 'tablet', widgets: ['OFFLINE_INDICATOR'] },
];

export class PageCatalogRegistry {
    private static pagesMap: Map<string, RegisteredPageMeta> = new Map(
        RESTAURANT_OS_PAGES_META.map(p => [p.id, p])
    );

    public static getAllPages(): readonly RegisteredPageMeta[] {
        return RESTAURANT_OS_PAGES_META;
    }

    public static getPageById(id: string): RegisteredPageMeta | undefined {
        return this.pagesMap.get(id);
    }

    public static getPageByRoute(route: string): RegisteredPageMeta | undefined {
        return RESTAURANT_OS_PAGES_META.find(p => p.route === route);
    }

    public static getPagesByCategory(category: RegisteredPageMeta['category']): RegisteredPageMeta[] {
        return RESTAURANT_OS_PAGES_META.filter(p => p.category === category);
    }

    /**
     * Génère un document .pen complet contenant les 84 pages modélisées
     */
    public static createFullPenDocument(targetTenantId?: string): PenDocument {
        const pages: PageDocument[] = RESTAURANT_OS_PAGES_META.map(spec =>
            ReactToPenTransformer.createPageSceneGraph({
                id: spec.id,
                name: spec.name,
                route: spec.route,
                category: spec.category,
                description: spec.description,
                icon: spec.icon,
                device: spec.devicePreset,
                widgets: spec.widgets,
            })
        );

        return {
            version: '1.0.0',
            name: `Restaurant OS Complete UI Library (${pages.length} Pages)`,
            targetTenantId,
            author: 'Antigravity & OpenPencil Engine',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pages,
            metadata: {
                customNotes: 'Catalogue complet des 84 pages pour personnalisation et édition multi-tenant',
            },
        };
    }
}
