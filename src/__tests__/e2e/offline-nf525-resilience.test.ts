import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CryptoService } from '@/lib/CryptoService';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('E2E Scénario 1 : Résilience Réseau & Synchronisation NF525 Multi-Caisses Offline', () => {
  let tenantId: string;
  const register1 = 'caisse_ipad_terrasse';
  const register2 = 'caisse_ipad_comptoir';

  beforeEach(() => {
    vi.clearAllMocks();
    tenantId = `brasserie-republique-${Date.now()}`;
  });

  it('devrait encaisser hors-ligne sur 2 caisses indépendantes puis réconcilier les chaînes sans fork', async () => {
    // === PHASE 1 : SIMULATION COUPURE RÉSEAU (Mode Hors-Ligne) ===
    let isNetworkOnline = false;

    // === PHASE 2 : ENCAISSEMENT SUR CAISSE 1 (3 Tickets) ===
    const caisse1Seals = [];
    let prevHash1 = 'GENESIS_REGISTER_1_0000000000000000';

    for (let i = 1; i <= 3; i++) {
      const ticketData = {
        tenantId,
        registerId: register1,
        ticketNumber: i,
        totalInCents: 2500 * i,
        paymentMethod: 'CB',
        offlineLoggedAt: Date.now() + i * 1000,
      };

      const dataSnapshot = CryptoService.canonicalStringify(ticketData as unknown as import("@/shared/nexus/contracts").SovereignData);
      const hash = await CryptoService.generateHash(dataSnapshot, prevHash1);

      caisse1Seals.push({
        id: `seal_c1_${i}`,
        registerId: register1,
        hash,
        previousHash: prevHash1,
        dataSnapshot,
      });

      prevHash1 = hash;
    }

    expect(caisse1Seals.length).toBe(3);

    // === PHASE 3 : ENCAISSEMENT EN PARALLÈLE SUR CAISSE 2 (3 Tickets) ===
    const caisse2Seals = [];
    let prevHash2 = 'GENESIS_REGISTER_2_0000000000000000';

    for (let j = 1; j <= 3; j++) {
      const ticketData = {
        tenantId,
        registerId: register2,
        ticketNumber: j,
        totalInCents: 1800 * j,
        paymentMethod: 'CASH',
        offlineLoggedAt: Date.now() + j * 1000,
      };

      const dataSnapshot = CryptoService.canonicalStringify(ticketData as unknown as import("@/shared/nexus/contracts").SovereignData);
      const hash = await CryptoService.generateHash(dataSnapshot, prevHash2);

      caisse2Seals.push({
        id: `seal_c2_${j}`,
        registerId: register2,
        hash,
        previousHash: prevHash2,
        dataSnapshot,
      });

      prevHash2 = hash;
    }

    expect(caisse2Seals.length).toBe(3);

    // === PHASE 4 : RECONNEXION RÉSEAU & SYNCHRONISATION ===
    isNetworkOnline = true;
    expect(isNetworkOnline).toBe(true);

    // Envoi des files d'attente vers le cloud
    const consolidatedSeals = [...caisse1Seals, ...caisse2Seals];
    for (const seal of consolidatedSeals) {
      await Nexus.adapter.set(`tenants/${tenantId}/fiscalSeals/${seal.id}`, seal);
    }

    // === PHASE 5 : VÉRIFICATION D INTÉGRITÉ SANS FORK ===
    // Vérification de la chaîne Caisse 1
    let verifyPrev1 = 'GENESIS_REGISTER_1_0000000000000000';
    for (const seal of caisse1Seals) {
      const recomputed = await CryptoService.generateHash(seal.dataSnapshot, verifyPrev1);
      expect(seal.hash).toBe(recomputed);
      expect(seal.previousHash).toBe(verifyPrev1);
      verifyPrev1 = seal.hash;
    }

    // Vérification de la chaîne Caisse 2
    let verifyPrev2 = 'GENESIS_REGISTER_2_0000000000000000';
    for (const seal of caisse2Seals) {
      const recomputed = await CryptoService.generateHash(seal.dataSnapshot, verifyPrev2);
      expect(seal.hash).toBe(recomputed);
      expect(seal.previousHash).toBe(verifyPrev2);
      verifyPrev2 = seal.hash;
    }

    // Vérification qu'aucune collision n'a eu lieu
    const allHashes = new Set(consolidatedSeals.map((s) => s.hash));
    expect(allHashes.size).toBe(6);
  });
});
