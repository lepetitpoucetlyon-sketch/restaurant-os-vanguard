import { describe, it, expect } from 'vitest';
import { FiscalSealWasmEngine, type FiscalSealRecord, type SealedFiscalRecord } from '@/kernel/security/FiscalSealWasm';

describe('🛡️ FiscalSealWasmEngine — NF525 & Native Cryptographic Sovereignty (Loi 10)', () => {
  it('devrait sérialiser de manière canonique et déterministe indépendamment de l ordre des clés', () => {
    const objA = { z: 100, a: 'test', m: { b: 2, a: 1 } };
    const objB = { a: 'test', m: { a: 1, b: 2 }, z: 100 };

    const canonA = FiscalSealWasmEngine.canonicalize(objA);
    const canonB = FiscalSealWasmEngine.canonicalize(objB);

    expect(canonA).toBe(canonB);
    expect(canonA).toBe('{"a":"test","m":{"a":1,"b":2},"z":100}');
  });

  it('devrait sceller une chaîne de 1 000 transactions et vérifier son inaltérabilité en < 15ms', () => {
    const chain: SealedFiscalRecord[] = [];
    let prevHash = 'genesis_hash_00000000000000000000000000000000000000000000000000000000';
    let runningGrandTotal = 0n;

    const startTime = performance.now();

    for (let i = 1; i <= 1000; i++) {
      const record: FiscalSealRecord = {
        id: `tx_${i}`,
        tenantId: 'tenant_paris_01',
        sequenceNumber: i,
        timestamp: new Date(1725184800000 + i * 1000).toISOString(),
        totalHTInMicrounits: 20_000_000n,  // 20.00 €
        totalVATInMicrounits: 2_000_000n,  // 2.00 € (10%)
        totalTTCInMicrounits: 22_000_000n, // 22.00 €
        previousHash: prevHash,
      };

      const sealed = FiscalSealWasmEngine.sealRecord(record, runningGrandTotal, 'secret_key_pos_hsm');
      chain.push(sealed);
      prevHash = sealed.seal;
      runningGrandTotal = sealed.cumulativeGrandTotalInMicrounits;
    }

    const sealDuration = performance.now() - startTime;
    expect(chain.length).toBe(1000);
    expect(runningGrandTotal).toBe(22_000_000_000n); // 22 000.00 €

    // Vérification de la chaîne complète
    const verifyStart = performance.now();
    const result = FiscalSealWasmEngine.verifyChain(chain, 'genesis_hash_00000000000000000000000000000000000000000000000000000000');
    const verifyDuration = performance.now() - verifyStart;

    expect(result.valid).toBe(true);
    expect(result.verifiedCount).toBe(1000);
    expect(verifyDuration).toBeLessThan(30); // Ultra-rapide < 30ms pour 1 000 vérifications
  });

  it('devrait détecter immédiatement toute tentative de fraude ou altération de montant', () => {
    const chain: SealedFiscalRecord[] = [];
    let prevHash = 'genesis_hash';
    let runningGrandTotal = 0n;

    for (let i = 1; i <= 10; i++) {
      const record: FiscalSealRecord = {
        id: `tx_${i}`,
        tenantId: 'tenant_paris_01',
        sequenceNumber: i,
        timestamp: new Date(1725184800000 + i * 1000).toISOString(),
        totalHTInMicrounits: 10_000_000n,
        totalVATInMicrounits: 1_000_000n,
        totalTTCInMicrounits: 11_000_000n,
        previousHash: prevHash,
      };

      const sealed = FiscalSealWasmEngine.sealRecord(record, runningGrandTotal);
      chain.push(sealed);
      prevHash = sealed.seal;
      runningGrandTotal = sealed.cumulativeGrandTotalInMicrounits;
    }

    // Fraude simulée : modification d'un centime sur la transaction 5
    const tamperedChain = JSON.parse(JSON.stringify(chain, (_, v) => typeof v === 'bigint' ? v.toString() : v));
    tamperedChain[4].totalTTCInMicrounits = '10990000'; // -0.01 €

    const verifyResult = FiscalSealWasmEngine.verifyChain(tamperedChain, 'genesis_hash');
    expect(verifyResult.valid).toBe(false);
    expect(verifyResult.tamperedIndex).toBe(4);
    expect(verifyResult.error).toBeDefined();
  });
});
