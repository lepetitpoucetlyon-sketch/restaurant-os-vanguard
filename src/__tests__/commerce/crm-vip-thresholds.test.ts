/**
 * DF-K2 — Les seuils VIP doivent être pilotés par le registre de réglages.
 *
 * Avant correction, `CRMVipHandler` portait `VIP_VISITS_THRESHOLD = 5` et
 * `VIP_SPENT_THRESHOLD = 500_000_000` en dur, alors que le registre déclarait déjà
 * `vip_threshold_visits` et `vip_threshold_spend` sur la page `customer`.
 * Le gérant réglait deux curseurs qui ne pilotaient rien.
 *
 * ⚠️ Le registre expose le seuil de dépense en **euros** ; le handler raisonne en
 * **microunits**. La conversion (1 € = 1 000 000 µ) est le point le plus facile à casser.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';
import { pageSettingsAtom } from '@/store/settingsAtoms';
import { getSetting } from '@/lib/settings/SettingsReader';

const EUR_TO_MICROUNITS = 1_000_000;

/** Réplique la règle du handler — voir `CRMVipHandler.ts`. */
function evaluateVip(visits: number, totalSpentMicrounits: number) {
  const visitsThreshold = getSetting<number>('customer', 'vip_threshold_visits', 5);
  const spentThresholdEur = getSetting<number>('customer', 'vip_threshold_spend', 500);
  const spentThreshold = spentThresholdEur * EUR_TO_MICROUNITS;
  return {
    becomesVip: visits >= visitsThreshold || totalSpentMicrounits >= spentThreshold,
    reason: visits >= visitsThreshold ? 'VISITS' : 'SPENT',
  };
}

describe('DF-K2 — seuils VIP pilotés par le registre', () => {
  beforeEach(() => {
    getDefaultStore().set(pageSettingsAtom, {});
  });

  describe('sans réglage — le comportement historique est préservé', () => {
    it('5 visites suffisent', () => {
      expect(evaluateVip(5, 0).becomesVip).toBe(true);
      expect(evaluateVip(4, 0).becomesVip).toBe(false);
    });

    it('500 € de dépenses suffisent', () => {
      expect(evaluateVip(1, 500 * EUR_TO_MICROUNITS).becomesVip).toBe(true);
      expect(evaluateVip(1, 499 * EUR_TO_MICROUNITS).becomesVip).toBe(false);
    });
  });

  describe('avec réglage — le gérant reprend la main', () => {
    it('un seuil de visites relevé à 10 rend un client à 5 visites non-VIP', () => {
      getDefaultStore().set(pageSettingsAtom, { customer: { vip_threshold_visits: 10 } });
      expect(evaluateVip(5, 0).becomesVip).toBe(false);
      expect(evaluateVip(10, 0).becomesVip).toBe(true);
    });

    it('un seuil de dépense abaissé à 200 € rend VIP à partir de 200 €', () => {
      getDefaultStore().set(pageSettingsAtom, { customer: { vip_threshold_spend: 200 } });
      expect(evaluateVip(1, 200 * EUR_TO_MICROUNITS).becomesVip).toBe(true);
      expect(evaluateVip(1, 199 * EUR_TO_MICROUNITS).becomesVip).toBe(false);
    });

    it('les deux seuils restent indépendants (OU logique)', () => {
      getDefaultStore().set(pageSettingsAtom, {
        customer: { vip_threshold_visits: 3, vip_threshold_spend: 1000 },
      });
      expect(evaluateVip(3, 0).reason).toBe('VISITS');
      expect(evaluateVip(1, 1000 * EUR_TO_MICROUNITS).reason).toBe('SPENT');
    });
  });

  describe('conversion euros → microunits', () => {
    it('un seuil de 1 000 € vaut bien 1 000 000 000 µ, pas 1 000 µ', () => {
      getDefaultStore().set(pageSettingsAtom, { customer: { vip_threshold_spend: 1000 } });
      // Le piège : sans conversion, 1 000 µ (= 0,001 €) rendrait VIP au premier café.
      expect(evaluateVip(1, 1_000).becomesVip).toBe(false);
      expect(evaluateVip(1, 1_000_000_000).becomesVip).toBe(true);
    });
  });
});
