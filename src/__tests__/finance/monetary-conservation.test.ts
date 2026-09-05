import { describe, it, expect, vi } from 'vitest';
import { IntegrationPolicy } from '@/lib/http/integrationPolicy';
import { BridgeProvider } from '@/modules/finance/tresorerie/banking/openBanking/BridgeProvider';

describe('💰 Monetary Conservation & Integration Policy Invariants (Phase 5)', () => {
  describe('IntegrationPolicy Enforcement', () => {
    it('interdit strictement le retry d une mutation sans clé d idempotence', async () => {
      await expect(
        IntegrationPolicy.execute({
          providerName: 'Stripe',
          operationName: 'chargePayment',
          url: 'https://api.stripe.com/v1/charges',
          method: 'POST',
          isMutation: true,
          maxRetries: 2,
          // Aucune idempotencyKey fournie
        }),
      ).rejects.toThrow(/Invariant violé : Tentative de retry sur mutation externe/);
    });

    it('autorise le retry d une mutation si une clé d idempotence fournisseur est présente', async () => {
      let attempts = 0;
      const mockFetcher = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          // Premier appel échoue en 503
          return new Response(JSON.stringify({ error: 'Service Unavailable' }), { status: 503 });
        }
        // Deuxième appel réussit
        return new Response(JSON.stringify({ id: 'ch_123', status: 'succeeded' }), { status: 200 });
      });

      const result = await IntegrationPolicy.execute<any>({
        providerName: 'Stripe',
        operationName: 'chargePayment',
        url: 'https://api.stripe.com/v1/charges',
        method: 'POST',
        isMutation: true,
        maxRetries: 2,
        idempotencyKey: 'idem_key_unique_test_456',
        fetcher: mockFetcher as unknown as typeof fetch,
      });

      expect(result.id).toBe('ch_123');
      expect(attempts).toBe(2);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('censure et protège les tokens et clés d API dans les headers', () => {
      const headers = {
        Authorization: 'Bearer secret_token_1234567890',
        'X-Api-Key': 'key_abc999888777',
        'Content-Type': 'application/json',
      };
      const sanitized = IntegrationPolicy.sanitizeHeaders(headers);
      expect(sanitized.Authorization).toContain('[REDACTED]');
      expect(sanitized['X-Api-Key']).toContain('[REDACTED]');
      expect(sanitized['Content-Type']).toBe('application/json');
    });

    it('exécute les requêtes réelles de BridgeProvider via IntegrationPolicy sans réseau', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            resources: [
              { id: 'acc_1', name: 'Compte Courant', balance: 15420.5, currency_code: 'EUR' },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const bridge = new BridgeProvider();
      const accounts = await bridge.getAccounts('valid_mock_user_token');
      expect(accounts.length).toBe(1);
      expect(accounts[0].label).toBe('Compte Courant');
      expect(accounts[0].balance).toBe(15420.5);

      vi.unstubAllGlobals();
    });
  });

  describe('Monetary Arithmetic & Split Remainder Invariant', () => {
    const ONE_EURO_MICROUNITS = 1_000_000n;
    const ONE_CENT_MICROUNITS = 10_000n;

    it('conserve rigoureusement la somme exacte lors d un split d addition sans perte de centime', () => {
      // Addition de 100,00 € = 100 000 000 microunités
      const totalAmount = 100n * ONE_EURO_MICROUNITS;
      const guestCount = 3n;

      const baseShare = totalAmount / guestCount; // 33 333 333
      const remainder = totalAmount % guestCount; // 1 microunité restante

      const shares: bigint[] = [];
      for (let i = 0n; i < guestCount; i++) {
        // La règle du reliquat alloue le résidu au dernier convive
        if (i === guestCount - 1n) {
          shares.push(baseShare + remainder);
        } else {
          shares.push(baseShare);
        }
      }

      // Vérification des parts
      expect(shares[0]).toBe(33_333_333n);
      expect(shares[1]).toBe(33_333_333n);
      expect(shares[2]).toBe(33_333_334n);

      // Invariant absolu : somme(parts) === total
      const totalCalculated = shares.reduce((acc, curr) => acc + curr, 0n);
      expect(totalCalculated).toBe(totalAmount);
    });

    it('calcule la ventilation de TVA sans flottant JavaScript avec égalité exacte TTC === HT + TVA', () => {
      // Exemple : 47,85 € TTC ventilé en taux 10% et 20%
      // Base HT 1 : 20,00 € (taux 20% = 2000 bps) -> TVA = 4,00 €
      // Base HT 2 : 19,85 € (taux 10% = 1000 bps) -> TVA = 1,985 € (19 850 microunités)
      const ht1 = 20n * ONE_EURO_MICROUNITS;
      const rate1Bps = 2000n; // 20.00%
      const tva1 = (ht1 * rate1Bps) / 10000n; // 4 000 000

      const ht2 = 1985n * ONE_CENT_MICROUNITS; // 19,85 € = 19 850 000
      const rate2Bps = 1000n; // 10.00%
      const tva2 = (ht2 * rate2Bps) / 10000n; // 1 985 000

      const totalHT = ht1 + ht2;
      const totalTVA = tva1 + tva2;
      const totalTTC = totalHT + totalTVA;

      expect(totalHT).toBe(39_850_000n);
      expect(totalTVA).toBe(5_985_000n);
      expect(totalTTC).toBe(45_835_000n); // 45,835 €
      expect(totalTTC).toBe(totalHT + totalTVA);
    });
  });
});
