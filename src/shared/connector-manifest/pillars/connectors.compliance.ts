import type { IConnectorManifest } from '../types';

export const COMPLIANCE_CONNECTORS: Record<string, IConnectorManifest> = {
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
};
