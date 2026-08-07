import type { IConnectorManifest } from './types';

export const CONNECTOR_CATALOG: Record<string, IConnectorManifest> = {

  // ─── OPS / RÉSERVATIONS ───────────────────────────────────────────────────
  'zenchef': {
    id: 'zenchef', displayName: 'Zenchef', logo: '🗓️',
    category: 'reservations', pillar: 'ops',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API', type: 'password', placeholder: 'zc_live_...' }],
    verticals: ['restaurant', 'hotel', 'bakery'],
    autoActivateFor: ['restaurant'],
    requiredCapability: 'mod_reservations',
    isPremium: false,
  },
  'thefork': {
    id: 'thefork', displayName: 'TheFork', logo: '🍴',
    category: 'reservations', pillar: 'ops',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://manager.thefork.com/oauth/authorize',
      tokenUrl: 'https://manager.thefork.com/oauth/token',
      scopes: ['reservations:read', 'reservations:write'],
      callbackRoute: '/api/connectors/reservations/thefork/callback',
    },
    verticals: ['restaurant', 'hotel'],
    autoActivateFor: [],
    requiredCapability: 'mod_reservations',
    isPremium: false,
  },
  'widget-reservations': {
    id: 'widget-reservations', displayName: 'Widget natif', logo: '📋',
    category: 'reservations', pillar: 'ops',
    authType: 'none',
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'clinic', 'salon', 'garage', 'retail', 'custom'],
    requiredCapability: 'mod_reservations',
    isPremium: false,
  },

  // ─── OPS / LIVRAISON ──────────────────────────────────────────────────────
  'uber-eats': {
    id: 'uber-eats', displayName: 'Uber Eats', logo: '🛵',
    category: 'delivery', pillar: 'ops',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://login.uber.com/oauth/v2/authorize',
      tokenUrl: 'https://login.uber.com/oauth/v2/token',
      scopes: ['eats.store', 'eats.order'],
      callbackRoute: '/api/connectors/delivery/webhook/ubereats',
    },
    verticals: ['restaurant', 'bakery'],
    autoActivateFor: ['restaurant'],
    requiredCapability: 'mod_pos',
    isPremium: false,
  },
  'deliveroo': {
    id: 'deliveroo', displayName: 'Deliveroo', logo: '🦘',
    category: 'delivery', pillar: 'ops',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Deliveroo', type: 'password' }],
    verticals: ['restaurant', 'bakery'],
    autoActivateFor: [],
    requiredCapability: 'mod_pos',
    isPremium: false,
  },
  'just-eat': {
    id: 'just-eat', displayName: 'Just Eat', logo: '🍕',
    category: 'delivery', pillar: 'ops',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Just Eat', type: 'password' }],
    verticals: ['restaurant', 'bakery'],
    autoActivateFor: [],
    requiredCapability: 'mod_pos',
    isPremium: false,
  },
  'click-collect': {
    id: 'click-collect', displayName: 'Click & Collect natif', logo: '🏪',
    category: 'delivery', pillar: 'ops',
    authType: 'none',
    verticals: 'all',
    autoActivateFor: ['restaurant', 'bakery', 'retail'],
    requiredCapability: 'mod_pos',
    isPremium: false,
  },

  // ─── COMMERCE / AVIS ──────────────────────────────────────────────────────
  'google-business': {
    id: 'google-business', displayName: 'Google My Business', logo: '⭐',
    category: 'reviews', pillar: 'commerce',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/business.manage'],
      callbackRoute: '/api/auth/google/callback',
    },
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'salon', 'clinic', 'garage', 'retail'],
    requiredCapability: 'mod_analytics',
    isPremium: false,
  },
  'tripadvisor': {
    id: 'tripadvisor', displayName: 'TripAdvisor', logo: '🦉',
    category: 'reviews', pillar: 'commerce',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API TripAdvisor', type: 'password' }],
    verticals: ['restaurant', 'hotel'],
    autoActivateFor: [],
    requiredCapability: 'mod_analytics',
    isPremium: false,
  },

  // ─── COMMERCE / EMAILING ──────────────────────────────────────────────────
  'brevo': {
    id: 'brevo', displayName: 'Brevo (Sendinblue)', logo: '📧',
    category: 'emailing', pillar: 'commerce',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Brevo', type: 'password', placeholder: 'xkeysib-...' }],
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'salon', 'retail'],
    requiredCapability: 'mod_omnichannel',
    isPremium: false,
  },

  // ─── COMMUNICATION ────────────────────────────────────────────────────────
  'gmail': {
    id: 'gmail', displayName: 'Gmail / Google Workspace', logo: '📬',
    category: 'communication', pillar: 'finance',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      callbackRoute: '/api/auth/google/callback',
    },
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_accounting_management',
    isPremium: false,
  },
  'whatsapp-business': {
    id: 'whatsapp-business', displayName: 'WhatsApp Business', logo: '💬',
    category: 'communication', pillar: 'commerce',
    authType: 'api_key',
    fields: [
      { key: 'accessToken', label: 'Token accès Meta', type: 'password' },
      { key: 'phoneNumberId', label: 'ID Numéro', type: 'text' },
    ],
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_omnichannel',
    isPremium: false,
  },

  // ─── FINANCE / COMPTABILITÉ ───────────────────────────────────────────────
  'pennylane': {
    id: 'pennylane', displayName: 'Pennylane', logo: '🪙',
    category: 'accounting', pillar: 'finance',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://app.pennylane.com/oauth/authorize',
      tokenUrl: 'https://app.pennylane.com/oauth/token',
      scopes: ['accounting:read', 'accounting:write', 'transactions:read'],
      callbackRoute: '/api/connectors/accounting/pennylane/callback',
    },
    verticals: ['restaurant', 'hotel', 'bakery', 'salon', 'clinic', 'retail', 'custom'],
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'salon', 'clinic', 'retail'],
    requiredCapability: 'mod_accounting_management',
    isPremium: false,
  },
  'quickbooks': {
    id: 'quickbooks', displayName: 'QuickBooks', logo: '📒',
    category: 'accounting', pillar: 'finance',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://appcenter.intuit.com/connect/oauth2',
      tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      scopes: ['com.intuit.quickbooks.accounting'],
      callbackRoute: '/api/connectors/accounting/quickbooks/callback',
    },
    verticals: ['garage', 'retail', 'custom'],
    autoActivateFor: ['garage'],
    requiredCapability: 'mod_accounting_management',
    isPremium: false,
  },
  'xero': {
    id: 'xero', displayName: 'Xero', logo: '🔵',
    category: 'accounting', pillar: 'finance',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://login.xero.com/identity/connect/authorize',
      tokenUrl: 'https://identity.xero.com/connect/token',
      scopes: ['accounting.transactions', 'accounting.reports.read'],
      callbackRoute: '/api/connectors/accounting/xero/callback',
    },
    verticals: ['garage', 'retail', 'clinic', 'custom'],
    autoActivateFor: [],
    requiredCapability: 'mod_accounting_management',
    isPremium: false,
  },

  // ─── FINANCE / FACTURES ───────────────────────────────────────────────────
  'imap-invoices': {
    id: 'imap-invoices', displayName: 'IMAP (email générique)', logo: '📥',
    category: 'invoices', pillar: 'finance',
    authType: 'api_key',
    fields: [
      { key: 'host', label: 'Serveur IMAP', type: 'text', placeholder: 'imap.example.com' },
      { key: 'user', label: 'Utilisateur', type: 'text' },
      { key: 'password', label: 'Mot de passe', type: 'password' },
    ],
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_accounting_management',
    isPremium: false,
  },

  // ─── FINANCE / PAIEMENTS ──────────────────────────────────────────────────
  'stripe': {
    id: 'stripe', displayName: 'Stripe', logo: '💳',
    category: 'payments', pillar: 'finance',
    authType: 'api_key',
    fields: [
      { key: 'secretKey', label: 'Clé secrète', type: 'password', placeholder: 'sk_live_...' },
      { key: 'webhookSecret', label: 'Secret webhook', type: 'password', placeholder: 'whsec_...', optional: true },
    ],
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'salon', 'clinic', 'garage', 'retail', 'custom'],
    requiredCapability: 'mod_treasury',
    isPremium: false,
  },

  // ─── FINANCE / BANKING ────────────────────────────────────────────────────
  'gocardless': {
    id: 'gocardless', displayName: 'GoCardless (Open Banking)', logo: '🏦',
    category: 'banking', pillar: 'finance',
    authType: 'api_key',
    fields: [
      { key: 'secretId', label: 'Secret ID', type: 'text', placeholder: 'nordigen-...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
    ],
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'retail'],
    requiredCapability: 'mod_treasury',
    isPremium: false,
  },

  // ─── HUMAN / PAIE ─────────────────────────────────────────────────────────
  'silae': {
    id: 'silae', displayName: 'Silae', logo: '💼',
    category: 'payroll', pillar: 'human',
    authType: 'api_key',
    fields: [
      { key: 'silaeApiKey', label: 'Clé API', type: 'password', placeholder: 'sk-silae-...' },
      { key: 'silaeDossierId', label: 'N° Dossier', type: 'text', placeholder: '12345' },
    ],
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery'],
    requiredCapability: 'mod_hr',
    isPremium: true,
  },
  'merge-payroll': {
    id: 'merge-payroll', displayName: 'Merge.dev (multi-paie)', logo: '🔀',
    category: 'payroll', pillar: 'human',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: '',  // link token flow via /api/admin/hr/payroll/merge/link-token
      tokenUrl: '',
      scopes: [],
      callbackRoute: '/api/admin/hr/payroll/merge/exchange',
    },
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_hr',
    isPremium: true,
  },

  // ─── HUMAN / POINTAGE ─────────────────────────────────────────────────────
  'timeclock-qrcode': {
    id: 'timeclock-qrcode', displayName: 'Pointage QR Code', logo: '📲',
    category: 'timeclock', pillar: 'human',
    authType: 'none',
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'salon', 'retail'],
    requiredCapability: 'mod_hr',
    isPremium: false,
  },

  // ─── LOGISTICS / FOURNISSEURS ─────────────────────────────────────────────
  'metro': {
    id: 'metro', displayName: 'Metro', logo: '🛒',
    category: 'suppliers', pillar: 'logistics',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Metro', type: 'password' }],
    verticals: ['restaurant', 'hotel', 'bakery'],
    autoActivateFor: ['restaurant', 'hotel', 'bakery'],
    requiredCapability: 'mod_inventory',
    isPremium: false,
  },
  'pomona': {
    id: 'pomona', displayName: 'Pomona', logo: '🥬',
    category: 'suppliers', pillar: 'logistics',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Pomona', type: 'password' }],
    verticals: ['restaurant', 'hotel', 'bakery'],
    autoActivateFor: ['restaurant'],
    requiredCapability: 'mod_inventory',
    isPremium: false,
  },

  // ─── COMPLIANCE / IOT ─────────────────────────────────────────────────────
  'iot-mqtt': {
    id: 'iot-mqtt', displayName: 'IoT MQTT (sondes temp.)', logo: '🌡️',
    category: 'iot', pillar: 'compliance',
    authType: 'api_key',
    fields: [
      { key: 'brokerUrl', label: 'URL Broker', type: 'url', placeholder: 'mqtt://broker.example.com:1883' },
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'restaurant/sensors/#' },
    ],
    verticals: ['restaurant', 'hotel', 'bakery', 'clinic'],
    autoActivateFor: [],
    requiredCapability: 'mod_haccp',
    isPremium: false,
  },

  // ─── INTELLIGENCE / MÉTÉO ─────────────────────────────────────────────────
  'meteo-france': {
    id: 'meteo-france', displayName: 'Météo-France', logo: '⛅',
    category: 'weather', pillar: 'intelligence',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Météo-France', type: 'password' }],
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel'],
    requiredCapability: 'mod_analytics',
    isPremium: false,
  },
  'openweathermap': {
    id: 'openweathermap', displayName: 'OpenWeatherMap', logo: '🌤️',
    category: 'weather', pillar: 'intelligence',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API OWM', type: 'password' }],
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_analytics',
    isPremium: false,
  },
  'ticketmaster': {
    id: 'ticketmaster', displayName: 'Ticketmaster Events', logo: '🎟️',
    category: 'events', pillar: 'intelligence',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Ticketmaster', type: 'password' }],
    verticals: ['restaurant', 'hotel'],
    autoActivateFor: [],
    requiredCapability: 'mod_analytics',
    isPremium: false,
  },

  // ─── INTELLIGENCE / AI-LLM ────────────────────────────────────────────────
  'claude': {
    id: 'claude', displayName: 'Claude (Anthropic)', logo: '🤖',
    category: 'ai-llm', pillar: 'intelligence',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Anthropic', type: 'password', placeholder: 'sk-ant-...' }],
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_agent_dashboard',
    isPremium: true,
  },
  'openai': {
    id: 'openai', displayName: 'ChatGPT (OpenAI)', logo: '💡',
    category: 'ai-llm', pillar: 'intelligence',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API OpenAI', type: 'password', placeholder: 'sk-...' }],
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_agent_dashboard',
    isPremium: true,
  },
  'mistral': {
    id: 'mistral', displayName: 'Mistral AI', logo: '🇫🇷',
    category: 'ai-llm', pillar: 'intelligence',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Mistral', type: 'password' }],
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_agent_dashboard',
    isPremium: true,
  },

  // ─── INTELLIGENCE / AI-LEGAL (MCP) ────────────────────────────────────────
  'bofip': {
    id: 'bofip', displayName: 'BOFiP (DGFiP)', logo: '⚖️',
    category: 'ai-legal', pillar: 'intelligence',
    authType: 'none',
    mcp: {
      serverUrl: 'http://localhost:9622',
      toolNames: ['search_bofip', 'get_tva_rates', 'get_fiscal_article'],
    },
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'clinic', 'garage', 'retail'],
    requiredCapability: 'mod_accounting_management',
    isPremium: false,
  },
  'dgfip-api': {
    id: 'dgfip-api', displayName: 'API Entreprises (DGFiP)', logo: '🏛️',
    category: 'ai-legal', pillar: 'intelligence',
    authType: 'api_key',
    fields: [{ key: 'token', label: 'Token API Entreprises', type: 'password' }],
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'clinic', 'garage', 'retail', 'salon'],
    requiredCapability: 'mod_settings',
    isPremium: false,
  },

  // ─── VERTICAL-SPECIFIC : HOTEL ────────────────────────────────────────────
  'booking-com': {
    id: 'booking-com', displayName: 'Booking.com', logo: '🏨',
    category: 'marketplace', pillar: 'ops',
    authType: 'api_key',
    fields: [
      { key: 'hotelId', label: 'Hotel ID', type: 'text' },
      { key: 'apiKey', label: 'Clé API', type: 'password' },
    ],
    verticals: ['hotel'],
    autoActivateFor: ['hotel'],
    requiredCapability: 'mod_pms',
    isPremium: false,
  },
  'mews-pms': {
    id: 'mews-pms', displayName: 'Mews PMS', logo: '🛎️',
    category: 'vertical-specific', pillar: 'ops',
    authType: 'api_key',
    fields: [{ key: 'clientToken', label: 'Client Token', type: 'password' }],
    verticals: ['hotel'],
    autoActivateFor: ['hotel'],
    requiredCapability: 'mod_pms',
    isPremium: true,
  },

  // ─── VERTICAL-SPECIFIC : SALON ────────────────────────────────────────────
  'treatwell': {
    id: 'treatwell', displayName: 'Treatwell', logo: '💈',
    category: 'marketplace', pillar: 'ops',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://api.treatwell.com/oauth/authorize',
      tokenUrl: 'https://api.treatwell.com/oauth/token',
      scopes: ['appointments:read', 'appointments:write'],
      callbackRoute: '/api/connectors/reservations/treatwell/callback',
    },
    verticals: ['salon'],
    autoActivateFor: ['salon'],
    requiredCapability: 'mod_reservations',
    isPremium: false,
  },
  'fresha': {
    id: 'fresha', displayName: 'Fresha', logo: '✂️',
    category: 'marketplace', pillar: 'ops',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Fresha', type: 'password' }],
    verticals: ['salon'],
    autoActivateFor: [],
    requiredCapability: 'mod_reservations',
    isPremium: false,
  },

  // ─── VERTICAL-SPECIFIC : CLINIC ───────────────────────────────────────────
  'doctolib': {
    id: 'doctolib', displayName: 'Doctolib', logo: '🩺',
    category: 'vertical-specific', pillar: 'ops',
    authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API Doctolib', type: 'password' }],
    verticals: ['clinic'],
    autoActivateFor: ['clinic'],
    requiredCapability: 'mod_reservations',
    isPremium: true,
  },

  // ─── VERTICAL-SPECIFIC : GARAGE ───────────────────────────────────────────
  'tecdoc': {
    id: 'tecdoc', displayName: 'TecDoc (catalogue pièces)', logo: '🔧',
    category: 'vertical-specific', pillar: 'logistics',
    authType: 'api_key',
    fields: [
      { key: 'providerId', label: 'Provider ID', type: 'text' },
      { key: 'apiKey', label: 'Clé API TecDoc', type: 'password' },
    ],
    verticals: ['garage'],
    autoActivateFor: ['garage'],
    requiredCapability: 'mod_inventory',
    isPremium: false,
  },

  // ─── VERTICAL-SPECIFIC : RETAIL / BAKERY ──────────────────────────────────
  'shopify': {
    id: 'shopify', displayName: 'Shopify', logo: '🛍️',
    category: 'ecommerce', pillar: 'commerce',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
      tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
      scopes: ['read_orders', 'write_orders', 'read_products', 'write_products'],
      callbackRoute: '/api/connectors/ecommerce/shopify/callback',
    },
    verticals: ['retail', 'bakery'],
    autoActivateFor: ['retail'],
    requiredCapability: 'mod_pos',
    isPremium: false,
  },
  'google-shopping': {
    id: 'google-shopping', displayName: 'Google Shopping', logo: '🛒',
    category: 'ecommerce', pillar: 'commerce',
    authType: 'oauth2',
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/content'],
      callbackRoute: '/api/connectors/ecommerce/google-shopping/callback',
    },
    verticals: ['retail', 'bakery'],
    autoActivateFor: ['retail'],
    requiredCapability: 'mod_pos',
    isPremium: false,
  },
};
