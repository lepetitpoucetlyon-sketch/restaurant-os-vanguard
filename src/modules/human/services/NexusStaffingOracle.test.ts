import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusStaffingOracle } from './NexusStaffingOracle';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SimulationService } from '@modules/intelligence/ia/simulator/SimulationService';

describe('🧑‍💼 NexusStaffingOracle — Prédiction & Conseil Effectifs RH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const date = '2026-08-20';

  it('devrait générer une proposition de renfort si la vélocité prédite dépasse l\'effectif prévu', async () => {
    // Ratio par défaut: 1 staff pour 25 couverts.
    // Si 80 commandes prévues -> neededStaff = Math.ceil(80 / 25) = 4 staff
    // Actuel prévu = 2 staff -> Gap de 2 staff

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(null); // Pas de settings custom
    vi.spyOn(SimulationService, 'simulateDay').mockResolvedValueOnce({
      orders: Array(80).fill({ id: 'ord_1' }),
      revenueCents: 200000,
    } as never);

    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);

    const proposal = await NexusStaffingOracle.analyzeStaffingGaps(date);

    expect(proposal).not.toBeNull();
    expect(proposal?.targetDate).toBe(date);
    expect(proposal?.currentStaffCount).toBe(2);
    expect(proposal?.suggestedStaffCount).toBe(4);
    expect(proposal?.predictedVelocity).toBe(80);
    expect(proposal?.status).toBe('pending');
    expect(spySet).toHaveBeenCalled();
  });

  it('devrait retourner null si l\'effectif prévu est suffisant pour absorber la charge', async () => {
    // 30 commandes prévues -> neededStaff = ceil(30 / 25) = 2 staff. Actuel = 2 -> Pas de gap
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(null);
    vi.spyOn(SimulationService, 'simulateDay').mockResolvedValueOnce({
      orders: Array(30).fill({ id: 'ord_1' }),
      revenueCents: 75000,
    } as never);

    const proposal = await NexusStaffingOracle.analyzeStaffingGaps(date);
    expect(proposal).toBeNull();
  });

  it('devrait approuver une proposition et la passer au statut approved', async () => {
    const existingProposal = {
      id: 'PRP-STAFF-123',
      targetDate: date,
      status: 'pending',
      suggestedStaffCount: 4,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingProposal);
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);

    await NexusStaffingOracle.approveProposal('PRP-STAFF-123');

    expect(spySet).toHaveBeenCalledWith(
      expect.stringContaining('proposals/staffing/PRP-STAFF-123'),
      expect.objectContaining({
        status: 'approved',
      })
    );
  });
});
