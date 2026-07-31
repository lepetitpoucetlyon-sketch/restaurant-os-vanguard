export type MCCLocale = 'fr' | 'en';

export const mccTranslations = {
  fr: {
    header: {
      title: 'Console Maîtresse',
      subtitle: 'Orchestrateur Impérial • v4.0.0-NEXUS',
      globalSync: 'Sync Globale',
      axiomBridge: 'Pont Axiom',
    },
    tabs: {
      fleet: 'Flotte',
      compliance: 'Conformité',
      intelligence: 'Oracle',
      treasury: 'Trésorerie',
      patchcenter: 'Correctifs',
      plugins: 'Plugins',
      eventbus: 'Event Bus',
    },
    fleet: {
      totalInstances: 'Total Instances',
      globalRevenue: 'CA Global',
      fleetHealth: 'Santé Flotte',
      globalCompliance: 'Conformité Globale',
      trendCapacity: 'Capacité flotte maximale',
      trendRevenue: 'Calculé en temps réel',
      trendHealth: 'Moyenne pondérée',
      trendCompliance: 'Niveau intégrité NF525',
      tacticalOverview: 'Vue Tactique de la Flotte',
      newClone: 'Nouveau Clone',
    },
    sidebar: {
      coreStatus: 'Statut Cœur MCC',
      provisioningEngine: 'Moteur de Provisionnement',
      axiomLogIngest: 'Ingestion Log Axiom',
      nf525SealEngine: 'Moteur Scellement NF525',
      fleetIntelligence: 'Intelligence Flotte',
      switchboard: 'Tableau de Commande Souverain',
      telemetrySentinel: 'Télémétrie & Sentinelle',
      samAutomations: 'Automatisations SAM',
      nexusSyncEngine: 'Moteur Sync Nexus',
      clientInterface: 'Interface Client',
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
      title: 'Naissance d\'un Nouveau Clone',
      subtitle: 'Injection ADN & Infrastructure',
      instanceName: 'Nom de l\'Instance',
      instanceNamePlaceholder: 'ex : Le Grand Paris',
      subdomainSlug: 'Slug Sous-domaine',
      subdomainSlugPlaceholder: 'ex : le-grand-paris',
      ownerEmail: 'Email Propriétaire',
      ownerEmailPlaceholder: 'proprietaire@restaurant.fr',
      tier: 'Niveau',
      policy: 'Politique : Toutes les instances sont provisionnées avec NF525 et 2FA activés par défaut (STANDARD_DNA_V3).',
      cancel: 'Annuler',
      launch: 'Lancer la Naissance',
    },
    audit: {
      title: 'Journal d\'Audit en Direct',
      noEvents: 'En attente de données de télémétrie...',
      bufferStatus: 'Statut Buffer',
    },
    performance: {
      title: 'Moniteur de Performance',
      cpu: 'CPU',
      memory: 'Mémoire',
      latency: 'Latence API',
      uptime: 'Disponibilité',
    },
    deployment: {
      title: 'Moteur de Déploiement',
      rollout: 'Déploiement',
      rollback: 'Retour arrière',
      patch: 'Correctif',
    },
    insights: {
      title: 'Perspectives IA',
      generate: 'Générer une analyse',
    },
    fiscal: {
      title: 'Explorateur de Chaîne Fiscale',
    },
    treasury: {
      title: 'Trésorerie MCC',
    },
    compliance: {
      title: 'Centre de Certification',
    },
    support: {
      title: 'Brouillons Support',
    },
    users: {
      title: 'Utilisateurs du Tenant',
    },
    devices: {
      title: 'Inventaire Appareils',
    },
    changelog: {
      title: 'Journal des Modifications',
    },
    upgrades: {
      title: 'Mises à Niveau Flotte',
    },
    overrides: {
      title: 'Surcharges Tenant',
    },
    oracle: {
      title: 'Oracle Stratégique',
    },
    reseller: {
      title: 'Portail Revendeur',
    },
    taxAudit: {
      title: 'Audit Fiscal',
    },
    trustedDevices: {
      title: 'Appareils de Confiance',
    },
    certifications: {
      title: 'Certifications',
    },
  },
  en: {
    header: {
      title: 'Master Console',
      subtitle: 'Empire Orchestrator • v4.0.0-NEXUS',
      globalSync: 'Global Sync',
      axiomBridge: 'Axiom Bridge',
    },
    tabs: {
      fleet: 'Fleet',
      compliance: 'Compliance',
      intelligence: 'Oracle',
      treasury: 'Treasury',
      patchcenter: 'Patches',
      plugins: 'Plugins',
      eventbus: 'Event Bus',
    },
    fleet: {
      totalInstances: 'Total Instances',
      globalRevenue: 'Global Revenue',
      fleetHealth: 'Fleet Health',
      globalCompliance: 'Global Compliance',
      trendCapacity: 'Fleet capacity at 100%',
      trendRevenue: 'Calculated in real-time',
      trendHealth: 'Weighted average',
      trendCompliance: 'NF525 Integrity Level',
      tacticalOverview: 'Fleet Tactical Overview',
      newClone: 'New Clone',
    },
    sidebar: {
      coreStatus: 'MCC Core Status',
      provisioningEngine: 'Provisioning Engine',
      axiomLogIngest: 'Axiom Log Ingest',
      nf525SealEngine: 'NF525 Seal Engine',
      fleetIntelligence: 'Fleet Intelligence',
      switchboard: 'Sovereign Switchboard',
      telemetrySentinel: 'Telemetry & Sentinel',
      samAutomations: 'SAM Automations',
      nexusSyncEngine: 'Nexus Sync Engine',
      clientInterface: 'Client Interface',
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
      title: 'Birth of a New Clone',
      subtitle: 'DNA Injection & Infrastructure',
      instanceName: 'Instance Name',
      instanceNamePlaceholder: 'ex: Le Grand Paris',
      subdomainSlug: 'Subdomain Slug',
      subdomainSlugPlaceholder: 'ex: le-grand-paris',
      ownerEmail: 'Owner Email',
      ownerEmailPlaceholder: 'owner@restaurant.fr',
      tier: 'Tier',
      policy: 'Policy: All instances are provisioned with NF525 and 2FA enabled by default (STANDARD_DNA_V3).',
      cancel: 'Cancel',
      launch: 'Launch Birth',
    },
    audit: {
      title: 'Live Audit Stream',
      noEvents: 'Waiting for telemetry data...',
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
      title: 'Deployment Engine',
      rollout: 'Rollout',
      rollback: 'Rollback',
      patch: 'Patch',
    },
    insights: {
      title: 'AI Insights',
      generate: 'Generate analysis',
    },
    fiscal: {
      title: 'Fiscal Chain Explorer',
    },
    treasury: {
      title: 'MCC Treasury',
    },
    compliance: {
      title: 'Certification Center',
    },
    support: {
      title: 'Support Drafts',
    },
    users: {
      title: 'Tenant Users',
    },
    devices: {
      title: 'Device Inventory',
    },
    changelog: {
      title: 'Changelog',
    },
    upgrades: {
      title: 'Fleet Upgrades',
    },
    overrides: {
      title: 'Tenant Overrides',
    },
    oracle: {
      title: 'Strategy Oracle',
    },
    reseller: {
      title: 'Reseller Portal',
    },
    taxAudit: {
      title: 'Tax Audit',
    },
    trustedDevices: {
      title: 'Trusted Devices',
    },
    certifications: {
      title: 'Certifications',
    },
  },
} as const;

export type MCCTranslations = typeof mccTranslations.fr;
