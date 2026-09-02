export type MCCLocale = 'fr' | 'en';

export const mccTranslations = {
  fr: {
    header: {
      title: 'Console Réseau & Multi-Sites',
      subtitle: 'Administration Centrale des Établissements • v4.0.0',
      globalSync: 'Sync Globale',
      axiomBridge: 'Passerelle API',
    },
    tabs: {
      fleet: 'Établissements',
      compliance: 'Conformité',
      intelligence: 'Analyses & IA',
      treasury: 'Facturation',
      patchcenter: 'Mises à jour',
      plugins: 'Modules',
      eventbus: 'Flux Événements',
      lifecycle: 'Déploiement',
    },
    fleet: {
      totalInstances: 'Total Établissements',
      globalRevenue: 'CA Global Réseau',
      fleetHealth: 'Santé du Parc',
      globalCompliance: 'Conformité NF525',
      trendCapacity: 'Capacité réseau',
      trendRevenue: 'Calculé en temps réel',
      trendHealth: 'Moyenne pondérée',
      trendCompliance: 'Niveau intégrité légale',
      tacticalOverview: 'Vue d\'Ensemble du Parc',
      newClone: 'Nouvel Établissement',
    },
    sidebar: {
      coreStatus: 'Statut du Serveur',
      provisioningEngine: 'Moteur de Déploiement',
      axiomLogIngest: 'Ingestion des Logs',
      nf525SealEngine: 'Moteur Fiscal NF525',
      fleetIntelligence: 'Analyses Réseau',
      switchboard: 'Tableau de Bord Central',
      telemetrySentinel: 'Monitoring & Alertes',
      samAutomations: 'Automatisations Système',
      nexusSyncEngine: 'Moteur de Synchronisation',
      clientInterface: 'Accès Client',
    },
    status: {
      ready: 'Prêt',
      degraded: 'Dégradé',
      offline: 'Hors ligne',
      offlineWarning: 'Hors ligne ⚠',
      streaming: 'En diffusion',
      secured: 'Sécurisé',
      aggregating: 'Agrégation',
      online: 'En ligne',
      loading: '…',
    },
    clone: {
      title: 'Création d\'un Nouvel Établissement',
      subtitle: 'Configuration Initiale & Déploiement',
      instanceName: 'Nom de l\'Établissement',
      instanceNamePlaceholder: 'ex : Le Grand Paris',
      subdomainSlug: 'Identifiant / Sous-domaine',
      subdomainSlugPlaceholder: 'ex : le-grand-paris',
      ownerEmail: 'Email du Gérant',
      ownerEmailPlaceholder: 'gerant@restaurant.fr',
      tier: 'Formule d\'Abonnement',
      tiers: {
        STANDARD: { name: 'Standard', tagline: 'Indépendant', price: '0€', period: '/mois', features: ['Jusqu\'à 100 tickets/jour'] },
        PREMIUM: { name: 'Premium', tagline: 'Recommandé', price: '99€', period: '/mois', features: ['Tickets illimités', 'Support 24/7'] },
        ENTERPRISE: { name: 'Entreprise', tagline: 'Multi-Sites', price: 'Sur devis', period: '', features: ['Instances dédiées & SLA'] }
      },
      policy: 'Sécurité : Tous les établissements sont configurés avec la conformité NF525 et le 2FA activés.',
      cancel: 'Annuler',
      launch: 'Créer l\'Établissement',
    },
    audit: {
      title: 'Journal d\'Audit en Direct',
      noEvents: 'En attente d\'événements...',
      bufferStatus: 'Statut Mémoire Tampon',
    },
    performance: {
      title: 'Moniteur de Performance',
      cpu: 'CPU',
      memory: 'Mémoire',
      latency: 'Latence API',
      uptime: 'Disponibilité',
    },
    deployment: {
      title: 'Gestion des Versions',
      rollout: 'Déploiement',
      rollback: 'Retour arrière',
      patch: 'Correctif',
    },
    insights: {
      title: 'Analyses & Recommandations',
      generate: 'Générer une analyse',
    },
    fiscal: {
      title: 'Piste d\'Audit Fiscale',
    },
    treasury: {
      title: 'Facturation & Abonnements',
    },
    compliance: {
      title: 'Centre de Conformité & Certifications',
    },
    support: {
      title: 'Tickets de Support',
    },
    users: {
      title: 'Utilisateurs de l\'Établissement',
    },
    devices: {
      title: 'Inventaire des Terminaux & Caisses',
    },
    changelog: {
      title: 'Historique des Mises à Jour',
    },
    upgrades: {
      title: 'Mises à Niveau du Parc',
    },
    overrides: {
      title: 'Configurations Spécifiques',
    },
    oracle: {
      title: 'Assistant & Analyses Stratégiques',
    },
    reseller: {
      title: 'Portail Partenaires & Revendeurs',
    },
    taxAudit: {
      title: 'Audit Fiscal & FEC',
    },
    trustedDevices: {
      title: 'Appareils Autorisés',
    },
    certifications: {
      title: 'Certifications Légales',
    },
  },
  en: {
    header: {
      title: 'Network & Fleet Console',
      subtitle: 'Central Restaurant Management • v4.0.0',
      globalSync: 'Global Sync',
      axiomBridge: 'API Gateway',
    },
    tabs: {
      fleet: 'Locations',
      compliance: 'Compliance',
      intelligence: 'Analytics & AI',
      treasury: 'Billing',
      patchcenter: 'Updates',
      plugins: 'Modules',
      eventbus: 'Event Stream',
      lifecycle: 'Deployment',
    },
    fleet: {
      totalInstances: 'Total Locations',
      globalRevenue: 'Total Network Revenue',
      fleetHealth: 'Fleet Health',
      globalCompliance: 'NF525 Compliance',
      trendCapacity: 'Network capacity',
      trendRevenue: 'Real-time calculation',
      trendHealth: 'Weighted average',
      trendCompliance: 'Fiscal integrity level',
      tacticalOverview: 'Fleet Overview',
      newClone: 'New Location',
    },
    sidebar: {
      coreStatus: 'Core Status',
      provisioningEngine: 'Provisioning Engine',
      axiomLogIngest: 'Log Ingestion',
      nf525SealEngine: 'NF525 Fiscal Engine',
      fleetIntelligence: 'Fleet Analytics',
      switchboard: 'Central Dashboard',
      telemetrySentinel: 'Monitoring & Alerts',
      samAutomations: 'System Automations',
      nexusSyncEngine: 'Sync Engine',
      clientInterface: 'Client Access',
    },
    status: {
      ready: 'Ready',
      degraded: 'Degraded',
      offline: 'Offline',
      offlineWarning: 'Offline ⚠',
      streaming: 'Streaming',
      secured: 'Secured',
      aggregating: 'Aggregating',
      online: 'Online',
      loading: '…',
    },
    clone: {
      title: 'Create New Location',
      subtitle: 'Initial Configuration & Deployment',
      instanceName: 'Location Name',
      instanceNamePlaceholder: 'e.g., Downtown Bistro',
      subdomainSlug: 'Subdomain / Identifier',
      subdomainSlugPlaceholder: 'e.g., downtown-bistro',
      ownerEmail: 'Owner Email',
      ownerEmailPlaceholder: 'manager@restaurant.com',
      tier: 'Subscription Tier',
      tiers: {
        STANDARD: { name: 'Standard', tagline: 'Single Location', price: '$0', period: '/month', features: ['Up to 100 tickets/day'] },
        PREMIUM: { name: 'Premium', tagline: 'Recommended', price: '$99', period: '/month', features: ['Unlimited tickets', '24/7 Support'] },
        ENTERPRISE: { name: 'Enterprise', tagline: 'Multi-Unit', price: 'Custom', period: '', features: ['Dedicated instances & SLA'] }
      },
      policy: 'Security Policy: All locations are provisioned with NF525 fiscal sealing and 2FA enabled.',
      cancel: 'Cancel',
      launch: 'Deploy Location',
    },
    audit: {
      title: 'Live Audit Log',
      noEvents: 'Waiting for telemetry events...',
      bufferStatus: 'Buffer Status',
    },
    performance: {
      title: 'Performance Monitor',
      cpu: 'CPU',
      memory: 'Memory',
      latency: 'API Latency',
      uptime: 'Uptime',
    },
    deployment: {
      title: 'Release Management',
      rollout: 'Rollout',
      rollback: 'Rollback',
      patch: 'Patch',
    },
    insights: {
      title: 'Analytics & Insights',
      generate: 'Generate Analysis',
    },
    fiscal: {
      title: 'Fiscal Audit Trail',
    },
    treasury: {
      title: 'SaaS Billing & Subscriptions',
    },
    compliance: {
      title: 'Compliance & Certification Center',
    },
    support: {
      title: 'Support Tickets',
    },
    users: {
      title: 'Location Users',
    },
    devices: {
      title: 'Terminal & Device Inventory',
    },
    changelog: {
      title: 'Release Changelog',
    },
    upgrades: {
      title: 'Fleet Version Upgrades',
    },
    overrides: {
      title: 'Tenant Overrides',
    },
    oracle: {
      title: 'Strategic Management Assistant',
    },
    reseller: {
      title: 'Partner & Reseller Portal',
    },
    taxAudit: {
      title: 'Tax Audit & FEC Export',
    },
    trustedDevices: {
      title: 'Authorized Devices',
    },
    certifications: {
      title: 'Compliance Certifications',
    },
  },
} as const;

export type MCCTranslations = typeof mccTranslations.fr;
