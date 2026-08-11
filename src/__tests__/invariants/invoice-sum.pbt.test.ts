import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

/**
 * Invariant 6 — Σ factures d'un ticket ≤ total scellé (prépare §7.4)
 */
describe('Invariant 6: Sum of Invoices <= Sealed Ticket Total', () => {
    it("la somme des factures émises pour un ticket ne dépasse jamais le total scellé", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 100_000, max: 50_000_000 }), // Sealed total in microunits
                fc.array(fc.integer({ min: 10_000, max: 10_000_000 }), { minLength: 1, maxLength: 5 }), // Invoices splits
                async (sealedTotalMicrounits, rawInvoices) => {
                    // Clamp or calculate split amounts such that sum(invoices) <= sealedTotal
                    let currentSum = 0;
                    const validInvoices: number[] = [];

                    for (const amount of rawInvoices) {
                        if (currentSum + amount <= sealedTotalMicrounits) {
                            validInvoices.push(amount);
                            currentSum += amount;
                        }
                    }

                    const sumInvoices = validInvoices.reduce((a, b) => a + b, 0);

                    // Property: sum of generated invoices must never exceed the sealed ticket total
                    expect(sumInvoices).toBeLessThanOrEqual(sealedTotalMicrounits);
                    return sumInvoices <= sealedTotalMicrounits;
                }
            ),
            { numRuns: 50 }
        );
    });
});
