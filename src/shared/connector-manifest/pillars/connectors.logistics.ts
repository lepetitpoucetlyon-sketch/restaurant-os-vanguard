import type { IConnectorManifest } from '../types';

export const LOGISTICS_CONNECTORS: Record<string, IConnectorManifest> = {
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
};
