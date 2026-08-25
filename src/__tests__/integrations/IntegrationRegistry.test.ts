import { describe, it, expect } from 'vitest';
import { IntegrationRegistry } from '@/shared/connector-manifest';

describe('🔌 IntegrationRegistry & ComingSoon Status (Priorité 2.1 & 2.2)', () => {
  it('loads all manifests in the registry', () => {
    const all = IntegrationRegistry.getAll();
    expect(all.length).toBeGreaterThan(15);
  });

  it('correctly marks the 7 non-implemented connectors as comingSoon', () => {
    const phantomIds = [
      'quickbooks',
      'xero',
      'shopify',
      'google-shopping',
      'mews-pms',
      'treatwell',
      'fresha',
    ];

    for (const id of phantomIds) {
      const manifest = IntegrationRegistry.get(id);
      expect(manifest, `Connecteur ${id} doit exister dans le catalogue`).toBeDefined();
      expect(manifest?.comingSoon, `Connecteur ${id} doit être marqué comingSoon: true`).toBe(true);
      expect(manifest?.autoActivateFor, `Connecteur ${id} ne doit pas s'auto-activer sans code`).toEqual([]);
    }
  });

  it('keeps operational connectors as implemented (comingSoon != true)', () => {
    const operationalIds = [
      'pennylane',
      'google-business',
      'tripadvisor',
      'brevo',
      'whatsapp-business',
      'uber-eats',
      'deliveroo',
      'just-eat',
    ];

    for (const id of operationalIds) {
      const manifest = IntegrationRegistry.get(id);
      expect(manifest, `Connecteur ${id} doit exister`).toBeDefined();
      expect(manifest?.comingSoon).toBeFalsy();
    }
  });

  it('filters connectors by pillar and variant', () => {
    const financeConnectors = IntegrationRegistry.getByPillar('finance');
    expect(financeConnectors.length).toBeGreaterThan(0);

    const isAvailableForRestaurant = IntegrationRegistry.isAvailableForVariant('pennylane', 'restaurant');
    expect(isAvailableForRestaurant).toBe(true);
  });
});
