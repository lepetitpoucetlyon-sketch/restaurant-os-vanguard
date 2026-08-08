import type { IConnectorManifest } from '../types';

export const HUMAN_CONNECTORS: Record<string, IConnectorManifest> = {
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
      authUrl: '',
      tokenUrl: '',
      scopes: [],
      callbackRoute: '/api/admin/hr/payroll/merge/exchange',
    },
    verticals: 'all',
    autoActivateFor: [],
    requiredCapability: 'mod_hr',
    isPremium: true,
  },
  'timeclock-qrcode': {
    id: 'timeclock-qrcode', displayName: 'Pointage QR Code', logo: '📲',
    category: 'timeclock', pillar: 'human',
    authType: 'none',
    verticals: 'all',
    autoActivateFor: ['restaurant', 'hotel', 'bakery', 'salon', 'retail'],
    requiredCapability: 'mod_hr',
    isPremium: false,
  },
};
