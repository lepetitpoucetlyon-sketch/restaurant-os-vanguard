export interface SealSnapshot {
  id: string;
  hash: string;
  previousHash: string;
  transactionId: string;
  timestamp?: string;
}

export class AssertionLayer {
  static assertNF525Chain(seals: SealSnapshot[]): void {
    if (seals.length === 0) return;

    const sorted = [...seals].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });

    if (!sorted[0].previousHash.startsWith('GENESIS_ROOT')) {
      throw new Error(
        `NF525: premier sceau sans genesis block. previousHash="${sorted[0].previousHash}"`
      );
    }

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].previousHash !== sorted[i - 1].hash) {
        throw new Error(
          `NF525: chaîne rompue au sceau[${i}] id="${sorted[i].id}". ` +
          `attendu="${sorted[i - 1].hash}", reçu="${sorted[i].previousHash}"`
        );
      }
    }
  }

  static assertMicrounitsConsistency(
    totalInMicrounits: number,
    amountInCents: number
  ): void {
    const expectedCents = Math.round(totalInMicrounits / 10_000);
    if (Math.abs(expectedCents - amountInCents) > 1) {
      throw new Error(
        `MICROUNIT: écart > 1 centime. ` +
        `total=${totalInMicrounits}µ → attendu≈${expectedCents}c, reçu=${amountInCents}c`
      );
    }
  }

  static assertNoViolations(violations: string[]): void {
    if (violations.length > 0) {
      throw new Error(
        `SIMULATION: ${violations.length} violation(s):\n${violations.map(v => `  · ${v}`).join('\n')}`
      );
    }
  }
}
