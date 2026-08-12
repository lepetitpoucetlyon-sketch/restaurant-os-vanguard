import { describe, it, expect } from 'vitest';
import type { PlatformVariant } from '@nexus/contracts';
import { resolveMetricLabels, labelFor, type MetricLabels } from './labels';

describe('resolveMetricLabels (§8.6 Vague 2 — libellés métier par verticale)', () => {
  const VARIANTS: PlatformVariant[] = [
    'restaurant', 'hotel', 'bakery', 'garage', 'salon', 'clinic', 'retail', 'custom',
  ];

  it('couvre les 8 verticales sans lever', () => {
    for (const v of VARIANTS) {
      const labels = resolveMetricLabels(v);
      expect(labels).toBeDefined();
      expect(labels.unit).toBeTruthy();
      expect(labels.unitPlural).toBeTruthy();
      expect(labels.spatialContext).toBeTruthy();
      expect(labels.merchantKind).toBeTruthy();
      expect(labels.server).toBeTruthy();
      expect(labels.prepTicket).toBeTruthy();
    }
  });

  it('libellés distincts entre restaurant et garage (test anti-régression)', () => {
    const r = resolveMetricLabels('restaurant');
    const g = resolveMetricLabels('garage');
    expect(r.unit).not.toBe(g.unit);
    expect(r.spatialContext).not.toBe(g.spatialContext);
    expect(r.server).not.toBe(g.server);
    expect(r.prepTicket).not.toBe(g.prepTicket);
    expect(r.merchantKind).not.toBe(g.merchantKind);
  });

  it("défaut variant = 'restaurant' → couvert/table/serveur", () => {
    const d = resolveMetricLabels();
    expect(d.unit).toBe('couvert');
    expect(d.spatialContext).toBe('table');
    expect(d.server).toBe('serveur');
  });

  it("fallback custom = restaurant (comportement historique)", () => {
    const c = resolveMetricLabels('custom');
    const r = resolveMetricLabels('restaurant');
    expect(c).toEqual(r);
  });

  it('valeurs métier attendues par verticale (spot-check)', () => {
    expect(resolveMetricLabels('hotel').unit).toBe('nuitée');
    expect(resolveMetricLabels('hotel').spatialContext).toBe('chambre');
    expect(resolveMetricLabels('garage').unit).toBe('intervention');
    expect(resolveMetricLabels('garage').spatialContext).toBe('baie');
    expect(resolveMetricLabels('salon').server).toBe('coiffeur');
    expect(resolveMetricLabels('clinic').server).toBe('praticien');
    expect(resolveMetricLabels('retail').merchantKind).toBe('commerce');
    expect(resolveMetricLabels('bakery').prepTicket).toBe('ordre de fournée');
  });

  it("labelFor() résout une clé unique", () => {
    expect(labelFor('unit', 'garage')).toBe('intervention');
    expect(labelFor('spatialContext', 'hotel')).toBe('chambre');
    expect(labelFor('merchantKind')).toBe('restaurant'); // défaut
  });

  it('type MetricLabels réexporté depuis _shared', () => {
    const labels: MetricLabels = resolveMetricLabels('restaurant');
    expect(Object.keys(labels)).toHaveLength(6);
  });
});
